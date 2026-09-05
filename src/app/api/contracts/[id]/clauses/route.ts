import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const clauseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.string().optional(),
  riskLevel: z.string().optional(),
  orderIndex: z.number().optional(),
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

    const clauses = await prisma.contractClause.findMany({
      where: { contractId: params.id },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ clauses });
  } catch (error) {
    console.error("GET contract clauses error:", error);
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
    const validatedData = clauseSchema.parse(body);

    const contract = await prisma.contract.findUnique({ where: { id: params.id } });
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const existingClauses = await prisma.contractClause.count({
      where: { contractId: params.id },
    });

    const clause = await prisma.contractClause.create({
      data: {
        contractId: params.id,
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        riskLevel: validatedData.riskLevel,
        orderIndex: validatedData.orderIndex ?? existingClauses,
      },
    });

    return NextResponse.json({ clause }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST contract clauses error:", error);
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
    const { clauses } = body as { clauses: { id: string; orderIndex: number }[] };

    if (!Array.isArray(clauses)) {
      return NextResponse.json({ error: "Invalid clauses data" }, { status: 400 });
    }

    const contract = await prisma.contract.findUnique({ where: { id: params.id } });
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    await Promise.all(
      clauses.map((c) =>
        prisma.contractClause.update({
          where: { id: c.id },
          data: { orderIndex: c.orderIndex },
        })
      )
    );

    const clausesResult = await prisma.contractClause.findMany({
      where: { contractId: params.id },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ clauses: clausesResult });
  } catch (error) {
    console.error("PUT contract clauses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
