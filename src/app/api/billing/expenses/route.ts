import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be positive"),
  date: z.string().optional(),
  category: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  matterId: z.string().min(1, "Matter is required"),
  invoiceId: z.string().optional().nullable(),
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
    const matterId = searchParams.get("matterId");
    const category = searchParams.get("category");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (matterId) where.matterId = matterId;
    if (category) where.category = category;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          matter: { select: { id: true, title: true, number: true } },
          user: { select: { id: true, name: true, email: true } },
          invoice: { select: { id: true, number: true, status: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const unbilledExpenses = expenses
      .filter((e) => !e.invoiceId)
      .reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      expenses,
      summary: { totalExpenses, unbilledExpenses },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET expenses error:", error);
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
    const validatedData = expenseSchema.parse(body);

    const matter = await prisma.matter.findUnique({ where: { id: validatedData.matterId } });
    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const expense = await prisma.expense.create({
      data: {
        description: validatedData.description,
        amount: validatedData.amount,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        category: validatedData.category,
        receiptUrl: validatedData.receiptUrl,
        matterId: validatedData.matterId,
        userId: (session.user as any).id,
        invoiceId: validatedData.invoiceId || null,
      },
      include: {
        matter: { select: { id: true, title: true, number: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST expenses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
