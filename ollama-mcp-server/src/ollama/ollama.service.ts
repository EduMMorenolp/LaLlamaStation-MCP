import axios from "axios";
import * as fs from "fs";
import { Server as SocketServer } from "socket.io";

export interface OllamaModel {
  name: string;
  size: number;
  format: string;
}

export class OllamaService {
  private readonly baseUrl: string;
  private readonly requestLogs: any[] = [];
  private readonly blacklist: Set<string> = new Set();
  private readonly failedAttempts: Map<string, number> = new Map();
  private readonly sessionCache: Map<string, any[]> = new Map();
  private io?: SocketServer;
  private readonly pullStates: Map<string, { percent: number; status: string; lastUpdate: number }> = new Map();

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || "http://ollama:11434";
  }

  setIo(io: SocketServer) {
    this.io = io;
  }

  async listModels(): Promise<OllamaModel[]> {
    const response = await axios.get(`${this.baseUrl}/api/tags`);
    return response.data.models;
  }

  async generate(
    model: string,
    prompt: string,
    options: any = {},
    keep_alive: string | number = "5m",
  ): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/api/generate`, {
      model,
      prompt,
      options,
      keep_alive,
      stream: false,
    });
    return response.data.response;
  }

  async chat(
    model: string,
    messages: any[],
    options: any = {},
    keep_alive: string | number = "5m",
    sessionId?: string,
  ): Promise<any> {
    let finalMessages = messages;

    // Context Caching Logic (Fase 3)
    if (sessionId) {
      const cached = this.sessionCache.get(sessionId) || [];
      // Si recibimos un solo mensaje nuevo, lo añadimos al caché
      if (messages.length === 1 && cached.length > 0) {
        finalMessages = [...cached, ...messages];
      }
      this.sessionCache.set(sessionId, finalMessages);
      // Limitar tamaño de caché a los últimos 20 mensajes
      if (this.sessionCache.get(sessionId)!.length > 20) {
        this.sessionCache.set(sessionId, this.sessionCache.get(sessionId)!.slice(-20));
      }
    }

    const response = await axios.post(`${this.baseUrl}/api/chat`, {
      model,
      messages: finalMessages,
      options,
      keep_alive,
      stream: false,
    });
    return response.data.message;
  }

  async unloadModels(): Promise<void> {
    const models = await this.listModels();
    for (const model of models) {
      await axios.post(`${this.baseUrl}/api/chat`, {
        model: model.name,
        keep_alive: 0,
      }).catch(() => {}); // Ignorar errores si el modelo no está cargado
    }
  }

  async pullModel(model: string): Promise<void> {
    const status = await this.getServerStatus();
    // Validación de espacio simple (ej: requiere al menos 5GB libres para intentar descargar un modelo medio)
    if (status.diskSpace.free < 2) {
      const msg = `Espacio insuficiente para descargar ${model}. Libres: ${status.diskSpace.free.toFixed(2)}GB`;
      if (this.io) this.io.emit("security-alert", { type: "error", message: msg });
      throw new Error(msg);
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api/pull`, {
        name: model,
        stream: true,
      }, { responseType: 'stream' });

      response.data.on('data', (chunk: Buffer) => {
        try {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (!line) continue;
            const update = JSON.parse(line);
            if (update.status === 'downloading' && update.total) {
              const percent = Math.round((update.completed / update.total) * 100);
              const prevState = this.pullStates.get(model);
              const now = Date.now();

              // Throttling: 1% o 2 segundos
              if (!prevState || percent >= prevState.percent + 1 || now - prevState.lastUpdate > 2000) {
                this.pullStates.set(model, { percent, status: update.status, lastUpdate: now });
                if (this.io) this.io.emit("pull-progress", { model, percent, status: update.status });
              }
            } else if (update.status === 'success') {
              this.pullStates.delete(model);
              if (this.io) this.io.emit("pull-progress", { model, percent: 100, status: 'completed' });
            }
          }
        } catch (e) {
          // Ignorar errores de parsing parcial
        }
      });
    } catch (e: any) {
      if (this.io) this.io.emit("security-alert", { type: "error", message: `Fallo al descargar ${model}: ${e.message}` });
      throw e;
    }
  }

  async getServerStatus(): Promise<any> {
    let diskSpace = { free: 0, total: 0 };
    try {
      const stats = fs.statfsSync("/root/.ollama");
      const bavail = Number(stats.bavail);
      const bsize = Number(stats.bsize);
      const blocks = Number(stats.blocks);
      diskSpace = {
        free: (bavail * bsize) / Math.pow(1024, 3),
        total: (blocks * bsize) / Math.pow(1024, 3),
      };
    } catch (e) {
      console.error("Error checking disk space:", e);
    }

    let loadedModels = [];
    try {
      const psResponse = await axios.get(`${this.baseUrl}/api/ps`);
      loadedModels = psResponse.data.models || [];
    } catch (e) {
      console.error("Error fetching loaded models:", e);
    }

    let ngrokInfo = { url: "N/A", latency: 0 };
    try {
      const ngrokResponse = await axios.get("http://mcp-ngrok-tunnel:4040/api/tunnels");
      const tunnel = ngrokResponse.data.tunnels[0];
      if (tunnel) {
        ngrokInfo = {
          url: tunnel.public_url,
          latency: 0, // La métrica exacta de latencia puede requerir más parsing
        };
      }
    } catch (e) {
      console.error("Error fetching ngrok info:", e);
    }

    return {
      diskSpace,
      loadedModels,
      ngrokInfo,
      timestamp: new Date().toISOString(),
      recentLogs: this.requestLogs.slice(-20).reverse(),
      blacklistedIps: Array.from(this.blacklist),
    };
  }

  logRequest(ip: string, action: string, status: string) {
    this.requestLogs.push({
      ip,
      action,
      status,
      timestamp: new Date().toISOString(),
    });
    if (this.requestLogs.length > 100) this.requestLogs.shift();

    // Notificar nueva IP o acceso (Fase 4)
    if (this.io && status === "Success") {
      this.io.emit("new-access", { ip, action, timestamp: new Date().toISOString() });
    }
  }

  isBlacklisted(ip: string): boolean {
    return this.blacklist.has(ip);
  }

  banIp(ip: string) {
    this.blacklist.add(ip);
  }

  unbanIp(ip: string) {
    this.blacklist.delete(ip);
  }

  reportFailedAuth(ip: string) {
    const attempts = (this.failedAttempts.get(ip) || 0) + 1;
    this.failedAttempts.set(ip, attempts);
    if (attempts >= 5) {
      this.banIp(ip);
      console.warn(`🚨 IP ${ip} auto-baneada tras 5 intentos fallidos.`);
      if (this.io) {
        this.io.emit("security-alert", { 
          type: "ban", 
          ip, 
          message: `IP ${ip} ha sido bloqueada automáticamente tras 5 intentos fallidos.` 
        });
      }
    } else {
      if (this.io) {
        this.io.emit("security-alert", { 
          type: "auth_failed", 
          ip, 
          message: `Intento de acceso fallido desde ${ip} (${attempts}/5)` 
        });
      }
    }
  }
}
