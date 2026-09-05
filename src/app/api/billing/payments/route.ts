import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.number().min(0.01, "Amount must be positive"),
  method: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
  date: z.string().optional(),
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
    const invoiceId = searchParams.get("invoiceId");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (invoiceId) where.invoiceId = invoiceId;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: { select: { id: true, number: true, status: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const totalPaid = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payments,
      summary: { totalPaid },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET payments error:", error);
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
    const validatedData = paymentSchema.parse(body);

    const invoice = await prisma.invoice.findUnique({ where: { id: validatedData.invoiceId } });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const existingPayments = await prisma.payment.findMany({
      where: { invoiceId: validatedData.invoiceId, status: "COMPLETED" },
    });
    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = invoice.total + invoice.tax - totalPaid;

    if (validatedData.amount > balanceDue) {
      return NextResponse.json(
        { error: `Payment amount exceeds balance due of ${balanceDue}` },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: validatedData.invoiceId,
        amount: validatedData.amount,
        method: validatedData.method,
        reference: validatedData.reference,
        status: "COMPLETED",
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
      },
      include: {
        invoice: { select: { id: true, number: true, status: true } },
      },
    });

    const newTotalPaid = totalPaid + validatedData.amount;
    if (newTotalPaid >= invoice.total + invoice.tax) {
      await prisma.invoice.update({
        where: { id: validatedData.invoiceId },
        data: { status: "PAID", paidDate: new Date() },
      });
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
