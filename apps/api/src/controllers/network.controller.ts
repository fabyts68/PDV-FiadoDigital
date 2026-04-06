import type { Request, Response } from "express";
import * as os from "node:os";
import { config } from "../config/index.js";

function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const entry of iface) {
      // Usar String() para garantir compatibilidade caso family seja número (4) em vez de string ("IPv4")
      if (String(entry.family) === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }
  return "127.0.0.1";
}

export function getAccessInfo(_req: Request, res: Response): void {
  const ip = getLocalIpAddress();
  const port = config.port;
  res.json({ ip, port, url: `http://${ip}:${port}` });
}

export async function getLocalIp(_req: Request, res: Response): Promise<void> {
  try {
    const interfaces = os.networkInterfaces();
    let localIp = "";

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (String(iface.family) === "IPv4" && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
      if (localIp) break;
    }

    res.status(200).json({ success: true, ip: localIp || "localhost" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao detectar IP local." });
  }
}
