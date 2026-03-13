import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "http";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { config } from "../config/index.js";

type WsMessage = {
  type: string;
  payload: unknown;
};

interface AuthenticatedWs extends WebSocket {
  user?: JwtPayload;
}

const clients = new Set<WebSocket>();

export function initWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const requestHost = req.headers.host ?? "localhost";
    const requestUrl = new URL(req.url ?? "", `http://${requestHost}`);
    const token = requestUrl.searchParams.get("token");

    if (!token) {
      ws.close(1008, "Token não fornecido.");
      return;
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
      (ws as AuthenticatedWs).user = payload;
    } catch {
      ws.close(1008, "Token inválido ou expirado.");
      return;
    }

    clients.add(ws);
    console.log(
      `[PDV WS] Cliente conectado. Total: ${clients.size}`,
    );

    ws.on("close", () => {
      clients.delete(ws);
      console.log(
        `[PDV WS] Cliente desconectado. Total: ${clients.size}`,
      );
    });

    ws.on("error", (error) => {
      console.error("[PDV WS] Erro:", error.message);
      clients.delete(ws);
    });
  });

  console.log("[PDV WS] WebSocket inicializado em /ws");
}

export function broadcast(message: WsMessage): void {
  const data = JSON.stringify(message);

  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}
