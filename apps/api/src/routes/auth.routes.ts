import { Router } from "express";
import {
  handleGetMe,
  handleLogin,
  handleLogout,
  handleLogoutAll,
  handleRegister
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { createRateLimiter } from "../middleware/rate-limiter.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

export const authRouter = Router();

// Rate limiter: 15 attempts per 15 minutes per IP
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication requests from this IP. Please try again later.",
  keyPrefix: "auth"
});

authRouter.post("/register", authLimiter, validateBody(registerSchema), handleRegister);
authRouter.post("/login", authLimiter, validateBody(loginSchema), handleLogin);
authRouter.post("/logout", handleLogout);
authRouter.post("/logout-all", authenticate, handleLogoutAll);
authRouter.get("/me", authenticate, handleGetMe);
