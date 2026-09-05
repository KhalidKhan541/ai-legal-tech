import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const updateContractSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  matterId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  value: z.number().optional(),
  status: z.enum(["DRAFT", "UNDER_REVIEW", "NEGOTIATION", "PENDING_SIGNATURE", "ACTIVE", "EXPIRED", "TERMINATED", "ARCHIVED"]).optional(),
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

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        matter: { select: { id: true, title: true, number: true } },
        clauses: { orderBy: { orderIndex: "asc" } },
        reviews: {
          include: { reviewer: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error("GET contract error:", error);
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
    const validatedData = updateContractSchema.parse(body);

    const existingContract = await prisma.contract.findUnique({ where: { id: params.id } });
    if (!existingContract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: updateData,
      include: {
        matter: { select: { id: true, title: true, number: true } },
      },
    });

    return NextResponse.json({ contract });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("PUT contract error:", error);
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

    const contract = await prisma.contract.findUnique({ where: { id: params.id } });
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    await prisma.contract.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Contract deleted successfully" });
  } catch (error) {
    console.error("DELETE contract error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
