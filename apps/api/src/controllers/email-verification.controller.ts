import type { NextFunction, Request, Response } from "express";
import * as emailVerificationService from "../services/email-verification.service.js";
import { AppError } from "../utils/app-error.js";

export async function handleSendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const email = typeof req.body?.email === "string" ? req.body.email : undefined;

    if (!userId && !email) {
      throw new AppError("Authentication or email address is required", 400);
    }

    const result = await emailVerificationService.sendVerificationEmail({
      userId,
      email
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleVerifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : undefined;

    if (!token) {
      throw new AppError("Verification token is required", 400);
    }

    const result = await emailVerificationService.verifyEmailToken(token);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetVerificationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const email = typeof req.query.email === "string" ? req.query.email : undefined;

    if (!userId && !email) {
      throw new AppError("Authentication or email parameter is required", 400);
    }

    const result = await emailVerificationService.getVerificationStatus({
      userId,
      email
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
