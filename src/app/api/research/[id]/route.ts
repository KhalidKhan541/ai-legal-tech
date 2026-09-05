import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const updateResearchSchema = z.object({
  title: z.string().min(1).optional(),
  query: z.string().min(1).optional(),
  results: z.string().optional(),
  matterId: z.string().optional().nullable(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "NEEDS_REVISION", "ARCHIVED"]).optional(),
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

    const research = await prisma.research.findUnique({
      where: { id: params.id },
      include: {
        matter: { select: { id: true, title: true, number: true } },
        citations: { orderBy: { relevance: "desc" } },
      },
    });

    if (!research) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 });
    }

    return NextResponse.json({ research });
  } catch (error) {
    console.error("GET research error:", error);
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
    const validatedData = updateResearchSchema.parse(body);

    const existingResearch = await prisma.research.findUnique({ where: { id: params.id } });
    if (!existingResearch) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 });
    }

    const research = await prisma.research.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        matter: { select: { id: true, title: true, number: true } },
        citations: true,
      },
    });

    return NextResponse.json({ research });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("PUT research error:", error);
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

    const research = await prisma.research.findUnique({ where: { id: params.id } });
    if (!research) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 });
    }

    await prisma.research.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Research deleted successfully" });
  } catch (error) {
    console.error("DELETE research error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
