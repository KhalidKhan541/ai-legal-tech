import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const updateMatterSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["LITIGATION", "CORPORATE", "REAL_ESTATE", "FAMILY", "CRIMINAL", "INTELLECTUAL_PROPERTY", "EMPLOYMENT", "TAX", "IMMIGRATION", "ENVIRONMENTAL"]).optional(),
  clientId: z.string().optional(),
  attorneyId: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "CLOSED", "ARCHIVED"]).optional(),
  closeDate: z.string().optional(),
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

    const matter = await prisma.matter.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        attorney: { select: { id: true, name: true, email: true, phone: true } },
        documents: {
          orderBy: { updatedAt: "desc" },
          take: 10,
        },
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        timeline: {
          orderBy: { date: "desc" },
          take: 20,
        },
        contracts: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            documents: true,
            tasks: true,
            timeline: true,
            contracts: true,
            timeEntries: true,
          },
        },
      },
    });

    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    return NextResponse.json({ matter });
  } catch (error) {
    console.error("GET matter error:", error);
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
    const validatedData = updateMatterSchema.parse(body);

    const existingMatter = await prisma.matter.findUnique({
      where: { id: params.id },
    });

    if (!existingMatter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.closeDate) {
      updateData.closeDate = new Date(validatedData.closeDate);
    }

    const matter = await prisma.matter.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, company: true } },
        attorney: { select: { id: true, name: true, email: true } },
      },
    });

    if (validatedData.status && validatedData.status !== existingMatter.status) {
      await prisma.timelineEvent.create({
        data: {
          type: "STATUS_CHANGE",
          title: "Status updated",
          description: `Status changed from ${existingMatter.status} to ${validatedData.status}`,
          matterId: params.id,
        },
      });
    }

    return NextResponse.json({ matter });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("PUT matter error:", error);
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

    const matter = await prisma.matter.findUnique({
      where: { id: params.id },
    });

    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    await prisma.matter.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Matter deleted successfully" });
  } catch (error) {
    console.error("DELETE matter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
