import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatterCard } from '@/components/matters/matter-card';

const mockMatter = {
  id: 'm1',
  title: 'Smith v. Jones',
  description: 'Contract dispute regarding software licensing agreement',
  status: 'ACTIVE',
  type: 'LITIGATION',
  practiceArea: 'Commercial Litigation',
  jurisdiction: 'New York',
  client: { id: 'c1', name: 'John Smith' },
  assignedTo: [
    { id: 'u1', name: 'Jane Doe', email: 'jane@law.com' },
    { id: 'u2', name: 'Bob Wilson', email: 'bob@law.com' },
  ],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-03-10'),
  _count: { documents: 12, timeEntries: 45, tasks: 8 },
  totalBilled: 15750,
};

describe('MatterCard', () => {
  const mockOnClick = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render matter title', () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Smith v. Jones')).toBeInTheDocument();
  });

  it('should render matter description', () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(
      screen.getByText(/Contract dispute regarding/)
    ).toBeInTheDocument();
  });

  it('should render status badge', () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('should render client name', () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('should render assigned attorneys', () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('should render matter statistics', () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should render total billed amount', () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('$15,750.00')).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', async () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const card = screen.getByRole('button');
    await userEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith('m1');
  });

  it('should call onEdit when edit button is clicked', async () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith('m1');
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should call onDelete when delete button is clicked', async () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('m1');
  });

  it('should display different status colors', () => {
    const { rerender } = render(
      <MatterCard
        matter={{ ...mockMatter, status: 'ACTIVE' }}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const activeBadge = screen.getByText('ACTIVE');
    expect(activeBadge).toHaveClass('bg-green-100');

    rerender(
      <MatterCard
        matter={{ ...mockMatter, status: 'PENDING' }}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const pendingBadge = screen.getByText('PENDING');
    expect(pendingBadge).toHaveClass('bg-yellow-100');

    rerender(
      <MatterCard
        matter={{ ...mockMatter, status: 'CLOSED' }}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const closedBadge = screen.getByText('CLOSED');
    expect(closedBadge).toHaveClass('bg-gray-100');
  });

  it('should truncate long descriptions', () => {
    const longMatter = {
      ...mockMatter,
      description:
        'This is a very long description that should be truncated when displayed in the matter card component to maintain the card layout and readability.',
    };

    render(
      <MatterCard
        matter={longMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const description = screen.getByText(/This is a very long/);
    expect(description).toHaveClass('line-clamp-2');
  });

  it('should handle missing client gracefully', () => {
    const noClientMatter = {
      ...mockMatter,
      client: null,
    };

    render(
      <MatterCard
        matter={noClientMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No client assigned')).toBeInTheDocument();
  });

  it('should handle empty assignedTo array', () => {
    const unassignedMatter = {
      ...mockMatter,
      assignedTo: [],
    };

    render(
      <MatterCard
        matter={unassignedMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('should render practice area badge', () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Commercial Litigation')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const card = screen.getByRole('button');
    card.focus();

    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnClick).toHaveBeenCalledWith('m1');
  });

  it('should render updated date', () => {
    render(
      <MatterCard
        matter={mockMatter}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });
});
