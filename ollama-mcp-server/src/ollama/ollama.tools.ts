import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { AuthService } from "../auth/auth.service.js";
import type { OllamaService } from "./ollama.service.js";

const InferenceOptionsSchema = z.object({
	temperature: z.number().min(0).max(2).optional(),
	num_ctx: z.number().min(128).max(131072).optional(),
	top_p: z.number().min(0).max(1).optional(),
	top_k: z.number().min(0).max(100).optional(),
});

export class OllamaTools {
	constructor(
		private readonly ollamaService: OllamaService,
		private readonly authService: AuthService
	) {}

	register(server: Server) {
		// 1. List Tools
		server.setRequestHandler(ListToolsRequestSchema, async () => {
			return {
				tools: [
					{
						name: "list_models",
						description: "List installed Ollama models",
						inputSchema: {
							type: "object",
							properties: {
								apiKey: {
									type: "string",
									description: "API Key for authentication",
								},
							},
							required: ["apiKey"],
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
								apiKey: {
									type: "string",
									description: "API Key for authentication",
								},
							},
							required: ["model", "apiKey"],
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
								apiKey: { type: "string" },
								temperature: { type: "number", minimum: 0, maximum: 2 },
								num_ctx: { type: "number", minimum: 128 },
								keep_alive: { type: "string" },
							},
							required: ["model", "prompt", "apiKey"],
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
								apiKey: { type: "string" },
								temperature: { type: "number", minimum: 0, maximum: 2 },
								num_ctx: { type: "number", minimum: 128 },
								session_id: { type: "string" },
								keep_alive: { type: "string" },
							},
							required: ["model", "messages", "apiKey"],
						},
					},
					{
						name: "unload_models",
						description: "Unload all models from VRAM (Free GPU)",
						inputSchema: {
							type: "object",
							properties: {
								apiKey: { type: "string" },
							},
							required: ["apiKey"],
						},
					},
					{
						name: "get_server_status",
						description: "Get Ollama server telemetry (VRAM, Disk, Ngrok)",
						inputSchema: {
							type: "object",
							properties: {
								apiKey: { type: "string" },
							},
							required: ["apiKey"],
						},
					},
					{
						name: "delete_model",
						description: "Delete a model from disk to free space",
						inputSchema: {
							type: "object",
							properties: {
								model: { type: "string" },
								apiKey: { type: "string" },
							},
							required: ["model", "apiKey"],
						},
					},
				],
			};
		});

		// 2. Call Tools
		server.setRequestHandler(CallToolRequestSchema, async (request: Record<string, unknown>) => {
			const { name, arguments: args } = request.params;
			const ip = "MCP-Client";

			// Global Auth Check
			if (!this.authService.validate(args?.apiKey as string)) {
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
							content: [{ type: "text", text: chatResponse.content }],
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
			} catch (error: any) {
				return {
					content: [{ type: "text", text: `Error: ${error.message}` }],
					isError: true,
				};
			}
		});
	}
}
