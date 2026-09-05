import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const documentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["CONTRACT", "BRIEF", "MOTION", "AGREEMENT", "CORRESPONDENCE", "MEMO", "DEPOSITION", "EVIDENCE", "COURT_FILING", "OTHER"]),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  matterId: z.string().min(1, "Matter is required"),
  isPublic: z.boolean().optional(),
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
    const type = searchParams.get("type");
    const matterId = searchParams.get("matterId");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (matterId) where.matterId = matterId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { fileName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          matter: { select: { id: true, title: true, number: true } },
          uploadedBy: { select: { id: true, name: true, email: true } },
          _count: { select: { versions: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET documents error:", error);
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
    const validatedData = documentSchema.parse(body);

    const matter = await prisma.matter.findUnique({ where: { id: validatedData.matterId } });
    if (!matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const document = await prisma.document.create({
      data: {
        ...validatedData,
        uploadedById: (session.user as any).id,
      },
      include: {
        matter: { select: { id: true, title: true, number: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        content: validatedData.content,
        fileUrl: validatedData.fileUrl,
        fileName: validatedData.fileName,
        changes: "Initial version",
      },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "DOCUMENT_UPLOADED",
        title: "Document uploaded",
        description: `Document "${document.title}" has been uploaded`,
        matterId: validatedData.matterId,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
