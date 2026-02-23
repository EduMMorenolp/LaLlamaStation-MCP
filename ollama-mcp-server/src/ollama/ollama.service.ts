import axios from "axios";

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
}
