import type { NextFunction, Request, Response } from "express";
import * as photoService from "../services/photo.service.js";
import { AppError } from "../utils/app-error.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractParamId(param: string | string[] | undefined): string {
  const val = Array.isArray(param) ? param[0] : param;
  if (!val || !UUID_REGEX.test(val)) {
    throw new AppError("Photo not found", 404);
  }
  return val;
}

export async function handleUploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    if (!req.file) {
      throw new AppError("Image file is required", 400);
    }

    const photo = await photoService.uploadProfilePhoto(userId, {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    res.status(201).json({
      message: "Photo uploaded successfully.",
      photo
    });
  } catch (error) {
    next(error);
  }
}

export async function handleListPhotos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const photos = await photoService.listUserPhotos(userId);
    res.status(200).json({ photos });
  } catch (error) {
    next(error);
  }
}

export async function handleSetPrimaryPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const photoId = extractParamId(req.params.photoId);
    const photo = await photoService.setPrimaryPhoto(userId, photoId);

    res.status(200).json({
      message: "Primary photo set successfully.",
      photo
    });
  } catch (error) {
    next(error);
  }
}

export async function handleDeletePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const photoId = extractParamId(req.params.photoId);
    const result = await photoService.deleteProfilePhoto(userId, photoId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleReorderPhotos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const photos = await photoService.reorderProfilePhotos(userId, req.body);
    res.status(200).json({
      message: "Photos reordered successfully.",
      photos
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdatePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const photoId = extractParamId(req.params.photoId);
    const photo = await photoService.updateProfilePhoto(userId, photoId, req.body);

    res.status(200).json({
      message: "Photo updated successfully.",
      photo
    });
  } catch (error) {
    next(error);
  }
}
