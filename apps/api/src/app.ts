import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { profileRouter } from "./routes/profile.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN ?? true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);

app.use(notFoundHandler);
app.use(errorHandler);
