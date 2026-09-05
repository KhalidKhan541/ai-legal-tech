import { ContractReviewService } from '@/lib/ai/contract-review';

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
    contractReview: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('ContractReviewService', () => {
  let service: ContractReviewService;

  beforeEach(() => {
    service = new ContractReviewService();
    jest.clearAllMocks();
  });

  describe('analyzeContract', () => {
    it('should analyze a contract and return risk assessment', async () => {
      const contractText = `
        SERVICE AGREEMENT
        
        This Agreement is entered into as of January 1, 2024.
        
        1. TERM: This agreement shall be for a period of 2 years.
        
        2. PAYMENT: Client shall pay $10,000 monthly.
        
        3. LIABILITY: Provider's total liability shall not exceed 
           the fees paid under this Agreement.
        
        4. INDEMNIFICATION: Client shall indemnify Provider against 
           all claims arising from Client's use of services.
        
        5. TERMINATION: Either party may terminate with 30 days notice.
      `;

      const mockAnalysis = {
        overallRisk: 'MEDIUM',
        confidenceScore: 0.87,
        summary: 'Standard service agreement with moderate risk factors.',
        clauses: [
          {
            type: 'LIABILITY_LIMITATION',
            risk: 'HIGH',
            text: "Provider's total liability shall not exceed the fees paid",
            explanation:
              'This clause limits the provider liability to fees paid, which may be insufficient for significant damages.',
            recommendation:
              'Consider negotiating a higher liability cap or carve-outs for gross negligence.',
          },
          {
            type: 'INDEMNIFICATION',
            risk: 'HIGH',
            text: 'Client shall indemnify Provider against all claims',
            explanation:
              'Broad indemnification clause favors the provider.',
            recommendation:
              'Negotiate mutual indemnification or limit to specific claim types.',
          },
          {
            type: 'TERMINATION',
            risk: 'LOW',
            text: 'Either party may terminate with 30 days notice',
            explanation: 'Reasonable termination clause.',
            recommendation: 'No changes needed.',
          },
        ],
        keyDates: [
          { date: '2024-01-01', description: 'Agreement effective date' },
        ],
        missingClauses: ['Force Majeure', 'Dispute Resolution', 'Confidentiality'],
        suggestions: [
          'Add a force majeure clause',
          'Include dispute resolution mechanism',
          'Add confidentiality provisions',
        ],
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAnalysis),
            },
          },
        ],
      });

      (prisma.contractReview.create as jest.Mock).mockResolvedValue({
        id: 'cr1',
        contractText,
        analysis: mockAnalysis,
      });

      const result = await service.analyzeContract(contractText, {
        contractType: 'SERVICE_AGREEMENT',
        jurisdiction: 'NEW_YORK',
        userId: 'u1',
        organizationId: 'org-1',
      });

      expect(result.overallRisk).toBe('MEDIUM');
      expect(result.clauses).toHaveLength(3);
      expect(result.missingClauses).toContain('Force Majeure');
    });

    it('should handle empty contract text', async () => {
      await expect(
        service.analyzeContract('', {
          contractType: 'SERVICE_AGREEMENT',
          jurisdiction: 'NEW_YORK',
          userId: 'u1',
          organizationId: 'org-1',
        })
      ).rejects.toThrow('Contract text cannot be empty');
    });

    it('should handle very long contract text', async () => {
      const longText = 'A'.repeat(500001);

      await expect(
        service.analyzeContract(longText, {
          contractType: 'SERVICE_AGREEMENT',
          jurisdiction: 'NEW_YORK',
          userId: 'u1',
          organizationId: 'org-1',
        })
      ).rejects.toThrow('Contract text exceeds maximum length');
    });

    it('should retry on API failure', async () => {
      const { openai } = require('@/lib/openai');
      openai.chat.completions.create
        .mockRejectedValueOnce(new Error('API temporarily unavailable'))
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  overallRisk: 'LOW',
                  confidenceScore: 0.9,
                  summary: 'Test',
                  clauses: [],
                  keyDates: [],
                  missingClauses: [],
                  suggestions: [],
                }),
              },
            },
          ],
        });

      (prisma.contractReview.create as jest.Mock).mockResolvedValue({
        id: 'cr1',
      });

      const result = await service.analyzeContract('Test contract text', {
        contractType: 'SERVICE_AGREEMENT',
        jurisdiction: 'NEW_YORK',
        userId: 'u1',
        organizationId: 'org-1',
      });

      expect(result.overallRisk).toBe('LOW');
      expect(openai.chat.completions.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('compareContracts', () => {
    it('should compare two contracts and highlight differences', async () => {
      const contract1 = `
        TERM: 1 year
        PAYMENT: $5,000 monthly
        LIABILITY: Limited to fees paid
      `;

      const contract2 = `
        TERM: 2 years
        PAYMENT: $7,500 monthly
        LIABILITY: Unlimited
        CONFIDENTIALITY: 3-year NDA
      `;

      const mockComparison = {
        differences: [
          {
            category: 'TERM',
            contract1: '1 year',
            contract2: '2 years',
            significance: 'MEDIUM',
          },
          {
            category: 'PAYMENT',
            contract1: '$5,000 monthly',
            contract2: '$7,500 monthly',
            significance: 'HIGH',
          },
          {
            category: 'LIABILITY',
            contract1: 'Limited to fees paid',
            contract2: 'Unlimited',
            significance: 'HIGH',
          },
        ],
        recommendation: 'Contract 2 has more favorable terms for the provider.',
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockComparison) } },
        ],
      });

      const result = await service.compareContracts(contract1, contract2);

      expect(result.differences).toHaveLength(3);
      expect(result.differences[2].significance).toBe('HIGH');
    });
  });

  describe('extractKeyTerms', () => {
    it('should extract key terms from a contract', async () => {
      const contractText = `
        Effective Date: January 1, 2024
        Term: 24 months
        Monthly Fee: $15,000
        Renewal: Auto-renews for 12-month periods
        Governing Law: State of Delaware
      `;

      const mockTerms = {
        effectiveDate: '2024-01-01',
        term: '24 months',
        monthlyFee: 15000,
        renewalType: 'AUTO_RENEW',
        governingLaw: 'Delaware',
        parties: [
          { name: 'Provider Inc', role: 'Service Provider' },
          { name: 'Client Corp', role: 'Client' },
        ],
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockTerms) } },
        ],
      });

      const result = await service.extractKeyTerms(contractText);

      expect(result.monthlyFee).toBe(15000);
      expect(result.governingLaw).toBe('Delaware');
    });
  });

  describe('generateSummary', () => {
    it('should generate a plain-language summary of a contract', async () => {
      const contractText = `
        This is a 2-year service agreement for software development.
        The client pays $10,000/month. Either party can terminate 
        with 60 days notice. Provider limits liability to fees paid.
      `;

      const mockSummary = {
        overview:
          'This is a 2-year software development service agreement.',
        keyPoints: [
          'Monthly payment of $10,000',
          '60-day termination notice required',
          'Limited liability clause',
        ],
        riskLevel: 'MEDIUM',
        plainLanguageSummary:
          'You are entering a 2-year contract to pay $10,000/month for software development services. You can cancel with 60 days notice, but the provider limits their liability.',
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockSummary) } },
        ],
      });

      const result = await service.generateSummary(contractText);

      expect(result.keyPoints).toHaveLength(3);
      expect(result.riskLevel).toBe('MEDIUM');
    });
  });
});
