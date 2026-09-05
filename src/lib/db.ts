import { PrismaClient, Prisma } from "@prisma/client";
import { addDays, startOfDay, endOfDay, subDays } from "date-fns";

// ─── Global Type Extensions ──────────────────────────────────────────────────

declare global {
  var __db__: PrismaClient | undefined;
}

// ─── Prisma Client Singleton ─────────────────────────────────────────────────

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });

  return client;
}

export const db: PrismaClient =
  global.__db__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__db__ = db;
}

// ─── Soft Delete Extension ───────────────────────────────────────────────────

export const softDelete = async <T extends { id: string }>(
  model: { update: (args: { where: { id: string }; data: { isActive: boolean } }) => Promise<T> },
  id: string
): Promise<T> => {
  return model.update({
    where: { id },
    data: { isActive: false } as any,
  });
};

export const restoreSoftDeleted = async <T extends { id: string }>(
  model: { update: (args: { where: { id: string }; data: { isActive: boolean } }) => Promise<T> },
  id: string
): Promise<T> => {
  return model.update({
    where: { id },
    data: { isActive: true } as any,
  });
};

// ─── Pagination Types ────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    cursor?: string;
  };
}

export interface CursorPaginationResult<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
    previousCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    total: number;
  };
}

// ─── Pagination Helpers ──────────────────────────────────────────────────────

export function getPaginationParams(params: PaginationParams): {
  skip: number;
  take: number;
  cursor: { id: string } | undefined;
  orderBy: Record<string, "asc" | "desc">;
} {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const cursor = params.cursor ? { id: params.cursor } : undefined;
  const order = params.order ?? "asc";
  const orderByField = params.orderBy ?? "createdAt";
  const orderBy = { [orderByField]: order } as Record<string, "asc" | "desc">;

  return { skip, take: limit, cursor, orderBy };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      cursor: params.cursor,
    },
  };
}

export function buildCursorPaginatedResult<T>(
  data: T[],
  total: number,
  hasNextPage: boolean,
  nextCursor: string | null,
  previousCursor: string | null
): CursorPaginationResult<T> {
  return {
    data,
    meta: {
      nextCursor,
      previousCursor,
      hasNextPage,
      hasPreviousPage: previousCursor !== null,
      total,
    },
  };
}

// ─── Transaction Helpers ─────────────────────────────────────────────────────

export async function runTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(fn, {
    maxWait: 10000,
    timeout: 30000,
  });
}

// ─── Batch Operation Helpers ─────────────────────────────────────────────────

export async function batchCreate<T extends Record<string, unknown>>(
  model: { createMany: (args: { data: T[]; skipDuplicates?: boolean }) => Promise<Prisma.BatchPayload> },
  data: T[],
  batchSize: number = 100
): Promise<number> {
  let totalCreated = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const result = await model.createMany({
      data: batch,
      skipDuplicates: true,
    });
    totalCreated += result.count;
  }

  return totalCreated;
}

export async function batchUpdate<T extends { id: string }>(
  model: {
    update: (args: { where: { id: string }; data: Partial<T> }) => Promise<T>;
  },
  items: T[],
  data: Partial<T>,
  batchSize: number = 100
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) =>
        model.update({
          where: { id: item.id },
          data,
        })
      )
    );
    results.push(...batchResults);
  }

  return results;
}

// ─── Date Range Helpers ──────────────────────────────────────────────────────

export function getDateRange(
  range: "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "last30Days" | "last90Days"
): { start: Date; end: Date } {
  const now = new Date();
  const today = startOfDay(now);

  switch (range) {
    case "today":
      return { start: today, end: endOfDay(now) };
    case "yesterday":
      return { start: subDays(today, 1), end: endOfDay(subDays(today, 1)) };
    case "thisWeek":
      return {
        start: startOfDay(subDays(now, now.getDay())),
        end: endOfDay(now),
      };
    case "lastWeek":
      return {
        start: startOfDay(subDays(now, now.getDay() + 7)),
        end: endOfDay(subDays(now, now.getDay() + 1)),
      };
    case "thisMonth":
      return {
        start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: endOfDay(now),
      };
    case "lastMonth":
      return {
        start: startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: endOfDay(
          new Date(now.getFullYear(), now.getMonth(), 0)
        ),
      };
    case "thisYear":
      return {
        start: startOfDay(new Date(now.getFullYear(), 0, 1)),
        end: endOfDay(now),
      };
    case "lastYear":
      return {
        start: startOfDay(new Date(now.getFullYear() - 1, 0, 1)),
        end: endOfDay(new Date(now.getFullYear() - 1, 11, 31)),
      };
    case "last30Days":
      return {
        start: startOfDay(subDays(now, 30)),
        end: endOfDay(now),
      };
    case "last90Days":
      return {
        start: startOfDay(subDays(now, 90)),
        end: endOfDay(now),
      };
    default:
      return { start: today, end: endOfDay(now) };
  }
}

// ─── Search Helpers ──────────────────────────────────────────────────────────

export function buildSearchFilter(
  searchTerm: string,
  fields: string[]
): Prisma.StringFilter[] {
  if (!searchTerm) return [];

  return fields.map((field) => ({
    [field]: {
      contains: searchTerm,
      mode: "insensitive" as const,
    },
  }));
}

export function buildOrFilter(
  conditions: Record<string, unknown>[]
): Record<string, unknown> {
  return {
    OR: conditions,
  };
}

// ─── Aggregation Helpers ─────────────────────────────────────────────────────

export async function countWithDeleted<T extends { isActive: boolean }>(
  model: { count: (args?: { where?: Record<string, unknown> }) => Promise<number> },
  includeDeleted: boolean = false
): Promise<number> {
  return model.count({
    where: includeDeleted ? undefined : { isActive: true },
  });
}

export async function aggregateSum(
  model: {
    aggregate: (args: {
      where?: Record<string, unknown>;
      _sum: Record<string, boolean>;
    }) => Promise<Record<string, number | null>>;
    },
  field: string,
  where?: Record<string, unknown>
): Promise<number> {
  const result = await model.aggregate({
    where,
    _sum: { [field]: true },
  });
  return (result._sum?.[field] as number) ?? 0;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

export function generateMatterNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `MAT-${year}-${random}`;
}

export function generateInvoiceNumber(prefix: string = "INV"): string {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${year}${month}-${random}`;
}

export function generateApiKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "lkt_";
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export default db;
