import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(["CONTRACT", "BRIEF", "MOTION", "AGREEMENT", "CORRESPONDENCE", "MEMO", "DEPOSITION", "EVIDENCE", "COURT_FILING", "OTHER"]).optional(),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  isPublic: z.boolean().optional(),
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

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        matter: { select: { id: true, title: true, number: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
        versions: { orderBy: { version: "desc" } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("GET document error:", error);
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
    const validatedData = updateDocumentSchema.parse(body);

    const existingDocument = await prisma.document.findUnique({ where: { id: params.id } });
    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const document = await prisma.document.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        matter: { select: { id: true, title: true, number: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (validatedData.content || validatedData.fileUrl) {
      const newVersion = existingDocument.version + 1;
      await prisma.documentVersion.create({
        data: {
          documentId: params.id,
          version: newVersion,
          content: validatedData.content,
          fileUrl: validatedData.fileUrl,
          fileName: validatedData.fileName,
          changes: `Version ${newVersion}`,
        },
      });

      await prisma.document.update({
        where: { id: params.id },
        data: { version: newVersion },
      });
    }

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("PUT document error:", error);
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

    const document = await prisma.document.findUnique({ where: { id: params.id } });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("DELETE document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
