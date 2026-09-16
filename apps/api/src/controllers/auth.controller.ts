import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { extractSessionToken } from "../middleware/authenticate.js";
import * as authService from "../services/auth.service.js";
import { getSessionCookieOptions } from "../utils/session.js";

export async function handleRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, sessionToken } = await authService.register(req.body, {
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.cookie(env.SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());

    res.status(201).json({
      user
    });
  } catch (error) {
    next(error);
  }
}

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, sessionToken } = await authService.login(req.body, {
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.cookie(env.SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());

    res.status(200).json({
      user
    });
  } catch (error) {
    next(error);
  }
}

export async function handleLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.sessionToken || extractSessionToken(req);
    await authService.logout(token);

    const cookieOptions = getSessionCookieOptions();
    res.clearCookie(env.SESSION_COOKIE_NAME, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path
    });

    res.status(200).json({
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function handleLogoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await authService.logoutAll(req.user.id);
    }

    const cookieOptions = getSessionCookieOptions();
    res.clearCookie(env.SESSION_COOKIE_NAME, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path
    });

    res.status(200).json({
      message: "All sessions invalidated successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({
      user: req.user
    });
  } catch (error) {
    next(error);
  }
}
