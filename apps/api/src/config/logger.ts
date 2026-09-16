import pino from "pino";

import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "password",
      "otp",
      "token",
      "rawToken",
      "phoneNumber",
      "*.password",
      "*.otp",
      "*.token",
      "*.phoneNumber",
      "body.password",
      "body.otp",
      "body.phoneNumber",
      "req.headers.authorization",
      "req.headers.cookie"
    ],
    censor: "[REDACTED]"
  },
  ...(env.NODE_ENV === "development" ? { transport: { target: "pino/file", options: { destination: 1 } } } : {})
});
