import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");

    const where: any = {};
    if (type) where.type = type;

    const [timelineEvents, recentDocuments, recentTasks, upcomingDeadlines] = await Promise.all([
      prisma.timelineEvent.findMany({
        where,
        include: {
          matter: { select: { id: true, title: true, number: true } },
        },
        orderBy: { date: "desc" },
        take: limit,
      }),
      prisma.document.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          matter: { select: { id: true, title: true } },
          uploadedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.task.findMany({
        where: { status: { not: "COMPLETED" } },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
        ],
        take: 5,
        include: {
          matter: { select: { id: true, title: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      prisma.calendarEvent.findMany({
        where: {
          start: { gte: new Date() },
          type: "DEADLINE",
        },
        orderBy: { start: "asc" },
        take: 5,
        include: {
          matter: { select: { id: true, title: true } },
        },
      }),
    ]);

    const activity = [
      ...timelineEvents.map((event) => ({
        id: event.id,
        type: "timeline",
        title: event.title,
        description: event.description,
        date: event.date,
        matter: event.matter,
        icon: getEventIcon(event.type),
      })),
      ...recentDocuments.map((doc) => ({
        id: doc.id,
        type: "document",
        title: `Document uploaded: ${doc.title}`,
        description: `${doc.type} document for ${doc.matter?.title || "Unknown matter"}`,
        date: doc.updatedAt,
        matter: doc.matter,
        icon: "file",
      })),
      ...recentTasks.map((task) => ({
        id: task.id,
        type: "task",
        title: task.title,
        description: `Priority: ${task.priority} | Due: ${task.dueDate?.toLocaleDateString() || "No due date"}`,
        date: task.createdAt,
        matter: task.matter,
        icon: "check-square",
      })),
      ...upcomingDeadlines.map((deadline) => ({
        id: deadline.id,
        type: "deadline",
        title: deadline.title,
        description: `Due: ${deadline.start.toLocaleDateString()}`,
        date: deadline.start,
        matter: deadline.matter,
        icon: "alert-circle",
      })),
    ];

    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      activity: activity.slice(0, limit),
      summary: {
        recentEvents: timelineEvents.length,
        recentDocuments: recentDocuments.length,
        pendingTasks: recentTasks.length,
        upcomingDeadlines: upcomingDeadlines.length,
      },
    });
  } catch (error) {
    console.error("GET dashboard activity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    CASE_OPENED: "briefcase",
    DOCUMENT_UPLOADED: "file",
    TASK_CREATED: "plus-square",
    TASK_COMPLETED: "check-circle",
    DEADLINE_SET: "calendar",
    DEADLINE_MET: "check",
    HEARING_SCHEDULED: "calendar",
    HEARING_COMPLETED: "check-circle",
    SETTLEMENT: "dollar-sign",
    NOTE_ADDED: "edit",
    STATUS_CHANGE: "refresh-cw",
    OTHER: "activity",
  };
  return icons[type] || "circle";
}
