import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageConfig {
  provider: "local" | "s3";
  basePath: string;
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
}

export interface StorageFile {
  key: string;
  name: string;
  size: number;
  contentType: string;
  lastModified: Date;
  url?: string;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  access?: "public" | "private";
}

export interface SignedUrlOptions {
  expiresIn?: number;
  operation?: "getObject" | "putObject";
}

// ─── Local Storage Provider ──────────────────────────────────────────────────

class LocalStorageProvider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  async upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageFile> {
    const fullPath = this.getFullPath(key);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, data);

    const stat = await fs.stat(fullPath);
    return {
      key,
      name: path.basename(key),
      size: stat.size,
      contentType: options?.contentType ?? "application/octet-stream",
      lastModified: stat.mtime,
    };
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = this.getFullPath(key);
    return fs.readFile(fullPath);
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    await fs.unlink(fullPath);
  }

  async list(prefix: string): Promise<StorageFile[]> {
    const dirPath = this.getFullPath(prefix);
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: StorageFile[] = [];

      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(dirPath, entry.name);
          const stat = await fs.stat(filePath);
          const relativePath = path.relative(this.basePath, filePath);
          files.push({
            key: relativePath.replace(/\\/g, "/"),
            name: entry.name,
            size: stat.size,
            contentType: "application/octet-stream",
            lastModified: stat.mtime,
          });
        }
      }

      return files;
    } catch {
      return [];
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.getFullPath(key));
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, _options?: SignedUrlOptions): Promise<string> {
    return `/api/files/${encodeURIComponent(key)}`;
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    try {
      const fullPath = this.getFullPath(key);
      const stat = await fs.stat(fullPath);
      return {
        key,
        name: path.basename(key),
        size: stat.size,
        contentType: "application/octet-stream",
        lastModified: stat.mtime,
      };
    } catch {
      return null;
    }
  }
}

// ─── S3 Storage Provider (Stub) ─────────────────────────────────────────────

class S3StorageProvider {
  private bucket: string;
  private region: string;

  constructor(config: NonNullable<StorageConfig["s3"]>) {
    this.bucket = config.bucket;
    this.region = config.region;
  }

  async upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageFile> {
    console.log(`[S3] Uploading ${key} to ${this.bucket}`);
    return {
      key,
      name: path.basename(key),
      size: data.length,
      contentType: options?.contentType ?? "application/octet-stream",
      lastModified: new Date(),
    };
  }

  async download(key: string): Promise<Buffer> {
    console.log(`[S3] Downloading ${key} from ${this.bucket}`);
    return Buffer.alloc(0);
  }

  async delete(key: string): Promise<void> {
    console.log(`[S3] Deleting ${key} from ${this.bucket}`);
  }

  async list(prefix: string): Promise<StorageFile[]> {
    console.log(`[S3] Listing ${prefix} from ${this.bucket}`);
    return [];
  }

  async exists(key: string): Promise<boolean> {
    console.log(`[S3] Checking ${key} in ${this.bucket}`);
    return false;
  }

  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    return null;
  }
}

// ─── Document Storage Service ────────────────────────────────────────────────

export type StorageProvider = LocalStorageProvider | S3StorageProvider;

let storageProvider: StorageProvider | null = null;

export function configureStorage(config: StorageConfig): void {
  if (config.provider === "local") {
    storageProvider = new LocalStorageProvider(config.basePath);
  } else if (config.provider === "s3" && config.s3) {
    storageProvider = new S3StorageProvider(config.s3);
  }
}

function getProvider(): StorageProvider {
  if (!storageProvider) {
    storageProvider = new LocalStorageProvider(path.join(process.cwd(), "storage"));
  }
  return storageProvider;
}

export async function uploadFile(
  key: string,
  data: Buffer,
  options?: UploadOptions
): Promise<StorageFile> {
  return getProvider().upload(key, data, options);
}

export async function downloadFile(key: string): Promise<Buffer> {
  return getProvider().download(key);
}

export async function deleteFile(key: string): Promise<void> {
  return getProvider().delete(key);
}

export async function listFiles(prefix: string): Promise<StorageFile[]> {
  return getProvider().list(prefix);
}

export async function fileExists(key: string): Promise<boolean> {
  return getProvider().exists(key);
}

export async function getFileSignedUrl(
  key: string,
  options?: SignedUrlOptions
): Promise<string> {
  return getProvider().getSignedUrl(key, options);
}

export async function getFileMetadata(key: string): Promise<StorageFile | null> {
  return getProvider().getMetadata(key);
}

// ─── Document Storage Helpers ────────────────────────────────────────────────

export function generateDocumentKey(
  matterId: string,
  filename: string,
  version?: number
): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const versionSuffix = version ? `_v${version}` : "";
  const hash = crypto.randomBytes(4).toString("hex");
  return `matters/${matterId}/documents/${hash}_${versionSuffix}_${safeFilename}`;
}

export function generateTempKey(filename: string): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `temp/${crypto.randomUUID()}_${safeFilename}`;
}

export function parseFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1);
}

export function isAllowedFileType(filename: string, allowed: string[]): boolean {
  const ext = parseFileExtension(filename);
  return allowed.includes(ext);
}

export const ALLOWED_DOCUMENT_TYPES = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "rtf", "csv", "png", "jpg", "jpeg", "gif",
  "tiff", "bmp", "svg", "webp",
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
