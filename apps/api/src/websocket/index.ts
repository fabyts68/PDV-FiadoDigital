import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "http";
import { wsTokenService } from "../services/ws-token.service.js";
import type { AuthPayload } from "../middlewares/auth.middleware.js";
import { logInfo, logError } from "../utils/logger.js";

type WsMessage = {
  type: string;
  payload: unknown;
};

interface AuthenticatedWs extends WebSocket {
  user?: AuthPayload;
}

const clients = new Set<WebSocket>();

export function initWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const requestHost = req.headers.host ?? "localhost";
    const requestUrl = new URL(req.url ?? "", `http://${requestHost}`);
    const token = requestUrl.searchParams.get("ws_token");

    if (!token) {
      ws.close(1008, "Token WS não fornecido.");
      return;
    }

    const payload = wsTokenService.consumeToken(token);

    if (!payload) {
      ws.close(1008, "Token WS inválido, expirado ou já utilizado.");
      return;
    }

    (ws as AuthenticatedWs).user = payload;

    clients.add(ws);
    logInfo(`Cliente conectado. Total: ${clients.size}`, { tag: "PDV WS" });

    ws.on("close", () => {
      clients.delete(ws);
      logInfo(`Cliente desconectado. Total: ${clients.size}`, { tag: "PDV WS" });
    });

    ws.on("error", (error) => {
      logError("Erro", error.message, { tag: "PDV WS" });
      clients.delete(ws);
    });
  });

  logInfo("WebSocket inicializado em /ws", { tag: "PDV WS" });
}

export function broadcast(message: WsMessage): void {
  const data = JSON.stringify(message);

  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}
