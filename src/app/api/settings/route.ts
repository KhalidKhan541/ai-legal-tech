import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const settingsSchema = z.object({
  firmName: z.string().optional(),
  firmAddress: z.string().optional(),
  firmPhone: z.string().optional(),
  firmEmail: z.string().email().optional(),
  defaultHourlyRate: z.number().optional(),
  taxRate: z.number().optional(),
  invoicePrefix: z.string().optional(),
  matterPrefix: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  currency: z.string().optional(),
  enableNotifications: z.boolean().optional(),
  enableAI: z.boolean().optional(),
  defaultContractTemplate: z.string().optional(),
  trustAccountEnabled: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.systemSettings.findMany();
    const settingsMap: Record<string, any> = {};

    settings.forEach((setting) => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsMap[setting.key] = setting.value;
      }
    });

    const defaultSettings = {
      firmName: "AI Legal Tech Firm",
      firmAddress: "",
      firmPhone: "",
      firmEmail: "",
      defaultHourlyRate: 250,
      taxRate: 10,
      invoicePrefix: "INV",
      matterPrefix: "MAT",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
      currency: "USD",
      enableNotifications: true,
      enableAI: true,
      defaultContractTemplate: "",
      trustAccountEnabled: true,
    };

    const mergedSettings = { ...defaultSettings, ...settingsMap };

    return NextResponse.json({ settings: mergedSettings });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can modify settings" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    const updatePromises = Object.entries(validatedData)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) =>
        prisma.systemSettings.upsert({
          where: { key },
          update: { value: JSON.stringify(value), updatedAt: new Date() },
          create: { key, value: JSON.stringify(value) },
        })
      );

    await Promise.all(updatePromises);

    const settings = await prisma.systemSettings.findMany();
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsMap[setting.key] = setting.value;
      }
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: settingsMap,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("PUT settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can reset settings" }, { status: 403 });
    }

    await prisma.systemSettings.deleteMany();

    return NextResponse.json({ message: "Settings reset to defaults" });
  } catch (error) {
    console.error("POST settings reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
