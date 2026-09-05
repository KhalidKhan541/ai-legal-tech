import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractReviewPanel } from '@/components/contracts/contract-review-panel';

const mockAnalysis = {
  id: 'cr1',
  contractText: 'This is a service agreement...',
  status: 'COMPLETED',
  overallRisk: 'MEDIUM',
  confidenceScore: 0.87,
  summary: 'Standard service agreement with moderate risk factors.',
  clauses: [
    {
      id: 'cl1',
      type: 'LIABILITY_LIMITATION',
      risk: 'HIGH',
      text: "Provider's total liability shall not exceed the fees paid",
      explanation:
        'This clause limits the provider liability to fees paid, which may be insufficient for significant damages.',
      recommendation:
        'Consider negotiating a higher liability cap or carve-outs for gross negligence.',
      position: { start: 250, end: 350 },
    },
    {
      id: 'cl2',
      type: 'INDEMNIFICATION',
      risk: 'HIGH',
      text: 'Client shall indemnify Provider against all claims',
      explanation: 'Broad indemnification clause favors the provider.',
      recommendation: 'Negotiate mutual indemnification or limit to specific claim types.',
      position: { start: 400, end: 500 },
    },
    {
      id: 'cl3',
      type: 'TERMINATION',
      risk: 'LOW',
      text: 'Either party may terminate with 30 days notice',
      explanation: 'Reasonable termination clause.',
      recommendation: 'No changes needed.',
      position: { start: 600, end: 680 },
    },
  ],
  keyDates: [
    { date: '2024-01-01', description: 'Agreement effective date' },
    { date: '2025-01-01', description: 'Agreement expiration date' },
  ],
  missingClauses: ['Force Majeure', 'Dispute Resolution', 'Confidentiality'],
  suggestions: [
    'Add a force majeure clause',
    'Include dispute resolution mechanism',
    'Add confidentiality provisions',
  ],
  createdAt: new Date('2024-03-15'),
};

describe('ContractReviewPanel', () => {
  const mockOnAnalyze = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnRegenerate = jest.fn();
  const mockOnClauseClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render contract summary', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(screen.getByText('Standard service agreement')).toBeInTheDocument();
  });

  it('should render overall risk level', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('should render confidence score', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(screen.getByText('87%')).toBeInTheDocument();
  });

  it('should render all clauses', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(screen.getByText('LIABILITY_LIMITATION')).toBeInTheDocument();
    expect(screen.getByText('INDEMNIFICATION')).toBeInTheDocument();
    expect(screen.getByText('TERMINATION')).toBeInTheDocument();
  });

  it('should render clause risk levels', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    const highRiskBadges = screen.getAllByText('HIGH');
    expect(highRiskBadges).toHaveLength(2);

    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('should render clause text', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(
      screen.getByText(/Provider's total liability/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Client shall indemnify/)
    ).toBeInTheDocument();
  });

  it('should render recommendations', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(
      screen.getByText(/Consider negotiating a higher liability cap/)
    ).toBeInTheDocument();
  });

  it('should render missing clauses', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(screen.getByText('Force Majeure')).toBeInTheDocument();
    expect(screen.getByText('Dispute Resolution')).toBeInTheDocument();
    expect(screen.getByText('Confidentiality')).toBeInTheDocument();
  });

  it('should render suggestions', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(
      screen.getByText('Add a force majeure clause')
    ).toBeInTheDocument();
  });

  it('should render key dates', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(
      screen.getByText('Agreement effective date')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Agreement expiration date')
    ).toBeInTheDocument();
  });

  it('should call onClauseClick when clause is clicked', async () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    const clauseCard = screen.getByText('LIABILITY_LIMITATION').closest('div');
    await userEvent.click(clauseCard!);

    expect(mockOnClauseClick).toHaveBeenCalledWith('cl1');
  });

  it('should call onExport when export button is clicked', async () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    const exportButton = screen.getByRole('button', { name: /export/i });
    await userEvent.click(exportButton);

    expect(mockOnExport).toHaveBeenCalledWith('cr1');
  });

  it('should call onRegenerate when regenerate button is clicked', async () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    const regenerateButton = screen.getByRole('button', {
      name: /regenerate/i,
    });
    await userEvent.click(regenerateButton);

    expect(mockOnRegenerate).toHaveBeenCalledWith('cr1');
  });

  it('should render loading state', () => {
    render(
      <ContractReviewPanel
        analysis={null}
        isLoading={true}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(
      <ContractReviewPanel
        analysis={null}
        error="Failed to analyze contract"
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(
      screen.getByText('Failed to analyze contract')
    ).toBeInTheDocument();
  });

  it('should render empty state when no analysis', () => {
    render(
      <ContractReviewPanel
        analysis={null}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(
      screen.getByText(/upload a contract/i)
    ).toBeInTheDocument();
  });

  it('should expand/collapse clause details', async () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    const expandButton = screen.getAllByRole('button', { name: /expand/i })[0];
    await userEvent.click(expandButton);

    expect(
      screen.getByText(/This clause limits the provider/)
    ).toBeInTheDocument();
  });

  it('should render analysis timestamp', () => {
    render(
      <ContractReviewPanel
        analysis={mockAnalysis}
        onAnalyze={mockOnAnalyze}
        onExport={mockOnExport}
        onRegenerate={mockOnRegenerate}
        onClauseClick={mockOnClauseClick}
      />
    );

    expect(screen.getByText(/Mar 15, 2024/)).toBeInTheDocument();
  });
});
