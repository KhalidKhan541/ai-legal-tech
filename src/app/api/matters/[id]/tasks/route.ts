import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional(),
  assignedToId: z.string().min(1, "Assignee is required"),
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
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const skip = (page - 1) * limit;

    const matter = await prisma.matter.findUnique({ where: { id: params.id } });
    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const where: any = { matterId: params.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET matter tasks error:", error);
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
    const validatedData = taskSchema.parse(body);

    const matter = await prisma.matter.findUnique({ where: { id: params.id } });
    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status || "PENDING",
        priority: validatedData.priority || "MEDIUM",
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        matterId: params.id,
        assignedToId: validatedData.assignedToId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "TASK_CREATED",
        title: "Task created",
        description: `Task "${task.title}" has been created`,
        matterId: params.id,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST matter tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
