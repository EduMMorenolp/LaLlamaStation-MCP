import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server as SocketServer } from "socket.io";
import { AuthService } from "./auth/auth.service.js";
import { DatabaseService } from "./memory/database.service.js";
import { MemoryService } from "./memory/memory.service.js";
import { MEMORY_TOOL_CATALOG, MEMORY_TOOL_NAMES, MemoryTools } from "./memory/memory.tools.js";
import { OllamaService } from "./ollama/ollama.service.js";
import { MCP_TOOL_CATALOG, MCP_TOOL_NAMES, OllamaTools } from "./ollama/ollama.tools.js";
import { SessionManager } from "./session/session.manager.js";

export class AppModule {
	public readonly ollamaService: OllamaService;
	public readonly authService: AuthService;
	public readonly sessionManager: SessionManager;
	private readonly ollamaTools: OllamaTools;
	private readonly memoryTools: MemoryTools;
	private readonly memoryService: MemoryService;
	private readonly dbService: DatabaseService;

	constructor() {
		this.authService = new AuthService();
		this.authService.setKnownMcpTools([
			...MCP_TOOL_CATALOG.map((tool) => tool.name),
			...MEMORY_TOOL_CATALOG.map((tool) => tool.name),
		]);
		this.ollamaService = new OllamaService();
		this.sessionManager = new SessionManager();
		this.dbService = new DatabaseService();
		this.memoryService = new MemoryService(this.dbService, this.ollamaService);
		this.ollamaTools = new OllamaTools(this.ollamaService, this.authService);
		this.memoryTools = new MemoryTools(this.memoryService, this.authService);
	}

	async bootstrap(server: Server, io?: SocketServer) {
		if (io) this.ollamaService.setIo(io);

		await this.dbService.initialize();

		const ollamaHandlers = this.ollamaTools.getToolHandlers();
		const memoryHandlers = this.memoryTools.getToolHandlers();

		// Combined list tools handler: merges both tool catalogs
		server.setRequestHandler(ListToolsRequestSchema, async () => {
			const [ollamaResult, memoryResult] = await Promise.all([
				ollamaHandlers.listToolsHandler(),
				memoryHandlers.listToolsHandler(),
			]);
			return {
				tools: [...(ollamaResult.tools || []), ...(memoryResult.tools || [])],
			};
		});

		// Combined call tool handler: routes by tool name
		server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const params = request.params as { name: string; arguments?: Record<string, unknown> };
			const { name } = params;

			if (MCP_TOOL_NAMES.has(name as any)) {
				return ollamaHandlers.callToolHandler(request);
			}

			if (MEMORY_TOOL_NAMES.has(name as any)) {
				return memoryHandlers.callToolHandler(request);
			}

			throw new Error(`Tool ${name} not found`);
		});

		console.log("AppModule bootstrapped with combined MCP tools (Ollama + Memory)");
	}
}
