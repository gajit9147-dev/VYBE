import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { ReorderPhotosInput, UpdatePhotoInput } from "../schemas/photo.schema.js";
import { AppError } from "../utils/app-error.js";
import {
  extractImageDimensions,
  generatePhotoStorageKey,
  validateImageBuffer
} from "../utils/image.js";
import { storageProvider } from "./storage/storage.provider.js";

export interface PhotoResponse {
  id: string;
  cdnUrl: string;
  displayOrder: number;
  isPrimary: boolean;
  moderationStatus: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  createdAt: string;
}

/**
 * Uploads and stores a new profile photo.
 * Enforces:
 * - Ownership & active user verification
 * - Maximum photo count limit
 * - Buffer magic bytes image validation (JPEG, PNG, WebP)
 * - Server-side dimension extraction
 * - Server-controlled unique storage keys (preventing path traversal)
 * - Automatic primary photo assignment on first photo
 * - Atomic database metadata persistence
 */
export async function uploadProfilePhoto(
  userId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
): Promise<PhotoResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    throw new AppError("Active account not found", 404);
  }

  // Ensure profile exists or initialize standard profile
  let profile = user.profile;
  if (!profile || profile.deletedAt) {
    profile = await prisma.profile.create({
      data: {
        userId,
        displayName: "Member",
        birthDate: new Date("2000-01-01"),
        gender: "OTHER"
      }
    });
  }

  // Enforce maximum photo limit per user
  const activePhotosCount = await prisma.profilePhoto.count({
    where: {
      profileId: profile.id,
      deletedAt: null
    }
  });

  if (activePhotosCount >= env.MAX_PHOTOS_PER_USER) {
    throw new AppError(
      `Maximum photo limit reached (${env.MAX_PHOTOS_PER_USER} photos allowed). Please delete an existing photo before uploading a new one.`,
      400
    );
  }

  // Enforce maximum file size
  if (file.buffer.length > env.MAX_PHOTO_FILE_SIZE_BYTES) {
    const maxMb = Math.round(env.MAX_PHOTO_FILE_SIZE_BYTES / (1024 * 1024));
    throw new AppError(`Photo size exceeds the maximum allowed limit of ${maxMb}MB.`, 400);
  }

  // Inspect actual binary bytes (magic bytes verification)
  const { mimeType, ext } = validateImageBuffer(file.buffer);

  // Extract dimensions server-side (do not trust client)
  const { width, height } = extractImageDimensions(file.buffer, mimeType);

  // Generate server-controlled object key (prevents path traversal)
  const storageKey = generatePhotoStorageKey(profile.id, ext);

  // Upload to storage provider abstraction
  const uploadResult = await storageProvider.upload({
    key: storageKey,
    buffer: file.buffer,
    mimeType
  });

  // Determine display order and primary status
  const isFirstPhoto = activePhotosCount === 0;
  const isPrimary = isFirstPhoto;

  const highestOrderPhoto = await prisma.profilePhoto.findFirst({
    where: { profileId: profile.id, deletedAt: null },
    orderBy: { displayOrder: "desc" }
  });
  const displayOrder = highestOrderPhoto ? highestOrderPhoto.displayOrder + 1 : 0;

  // Persist metadata in PostgreSQL (only metadata is stored; never raw binary)
  const photoRecord = await prisma.profilePhoto.create({
    data: {
      profileId: profile.id,
      storageKey: uploadResult.key,
      cdnUrl: uploadResult.url,
      displayOrder,
      isPrimary,
      moderationStatus: "APPROVED",
      width,
      height,
      fileSizeBytes: file.buffer.length
    }
  });

  logger.info(
    {
      userId,
      photoId: photoRecord.id,
      storageKey: uploadResult.key
    },
    "Profile photo uploaded and registered successfully"
  );

  return {
    id: photoRecord.id,
    cdnUrl: photoRecord.cdnUrl,
    displayOrder: photoRecord.displayOrder,
    isPrimary: photoRecord.isPrimary,
    moderationStatus: photoRecord.moderationStatus,
    width: photoRecord.width,
    height: photoRecord.height,
    fileSizeBytes: photoRecord.fileSizeBytes,
    createdAt: photoRecord.createdAt.toISOString()
  };
}

/**
 * Returns all active profile photos for the authenticated user, ordered by displayOrder.
 */
export async function listUserPhotos(userId: string): Promise<PhotoResponse[]> {
  const profile = await prisma.profile.findUnique({
    where: { userId }
  });

  if (!profile || profile.deletedAt) {
    return [];
  }

  const photos = await prisma.profilePhoto.findMany({
    where: {
      profileId: profile.id,
      deletedAt: null
    },
    orderBy: { displayOrder: "asc" }
  });

  return photos.map((p) => ({
    id: p.id,
    cdnUrl: p.cdnUrl,
    displayOrder: p.displayOrder,
    isPrimary: p.isPrimary,
    moderationStatus: p.moderationStatus,
    width: p.width,
    height: p.height,
    fileSizeBytes: p.fileSizeBytes,
    createdAt: p.createdAt.toISOString()
  }));
}

/**
 * Sets a specific photo as primary for the user, demoting all other photos.
 * Enforces ownership and IDOR protection.
 */
export async function setPrimaryPhoto(userId: string, photoId: string): Promise<PhotoResponse> {
  const photo = await prisma.profilePhoto.findUnique({
    where: { id: photoId },
    include: { profile: true }
  });

  if (!photo || photo.deletedAt || photo.profile.userId !== userId) {
    throw new AppError("Photo not found", 404);
  }

  // Atomically set this photo as primary and unset all others
  await prisma.$transaction(async (tx) => {
    await tx.profilePhoto.updateMany({
      where: {
        profileId: photo.profileId,
        id: { not: photoId },
        deletedAt: null
      },
      data: { isPrimary: false }
    });

    await tx.profilePhoto.update({
      where: { id: photoId },
      data: { isPrimary: true }
    });
  });

  const updated = await prisma.profilePhoto.findUnique({
    where: { id: photoId }
  });

  return {
    id: updated!.id,
    cdnUrl: updated!.cdnUrl,
    displayOrder: updated!.displayOrder,
    isPrimary: updated!.isPrimary,
    moderationStatus: updated!.moderationStatus,
    width: updated!.width,
    height: updated!.height,
    fileSizeBytes: updated!.fileSizeBytes,
    createdAt: updated!.createdAt.toISOString()
  };
}

/**
 * Deletes a photo from object storage and database.
 * If the deleted photo was primary, automatically promotes the next available photo.
 * Enforces ownership and IDOR protection.
 */
export async function deleteProfilePhoto(
  userId: string,
  photoId: string
): Promise<{ message: string; promotedPrimaryId: string | null }> {
  const photo = await prisma.profilePhoto.findUnique({
    where: { id: photoId },
    include: { profile: true }
  });

  if (!photo || photo.deletedAt || photo.profile.userId !== userId) {
    throw new AppError("Photo not found", 404);
  }

  // Delete from object storage provider
  try {
    await storageProvider.delete(photo.storageKey);
  } catch (err) {
    logger.warn({ err, key: photo.storageKey }, "Storage provider delete failure (continuing db cleanup)");
  }

  let promotedPrimaryId: string | null = null;

  // Execute database deletion and primary promotion in atomic transaction
  await prisma.$transaction(async (tx) => {
    // Delete target photo
    await tx.profilePhoto.delete({
      where: { id: photoId }
    });

    // If the deleted photo was primary, promote next available photo
    if (photo.isPrimary) {
      const nextPhoto = await tx.profilePhoto.findFirst({
        where: {
          profileId: photo.profileId,
          id: { not: photoId },
          deletedAt: null
        },
        orderBy: { displayOrder: "asc" }
      });

      if (nextPhoto) {
        await tx.profilePhoto.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true }
        });
        promotedPrimaryId = nextPhoto.id;
      }
    }
  });

  logger.info({ userId, photoId, promotedPrimaryId }, "Profile photo deleted");

  return {
    message: "Photo deleted successfully.",
    promotedPrimaryId
  };
}

/**
 * Reorders user's profile photos.
 * Enforces ownership and IDOR protection across all photo IDs in request.
 */
export async function reorderProfilePhotos(
  userId: string,
  input: ReorderPhotosInput
): Promise<PhotoResponse[]> {
  const profile = await prisma.profile.findUnique({
    where: { userId }
  });

  const userPhotos = profile && !profile.deletedAt
    ? await prisma.profilePhoto.findMany({
        where: {
          profileId: profile.id,
          deletedAt: null
        }
      })
    : [];

  const userPhotoIds = new Set(userPhotos.map((p) => p.id));

  // Verify all requested photos belong to this user (IDOR protection)
  for (const item of input.orders) {
    if (!userPhotoIds.has(item.photoId)) {
      throw new AppError(`Photo with ID ${item.photoId} does not belong to your profile.`, 403);
    }
  }

  // Atomically update display orders
  await prisma.$transaction(
    input.orders.map((item) =>
      prisma.profilePhoto.update({
        where: { id: item.photoId },
        data: { displayOrder: item.displayOrder }
      })
    )
  );

  return listUserPhotos(userId);
}

/**
 * Updates individual photo metadata (e.g. displayOrder).
 * Enforces ownership and IDOR protection.
 */
export async function updateProfilePhoto(
  userId: string,
  photoId: string,
  input: UpdatePhotoInput
): Promise<PhotoResponse> {
  const photo = await prisma.profilePhoto.findUnique({
    where: { id: photoId },
    include: { profile: true }
  });

  if (!photo || photo.deletedAt || photo.profile.userId !== userId) {
    throw new AppError("Photo not found", 404);
  }

  const updated = await prisma.profilePhoto.update({
    where: { id: photoId },
    data: {
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder })
    }
  });

  return {
    id: updated.id,
    cdnUrl: updated.cdnUrl,
    displayOrder: updated.displayOrder,
    isPrimary: updated.isPrimary,
    moderationStatus: updated.moderationStatus,
    width: updated.width,
    height: updated.height,
    fileSizeBytes: updated.fileSizeBytes,
    createdAt: updated.createdAt.toISOString()
  };
}
