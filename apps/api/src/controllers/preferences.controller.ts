import type { NextFunction, Request, Response } from "express";
import { updateDiscoveryPreferencesSchema } from "../schemas/interests.schema.js";
import * as preferencesService from "../services/preferences.service.js";
import { AppError } from "../utils/app-error.js";

export async function handleGetUserPreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const preferences = await preferencesService.getUserPreferences(userId);
    res.status(200).json({ preferences });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateUserPreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = updateDiscoveryPreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid discovery preferences payload";
      throw new AppError(message, 400, parsed.error.issues);
    }

    const preferences = await preferencesService.updateUserPreferences(userId, parsed.data);
    res.status(200).json({
      message: "Discovery preferences updated successfully",
      preferences
    });
  } catch (error) {
    next(error);
  }
}
