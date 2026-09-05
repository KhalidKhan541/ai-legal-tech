import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const deadlineSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  matterId: z.string().min(1, "Matter is required"),
  type: z.string().optional(),
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
    const matterId = searchParams.get("matterId");
    const upcoming = searchParams.get("upcoming");

    const where: any = {
      userId: (session.user as any).id,
      type: "DEADLINE",
    };

    if (startDate || endDate) {
      where.start = {};
      if (startDate) where.start.gte = new Date(startDate);
      if (endDate) where.start.lte = new Date(endDate);
    }
    if (matterId) where.matterId = matterId;
    if (upcoming === "true") {
      where.start = { gte: new Date() };
    }

    const deadlines = await prisma.calendarEvent.findMany({
      where,
      include: {
        matter: { select: { id: true, title: true, number: true } },
      },
      orderBy: { start: "asc" },
    });

    const overdue = deadlines.filter((d) => new Date(d.start) < new Date());
    const upcomingDeadlines = deadlines.filter((d) => new Date(d.start) >= new Date());

    return NextResponse.json({
      deadlines,
      summary: { overdue: overdue.length, upcoming: upcomingDeadlines.length },
    });
  } catch (error) {
    console.error("GET deadlines error:", error);
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
    const validatedData = deadlineSchema.parse(body);

    const matter = await prisma.matter.findUnique({ where: { id: validatedData.matterId } });
    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        start: new Date(validatedData.date),
        end: new Date(validatedData.date),
        type: "DEADLINE",
        matterId: validatedData.matterId,
        userId: (session.user as any).id,
        reminder: validatedData.reminder,
      },
      include: {
        matter: { select: { id: true, title: true, number: true } },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "DEADLINE_SET",
        title: "Deadline set",
        description: `Deadline "${event.title}" has been set for ${event.start.toLocaleDateString()}`,
        matterId: validatedData.matterId,
      },
    });

    return NextResponse.json({ deadline: event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST deadlines error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
