import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const calendarEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start: z.string().min(1, "Start date is required"),
  end: z.string().min(1, "End date is required"),
  allDay: z.boolean().optional(),
  type: z.string().optional(),
  matterId: z.string().optional().nullable(),
  reminder: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const matterId = searchParams.get("matterId");

    const where: any = {
      userId: (session.user as any).id,
    };

    if (startDate || endDate) {
      where.start = {};
      if (startDate) where.start.gte = new Date(startDate);
      if (endDate) where.start.lte = new Date(endDate);
    }
    if (type) where.type = type;
    if (matterId) where.matterId = matterId;

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        matter: { select: { id: true, title: true, number: true } },
      },
      orderBy: { start: "asc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET calendar events error:", error);
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
    const validatedData = calendarEventSchema.parse(body);

    const event = await prisma.calendarEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        start: new Date(validatedData.start),
        end: new Date(validatedData.end),
        allDay: validatedData.allDay ?? false,
        type: validatedData.type,
        matterId: validatedData.matterId || null,
        userId: (session.user as any).id,
        reminder: validatedData.reminder,
      },
      include: {
        matter: { select: { id: true, title: true, number: true } },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST calendar events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const existingEvent = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: any = { ...updateData };
    if (updateData.start) data.start = new Date(updateData.start);
    if (updateData.end) data.end = new Date(updateData.end);

    const event = await prisma.calendarEvent.update({
      where: { id },
      data,
      include: {
        matter: { select: { id: true, title: true, number: true } },
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("PUT calendar events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const existingEvent = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("DELETE calendar events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
