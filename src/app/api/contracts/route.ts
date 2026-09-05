import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const contractSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  matterId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  value: z.number().optional(),
  status: z.enum(["DRAFT", "UNDER_REVIEW", "NEGOTIATION", "PENDING_SIGNATURE", "ACTIVE", "EXPIRED", "TERMINATED", "ARCHIVED"]).optional(),
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
    const matterId = searchParams.get("matterId");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (matterId) where.matterId = matterId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          matter: { select: { id: true, title: true, number: true } },
          _count: { select: { clauses: true, reviews: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ]);

    return NextResponse.json({
      contracts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET contracts error:", error);
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
    const validatedData = contractSchema.parse(body);

    const contract = await prisma.contract.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        matterId: validatedData.matterId || null,
        clientId: validatedData.clientId || null,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        value: validatedData.value,
        status: validatedData.status || "DRAFT",
      },
      include: {
        matter: { select: { id: true, title: true, number: true } },
      },
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST contracts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
