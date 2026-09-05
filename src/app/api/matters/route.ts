import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const matterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["LITIGATION", "CORPORATE", "REAL_ESTATE", "FAMILY", "CRIMINAL", "INTELLECTUAL_PROPERTY", "EMPLOYMENT", "TAX", "IMMIGRATION", "ENVIRONMENTAL"]),
  clientId: z.string().min(1, "Client is required"),
  attorneyId: z.string().min(1, "Attorney is required"),
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "CLOSED", "ARCHIVED"]).optional(),
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const clientId = searchParams.get("clientId");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { number: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [matters, total] = await Promise.all([
      prisma.matter.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, company: true } },
          attorney: { select: { id: true, name: true, email: true } },
          _count: { select: { documents: true, tasks: true, timeline: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.matter.count({ where }),
    ]);

    return NextResponse.json({
      matters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET matters error:", error);
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
    const validatedData = matterSchema.parse(body);

    const matterCount = await prisma.matter.count();
    const matterNumber = `MAT-${String(matterCount + 1).padStart(4, "0")}`;

    const matter = await prisma.matter.create({
      data: {
        ...validatedData,
        number: matterNumber,
        openDate: validatedData.openDate ? new Date(validatedData.openDate) : new Date(),
        closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null,
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        attorney: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "CASE_OPENED",
        title: "Matter opened",
        description: `New matter "${matter.title}" has been created`,
        matterId: matter.id,
      },
    });

    return NextResponse.json({ matter }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST matters error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
