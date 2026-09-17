import type { RequestHandler } from "express";
import { type ZodType, ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }));
      next(new AppError("Validation failed", 400, issues));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }));
      next(new AppError("Validation failed", 400, issues));
      return;
    }
    req.query = result.data as any;
    next();
  };
}
