import type { Request, Response } from "express";

import { env } from "../config/env.js";

export function getHealth(_request: Request, response: Response): void {
  response.status(200).json({
    service: "VYBE API",
    status: "ok",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
