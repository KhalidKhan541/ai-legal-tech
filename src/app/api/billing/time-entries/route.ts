import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const timeEntrySchema = z.object({
  description: z.string().min(1, "Description is required"),
  hours: z.number().min(0.1, "Hours must be at least 0.1"),
  rate: z.number().min(0, "Rate must be positive"),
  date: z.string().optional(),
  billable: z.boolean().optional(),
  matterId: z.string().min(1, "Matter is required"),
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
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const billable = searchParams.get("billable");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (matterId) where.matterId = matterId;
    if (userId) where.userId = userId;
    if (billable !== null && billable !== undefined) {
      where.billable = billable === "true";
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
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
      prisma.timeEntry.count({ where }),
    ]);

    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalAmount = timeEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const billableHours = timeEntries.filter((e) => e.billable).reduce((sum, entry) => sum + entry.hours, 0);

    return NextResponse.json({
      timeEntries,
      summary: { totalHours, totalAmount, billableHours },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET time entries error:", error);
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
    const validatedData = timeEntrySchema.parse(body);

    const matter = await prisma.matter.findUnique({ where: { id: validatedData.matterId } });
    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const amount = validatedData.hours * validatedData.rate;

    const timeEntry = await prisma.timeEntry.create({
      data: {
        description: validatedData.description,
        hours: validatedData.hours,
        rate: validatedData.rate,
        amount,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        billable: validatedData.billable ?? true,
        matterId: validatedData.matterId,
        userId: (session.user as any).id,
      },
      include: {
        matter: { select: { id: true, title: true, number: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ timeEntry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST time entries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
