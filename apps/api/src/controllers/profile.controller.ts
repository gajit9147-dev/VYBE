import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import * as profileService from "../services/profile.service.js";
import { AppError } from "../utils/app-error.js";

function getClientIpHash(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function handleGetMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const profile = await profileService.getOwnProfile(userId);
    if (!profile) {
      res.status(200).json({
        profile: null,
        message: "Profile not yet initialized. Use PATCH /api/profile/me to complete your profile."
      });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function handlePatchMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const ipHash = getClientIpHash(req);
    const updatedProfile = await profileService.updateOwnProfile(userId, req.body, ipHash);

    res.status(200).json({
      message: "Profile updated successfully.",
      profile: updatedProfile
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params.id;
    const identifier = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!identifier) {
      throw new AppError("Profile identifier is required", 400);
    }

    const requesterUserId = req.user?.id;
    const profile = await profileService.getPublicProfile(identifier, requesterUserId);

    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}
