import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const citationSchema = z.object({
  researchId: z.string().min(1, "Research ID is required"),
  title: z.string().min(1, "Title is required"),
  source: z.string().min(1, "Source is required"),
  url: z.string().url().optional(),
  excerpt: z.string().optional(),
  relevance: z.number().min(0).max(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const researchId = searchParams.get("researchId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (researchId) where.researchId = researchId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { source: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const [citations, total] = await Promise.all([
      prisma.citation.findMany({
        where,
        include: {
          research: { select: { id: true, title: true } },
        },
        orderBy: { relevance: "desc" },
        skip,
        take: limit,
      }),
      prisma.citation.count({ where }),
    ]);

    return NextResponse.json({
      citations,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET citations error:", error);
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
    const validatedData = citationSchema.parse(body);

    const research = await prisma.research.findUnique({ where: { id: validatedData.researchId } });
    if (!research) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 });
    }

    const citation = await prisma.citation.create({
      data: {
        researchId: validatedData.researchId,
        title: validatedData.title,
        source: validatedData.source,
        url: validatedData.url,
        excerpt: validatedData.excerpt,
        relevance: validatedData.relevance,
      },
      include: {
        research: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ citation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST citations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
