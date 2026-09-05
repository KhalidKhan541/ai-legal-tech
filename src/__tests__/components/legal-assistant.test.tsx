import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegalAssistant } from '@/components/ai/legal-assistant';

const mockMessages = [
  {
    id: 'msg1',
    role: 'user',
    content: 'What are the elements of negligence in New York?',
    timestamp: new Date('2024-03-15T10:00:00Z'),
  },
  {
    id: 'msg2',
    role: 'assistant',
    content:
      'In New York, negligence requires proof of four elements: duty, breach, causation, and damages. The plaintiff must establish that the defendant owed a legal duty of care, breached that duty, and that the breach was the proximate cause of the plaintiff\'s damages.',
    timestamp: new Date('2024-03-15T10:00:05Z'),
    sources: [
      {
        title: 'Espinal v. Melville Snow Contractors',
        citation: '98 N.Y.2d 744 (2002)',
        url: 'https://court.gov/espinal',
      },
    ],
  },
  {
    id: 'msg3',
    role: 'user',
    content: 'What is the statute of limitations?',
    timestamp: new Date('2024-03-15T10:01:00Z'),
  },
  {
    id: 'msg4',
    role: 'assistant',
    content:
      'In New York, the statute of limitations for negligence is generally three years from the date of the accident under CPLR § 214.',
    timestamp: new Date('2024-03-15T10:01:05Z'),
    sources: [],
  },
];

describe('LegalAssistant', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnClearChat = jest.fn();
  const mockOnExportChat = jest.fn();
  const mockOnCopyMessage = jest.fn();
  const mockOnCitationClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render chat messages', () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    expect(
      screen.getByText(/elements of negligence/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/duty, breach, causation/)
    ).toBeInTheDocument();
  });

  it('should render message input', () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    expect(
      screen.getByRole('textbox', { name: /message/i })
    ).toBeInTheDocument();
  });

  it('should render send button', () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    expect(
      screen.getByRole('button', { name: /send/i })
    ).toBeInTheDocument();
  });

  it('should call onSendMessage when form is submitted', async () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const input = screen.getByRole('textbox', { name: /message/i });
    await userEvent.type(input, 'What is proximate cause?');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith(
      'What is proximate cause?'
    );
  });

  it('should call onClearChat when clear button is clicked', async () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);

    expect(mockOnClearChat).toHaveBeenCalled();
  });

  it('should call onExportChat when export button is clicked', async () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const exportButton = screen.getByRole('button', { name: /export/i });
    await userEvent.click(exportButton);

    expect(mockOnExportChat).toHaveBeenCalled();
  });

  it('should render message timestamps', () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/10:01 AM/)).toBeInTheDocument();
  });

  it('should render user and assistant message styles differently', () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const userMessages = screen.getAllByTestId('user-message');
    const assistantMessages = screen.getAllByTestId('assistant-message');

    expect(userMessages).toHaveLength(2);
    expect(assistantMessages).toHaveLength(2);
  });

  it('should render citations as clickable links', () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const citation = screen.getByText('Espinal v. Melville Snow Contractors');
    expect(citation).toHaveRole('link');
  });

  it('should call onCitationClick when citation is clicked', async () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const citation = screen.getByText('Espinal v. Melville Snow Contractors');
    await userEvent.click(citation);

    expect(mockOnCitationClick).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Espinal v. Melville Snow Contractors',
      })
    );
  });

  it('should render copy button on messages', () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('should call onCopyMessage when copy button is clicked', async () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    await userEvent.click(copyButtons[1]);

    expect(mockOnCopyMessage).toHaveBeenCalledWith('msg2');
  });

  it('should render loading indicator when generating', () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        isGenerating={true}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });

  it('should disable input when generating', () => {
    render(
      <LegalAssistant
        messages={mockMessages}
        isGenerating={true}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const input = screen.getByRole('textbox', { name: /message/i });
    expect(input).toBeDisabled();
  });

  it('should render empty state when no messages', () => {
    render(
      <LegalAssistant
        messages={[]}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    expect(
      screen.getByText(/ask a legal question/i)
    ).toBeInTheDocument();
  });

  it('should submit on Enter key', async () => {
    render(
      <LegalAssistant
        messages={[]}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const input = screen.getByRole('textbox', { name: /message/i });
    await userEvent.type(input, 'What is negligence?{Enter}');

    expect(mockOnSendMessage).toHaveBeenCalledWith('What is negligence?');
  });

  it('should not submit empty messages', async () => {
    render(
      <LegalAssistant
        messages={[]}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
      />
    );

    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('should render suggested questions', () => {
    render(
      <LegalAssistant
        messages={[]}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
        suggestedQuestions={[
          'What are the elements of negligence?',
          'How do I file a motion?',
          'What is the statute of limitations?',
        ]}
      />
    );

    expect(
      screen.getByText('What are the elements of negligence?')
    ).toBeInTheDocument();
  });

  it('should call onSendMessage when suggested question is clicked', async () => {
    render(
      <LegalAssistant
        messages={[]}
        onSendMessage={mockOnSendMessage}
        onClearChat={mockOnClearChat}
        onExportChat={mockOnExportChat}
        onCopyMessage={mockOnCopyMessage}
        onCitationClick={mockOnCitationClick}
        suggestedQuestions={['What are the elements of negligence?']}
      />
    );

    const suggestion = screen.getByText(
      'What are the elements of negligence?'
    );
    await userEvent.click(suggestion);

    expect(mockOnSendMessage).toHaveBeenCalledWith(
      'What are the elements of negligence?'
    );
  });
});
