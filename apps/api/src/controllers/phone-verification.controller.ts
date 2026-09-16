import type { NextFunction, Request, Response } from "express";
import * as phoneVerificationService from "../services/phone-verification.service.js";
import { AppError } from "../utils/app-error.js";

export async function handleSendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const result = await phoneVerificationService.sendOtp({
      userId,
      phoneNumber: req.body.phoneNumber,
      ip
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleVerifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const result = await phoneVerificationService.verifyOtp({
      userId,
      phoneNumber: req.body.phoneNumber,
      otp: req.body.otp,
      ip
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetPhoneStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const result = await phoneVerificationService.getPhoneStatus(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleRemovePhone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const result = await phoneVerificationService.removePhone({
      userId,
      password: req.body.password
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
