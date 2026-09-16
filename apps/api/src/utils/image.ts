import crypto from "node:crypto";
import { AppError } from "./app-error.js";

export type SupportedMimeType = "image/jpeg" | "image/png" | "image/webp";
export type SupportedExtension = "jpg" | "png" | "webp";

export interface ImageValidationResult {
  mimeType: SupportedMimeType;
  ext: SupportedExtension;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Validates actual binary file contents using magic byte headers.
 * Protects against renamed executables, scripts, SVGs, and corrupted data.
 */
export function validateImageBuffer(buffer: Buffer): ImageValidationResult {
  if (!buffer || buffer.length < 12) {
    throw new AppError("Invalid or empty image file", 400);
  }

  // 1. Check JPEG (SOI marker: 0xFF 0xD8 0xFF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", ext: "jpg" };
  }

  // 2. Check PNG (Magic signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: "image/png", ext: "png" };
  }

  // 3. Check WebP (RIFF header at 0..3 and WEBP chunk at 8..11)
  const riffHeader = buffer.subarray(0, 4).toString("ascii");
  const webpHeader = buffer.subarray(8, 12).toString("ascii");
  if (riffHeader === "RIFF" && webpHeader === "WEBP") {
    return { mimeType: "image/webp", ext: "webp" };
  }

  throw new AppError(
    "Unsupported image format. Only JPEG, PNG, and WebP images are permitted.",
    400
  );
}

/**
 * Extracts width and height directly from image headers server-side.
 * Does not rely on client-supplied image dimensions.
 */
export function extractImageDimensions(
  buffer: Buffer,
  mimeType: SupportedMimeType
): ImageDimensions {
  try {
    if (mimeType === "image/png" && buffer.length >= 24) {
      // PNG IHDR chunk starts at byte 12. Width is at 16..19, Height is at 20..23 (big endian)
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    if (mimeType === "image/jpeg") {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }

        const marker = buffer[offset + 1];
        // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
        if (marker >= 0xc0 && marker <= 0xc3) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          if (width > 0 && height > 0) {
            return { width, height };
          }
          break;
        }

        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    if (mimeType === "image/webp" && buffer.length >= 30) {
      const format = buffer.subarray(12, 16).toString("ascii");
      if (format === "VP8 " && buffer.length >= 30) {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        if (width > 0 && height > 0) {
          return { width, height };
        }
      } else if (format === "VP8L" && buffer.length >= 25) {
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        if (width > 0 && height > 0) {
          return { width, height };
        }
      }
    }
  } catch {
    // Fallback if binary structure is atypical
  }

  // Safe fallback standard profile dimensions
  return { width: 800, height: 1000 };
}

/**
 * Generates a server-controlled random storage key preventing path traversal.
 */
export function generatePhotoStorageKey(profileId: string, ext: SupportedExtension): string {
  const sanitizedProfileId = profileId.replace(/[^a-zA-Z0-9_-]/g, "");
  const randomFileId = crypto.randomUUID();
  return `photos/${sanitizedProfileId}/${randomFileId}.${ext}`;
}
