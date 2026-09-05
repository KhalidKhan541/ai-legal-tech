import { CitationAnalyzer } from '@/lib/ai/citation-analyzer';

jest.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

describe('CitationAnalyzer', () => {
  let analyzer: CitationAnalyzer;

  beforeEach(() => {
    analyzer = new CitationAnalyzer();
    jest.clearAllMocks();
  });

  describe('extractCitations', () => {
    it('should extract legal citations from text', () => {
      const text = `
        In Smith v. Jones, 123 N.Y.2d 456 (2020), the court held that...
        See also Brown v. Board of Education, 347 U.S. 483 (1954).
        Under 42 U.S.C. § 1983, the plaintiff may recover...
        The New York CPLR § 214 requires filing within two years.
      `;

      const citations = analyzer.extractCitations(text);

      expect(citations).toHaveLength(4);
      expect(citations[0]).toEqual(
        expect.objectContaining({
          text: 'Smith v. Jones, 123 N.Y.2d 456 (2020)',
          type: 'CASE',
          reporter: 'N.Y.2d',
          volume: '123',
          page: '456',
          year: 2020,
        })
      );
      expect(citations[1]).toEqual(
        expect.objectContaining({
          text: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
          type: 'CASE',
          reporter: 'U.S.',
          volume: '347',
          page: '483',
          year: 1954,
        })
      );
    });

    it('should extract statute citations', () => {
      const text = `
        Under 42 U.S.C. § 1983, the plaintiff has a cause of action.
        NY CPLR § 214 governs the statute of limitations.
        29 U.S.C. § 2614 prohibits retaliation.
      `;

      const citations = analyzer.extractCitations(text);

      expect(citations).toHaveLength(3);
      expect(citations[0]).toEqual(
        expect.objectContaining({
          type: 'STATUTE',
          code: '42 U.S.C.',
          section: '1983',
        })
      );
    });

    it('should extract regulatory citations', () => {
      const text = `
        Per 17 CFR § 240.10b-5, the defendant committed fraud.
        Under HIPAA, 45 CFR § 164.502, protected health information...
      `;

      const citations = analyzer.extractCitations(text);

      expect(citations).toHaveLength(2);
      expect(citations[0]).toEqual(
        expect.objectContaining({
          type: 'REGULATION',
          code: '17 CFR',
          section: '240.10b-5',
        })
      );
    });

    it('should handle text with no citations', () => {
      const text = 'This is a simple contract with no legal citations.';

      const citations = analyzer.extractCitations(text);

      expect(citations).toHaveLength(0);
    });

    it('should handle duplicate citations', () => {
      const text = `
        See Smith v. Jones, 123 N.Y.2d 456 (2020).
        As held in Smith v. Jones, 123 N.Y.2d 456 (2020), the court...
      `;

      const citations = analyzer.extractCitations(text);

      expect(citations).toHaveLength(1);
    });

    it('should extract parallel citations', () => {
      const text = `
        Smith v. Jones, 123 N.Y.2d 456, 999 N.E.2d 899 (2020).
      `;

      const citations = analyzer.extractCitations(text);

      expect(citations).toHaveLength(1);
      expect(citations[0].parallelCitations).toBeDefined();
    });
  });

  describe('validateCitation', () => {
    it('should validate a properly formatted case citation', async () => {
      const mockValidation = {
        citation: 'Smith v. Jones, 123 N.Y.2d 456 (2020)',
        valid: true,
        exists: true,
        caseName: 'Smith v. Jones',
        court: 'New York Court of Appeals',
        year: 2020,
        reporter: 'N.Y.2d',
        confidence: 0.95,
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockValidation) } },
        ],
      });

      const result = await analyzer.validateCitation(
        'Smith v. Jones, 123 N.Y.2d 456 (2020)'
      );

      expect(result.valid).toBe(true);
      expect(result.exists).toBe(true);
      expect(result.caseName).toBe('Smith v. Jones');
    });

    it('should detect invalid citations', async () => {
      const mockValidation = {
        citation: 'Fake Case v. Nothing, 999 F.3d 1 (2025)',
        valid: false,
        exists: false,
        error: 'Citation not found in legal databases',
        confidence: 0.1,
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockValidation) } },
        ],
      });

      const result = await analyzer.validateCitation(
        'Fake Case v. Nothing, 999 F.3d 1 (2025)'
      );

      expect(result.valid).toBe(false);
      expect(result.exists).toBe(false);
    });

    it('should handle malformed citations', async () => {
      const mockValidation = {
        citation: 'invalid citation format',
        valid: false,
        error: 'Unable to parse citation format',
        confidence: 0.05,
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockValidation) } },
        ],
      });

      const result = await analyzer.validateCitation('invalid citation format');

      expect(result.valid).toBe(false);
    });
  });

  describe('checkCitationFrequency', () => {
    it('should analyze how often a case is cited', async () => {
      const mockAnalysis = {
        citation: 'Smith v. Jones, 123 N.Y.2d 456 (2020)',
        totalCitations: 156,
        citationsByYear: {
          '2020': 12,
          '2021': 45,
          '2022': 38,
          '2023': 42,
          '2024': 19,
        },
        citationsByJurisdiction: {
          'NEW_YORK': 98,
          'FEDERAL': 45,
          'OTHER': 13,
        },
        treatment: 'FOLLOWED',
        influential: true,
        recentCitations: [
          {
            case: 'Recent Case v. Another',
            year: 2024,
            court: 'NY Supreme Court',
            treatment: 'FOLLOWED',
          },
        ],
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockAnalysis) } },
        ],
      });

      const result = await analyzer.checkCitationFrequency(
        'Smith v. Jones, 123 N.Y.2d 456 (2020)'
      );

      expect(result.totalCitations).toBe(156);
      expect(result.treatment).toBe('FOLLOWED');
      expect(result.influential).toBe(true);
    });
  });

  describe('analyzeCitationNetwork', () => {
    it('should map the citation network for a case', async () => {
      const mockNetwork = {
        rootCase: 'Smith v. Jones, 123 N.Y.2d 456 (2020)',
        citingCases: [
          {
            case: 'Doe v. Smith Corp',
            year: 2022,
            treatment: 'FOLLOWED',
          },
          {
            case: 'Williams v. Another Corp',
            year: 2023,
            treatment: 'DISTINGUISHED',
          },
        ],
        citedByRoot: [
          {
            case: 'Brown v. Jones',
            year: 2018,
            treatment: 'REVERSED',
          },
        ],
        networkSize: 3,
        depth: 1,
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockNetwork) } },
        ],
      });

      const result = await analyzer.analyzeCitationNetwork(
        'Smith v. Jones, 123 N.Y.2d 456 (2020)'
      );

      expect(result.citingCases).toHaveLength(2);
      expect(result.citedByRoot).toHaveLength(1);
      expect(result.networkSize).toBe(3);
    });
  });

  describe('suggestCitations', () => {
    it('should suggest relevant citations for a legal argument', async () => {
      const argument =
        'The defendant breached their fiduciary duty by self-dealing';

      const mockSuggestions = {
        argument,
        suggestedCitations: [
          {
            citation: 'Meinhard v. Salmon, 249 N.Y. 458 (1928)',
            relevance: 'HIGH',
            reason:
              'Established fiduciary duty standards for corporate officers',
          },
          {
            citation: 'Guth v. Loft, 5 A.2d 503 (Del. 1939)',
            relevance: 'HIGH',
            reason:
              'Addressed self-dealing by corporate fiduciaries',
          },
        ],
        strengthenArguments: [
          'Consider citing statutory provisions under DGCL § 144',
          'Reference the business judgment rule exceptions',
        ],
      };

      const { openai } = require('@/lib/openai');
      openai.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockSuggestions) } },
        ],
      });

      const result = await analyzer.suggestCitations(argument);

      expect(result.suggestedCitations).toHaveLength(2);
      expect(result.strengthenArguments).toHaveLength(2);
    });
  });
});
