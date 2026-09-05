import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const researchSchema = z.object({
  title: z.string().min(1, "Title is required"),
  query: z.string().min(1, "Query is required"),
  results: z.string().optional(),
  matterId: z.string().optional().nullable(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "NEEDS_REVISION", "ARCHIVED"]).optional(),
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
        { query: { contains: search, mode: "insensitive" } },
      ];
    }

    const [researchItems, total] = await Promise.all([
      prisma.research.findMany({
        where,
        include: {
          matter: { select: { id: true, title: true, number: true } },
          _count: { select: { citations: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.research.count({ where }),
    ]);

    return NextResponse.json({
      research: researchItems,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET research error:", error);
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
    const validatedData = researchSchema.parse(body);

    const research = await prisma.research.create({
      data: {
        title: validatedData.title,
        query: validatedData.query,
        results: validatedData.results,
        matterId: validatedData.matterId || null,
        status: validatedData.status || "IN_PROGRESS",
      },
      include: {
        matter: { select: { id: true, title: true, number: true } },
      },
    });

    return NextResponse.json({ research }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST research error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
