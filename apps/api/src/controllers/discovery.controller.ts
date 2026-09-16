import type { NextFunction, Request, Response } from "express";
import {
  createDiscoveryEventSchema,
  discoveryQuerySchema
} from "../schemas/discovery.schema.js";
import * as discoveryService from "../services/discovery.service.js";
import { AppError } from "../utils/app-error.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleGetDiscoveryFeed(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = discoveryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid query parameters";
      throw new AppError(message, 400, parsed.error.issues);
    }

    const result = await discoveryService.getDiscoveryFeed(userId, parsed.data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetCandidateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const candidateUserId = req.params.userId as string;
    if (!candidateUserId || !UUID_REGEX.test(candidateUserId)) {
      throw new AppError("Invalid user ID format", 400);
    }

    const result = await discoveryService.getDiscoveryCandidateProfile(userId, candidateUserId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleRecordDiscoveryEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = createDiscoveryEventSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid discovery event payload";
      throw new AppError(message, 400, parsed.error.issues);
    }

    const result = await discoveryService.recordDiscoveryEvent(userId, parsed.data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
