import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeTracker } from '@/components/billing/time-tracker';

const mockTimeEntries = [
  {
    id: 'te1',
    description: 'Contract review and analysis',
    hours: 3.5,
    rate: 350,
    amount: 1225,
    date: new Date('2024-03-15'),
    status: 'APPROVED',
    billable: true,
    category: 'LEGAL_RESEARCH',
    matter: { id: 'm1', title: 'Smith v. Jones' },
    user: { id: 'u1', name: 'Jane Doe' },
  },
  {
    id: 'te2',
    description: 'Client meeting - case strategy',
    hours: 1.5,
    rate: 350,
    amount: 525,
    date: new Date('2024-03-16'),
    status: 'PENDING',
    billable: true,
    category: 'MEETING',
    matter: { id: 'm1', title: 'Smith v. Jones' },
    user: { id: 'u1', name: 'Jane Doe' },
  },
  {
    id: 'te3',
    description: 'Internal team discussion',
    hours: 0.5,
    rate: 0,
    amount: 0,
    date: new Date('2024-03-17'),
    status: 'APPROVED',
    billable: false,
    category: 'ADMIN',
    matter: { id: 'm1', title: 'Smith v. Jones' },
    user: { id: 'u1', name: 'Jane Doe' },
  },
];

describe('TimeTracker', () => {
  const mockOnCreate = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnApprove = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render time entries', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(
      screen.getByText('Contract review and analysis')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Client meeting - case strategy')
    ).toBeInTheDocument();
  });

  it('should render total hours', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(screen.getByText('5.5')).toBeInTheDocument();
  });

  it('should render total amount', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(screen.getByText('$1,750.00')).toBeInTheDocument();
  });

  it('should render entry count', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(screen.getByText('3 entries')).toBeInTheDocument();
  });

  it('should render status badges', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    const approvedBadges = screen.getAllByText('APPROVED');
    expect(approvedBadges).toHaveLength(2);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should render billable indicator', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    const billableIcons = screen.getAllByTestId('billable-icon');
    expect(billableIcons).toHaveLength(2);
  });

  it('should render create button', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(
      screen.getByRole('button', { name: /add time entry/i })
    ).toBeInTheDocument();
  });

  it('should call onCreate when add button is clicked', async () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    const addButton = screen.getByRole('button', {
      name: /add time entry/i,
    });
    await userEvent.click(addButton);

    expect(mockOnCreate).toHaveBeenCalled();
  });

  it('should call onEdit when edit button is clicked', async () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith('te1');
  });

  it('should call onDelete when delete button is clicked', async () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith('te1');
  });

  it('should render rate and hours columns', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('$350.00')).toBeInTheDocument();
    expect(screen.getByText('1.5')).toBeInTheDocument();
  });

  it('should render category labels', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(screen.getByText('LEGAL_RESEARCH')).toBeInTheDocument();
    expect(screen.getByText('MEETING')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('should render empty state when no entries', () => {
    render(
      <TimeTracker
        entries={[]}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(screen.getByText(/no time entries/i)).toBeInTheDocument();
  });

  it('should render filter controls', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
        showFilters={true}
      />
    );

    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/billable/i)).toBeInTheDocument();
  });

  it('should call onFilter when filter changes', async () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
        showFilters={true}
      />
    );

    const statusFilter = screen.getByLabelText(/status/i);
    await userEvent.selectOptions(statusFilter, 'PENDING');

    expect(mockOnFilter).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' })
    );
  });

  it('should render submit button for pending entries', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(
      screen.getByRole('button', { name: /submit for approval/i })
    ).toBeInTheDocument();
  });

  it('should call onSubmit when submit button is clicked', async () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /submit for approval/i,
    });
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should render date columns', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    expect(screen.getByText(/Mar 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 16, 2024/)).toBeInTheDocument();
  });

  it('should render user information', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    const janeEntries = screen.getAllByText('Jane Doe');
    expect(janeEntries).toHaveLength(3);
  });

  it('should render matter information', () => {
    render(
      <TimeTracker
        entries={mockTimeEntries}
        onCreate={mockOnCreate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onApprove={mockOnApprove}
        onSubmit={mockOnSubmit}
        onFilter={mockOnFilter}
      />
    );

    const matterEntries = screen.getAllByText('Smith v. Jones');
    expect(matterEntries).toHaveLength(3);
  });
});
