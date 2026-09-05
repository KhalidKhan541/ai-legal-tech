import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentGrid } from '@/components/documents/document-grid';

const mockDocuments = [
  {
    id: 'd1',
    name: 'Contract Draft v1.pdf',
    type: 'CONTRACT',
    mimeType: 'application/pdf',
    size: 245760,
    uploadedBy: { id: 'u1', name: 'Jane Doe' },
    createdAt: new Date('2024-03-15'),
    tags: [{ id: 't1', name: 'contract' }, { id: 't2', name: 'draft' }],
    versions: [{ version: 2, uploadedAt: new Date('2024-03-20') }],
  },
  {
    id: 'd2',
    name: 'Client Correspondence.docx',
    type: 'CORRESPONDENCE',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 102400,
    uploadedBy: { id: 'u2', name: 'Bob Wilson' },
    createdAt: new Date('2024-03-18'),
    tags: [{ id: 't3', name: 'correspondence' }],
    versions: [{ version: 1, uploadedAt: new Date('2024-03-18') }],
  },
  {
    id: 'd3',
    name: 'Financial Report.xlsx',
    type: 'OTHER',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 512000,
    uploadedBy: { id: 'u1', name: 'Jane Doe' },
    createdAt: new Date('2024-03-22'),
    tags: [],
    versions: [{ version: 1, uploadedAt: new Date('2024-03-22') }],
  },
];

describe('DocumentGrid', () => {
  const mockOnSelect = jest.fn();
  const mockOnUpload = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnDownload = jest.fn();
  const mockOnPreview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render document list', () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    expect(
      screen.getByText('Contract Draft v1.pdf')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Client Correspondence.docx')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Financial Report.xlsx')
    ).toBeInTheDocument();
  });

  it('should render upload button', () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    expect(
      screen.getByRole('button', { name: /upload/i })
    ).toBeInTheDocument();
  });

  it('should call onUpload when upload button is clicked', async () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await userEvent.click(uploadButton);

    expect(mockOnUpload).toHaveBeenCalled();
  });

  it('should render document count', () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText('3 documents')).toBeInTheDocument();
  });

  it('should render document type icons', () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    const contractDoc = screen.getByText('Contract Draft v1.pdf');
    const correspondenceDoc = screen.getByText('Client Correspondence.docx');

    expect(contractDoc.closest('[data-type]')).toHaveAttribute(
      'data-type',
      'CONTRACT'
    );
    expect(correspondenceDoc.closest('[data-type]')).toHaveAttribute(
      'data-type',
      'CORRESPONDENCE'
    );
  });

  it('should call onSelect when document is clicked', async () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    const documentRow = screen.getByText('Contract Draft v1.pdf').closest('tr');
    await userEvent.click(documentRow!);

    expect(mockOnSelect).toHaveBeenCalledWith('d1');
  });

  it('should render file sizes in human-readable format', () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText('240 KB')).toBeInTheDocument();
    expect(screen.getByText('100 KB')).toBeInTheDocument();
    expect(screen.getByText('500 KB')).toBeInTheDocument();
  });

  it('should render uploaded by information', () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('should render tags for documents', () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText('contract')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('correspondence')).toBeInTheDocument();
  });

  it('should render version count', () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('should render empty state when no documents', () => {
    render(
      <DocumentGrid
        documents={[]}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText(/no documents/i)).toBeInTheDocument();
  });

  it('should call onDownload when download button is clicked', async () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    const downloadButtons = screen.getAllByRole('button', {
      name: /download/i,
    });
    await userEvent.click(downloadButtons[0]);

    expect(mockOnDownload).toHaveBeenCalledWith('d1');
  });

  it('should call onDelete when delete button is clicked', async () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith('d1');
  });

  it('should filter documents by type', async () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
        showFilters={true}
      />
    );

    const typeFilter = screen.getByRole('combobox', { name: /type/i });
    await userEvent.selectOptions(typeFilter, 'CONTRACT');

    expect(
      screen.getByText('Contract Draft v1.pdf')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Client Correspondence.docx')
    ).not.toBeInTheDocument();
  });

  it('should search documents by name', async () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
        showFilters={true}
      />
    );

    const searchInput = screen.getByRole('searchbox', { name: /search/i });
    await userEvent.type(searchInput, 'Contract');

    expect(
      screen.getByText('Contract Draft v1.pdf')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Financial Report.xlsx')
    ).not.toBeInTheDocument();
  });

  it('should render date columns', () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText(/Mar 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 18, 2024/)).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    render(
      <DocumentGrid
        documents={mockDocuments}
        onSelect={mockOnSelect}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
        onPreview={mockOnPreview}
      />
    );

    const firstRow = screen.getByText('Contract Draft v1.pdf').closest('tr');
    firstRow?.focus();

    fireEvent.keyDown(firstRow!, { key: 'Enter' });

    expect(mockOnSelect).toHaveBeenCalledWith('d1');
  });
});
