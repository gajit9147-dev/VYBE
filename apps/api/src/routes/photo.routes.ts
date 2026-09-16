import { Router } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import {
  handleDeletePhoto,
  handleListPhotos,
  handleReorderPhotos,
  handleSetPrimaryPhoto,
  handleUpdatePhoto,
  handleUploadPhoto
} from "../controllers/photo.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { createRateLimiter } from "../middleware/rate-limiter.js";
import { validateBody } from "../middleware/validate.js";
import { reorderPhotosSchema, updatePhotoSchema } from "../schemas/photo.schema.js";

export const photoRouter = Router();

// Configure Multer for in-memory buffer processing with size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_PHOTO_FILE_SIZE_BYTES,
    files: 1
  }
});

// Rate limiter for photo uploads: 20 uploads per 15 minutes per IP
const photoUploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many photo uploads. Please wait before uploading more photos.",
  keyPrefix: "photo_upload"
});

// All photo operations require an authenticated session
photoRouter.use(authenticate);

// POST /api/profile/photos - Upload new profile photo
photoRouter.post("/", photoUploadLimiter, upload.single("photo"), handleUploadPhoto);

// GET /api/profile/photos - List authenticated user's photos
photoRouter.get("/", handleListPhotos);

// PATCH /api/profile/photos/reorder - Reorder photos (must be declared before :photoId)
photoRouter.patch("/reorder", validateBody(reorderPhotosSchema), handleReorderPhotos);

// PATCH /api/profile/photos/:photoId/primary - Set photo as primary
photoRouter.patch("/:photoId/primary", handleSetPrimaryPhoto);

// PATCH /api/profile/photos/:photoId - Update photo metadata (e.g. display order)
photoRouter.patch("/:photoId", validateBody(updatePhotoSchema), handleUpdatePhoto);

// DELETE /api/profile/photos/:photoId - Delete photo and promote next primary if needed
photoRouter.delete("/:photoId", handleDeletePhoto);
