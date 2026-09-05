import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const timelineEventSchema = z.object({
  type: z.enum([
    "CASE_OPENED", "DOCUMENT_UPLOADED", "TASK_CREATED", "TASK_COMPLETED",
    "DEADLINE_SET", "DEADLINE_MET", "HEARING_SCHEDULED", "HEARING_COMPLETED",
    "SETTLEMENT", "NOTE_ADDED", "STATUS_CHANGE", "OTHER",
  ]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().optional(),
  metadata: z.string().optional(),
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type");
    const skip = (page - 1) * limit;

    const matter = await prisma.matter.findUnique({ where: { id: params.id } });
    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const where: any = { matterId: params.id };
    if (type) where.type = type;

    const [events, total] = await Promise.all([
      prisma.timelineEvent.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.timelineEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET timeline error:", error);
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
    const validatedData = timelineEventSchema.parse(body);

    const matter = await prisma.matter.findUnique({ where: { id: params.id } });
    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const event = await prisma.timelineEvent.create({
      data: {
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        metadata: validatedData.metadata,
        matterId: params.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST timeline error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
