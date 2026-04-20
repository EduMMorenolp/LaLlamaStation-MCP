import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { AuthService } from "../auth/auth.service.js";
import type { OllamaService } from "./ollama.service.js";

type ChatMessage = {
	role: "user" | "assistant" | "system";
	content: string;
};

const InferenceOptionsSchema = z.object({
	temperature: z.number().min(0).max(2).optional(),
	num_ctx: z.number().min(128).max(131072).optional(),
	top_p: z.number().min(0).max(1).optional(),
	top_k: z.number().min(0).max(100).optional(),
});

export const MCP_TOOL_CATALOG = [
	{ name: "list_models", description: "List installed Ollama models" },
	{ name: "pull_model", description: "Download a new model from Ollama library" },
	{ name: "generate", description: "Generate a response for a prompt" },
	{ name: "chat", description: "Send a chat message to a model" },
	{ name: "unload_models", description: "Unload all models from VRAM (Free GPU)" },
	{ name: "get_server_status", description: "Get Ollama server telemetry (VRAM, Disk, Ngrok)" },
	{ name: "delete_model", description: "Delete a model from disk to free space" },
] as const;

const MCP_TOOL_NAMES = new Set(MCP_TOOL_CATALOG.map((tool) => tool.name));

export class OllamaTools {
	constructor(
		private readonly ollamaService: OllamaService,
		private readonly authService: AuthService
	) {}

	register(server: Server) {
		// 1. List Tools
		server.setRequestHandler(ListToolsRequestSchema, async () => {
			const requireApiKey = this.authService.isMcpAuthEnabled();
			const authProps = {
				apiKey: {
					type: "string",
					description: "API Key for authentication",
				},
			};
			const availableTools = [
					{
						name: "list_models",
						description: "List installed Ollama models",
						inputSchema: {
							type: "object",
							properties: {
								...authProps,
							},
							required: requireApiKey ? ["apiKey"] : [],
						},
					},
					{
						name: "pull_model",
						description: "Download a new model from Ollama library",
						inputSchema: {
							type: "object",
							properties: {
								model: {
									type: "string",
									description: "Name of the model to pull (e.g., llama3)",
								},
								...authProps,
							},
							required: requireApiKey ? ["model", "apiKey"] : ["model"],
						},
					},
					{
						name: "generate",
						description: "Generate a response for a prompt",
						inputSchema: {
							type: "object",
							properties: {
								model: { type: "string" },
								prompt: { type: "string" },
								...authProps,
								temperature: { type: "number", minimum: 0, maximum: 2 },
								num_ctx: { type: "number", minimum: 128 },
								keep_alive: { type: "string" },
							},
							required: requireApiKey ? ["model", "prompt", "apiKey"] : ["model", "prompt"],
						},
					},
					{
						name: "chat",
						description: "Send a chat message to a model",
						inputSchema: {
							type: "object",
							properties: {
								model: { type: "string" },
								messages: {
									type: "array",
									items: {
										type: "object",
										properties: {
											role: { type: "string" },
											content: { type: "string" },
										},
									},
								},
								...authProps,
								temperature: { type: "number", minimum: 0, maximum: 2 },
								num_ctx: { type: "number", minimum: 128 },
								session_id: { type: "string" },
								keep_alive: { type: "string" },
							},
							required: requireApiKey
								? ["model", "messages", "apiKey"]
								: ["model", "messages"],
						},
					},
					{
						name: "unload_models",
						description: "Unload all models from VRAM (Free GPU)",
						inputSchema: {
							type: "object",
							properties: {
								...authProps,
							},
							required: requireApiKey ? ["apiKey"] : [],
						},
					},
					{
						name: "get_server_status",
						description: "Get Ollama server telemetry (VRAM, Disk, Ngrok)",
						inputSchema: {
							type: "object",
							properties: {
								...authProps,
							},
							required: requireApiKey ? ["apiKey"] : [],
						},
					},
					{
						name: "delete_model",
						description: "Delete a model from disk to free space",
						inputSchema: {
							type: "object",
							properties: {
								model: { type: "string" },
								...authProps,
							},
							required: requireApiKey ? ["model", "apiKey"] : ["model"],
						},
					},
					];

				return {
					tools: availableTools.filter((tool) => this.authService.isMcpToolEnabled(tool.name)),
				};
		});

		// 2. Call Tools
		server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const params = request.params as { name: string; arguments?: Record<string, unknown> };
			const { name, arguments: args } = params;
			const ip = "MCP-Client";

			if (!MCP_TOOL_NAMES.has(name as any)) {
				throw new Error(`Tool ${name} not found`);
			}

			if (!this.authService.isMcpToolEnabled(name)) {
				throw new Error(`Tool ${name} is disabled by administrator`);
			}

			// Global Auth Check (solo cuando MCP auth esta activa)
			if (this.authService.isMcpAuthEnabled() && !this.authService.validate(args?.apiKey as string)) {
				this.ollamaService.logRequest(ip, `Tool: ${name}`, "Unauthorized");
				this.ollamaService.reportFailedAuth(ip);
				throw new Error("Invalid API Key");
			}

			this.ollamaService.logRequest(ip, `Tool: ${name}`, "Success");

			try {
				switch (name) {
					case "list_models": {
						const models = await this.ollamaService.listModels();
						return {
							content: [{ type: "text", text: JSON.stringify(models, null, 2) }],
						};
					}

					case "pull_model":
						await this.ollamaService.pullModel(args?.model as string);
						return {
							content: [
								{
									type: "text",
									text: `Model ${args?.model} pull initiated/completed successfully.`,
								},
							],
						};

					case "generate": {
						const options = InferenceOptionsSchema.parse({
							temperature: args?.temperature,
							num_ctx: args?.num_ctx,
						});
						const genResponse = await this.ollamaService.generate(
							args?.model as string,
							args?.prompt as string,
							options,
							args?.keep_alive as string | number
						);
						return {
							content: [{ type: "text", text: genResponse }],
						};
					}

					case "chat": {
						const options = InferenceOptionsSchema.parse({
							temperature: args?.temperature,
							num_ctx: args?.num_ctx,
						});
						const chatResponse = await this.ollamaService.chat(
							args?.model as string,
							args?.messages as any[],
							options,
							args?.keep_alive as string | number,
							args?.session_id as string
						);
						return {
							content: [{ type: "text", text: chatResponse?.message?.content || "" }],
						};
					}

					case "unload_models":
						await this.ollamaService.unloadModels();
						return {
							content: [{ type: "text", text: "All models unloaded from VRAM successfully." }],
						};

					case "get_server_status": {
						const status = await this.ollamaService.getServerStatus();
						return {
							content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
						};
					}

					case "delete_model":
						await this.ollamaService.deleteModel(args?.model as string);
						return {
							content: [{ type: "text", text: `Model ${args?.model} deleted successfully.` }],
						};

					default:
						throw new Error(`Tool ${name} not found`);
				}
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : "Unknown error";
				return {
					content: [{ type: "text", text: `Error: ${message}` }],
					isError: true,
				};
			}
		});
	}
}
