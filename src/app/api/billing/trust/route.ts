import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const trustTransactionSchema = z.object({
  trustAccountId: z.string().min(1, "Trust account is required"),
  type: z.string().min(1, "Transaction type is required"),
  amount: z.number(),
  description: z.string().optional(),
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
    const matterId = searchParams.get("matterId");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (matterId) where.matterId = matterId;

    const [trustAccounts, total] = await Promise.all([
      prisma.trustAccount.findMany({
        where,
        include: {
          transactions: { orderBy: { date: "desc" }, take: 5 },
          _count: { select: { transactions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.trustAccount.count({ where }),
    ]);

    const totalBalance = trustAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    return NextResponse.json({
      trustAccounts,
      summary: { totalBalance },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET trust accounts error:", error);
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
    const { action, ...data } = body;

    if (action === "create_account") {
      const createAccountSchema = z.object({
        name: z.string().min(1, "Name is required"),
        balance: z.number().optional(),
        matterId: z.string().optional().nullable(),
        clientId: z.string().optional().nullable(),
      });

      const validatedData = createAccountSchema.parse(data);

      const account = await prisma.trustAccount.create({
        data: {
          name: validatedData.name,
          balance: validatedData.balance || 0,
          matterId: validatedData.matterId || null,
          clientId: validatedData.clientId || null,
        },
      });

      return NextResponse.json({ trustAccount: account }, { status: 201 });
    }

    if (action === "add_transaction") {
      const validatedData = trustTransactionSchema.parse(data);

      const account = await prisma.trustAccount.findUnique({
        where: { id: validatedData.trustAccountId },
      });
      if (!account) {
        return NextResponse.json({ error: "Trust account not found" }, { status: 404 });
      }

      const newBalance = account.balance + validatedData.amount;
      if (newBalance < 0) {
        return NextResponse.json({ error: "Insufficient trust balance" }, { status: 400 });
      }

      const [transaction] = await prisma.$transaction([
        prisma.trustTransaction.create({
          data: {
            trustAccountId: validatedData.trustAccountId,
            type: validatedData.type,
            amount: validatedData.amount,
            description: validatedData.description,
          },
        }),
        prisma.trustAccount.update({
          where: { id: validatedData.trustAccountId },
          data: { balance: newBalance },
        }),
      ]);

      return NextResponse.json({ transaction }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("POST trust error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
