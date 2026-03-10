import axios from "axios";
import * as fs from "fs";

export interface OllamaModel {
  name: string;
  size: number;
  format: string;
}

export class OllamaService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || "http://ollama:11434";
  }

  async listModels(): Promise<OllamaModel[]> {
    const response = await axios.get(`${this.baseUrl}/api/tags`);
    return response.data.models;
  }

  async generate(model: string, prompt: string): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/api/generate`, {
      model,
      prompt,
      stream: false,
    });
    return response.data.response;
  }

  async chat(model: string, messages: any[]): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/api/chat`, {
      model,
      messages,
      stream: false,
    });
    return response.data.message;
  }

  async pullModel(model: string): Promise<void> {
    // Note: Pull can take a long time and is usually a stream.
    // For simplicity in MCP, we'll wait for completion or trigger it.
    await axios.post(`${this.baseUrl}/api/pull`, {
      name: model,
      stream: false,
    });
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
    };
  }
}
