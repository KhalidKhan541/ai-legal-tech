import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const reviewSchema = z.object({
  status: z.string().min(1, "Status is required"),
  comments: z.string().optional(),
  score: z.number().min(0).max(10).optional(),
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

    const contract = await prisma.contract.findUnique({ where: { id: params.id } });
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const reviews = await prisma.contractReview.findMany({
      where: { contractId: params.id },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("GET contract reviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    const contract = await prisma.contract.findUnique({ where: { id: params.id } });
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const review = await prisma.contractReview.create({
      data: {
        contractId: params.id,
        reviewerId: (session.user as any).id,
        status: validatedData.status,
        comments: validatedData.comments,
        score: validatedData.score,
      },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST contract reviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
