import Fastify from "fastify";
import cors from "@fastify/cors";
import { WebSocketServer } from "ws";
import { env } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { groupRoutes } from "./routes/groups.js";
import { messageRoutes } from "./routes/messages.js";
import { handleWebSocketConnection } from "./ws/server.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});

app.get("/health", async () => ({ status: "ok" }));

await app.register(authRoutes);
await app.register(groupRoutes);
await app.register(messageRoutes);

const server = await app.listen({ port: env.PORT, host: env.HOST });

const wss = new WebSocketServer({ noServer: true });

app.server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  if (url.pathname !== "/ws") {
    socket.destroy();
    return;
  }

  const token = url.searchParams.get("token");

  wss.handleUpgrade(request, socket, head, (ws) => {
    handleWebSocketConnection(ws, token);
  });
});

console.log(`API listening on http://${env.HOST}:${env.PORT}`);
console.log(`WebSocket available at ws://${env.HOST}:${env.PORT}/ws`);

export { app, server };
