import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const updateInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        timeEntries: {
          include: {
            matter: { select: { id: true, title: true, number: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        },
        payments: { orderBy: { date: "desc" } },
        expenses: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = invoice.total + invoice.tax - totalPaid;

    return NextResponse.json({ invoice, summary: { totalPaid, balanceDue } });
  } catch (error) {
    console.error("GET invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateInvoiceSchema.parse(body);

    const existingInvoice = await prisma.invoice.findUnique({ where: { id: params.id } });
    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }
    if (validatedData.status === "PAID") {
      updateData.paidDate = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        timeEntries: true,
        payments: true,
        expenses: true,
      },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("PUT invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Cannot delete a paid invoice" }, { status: 400 });
    }

    await prisma.timeEntry.updateMany({
      where: { invoiceId: params.id },
      data: { invoiceId: null },
    });

    await prisma.expense.updateMany({
      where: { invoiceId: params.id },
      data: { invoiceId: null },
    });

    await prisma.invoice.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("DELETE invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
