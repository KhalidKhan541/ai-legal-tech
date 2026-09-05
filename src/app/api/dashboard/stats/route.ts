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

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const [
      totalMatters,
      activeMatters,
      closedMatters,
      totalClients,
      totalDocuments,
      pendingTasks,
      overdueTasks,
      completedTasks,
      totalInvoices,
      unpaidInvoices,
      recentTimeEntries,
      totalExpenses,
      trustAccountBalance,
    ] = await Promise.all([
      prisma.matter.count(),
      prisma.matter.count({ where: { status: "OPEN" } }),
      prisma.matter.count({ where: { status: "CLOSED" } }),
      prisma.client.count(),
      prisma.document.count(),
      prisma.task.count({ where: { status: "PENDING" } }),
      prisma.task.count({ where: { status: "OVERDUE" } }),
      prisma.task.count({ where: { status: "COMPLETED" } }),
      prisma.invoice.count(),
      prisma.invoice.findMany({
        where: { status: { in: ["SENT", "OVERDUE"] } },
        select: { total: true, tax: true },
      }),
      prisma.timeEntry.findMany({
        orderBy: { date: "desc" },
        take: 10,
        select: { amount: true, hours: true, date: true },
      }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.trustAccount.aggregate({ _sum: { balance: true } }),
    ]);

    const totalRevenue = unpaidInvoices.reduce((sum, inv) => sum + inv.total + inv.tax, 0);
    const recentHours = recentTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalExpensesAmount = totalExpenses._sum.amount || 0;
    const trustBalance = trustAccountBalance._sum.balance || 0;

    const mattersByType = await prisma.matter.groupBy({
      by: ["type"],
      _count: true,
    });

    const mattersByStatus = await prisma.matter.groupBy({
      by: ["status"],
      _count: true,
    });

    const tasksByPriority = await prisma.task.groupBy({
      by: ["priority"],
      _count: true,
      where: { status: { not: "COMPLETED" } },
    });

    const monthlyRevenue = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidDate: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
      select: { total: true, paidDate: true },
      orderBy: { paidDate: "asc" },
    });

    return NextResponse.json({
      overview: {
        totalMatters,
        activeMatters,
        closedMatters,
        totalClients,
        totalDocuments,
        pendingTasks,
        overdueTasks,
        completedTasks,
        totalInvoices,
        totalRevenue,
        recentHours,
        totalExpenses: totalExpensesAmount,
        trustBalance,
      },
      charts: {
        mattersByType: mattersByType.map((item) => ({
          type: item.type,
          count: item._count,
        })),
        mattersByStatus: mattersByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        tasksByPriority: tasksByPriority.map((item) => ({
          priority: item.priority,
          count: item._count,
        })),
        monthlyRevenue: aggregateMonthlyRevenue(monthlyRevenue),
      },
      userRole,
    });
  } catch (error) {
    console.error("GET dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function aggregateMonthlyRevenue(data: any[]) {
  const monthly: Record<string, number> = {};

  data.forEach((item) => {
    const month = item.paidDate?.toISOString().slice(0, 7) || "unknown";
    monthly[month] = (monthly[month] || 0) + item.total;
  });

  return Object.entries(monthly).map(([month, revenue]) => ({
    month,
    revenue,
  }));
}
