import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const versionSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  changes: z.string().optional(),
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

    const document = await prisma.document.findUnique({ where: { id: params.id } });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: params.id },
      orderBy: { version: "desc" },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("GET document versions error:", error);
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
    const validatedData = versionSchema.parse(body);

    const document = await prisma.document.findUnique({ where: { id: params.id } });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const newVersion = document.version + 1;

    const version = await prisma.documentVersion.create({
      data: {
        documentId: params.id,
        version: newVersion,
        content: validatedData.content,
        fileUrl: validatedData.fileUrl,
        fileName: validatedData.fileName,
        changes: validatedData.changes || `Version ${newVersion}`,
      },
    });

    await prisma.document.update({
      where: { id: params.id },
      data: { version: newVersion },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST document versions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
