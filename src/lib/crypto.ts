import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;

// ─── Password Hashing ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push("At least 8 characters required");

  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push("Include uppercase and lowercase letters");

  if (/\d/.test(password)) score++;
  else feedback.push("Include at least one number");

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  else feedback.push("Include at least one special character");

  return { score, feedback };
}

// ─── JWT-like Token Operations ───────────────────────────────────────────────

const DEFAULT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const DEFAULT_EXPIRY = 60 * 60 * 24; // 24 hours

interface TokenPayload {
  sub: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(data: string): string {
  let base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64").toString();
}

function sign(data: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateToken(
  payload: TokenPayload,
  secret = DEFAULT_SECRET,
  expiresIn = DEFAULT_EXPIRY
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: payload.iat ?? now,
    exp: (payload.iat ?? now) + expiresIn,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(tokenPayload));
  const signature = sign(`${headerEncoded}.${payloadEncoded}`, secret);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export function verifyToken<T extends TokenPayload>(
  token: string,
  secret = DEFAULT_SECRET
): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signature] = parts;
    const expectedSignature = sign(`${headerEncoded}.${payloadEncoded}`, secret);

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as T;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function decodeToken<T extends TokenPayload>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1] as string)) as T;
  } catch {
    return null;
  }
}

export function refreshToken(
  token: string,
  secret = DEFAULT_SECRET,
  extendBy = DEFAULT_EXPIRY
): string | null {
  const payload = decodeToken<TokenPayload>(token);
  if (!payload) return null;

  const newExp = Math.floor(Date.now() / 1000) + extendBy;
  return generateToken({ ...payload, exp: undefined }, secret, extendBy);
}

// ─── API Key Operations ──────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  key: string;
  prefix: string;
  hashedKey: string;
  name: string;
  createdAt: Date;
  expiresAt?: Date;
}

export function generateApiKey(name: string): ApiKey {
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const prefix = randomBytes.slice(0, 8);
  const key = `lkt_${randomBytes}`;
  const hashedKey = crypto.createHash("sha256").update(key).digest("hex");
  const id = crypto.randomUUID();

  return {
    id,
    key,
    prefix,
    hashedKey,
    name,
    createdAt: new Date(),
  };
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function verifyApiKey(key: string, hashedKey: string): boolean {
  const hash = hashApiKey(key);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashedKey));
}

// ─── Encryption Utilities ────────────────────────────────────────────────────

export function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(secret).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string, secret: string): string {
  const [ivHex, encrypted] = encryptedText.split(":");
  if (!ivHex || !encrypted) throw new Error("Invalid encrypted text format");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.createHash("sha256").update(secret).digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function generateSecret(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function hashData(data: string, algorithm: "sha256" | "sha512" = "sha256"): string {
  return crypto.createHash(algorithm).update(data).digest("hex");
}

export function createHmac(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
