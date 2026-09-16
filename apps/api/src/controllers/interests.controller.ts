import type { NextFunction, Request, Response } from "express";
import { addProfileInterestSchema } from "../schemas/interests.schema.js";
import * as interestsService from "../services/interests.service.js";
import { AppError } from "../utils/app-error.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleListSystemInterests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    const interests = await interestsService.listSystemInterests(categoryId);
    res.status(200).json({ interests });
  } catch (error) {
    next(error);
  }
}

export async function handleListUserInterests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const interests = await interestsService.listUserInterests(userId);
    res.status(200).json({ interests });
  } catch (error) {
    next(error);
  }
}

export async function handleAddUserInterest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = addProfileInterestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid interest payload";
      throw new AppError(message, 400, parsed.error.issues);
    }

    const interest = await interestsService.addUserInterest(userId, parsed.data.interestId);
    res.status(201).json({
      message: "Interest added to profile successfully",
      interest
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRemoveUserInterest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const interestId = req.params.interestId as string;
    if (!interestId || !UUID_REGEX.test(interestId)) {
      throw new AppError("Invalid interest ID format", 400);
    }

    const result = await interestsService.removeUserInterest(userId, interestId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
