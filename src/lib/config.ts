import { z } from "zod";

// ─── Environment Schema ──────────────────────────────────────────────────────

const envSchema = z.object({
  // ── Application ──────────────────────────────────────────────────────
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("AI Legal Tech"),
  NEXT_PUBLIC_APP_DESCRIPTION: z.string().default("AI-Powered Legal Tech Platform"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // ── Database ─────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // ── NextAuth ─────────────────────────────────────────────────────────
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(32),

  // ── OAuth: GitHub ────────────────────────────────────────────────────
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // ── OAuth: Google ────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ── AI Services ──────────────────────────────────────────────────────
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4-turbo-preview"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-opus-20240229"),

  // ── Storage ──────────────────────────────────────────────────────────
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),

  // ── Email ────────────────────────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // ── Redis ────────────────────────────────────────────────────────────
  REDIS_URL: z.string().url().optional(),

  // ── Stripe ───────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ── Logging ──────────────────────────────────────────────────────────
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),
  LOG_FILE_PATH: z.string().optional(),

  // ── Rate Limiting ────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().default(100),

  // ── Security ─────────────────────────────────────────────────────────
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
});

// ─── Validate Environment ────────────────────────────────────────────────────

function validateEnv() {
  try {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      console.error("❌ Invalid environment variables:");
      console.error(parsed.error.flatten().fieldErrors);
      throw new Error("Invalid environment variables");
    }

    return parsed.data;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    console.warn("⚠️  Using default environment variables for development");
    return envSchema.parse({});
  }
}

// ─── Export Validated Config ──────────────────────────────────────────────────

export const config = validateEnv();

// ─── Type-safe Config Access ─────────────────────────────────────────────────

export type Config = z.infer<typeof envSchema>;

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return config.NODE_ENV === "production";
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return config.NODE_ENV === "development";
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  return config.NODE_ENV === "test";
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  return config.NEXT_PUBLIC_APP_URL;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  const features: Record<string, boolean> = {
    ai: !!config.OPENAI_API_KEY || !!config.ANTHROPIC_API_KEY,
    storage: !!config.S3_BUCKET,
    email: !!config.SMTP_HOST,
    redis: !!config.REDIS_URL,
    stripe: !!config.STRIPE_SECRET_KEY,
    github_oauth: !!config.GITHUB_CLIENT_ID && !!config.GITHUB_CLIENT_SECRET,
    google_oauth: !!config.GOOGLE_CLIENT_ID && !!config.GOOGLE_CLIENT_SECRET,
  };

  return features[feature] ?? false;
}

/**
 * Get AI provider configuration
 */
export function getAIConfig() {
  if (config.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic" as const,
      apiKey: config.ANTHROPIC_API_KEY,
      model: config.ANTHROPIC_MODEL,
    };
  }

  if (config.OPENAI_API_KEY) {
    return {
      provider: "openai" as const,
      apiKey: config.OPENAI_API_KEY,
      model: config.OPENAI_MODEL,
    };
  }

  return null;
}

/**
 * Get storage configuration
 */
export function getStorageConfig() {
  if (!config.S3_BUCKET) {
    return null;
  }

  return {
    bucket: config.S3_BUCKET,
    region: config.S3_REGION,
    accessKey: config.S3_ACCESS_KEY,
    secretKey: config.S3_SECRET_KEY,
    endpoint: config.S3_ENDPOINT,
  };
}

/**
 * Get email configuration
 */
export function getEmailConfig() {
  if (!config.SMTP_HOST) {
    return null;
  }

  return {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    user: config.SMTP_USER,
    password: config.SMTP_PASSWORD,
    from: config.SMTP_FROM,
  };
}

/**
 * Get Stripe configuration
 */
export function getStripeConfig() {
  if (!config.STRIPE_SECRET_KEY) {
    return null;
  }

  return {
    secretKey: config.STRIPE_SECRET_KEY,
    publishableKey: config.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: config.STRIPE_WEBHOOK_SECRET,
  };
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig() {
  return {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
  };
}

/**
 * Get security configuration
 */
export function getSecurityConfig() {
  return {
    corsOrigin: config.CORS_ORIGIN,
    jwtSecret: config.JWT_SECRET,
    encryptionKey: config.ENCRYPTION_KEY,
  };
}

export default config;
