import type { NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../config/env.js";
import { type SafeUser, verifySession } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      sessionId?: string;
      sessionToken?: string;
    }
  }
}

export function extractSessionToken(req: Request): string | undefined {
  if (req.cookies && req.cookies[env.SESSION_COOKIE_NAME]) {
    return req.cookies[env.SESSION_COOKIE_NAME];
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return undefined;
}

export const authenticate: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractSessionToken(req);

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const auth = await verifySession(token);

    if (!auth) {
      throw new AppError("Invalid or expired session", 401);
    }

    req.user = auth.user;
    req.sessionId = auth.sessionId;
    req.sessionToken = token;

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return next();
    }

    const auth = await verifySession(token);
    if (auth) {
      req.user = auth.user;
      req.sessionId = auth.sessionId;
      req.sessionToken = token;
    }

    next();
  } catch {
    next();
  }
};

