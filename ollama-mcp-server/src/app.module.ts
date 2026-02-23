import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { OllamaService } from "./ollama/ollama.service.js";
import { AuthService } from "./auth/auth.service.js";
import { OllamaTools } from "./ollama/ollama.tools.js";

export class AppModule {
  public readonly ollamaService: OllamaService;
  public readonly authService: AuthService;
  private readonly ollamaTools: OllamaTools;

  constructor() {
    this.ollamaService = new OllamaService();
    this.authService = new AuthService();
    this.ollamaTools = new OllamaTools(this.ollamaService, this.authService);
  }

  bootstrap(server: Server) {
    this.ollamaTools.register(server);
    console.log("AppModule bootstrapped");
  }
}
