import { LegalResearchService } from '@/lib/ai/legal-research';

jest.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    researchQuery: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('LegalResearchService', () => {
  let service: LegalResearchService;

  beforeEach(() => {
    service = new LegalResearchService();
    jest.clearAllMocks();
  });

  describe('research', () => {
    it('should perform legal research and return findings', async () => {
      const query = 'What are the elements of negligence in New York?';

      const mockResult = {
        query,
        summary:
          'In New York, negligence requires proof of four elements: duty, breach, causation, and damages.',
        findings: [
          {
            title: 'Duty of Care',
            description:
              'The defendant owed a legal duty of care to the plaintiff.',
            citation: 'Espinal v. Melville Snow Contractors, 98 N.Y.2d 744 (2002)',
            relevance: 'HIGH',
            jurisdiction: 'NEW_YORK',
            sourceType: 'CASE_LAW',
          },
          {
            title: 'Breach of Duty',
            description:
              'The defendant failed to exercise reasonable care.',
            citation: 'Neron v. Hochster, 71 N.Y.2d 886 (1988)',
            relevance: 'HIGH',
            jurisdiction: 'NEW_YORK',
            sourceType: 'CASE_LAW',
          },
          {
            title: 'Causation',
            description:
              'The breach was the proximate cause of the injury.',
            citation: 'Derdiarian v. Felix Contracting Corp., 51 N.Y.2d 308 (1980)',
            relevance: 'HIGH',
            jurisdiction: 'NEW_YORK',
            sourceType: 'CASE_LAW',
          },
          {
            title: 'Damages',
            description:
              'The plaintiff suffered actual damages as a result.',
            citation: 'New York Pattern Jury Instructions 2:70',
            relevance: 'MEDIUM',
            jurisdiction: 'NEW_YORK',
            sourceType: 'JURY_INSTRUCTION',
          },
        ],
        relatedTopics: [
          'Comparative negligence',
          'Premises liability',
          'Medical malpractice',
        ],
        suggestedFollowUp: [
          'How does comparative negligence affect damages in NY?',
          'What is the statute of limitations for negligence in NY?',
        ],
        confidence: 0.92,
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockResult) } },
        ],
      });

      (prisma.researchQuery.create as jest.Mock).mockResolvedValue({
        id: 'rq1',
      });

      const result = await service.research(query, {
        jurisdiction: 'NEW_YORK',
        practiceArea: 'TORT_LAW',
        userId: 'u1',
        organizationId: 'org-1',
      });

      expect(result.findings).toHaveLength(4);
      expect(result.confidence).toBe(0.92);
      expect(result.findings[0].citation).toContain('Espinal');
    });

    it('should handle empty query', async () => {
      await expect(
        service.research('', {
          jurisdiction: 'NEW_YORK',
          userId: 'u1',
          organizationId: 'org-1',
        })
      ).rejects.toThrow('Research query cannot be empty');
    });

    it('should handle API errors gracefully', async () => {
      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockRejectedValue(
        new Error('API service unavailable')
      );

      await expect(
        service.research('Test query', {
          jurisdiction: 'NEW_YORK',
          userId: 'u1',
          organizationId: 'org-1',
        })
      ).rejects.toThrow('Research failed');
    });
  });

  describe('summarizeCase', () => {
    it('should summarize a legal case', async () => {
      const caseText = `
        SMITH v. JONES
        Supreme Court of New York
        Decided: March 15, 2024
        
        Plaintiff Smith brought this action alleging negligence 
        against Defendant Jones. The evidence showed that Jones 
        failed to maintain proper safety measures at his property.
        
        HELD: The court finds in favor of Plaintiff Smith. 
        Jones owed a duty of care which was breached, causing 
        Smith's injuries. Damages awarded: $250,000.
      `;

      const mockSummary = {
        caseName: 'Smith v. Jones',
        court: 'Supreme Court of New York',
        date: '2024-03-15',
        holding:
          'Court found for plaintiff on negligence claim.',
        keyFacts: [
          'Defendant failed to maintain safety measures',
          'Plaintiff suffered injuries as a result',
        ],
        legalReasoning:
          'Defendant owed duty of care, breached it, and causation was established.',
        outcome: 'Judgment for plaintiff, $250,000 damages',
        relevance: 'HIGH',
        citable: true,
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockSummary) } },
        ],
      });

      const result = await service.summarizeCase(caseText);

      expect(result.caseName).toBe('Smith v. Jones');
      expect(result.outcome).toContain('$250,000');
      expect(result.keyFacts).toHaveLength(2);
    });
  });

  describe('findPrecedents', () => {
    it('should find relevant precedents for a legal issue', async () => {
      const legalIssue = 'Breach of fiduciary duty by corporate officer';

      const mockPrecedents = {
        issue: legalIssue,
        precedents: [
          {
            caseName: 'Meinhard v. Salmon',
            citation: '249 N.Y. 458 (1928)',
            court: 'New York Court of Appeals',
            year: 1928,
            relevance: 'HIGH',
            summary:
              'Established the business judgment rule and fiduciary duties of corporate officers.',
            keyPrinciple:
              'Corporate officers owe fiduciary duties of loyalty and care to the corporation.',
          },
          {
            caseName: 'A.W. Humphrey Co. v. Donnelley & Sons Co.',
            citation: '97 N.Y.2d 134 (2001)',
            court: 'New York Court of Appeals',
            year: 2001,
            relevance: 'HIGH',
            summary:
              'Defined scope of fiduciary duty in corporate context.',
            keyPrinciple:
              'Officers must act in the best interest of the corporation.',
          },
        ],
        totalFound: 2,
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockPrecedents) } },
        ],
      });

      const result = await service.findPrecedents(legalIssue, {
        jurisdiction: 'NEW_YORK',
      });

      expect(result.precedents).toHaveLength(2);
      expect(result.precedents[0].caseName).toBe('Meinhard v. Salmon');
    });
  });

  describe('analyzeStatute', () => {
    it('should analyze a statute and explain its provisions', async () => {
      const statuteText = `
        NY CPLR § 214: Two-Year Limitation
        The following actions must be commenced within two years:
        1. An action to recover damages for personal injury;
        2. An action to recover damages for malpractice.
      `;

      const mockAnalysis = {
        statute: 'NY CPLR § 214',
        title: 'Two-Year Limitation',
        provisions: [
          {
            section: '1',
            description: 'Personal injury actions',
            timeLimit: '2 years',
            triggerEvent: 'Date of injury or discovery',
          },
          {
            section: '2',
            description: 'Malpractice actions',
            timeLimit: '2 years',
            triggerEvent: 'Date of malpractice or discovery',
          },
        ],
        exceptions: [
          'Tolling for minors',
          'Continuing treatment doctrine for malpractice',
        ],
        practicalImplications: [
          'Claims must be filed within 2 years of accrual',
          'Discovery rule may extend deadline',
        ],
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockAnalysis) } },
        ],
      });

      const result = await service.analyzeStatute(statuteText);

      expect(result.provisions).toHaveLength(2);
      expect(result.exceptions).toContain('Tolling for minors');
    });
  });

  describe('getResearchHistory', () => {
    it('should return research history for a user', async () => {
      const mockHistory = [
        {
          id: 'rq1',
          query: 'Negligence elements in NY',
          createdAt: new Date('2024-03-15'),
          results: { findings: [] },
        },
        {
          id: 'rq2',
          query: 'Statute of limitations for breach of contract',
          createdAt: new Date('2024-03-14'),
          results: { findings: [] },
        },
      ];

      (prisma.researchQuery.findMany as jest.Mock).mockResolvedValue(
        mockHistory
      );

      const result = await service.getResearchHistory('u1');

      expect(result).toHaveLength(2);
      expect(prisma.researchQuery.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });
});
