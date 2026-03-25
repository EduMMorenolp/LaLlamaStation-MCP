import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Server as SocketServer } from "socket.io";
import { AuthService } from "./auth/auth.service.js";
import { OllamaService } from "./ollama/ollama.service.js";
import { OllamaTools } from "./ollama/ollama.tools.js";
import { SessionManager } from "./session/session.manager.js";

export class AppModule {
	public readonly ollamaService: OllamaService;
	public readonly authService: AuthService;
	public readonly sessionManager: SessionManager;
	private readonly ollamaTools: OllamaTools;

	constructor() {
		this.authService = new AuthService();
		this.ollamaService = new OllamaService();
		this.sessionManager = new SessionManager();
		this.ollamaTools = new OllamaTools(this.ollamaService, this.authService);
	}

	bootstrap(server: Server, io?: SocketServer) {
		if (io) this.ollamaService.setIo(io);
		this.ollamaTools.register(server);
		console.log("AppModule bootstrapped with WebSockets support");
	}
}
