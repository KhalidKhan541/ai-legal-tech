export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface DeadlineNotificationData {
  clientName: string;
  matterTitle: string;
  deadline: Date;
  description: string;
  daysRemaining: number;
}

export interface TaskNotificationData {
  assigneeName: string;
  taskTitle: string;
  matterTitle: string;
  dueDate?: Date;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface InvoiceEmailData {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  matterTitle: string;
  lineItems: Array<{ description: string; hours: number; rate: number; amount: number }>;
}

// ─── Email Templates ─────────────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #1e293b; padding: 24px 32px; }
        .header h1 { color: #ffffff; font-size: 20px; margin: 0; }
        .content { padding: 32px; color: #334155; line-height: 1.6; }
        .footer { padding: 24px 32px; background: #f8fafc; color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .btn-urgent { background: #dc2626; }
        .highlight { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px; }
        .highlight-urgent { background: #fef2f2; border-left-color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { text-align: left; padding: 8px 12px; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #64748b; }
        td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        .total { font-weight: 700; font-size: 18px; color: #1e293b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AI Legal Tech</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>AI Legal Tech Platform &bull; Confidential Legal Communication</p>
          <p>If you received this in error, please notify the sender immediately.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function renderInvoiceEmail(data: InvoiceEmailData): { subject: string; html: string; text: string } {
  const lineItemsHtml = data.lineItems
    .map(
      (item) => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align:right">${item.hours.toFixed(1)}h</td>
        <td style="text-align:right">$${item.rate.toFixed(2)}</td>
        <td style="text-align:right">$${item.amount.toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  const total = data.lineItems.reduce((sum, item) => sum + item.amount, 0);

  const html = baseLayout(`
    <p>Dear ${data.clientName},</p>
    <p>Please find your invoice below for legal services rendered.</p>
    <div class="highlight">
      <strong>Invoice #${data.invoiceNumber}</strong><br>
      Matter: ${data.matterTitle}<br>
      Due Date: ${data.dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
    </div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:right">Hours</th>
          <th style="text-align:right">Rate</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="total">Total</td>
          <td class="total" style="text-align:right">$${total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
    <p>Payment is due within 30 days. Please remit payment to the account details provided.</p>
    <p>If you have questions about this invoice, please contact our billing department.</p>
    <p>Best regards,<br>AI Legal Tech Billing</p>
  `);

  const text = `Invoice #${data.invoiceNumber}\nMatter: ${data.matterTitle}\nDue: ${data.dueDate.toLocaleDateString()}\nTotal: $${total.toFixed(2)}`;

  return { subject: `Invoice #${data.invoiceNumber} - ${data.matterTitle}`, html, text };
}

export function renderDeadlineNotification(data: DeadlineNotificationData): { subject: string; html: string; text: string } {
  const isUrgent = data.daysRemaining <= 3;
  const highlightClass = isUrgent ? "highlight highlight-urgent" : "highlight";

  const html = baseLayout(`
    <p>Dear ${data.clientName},</p>
    <p>This is a ${isUrgent ? "<strong style='color:#dc2626'>URGENT</strong>" : "friendly"} reminder about an upcoming deadline.</p>
    <div class="${highlightClass}">
      <strong>${data.matterTitle}</strong><br>
      Deadline: ${data.deadline.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}<br>
      <strong>${data.daysRemaining} day${data.daysRemaining !== 1 ? "s" : ""} remaining</strong>
    </div>
    <p>${data.description}</p>
    <p>Please take the necessary action before the deadline.</p>
    <p>Best regards,<br>AI Legal Tech</p>
  `);

  const text = `Deadline: ${data.matterTitle}\nDue: ${data.deadline.toLocaleDateString()}\n${data.daysRemaining} days remaining\n${data.description}`;

  return {
    subject: `${isUrgent ? "[URGENT] " : ""}Deadline Reminder: ${data.matterTitle}`,
    html,
    text,
  };
}

export function renderTaskAssignment(data: TaskNotificationData): { subject: string; html: string; text: string } {
  const priorityColors: Record<string, string> = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#f97316",
    urgent: "#dc2626",
  };

  const html = baseLayout(`
    <p>Dear ${data.assigneeName},</p>
    <p>You have been assigned a new task.</p>
    <div class="highlight">
      <strong>${data.taskTitle}</strong><br>
      Matter: ${data.matterTitle}<br>
      ${data.dueDate ? `Due: ${data.dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}<br>` : ""}
      <span style="color:${priorityColors[data.priority]};font-weight:600;text-transform:uppercase">${data.priority}</span>
    </div>
    <p>Please review and complete this task in the platform.</p>
    <p>Best regards,<br>AI Legal Tech</p>
  `);

  const text = `Task: ${data.taskTitle}\nMatter: ${data.matterTitle}\nPriority: ${data.priority}${data.dueDate ? `\nDue: ${data.dueDate.toLocaleDateString()}` : ""}`;

  return {
    subject: `New Task: ${data.taskTitle} - ${data.matterTitle}`,
    html,
    text,
  };
}

// ─── Email Sender (Abstraction) ──────────────────────────────────────────────

export interface EmailTransporter {
  sendMail(options: {
    from: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: EmailAttachment[];
    replyTo?: string;
  }): Promise<{ messageId: string }>;
}

let transporter: EmailTransporter | null = null;

export function configureEmailTransport(t: EmailTransporter): void {
  transporter = t;
}

export async function sendEmail(message: EmailMessage): Promise<{ messageId: string }> {
  if (!transporter) {
    console.warn("[Email] No transporter configured. Logging email instead.");
    console.log(`[Email] To: ${message.to} | Subject: ${message.subject}`);
    return { messageId: `mock-${crypto.randomUUID()}` };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@ailegaltech.com",
    to: message.to,
    cc: message.cc,
    bcc: message.bcc,
    subject: message.subject,
    html: message.html,
    text: message.text,
    attachments: message.attachments,
    replyTo: message.replyTo,
  });
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<{ messageId: string }> {
  const { subject, html, text } = renderInvoiceEmail(data);
  return sendEmail({ to: data.clientName, subject, html, text });
}

export async function sendDeadlineNotification(
  to: string,
  data: DeadlineNotificationData
): Promise<{ messageId: string }> {
  const { subject, html, text } = renderDeadlineNotification(data);
  return sendEmail({ to, subject, html, text });
}

export async function sendTaskAssignment(
  to: string,
  data: TaskNotificationData
): Promise<{ messageId: string }> {
  const { subject, html, text } = renderTaskAssignment(data);
  return sendEmail({ to, subject, html, text });
}
