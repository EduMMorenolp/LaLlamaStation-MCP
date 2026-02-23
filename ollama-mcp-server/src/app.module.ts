import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { OllamaService } from "./ollama/ollama.service.js";
import { AuthService } from "./auth/auth.service.js";
import { OllamaTools } from "./ollama/ollama.tools.js";

export class AppModule {
  private readonly ollamaService: OllamaService;
  private readonly authService: AuthService;
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
