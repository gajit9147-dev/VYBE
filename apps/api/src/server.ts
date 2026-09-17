import http from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createWebSocketServer } from "./websocket/websocket.server.js";

const server = http.createServer(app);
createWebSocketServer(server);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, "VYBE API & WebSocket server listening");
});

