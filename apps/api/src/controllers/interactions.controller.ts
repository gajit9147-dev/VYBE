import type { NextFunction, Request, Response } from "express";
import { likeInputSchema } from "../schemas/interactions.schema.js";
import * as interactionsService from "../services/interactions.service.js";
import { AppError } from "../utils/app-error.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleLikeCandidate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actorUserId = req.user?.id;
    if (!actorUserId) {
      throw new AppError("Authentication required", 401);
    }

    const candidateId = req.params.candidateId as string;
    if (!candidateId || !UUID_REGEX.test(candidateId)) {
      throw new AppError("Invalid candidate ID format", 400);
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const parsed = likeInputSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid like payload";
      throw new AppError(message, 400, parsed.error.issues);
    }

    const result = await interactionsService.recordLike(
      actorUserId,
      candidateId,
      parsed.data.reasonType
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handlePassCandidate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actorUserId = req.user?.id;
    if (!actorUserId) {
      throw new AppError("Authentication required", 401);
    }

    const candidateId = req.params.candidateId as string;
    if (!candidateId || !UUID_REGEX.test(candidateId)) {
      throw new AppError("Invalid candidate ID format", 400);
    }

    const result = await interactionsService.recordPass(actorUserId, candidateId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleRemoveLike(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actorUserId = req.user?.id;
    if (!actorUserId) {
      throw new AppError("Authentication required", 401);
    }

    const candidateId = req.params.candidateId as string;
    if (!candidateId || !UUID_REGEX.test(candidateId)) {
      throw new AppError("Invalid candidate ID format", 400);
    }

    const result = await interactionsService.removeLike(actorUserId, candidateId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleRemovePass(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actorUserId = req.user?.id;
    if (!actorUserId) {
      throw new AppError("Authentication required", 401);
    }

    const candidateId = req.params.candidateId as string;
    if (!candidateId || !UUID_REGEX.test(candidateId)) {
      throw new AppError("Invalid candidate ID format", 400);
    }

    const result = await interactionsService.removePass(actorUserId, candidateId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetOwnAction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actorUserId = req.user?.id;
    if (!actorUserId) {
      throw new AppError("Authentication required", 401);
    }

    const candidateId = req.params.candidateId as string;
    if (!candidateId || !UUID_REGEX.test(candidateId)) {
      throw new AppError("Invalid candidate ID format", 400);
    }

    const result = await interactionsService.getOwnAction(actorUserId, candidateId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
