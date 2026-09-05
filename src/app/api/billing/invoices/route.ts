import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  matterId: z.string().optional().nullable(),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  timeEntryIds: z.array(z.string()).optional(),
  expenseIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          timeEntries: true,
          payments: true,
          expenses: true,
          _count: { select: { timeEntries: true, payments: true, expenses: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    const totalRevenue = invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.total, 0);
    const totalOutstanding = invoices
      .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
      .reduce((sum, inv) => sum + inv.total, 0);

    return NextResponse.json({
      invoices,
      summary: { totalRevenue, totalOutstanding },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET invoices error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, "0")}`;

    let totalAmount = 0;
    let taxAmount = 0;

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        status: "DRAFT",
        total: 0,
        tax: 0,
        dueDate: new Date(validatedData.dueDate),
        notes: validatedData.notes,
        clientId: validatedData.clientId,
        matterId: validatedData.matterId || null,
      },
    });

    if (validatedData.timeEntryIds && validatedData.timeEntryIds.length > 0) {
      const timeEntries = await prisma.timeEntry.findMany({
        where: { id: { in: validatedData.timeEntryIds } },
      });
      totalAmount += timeEntries.reduce((sum, entry) => sum + entry.amount, 0);

      await prisma.timeEntry.updateMany({
        where: { id: { in: validatedData.timeEntryIds } },
        data: { invoiceId: invoice.id },
      });
    }

    if (validatedData.expenseIds && validatedData.expenseIds.length > 0) {
      const expenses = await prisma.expense.findMany({
        where: { id: { in: validatedData.expenseIds } },
      });
      totalAmount += expenses.reduce((sum, expense) => sum + expense.amount, 0);

      await prisma.expense.updateMany({
        where: { id: { in: validatedData.expenseIds } },
        data: { invoiceId: invoice.id },
      });
    }

    taxAmount = totalAmount * 0.1;

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { total: totalAmount, tax: taxAmount },
      include: {
        timeEntries: true,
        expenses: true,
      },
    });

    return NextResponse.json({ invoice: updatedInvoice }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST invoices error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
