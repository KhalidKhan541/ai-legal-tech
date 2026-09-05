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
    const q = searchParams.get("q");
    const type = searchParams.get("type");
    const matterId = searchParams.get("matterId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const where: any = {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { fileName: { contains: q, mode: "insensitive" } },
      ],
    };

    if (type) where.type = type;
    if (matterId) where.matterId = matterId;

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

    const results = documents.map((doc) => {
      let snippet = "";
      if (doc.content) {
        const contentLower = doc.content.toLowerCase();
        const queryLower = q.toLowerCase();
        const index = contentLower.indexOf(queryLower);
        if (index !== -1) {
          const start = Math.max(0, index - 100);
          const end = Math.min(doc.content.length, index + q.length + 100);
          snippet = (start > 0 ? "..." : "") + doc.content.slice(start, end) + (end < doc.content.length ? "..." : "");
        }
      }
      return { ...doc, snippet };
    });

    return NextResponse.json({
      results,
      query: q,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET document search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
