import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export interface StorageUploadOptions {
  key: string;
  buffer: Buffer;
  mimeType: string;
}

export interface StorageUploadResult {
  key: string;
  url: string;
}

export interface StorageProvider {
  name: string;
  upload(options: StorageUploadOptions): Promise<StorageUploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  has(key: string): Promise<boolean>;
}

/**
 * In-memory storage provider for automated tests and development.
 * Simulates object storage without contacting external cloud services.
 */
export class MemoryStorageProvider implements StorageProvider {
  public readonly name = "MemoryStorageProvider";
  private store = new Map<string, { buffer: Buffer; mimeType: string; uploadedAt: Date }>();

  async upload(options: StorageUploadOptions): Promise<StorageUploadResult> {
    this.store.set(options.key, {
      buffer: options.buffer,
      mimeType: options.mimeType,
      uploadedAt: new Date()
    });

    logger.info(
      {
        provider: this.name,
        key: options.key,
        bytes: options.buffer.length
      },
      "File stored in simulated object storage"
    );

    return {
      key: options.key,
      url: this.getUrl(options.key)
    };
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    logger.info({ provider: this.name, key }, "File removed from simulated object storage");
  }

  getUrl(key: string): string {
    const cdnBase = env.STORAGE_CDN_URL.replace(/\/+$/, "");
    return `${cdnBase}/${key}`;
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  getBuffer(key: string): Buffer | undefined {
    return this.store.get(key)?.buffer;
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * S3-compatible production object storage provider.
 * Supports AWS S3, Cloudflare R2, MinIO, and other standard S3 implementations.
 * Credentials come strictly from environment variables.
 */
export class S3StorageProvider implements StorageProvider {
  public readonly name = "S3StorageProvider";
  private bucket: string;
  private region: string;
  private endpoint?: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private cdnUrl: string;

  constructor() {
    this.bucket = env.STORAGE_BUCKET || "";
    this.region = env.STORAGE_REGION || "us-east-1";
    this.endpoint = env.STORAGE_ENDPOINT || undefined;
    this.accessKeyId = env.STORAGE_ACCESS_KEY_ID || "";
    this.secretAccessKey = env.STORAGE_SECRET_ACCESS_KEY || "";
    this.cdnUrl = env.STORAGE_CDN_URL || "";

    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      if (env.NODE_ENV === "production") {
        throw new Error(
          "S3 storage provider selected but required environment variables are missing: " +
          "STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, or STORAGE_SECRET_ACCESS_KEY."
        );
      }
    }
  }

  getUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl.replace(/\/+$/, "")}/${key}`;
    }
    const host = this.endpoint
      ? `${this.endpoint.replace(/^https?:\/\//, "")}/${this.bucket}`
      : `${this.bucket}.s3.${this.region}.amazonaws.com`;
    return `https://${host}/${key}`;
  }

  async has(_key: string): Promise<boolean> {
    return true;
  }

  async upload(options: StorageUploadOptions): Promise<StorageUploadResult> {
    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error("S3 credentials not configured");
    }

    const host = this.endpoint
      ? this.endpoint.replace(/^https?:\/\//, "")
      : `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const targetUrl = this.endpoint
      ? `https://${host}/${this.bucket}/${options.key}`
      : `https://${host}/${options.key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = crypto.createHash("sha256").update(options.buffer).digest("hex");

    // AWS SigV4 Canonical Request
    const canonicalUri = this.endpoint ? `/${this.bucket}/${options.key}` : `/${options.key}`;
    const canonicalHeaders =
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [
      "PUT",
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join("\n");

    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      crypto.createHash("sha256").update(canonicalRequest).digest("hex")
    ].join("\n");

    // Signing Key
    const kDate = crypto.createHmac("sha256", `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(this.region).digest();
    const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    const authorizationHeader =
      `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(targetUrl, {
      method: "PUT",
      headers: {
        Host: host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        Authorization: authorizationHeader,
        "Content-Type": options.mimeType,
        "Content-Length": String(options.buffer.length)
      },
      body: new Uint8Array(options.buffer)
    });

    if (!response.ok) {
      logger.error(
        {
          statusCode: response.status,
          key: options.key
        },
        "S3 object upload failed"
      );
      throw new Error(`Object storage upload failed with HTTP status ${response.status}`);
    }

    logger.info({ provider: this.name, key: options.key }, "Object successfully uploaded to S3");
    return {
      key: options.key,
      url: this.getUrl(options.key)
    };
  }

  async delete(key: string): Promise<void> {
    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error("S3 credentials not configured");
    }

    const host = this.endpoint
      ? this.endpoint.replace(/^https?:\/\//, "")
      : `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const targetUrl = this.endpoint
      ? `https://${host}/${this.bucket}/${key}`
      : `https://${host}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = crypto.createHash("sha256").update("").digest("hex");

    const canonicalUri = this.endpoint ? `/${this.bucket}/${key}` : `/${key}`;
    const canonicalHeaders =
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [
      "DELETE",
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join("\n");

    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      crypto.createHash("sha256").update(canonicalRequest).digest("hex")
    ].join("\n");

    const kDate = crypto.createHmac("sha256", `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(this.region).digest();
    const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    const authorizationHeader =
      `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(targetUrl, {
      method: "DELETE",
      headers: {
        Host: host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        Authorization: authorizationHeader
      }
    });

    if (!response.ok && response.status !== 404) {
      logger.error({ statusCode: response.status, key }, "S3 object deletion failed");
      throw new Error(`Object storage delete failed with HTTP status ${response.status}`);
    }

    logger.info({ provider: this.name, key }, "Object removed from S3");
  }
}

export const storageProvider: StorageProvider =
  env.STORAGE_PROVIDER === "s3" ? new S3StorageProvider() : new MemoryStorageProvider();
