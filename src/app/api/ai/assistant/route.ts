import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const assistantMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  context: z.object({
    matterId: z.string().optional(),
    documentId: z.string().optional(),
    contractId: z.string().optional(),
  }).optional(),
});

const AI_SYSTEM_PROMPT = `You are a legal AI assistant for a law firm management platform. You can help with:
- Legal research and case analysis
- Document review and contract analysis
- Task management and scheduling
- Billing and time tracking
- Client communication drafting
- Legal terminology and concepts

Always provide professional, accurate legal information while noting that your responses do not constitute legal advice.`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = assistantMessageSchema.parse(body);

    let contextData = "";

    if (validatedData.context?.matterId) {
      const matter = await prisma.matter.findUnique({
        where: { id: validatedData.context.matterId },
        include: { client: true, documents: { take: 3 } },
      });
      if (matter) {
        contextData += `\nCurrent Matter: ${matter.title} (${matter.number})\n`;
        contextData += `Client: ${matter.client.name}\n`;
        contextData += `Status: ${matter.status}\n`;
        contextData += `Type: ${matter.type}\n`;
      }
    }

    if (validatedData.context?.documentId) {
      const document = await prisma.document.findUnique({
        where: { id: validatedData.context.documentId },
      });
      if (document) {
        contextData += `\nCurrent Document: ${document.title}\n`;
        contextData += `Type: ${document.type}\n`;
        if (document.content) {
          contextData += `Content Preview: ${document.content.slice(0, 500)}\n`;
        }
      }
    }

    if (validatedData.context?.contractId) {
      const contract = await prisma.contract.findUnique({
        where: { id: validatedData.context.contractId },
        include: { clauses: true },
      });
      if (contract) {
        contextData += `\nCurrent Contract: ${contract.title}\n`;
        contextData += `Status: ${contract.status}\n`;
        contextData += `Clauses: ${contract.clauses.length}\n`;
      }
    }

    const response = {
      id: crypto.randomUUID(),
      message: validatedData.message,
      response: generateLegalResponse(validatedData.message, contextData),
      timestamp: new Date().toISOString(),
      context: validatedData.context,
    };

    return NextResponse.json({ response });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST AI assistant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateLegalResponse(message: string, context: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("contract") || lowerMessage.includes("agreement")) {
    return `Based on your query about contracts, I can help you with:\n\n1. **Contract Review**: I can analyze contract clauses for potential risks and favorable terms.\n\n2. **Key Clauses to Review**: Always check indemnification, limitation of liability, termination, and intellectual property clauses.\n\n3. **Best Practices**: Ensure all parties are clearly defined, deliverables are specified, and payment terms are clear.${context ? `\n\nContext from your current matter:${context}` : ""}`;
  }

  if (lowerMessage.includes("research") || lowerMessage.includes("case law")) {
    return `For legal research, I recommend:\n\n1. **Search Strategy**: Start with key terms and narrow down using boolean operators.\n\n2. **Source Verification**: Always verify case citations and check for subsequent history.\n\n3. **Jurisdiction**: Ensure you're looking at relevant jurisdiction authority.${context ? `\n\nCurrent context:${context}` : ""}`;
  }

  if (lowerMessage.includes("deadline") || lowerMessage.includes("statute")) {
    return `Important deadline considerations:\n\n1. **Statute of Limitations**: Always verify applicable limitations periods.\n\n2. **Court Deadlines**: Track all filing deadlines and appearance dates.\n\n3. **Client Deadlines**: Set reminders for client-responsive deadlines.${context ? `\n\nMatter context:${context}` : ""}`;
  }

  if (lowerMessage.includes("billing") || lowerMessage.includes("invoice")) {
    return `Billing best practices:\n\n1. **Time Entry**: Record time contemporaneously for accuracy.\n\n2. **Descriptions**: Use clear, detailed descriptions that explain the work performed.\n\n3. **Rate Confirmation**: Ensure billing rates are agreed upon with clients.${context ? `\n\nMatter details:${context}` : ""}`;
  }

  return `I understand your question: "${message}"\n\nAs your legal AI assistant, I can help with:\n\n- **Document Analysis**: Review contracts, briefs, and legal documents\n- **Legal Research**: Find relevant case law and statutes\n- **Task Management**: Help organize and prioritize your workload\n- **Billing Support**: Assist with time tracking and invoicing\n- **Client Communication**: Draft professional correspondence${context ? `\n\nBased on the current context:${context}` : ""}\n\nPlease provide more details about how I can assist you.`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      capabilities: [
        "Legal research assistance",
        "Contract analysis and review",
        "Document drafting support",
        "Case law research",
        "Statutory interpretation",
        "Billing and time tracking guidance",
        "Task prioritization",
        "Client communication drafting",
      ],
      systemPrompt: AI_SYSTEM_PROMPT,
    });
  } catch (error) {
    console.error("GET AI assistant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
