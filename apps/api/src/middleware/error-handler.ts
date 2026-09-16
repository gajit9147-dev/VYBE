import type { ErrorRequestHandler, RequestHandler } from "express";

import { AppError } from "../utils/app-error.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : "Internal server error";

  request.log.error({ err: error, statusCode }, "Request failed");
  response.status(statusCode).json({
    error: {
      message
    }
  });
};
