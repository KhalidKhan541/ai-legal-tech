export interface PDFPage {
  content: PDFElement[];
  header?: PDFElement[];
  footer?: PDFElement[];
}

export interface PDFElement {
  type: "text" | "heading" | "paragraph" | "table" | "list" | "line" | "spacer" | "image";
  content?: string;
  level?: 1 | 2 | 3 | 4;
  items?: string[];
  table?: PDFTableData;
  style?: PDFStyle;
}

export interface PDFTableData {
  headers: string[];
  rows: (string | number)[][];
  widths?: number[];
}

export interface PDFStyle {
  fontSize?: number;
  fontFamily?: "helvetica" | "courier" | "times";
  fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
  color?: string;
  align?: "left" | "center" | "right";
  margin?: { top: number; bottom: number; left: number; right: number };
}

export interface PDFOptions {
  title?: string;
  author?: string;
  subject?: string;
  pageSize?: "letter" | "a4" | "legal";
  margins?: { top: number; bottom: number; left: number; right: number };
  styles?: Record<string, PDFStyle>;
}

// ─── Invoice Data Types ──────────────────────────────────────────────────────

export interface InvoicePDFData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  from: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    taxId?: string;
  };
  to: {
    name: string;
    address?: string;
    email?: string;
    company?: string;
  };
  matter: {
    title: string;
    number?: string;
  };
  lineItems: Array<{
    description: string;
    date?: Date;
    hours?: number;
    rate?: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  currency?: string;
  notes?: string;
  paymentInstructions?: string;
}

export interface ContractPDFData {
  title: string;
  effectiveDate: Date;
  parties: Array<{
    name: string;
    role: string;
    address?: string;
    signatory?: string;
  }>;
  sections: Array<{
    title: string;
    content: string;
    clauses?: Array<{
      number: string;
      title: string;
      content: string;
    }>;
  }>;
  signatureBlock?: boolean;
  governingLaw?: string;
  jurisdiction?: string;
}

// ─── PDF Builder ─────────────────────────────────────────────────────────────

export class PDFBuilder {
  private pages: PDFPage[] = [{ content: [] }];
  private options: Required<PDFOptions>;
  private currentPage = 0;

  constructor(options: PDFOptions = {}) {
    this.options = {
      title: options.title ?? "",
      author: options.author ?? "",
      subject: options.subject ?? "",
      pageSize: options.pageSize ?? "letter",
      margins: options.margins ?? { top: 72, bottom: 72, left: 72, right: 72 },
      styles: options.styles ?? {},
    };
  }

  addText(text: string, style?: PDFStyle): this {
    this.getCurrentPage().content.push({
      type: "text",
      content: text,
      style,
    });
    return this;
  }

  addHeading(text: string, level: 1 | 2 | 3 | 4 = 1, style?: PDFStyle): this {
    this.getCurrentPage().content.push({
      type: "heading",
      content: text,
      level,
      style,
    });
    return this;
  }

  addParagraph(text: string, style?: PDFStyle): this {
    this.getCurrentPage().content.push({
      type: "paragraph",
      content: text,
      style,
    });
    return this;
  }

  addTable(data: PDFTableData, style?: PDFStyle): this {
    this.getCurrentPage().content.push({
      type: "table",
      table: data,
      style,
    });
    return this;
  }

  addList(items: string[], style?: PDFStyle): this {
    this.getCurrentPage().content.push({
      type: "list",
      items,
      style,
    });
    return this;
  }

  addLine(style?: PDFStyle): this {
    this.getCurrentPage().content.push({
      type: "line",
      style,
    });
    return this;
  }

  addSpacer(height = 20): this {
    this.getCurrentPage().content.push({
      type: "spacer",
      style: { margin: { top: height, bottom: 0, left: 0, right: 0 } },
    });
    return this;
  }

  newPage(): this {
    this.pages.push({ content: [] });
    this.currentPage = this.pages.length - 1;
    return this;
  }

  build(): PDFPage[] {
    return [...this.pages];
  }

  private getCurrentPage(): PDFPage {
    return this.pages[this.currentPage]!;
  }
}

// ─── Invoice PDF Generator ───────────────────────────────────────────────────

export function generateInvoicePDF(data: InvoicePDFData): PDFPage[] {
  const builder = new PDFBuilder({
    title: `Invoice ${data.invoiceNumber}`,
    author: data.from.name,
  });

  // Header
  builder
    .addHeading(data.from.name, 1, { fontSize: 20, color: "#1e293b" })
    .addText(data.from.address ?? "", { fontSize: 10, color: "#64748b" })
    .addText(data.from.email ?? "", { fontSize: 10, color: "#64748b" })
    .addText(data.from.phone ?? "", { fontSize: 10, color: "#64748b" })
    .addSpacer(10)
    .addLine({ color: "#e2e8f0" })
    .addSpacer(10);

  // Invoice Title & Info
  builder
    .addHeading("INVOICE", 2, { fontSize: 24, color: "#2563eb", align: "right" })
    .addSpacer(5);

  // Invoice details table
  builder.addTable(
    {
      headers: ["Invoice Number", "Issue Date", "Due Date"],
      rows: [
        [
          data.invoiceNumber,
          data.issueDate.toLocaleDateString("en-US"),
          data.dueDate.toLocaleDateString("en-US"),
        ],
      ],
    },
    { fontSize: 10 }
  );

  builder.addSpacer(15);

  // Bill To
  builder
    .addHeading("Bill To:", 3, { fontSize: 12, color: "#64748b" })
    .addText(data.to.name, { fontSize: 11, fontStyle: "bold" })
    .addText(data.to.company ?? "", { fontSize: 10 })
    .addText(data.to.address ?? "", { fontSize: 10 })
    .addText(data.to.email ?? "", { fontSize: 10 });

  builder.addSpacer(15);

  // Matter Info
  if (data.matter.number) {
    builder.addText(`Matter: ${data.matter.title} (${data.matter.number})`, {
      fontSize: 10,
      color: "#64748b",
    });
    builder.addSpacer(10);
  }

  // Line Items Table
  const lineItemRows = data.lineItems.map((item) => [
    item.description,
    item.date ? item.date.toLocaleDateString("en-US") : "",
    item.hours ? item.hours.toFixed(1) : "",
    item.rate ? `$${item.rate.toFixed(2)}` : "",
    `$${item.amount.toFixed(2)}`,
  ]);

  builder.addTable(
    {
      headers: ["Description", "Date", "Hours", "Rate", "Amount"],
      rows: lineItemRows,
      widths: [40, 15, 10, 15, 15],
    },
    { fontSize: 9 }
  );

  builder.addSpacer(10);

  // Totals
  const totalRows: (string | number)[][] = [
    ["Subtotal", `$${data.subtotal.toFixed(2)}`],
  ];

  if (data.tax !== undefined) {
    totalRows.push([`Tax (${data.taxRate ?? 0}%)`, `$${data.tax.toFixed(2)}`]);
  }

  totalRows.push(["Total", `$${data.total.toFixed(2)}`]);

  builder.addTable(
    {
      headers: ["", "Amount"],
      rows: totalRows,
      widths: [70, 30],
    },
    { fontSize: 10 }
  );

  builder.addSpacer(15);

  // Notes
  if (data.notes) {
    builder
      .addHeading("Notes", 3, { fontSize: 11, color: "#64748b" })
      .addParagraph(data.notes, { fontSize: 9 });
    builder.addSpacer(10);
  }

  // Payment Instructions
  if (data.paymentInstructions) {
    builder
      .addHeading("Payment Instructions", 3, { fontSize: 11, color: "#64748b" })
      .addParagraph(data.paymentInstructions, { fontSize: 9 });
  }

  return builder.build();
}

// ─── Contract PDF Generator ──────────────────────────────────────────────────

export function generateContractPDF(data: ContractPDFData): PDFPage[] {
  const builder = new PDFBuilder({
    title: data.title,
    author: data.parties[0]?.name,
  });

  // Title
  builder
    .addHeading(data.title, 1, { fontSize: 18, align: "center", color: "#1e293b" })
    .addSpacer(5)
    .addText(
      `Effective Date: ${data.effectiveDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      { fontSize: 10, align: "center", color: "#64748b" }
    )
    .addSpacer(15)
    .addLine({ color: "#e2e8f0" })
    .addSpacer(10);

  // Parties
  builder.addHeading("PARTIES", 2, { fontSize: 12, color: "#2563eb" });
  builder.addSpacer(5);

  for (const party of data.parties) {
    builder
      .addText(`${party.name} (${party.role})`, { fontSize: 10, fontStyle: "bold" })
      .addText(party.address ?? "", { fontSize: 9, color: "#64748b" });
    builder.addSpacer(5);
  }

  builder.addSpacer(10);
  builder.addLine({ color: "#e2e8f0" });
  builder.addSpacer(10);

  // Sections
  for (const section of data.sections) {
    builder.addHeading(section.title, 2, { fontSize: 13, color: "#1e293b" });
    builder.addSpacer(3);
    builder.addParagraph(section.content, { fontSize: 10 });

    if (section.clauses && section.clauses.length > 0) {
      builder.addSpacer(5);
      for (const clause of section.clauses) {
        builder
          .addText(`${clause.number} ${clause.title}`, {
            fontSize: 10,
            fontStyle: "bold",
          })
          .addParagraph(clause.content, { fontSize: 9 });
        builder.addSpacer(3);
      }
    }

    builder.addSpacer(10);
  }

  // Governing Law
  if (data.governingLaw) {
    builder.addSpacer(10);
    builder.addLine({ color: "#e2e8f0" });
    builder.addSpacer(10);
    builder.addHeading("GOVERNING LAW", 2, { fontSize: 12, color: "#2563eb" });
    builder.addParagraph(
      `This Agreement shall be governed by and construed in accordance with the laws of ${data.governingLaw}.`,
      { fontSize: 10 }
    );

    if (data.jurisdiction) {
      builder.addParagraph(
        `Any disputes arising under this Agreement shall be resolved in the courts of ${data.jurisdiction}.`,
        { fontSize: 10 }
      );
    }
  }

  // Signature Blocks
  if (data.signatureBlock) {
    builder.addSpacer(30);
    builder.addLine({ color: "#e2e8f0" });
    builder.addSpacer(15);
    builder.addHeading("SIGNATURES", 2, { fontSize: 12, color: "#2563eb" });
    builder.addSpacer(10);

    for (const party of data.parties) {
      builder.addSpacer(20);
      builder.addText("_".repeat(40), { fontSize: 10 });
      builder.addText(`${party.signatory ?? party.name}`, {
        fontSize: 10,
        fontStyle: "bold",
      });
      builder.addText(party.role, { fontSize: 9, color: "#64748b" });
      builder.addText("Date: _______________", { fontSize: 9, color: "#64748b" });
      builder.addSpacer(10);
    }
  }

  return builder.build();
}

// ─── Simple PDF to HTML Renderer (for server-side) ───────────────────────────

export function renderPDFToHTML(pages: PDFPage[]): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
    th { background: #f8fafc; font-weight: 600; }
    h1 { font-size: 20pt; margin: 0; }
    h2 { font-size: 14pt; margin: 10px 0 5px; }
    h3 { font-size: 12pt; margin: 8px 0 4px; color: #64748b; }
    .line { border-top: 1px solid #e2e8f0; margin: 10px 0; }
    ul { padding-left: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>`;

  for (const page of pages) {
    for (const element of page.content) {
      switch (element.type) {
        case "heading": {
          const tag = `h${element.level ?? 1}`;
          const style = buildInlineStyle(element.style);
          html += `<${tag} style="${style}">${escapeHTML(element.content ?? "")}</${tag}>`;
          break;
        }
        case "text": {
          const style = buildInlineStyle(element.style);
          html += `<p style="margin:2px 0;${style}">${escapeHTML(element.content ?? "")}</p>`;
          break;
        }
        case "paragraph": {
          const style = buildInlineStyle(element.style);
          html += `<p style="margin:6px 0;line-height:1.6;${style}">${escapeHTML(element.content ?? "")}</p>`;
          break;
        }
        case "table": {
          if (!element.table) break;
          const { headers, rows } = element.table;
          html += "<table><thead><tr>";
          for (const header of headers) {
            html += `<th>${escapeHTML(header)}</th>`;
          }
          html += "</tr></thead><tbody>";
          for (const row of rows) {
            html += "<tr>";
            for (const cell of row) {
              html += `<td>${escapeHTML(String(cell))}</td>`;
            }
            html += "</tr>";
          }
          html += "</tbody></table>";
          break;
        }
        case "list": {
          html += "<ul>";
          for (const item of element.items ?? []) {
            html += `<li>${escapeHTML(item)}</li>`;
          }
          html += "</ul>";
          break;
        }
        case "line":
          html += '<div class="line"></div>';
          break;
        case "spacer": {
          const h = element.style?.margin?.top ?? 20;
          html += `<div style="height:${h}px"></div>`;
          break;
        }
      }
    }
  }

  html += "</body></html>";
  return html;
}

function buildInlineStyle(style?: PDFStyle): string {
  if (!style) return "";
  const parts: string[] = [];
  if (style.fontSize) parts.push(`font-size:${style.fontSize}pt`);
  if (style.fontFamily) parts.push(`font-family:${style.fontFamily}`);
  if (style.fontStyle) parts.push(`font-weight:${style.fontStyle === "bold" || style.fontStyle === "bolditalic" ? "700" : "400"}`);
  if (style.color) parts.push(`color:${style.color}`);
  if (style.align) parts.push(`text-align:${style.align}`);
  return parts.join(";");
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
