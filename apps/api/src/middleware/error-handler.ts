import type { ErrorRequestHandler, RequestHandler } from "express";

import { AppError } from "../utils/app-error.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error && (error as { name?: string }).name === "MulterError") {
    const multerErr = error as { code?: string; message?: string };
    const statusCode = 400;
    const message =
      multerErr.code === "LIMIT_FILE_SIZE"
        ? "File size exceeds the allowed limit"
        : multerErr.message || "File upload error";

    request.log.warn({ err: error, statusCode }, "File upload validation error");
    response.status(statusCode).json({ error: { message } });
    return;
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : "Internal server error";

  request.log.error({ err: error, statusCode }, "Request failed");
  response.status(statusCode).json({
    error: {
      message,
      ...(error instanceof AppError && error.details !== undefined ? { details: error.details } : {})
    }
  });
};
