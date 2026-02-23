import { Server } from "@modelcontextprotocol/sdk/server/index";
import { OllamaService } from "./ollama/ollama.service";
import { AuthService } from "./auth/auth.service";
import { OllamaTools } from "./ollama/ollama.tools";

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
