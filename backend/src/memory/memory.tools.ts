import type { AuthService } from "../auth/auth.service.js";
import type { MemoryService } from "./memory.service.js";

export const MEMORY_TOOL_CATALOG = [
	{ name: "mem_save", description: "Save a new memory (decision, bugfix, learning)" },
	{ name: "mem_update", description: "Update an existing memory" },
	{ name: "mem_delete", description: "Delete a memory" },
	{ name: "mem_search", description: "Search memories using lexical or semantic hybrid search" },
	{ name: "mem_context", description: "Get recent memories for a project" },
	{ name: "mem_timeline", description: "Get chronological timeline of memories" },
	{ name: "mem_session_start", description: "Start a new logical work session" },
	{ name: "mem_session_end", description: "End the work session and save summary" },
	{ name: "mem_session_summary", description: "Get the summary of a specific session" },
	{ name: "mem_compare", description: "Compare two memories using local LLM" },
	{ name: "mem_stats", description: "Get statistics about the brain" },
	{ name: "mem_suggest_tags", description: "Get tag suggestions for a text" },
	{ name: "mem_get_observation", description: "Retrieve a specific memory by ID" },
	{ name: "mem_current_project", description: "Set or get the active project" },
	{ name: "mem_judge", description: "Evaluate conflicts between memories using local LLM" },
] as const;

export const MEMORY_TOOL_NAMES = new Set(MEMORY_TOOL_CATALOG.map((tool) => tool.name));

export class MemoryTools {
	private currentProject: string | null = null;

	constructor(
		private readonly memoryService: MemoryService,
		private readonly authService: AuthService
	) {}

	/**
	 * Returns separate handlers for list and call that can be composed
	 * with other tool sets (e.g., Ollama tools) in a single registration.
	 */
	getToolHandlers() {
		const authService = this.authService;
		const memoryService = this.memoryService;
		const listToolsHandler = async () => {
			const requireApiKey = authService.isMcpAuthEnabled();
			const authProps = {
				apiKey: { type: "string", description: "API Key for authentication" },
			};

			const availableTools = [
				{
					name: "mem_save",
					description: "Save a new memory (decision, bugfix, learning)",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string", description: "Project name (e.g. lallamastation)" },
							type: {
								type: "string",
								description: "Type of memory (decision, bugfix, learning, architecture, rule)",
							},
							title: { type: "string", description: "Short title" },
							content: { type: "string", description: "Detailed explanation" },
							tags: { type: "string", description: "Comma separated tags" },
							...authProps,
						},
						required: requireApiKey
							? ["project", "type", "title", "content", "apiKey"]
							: ["project", "type", "title", "content"],
					},
				},
				{
					name: "mem_update",
					description: "Update an existing memory",
					inputSchema: {
						type: "object",
						properties: {
							id: { type: "string", description: "Memory ID" },
							title: { type: "string" },
							content: { type: "string" },
							tags: { type: "string" },
							...authProps,
						},
						required: requireApiKey ? ["id", "apiKey"] : ["id"],
					},
				},
				{
					name: "mem_delete",
					description: "Delete a memory",
					inputSchema: {
						type: "object",
						properties: {
							id: { type: "string", description: "Memory ID" },
							...authProps,
						},
						required: requireApiKey ? ["id", "apiKey"] : ["id"],
					},
				},
				{
					name: "mem_search",
					description: "Search memories using lexical or semantic hybrid search",
					inputSchema: {
						type: "object",
						properties: {
							query: { type: "string", description: "Search query" },
							project: { type: "string", description: "Project to search within" },
							mode: {
								type: "string",
								description: "Search mode: 'lexical', 'semantic', or 'hybrid' (default)",
							},
							limit: { type: "number" },
							...authProps,
						},
						required: requireApiKey ? ["query", "project", "apiKey"] : ["query", "project"],
					},
				},
				{
					name: "mem_context",
					description: "Get recent memories for a project",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							limit: { type: "number" },
							...authProps,
						},
						required: requireApiKey ? ["project", "apiKey"] : ["project"],
					},
				},
				{
					name: "mem_get_observation",
					description: "Retrieve a specific memory by ID",
					inputSchema: {
						type: "object",
						properties: {
							id: { type: "string" },
							...authProps,
						},
						required: requireApiKey ? ["id", "apiKey"] : ["id"],
					},
				},
				{
					name: "mem_current_project",
					description: "Set or get the active project",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string", description: "Optional project name to set" },
							...authProps,
						},
						required: requireApiKey ? ["apiKey"] : [],
					},
				},
				{
					name: "mem_session_start",
					description: "Start a new logical work session",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							name: { type: "string", description: "Session name or goal" },
							...authProps,
						},
						required: requireApiKey ? ["project", "name", "apiKey"] : ["project", "name"],
					},
				},
				{
					name: "mem_session_end",
					description: "End the work session and save summary",
					inputSchema: {
						type: "object",
						properties: {
							sessionId: { type: "string" },
							summary: { type: "string" },
							...authProps,
						},
						required: requireApiKey ? ["sessionId", "summary", "apiKey"] : ["sessionId", "summary"],
					},
				},
				{
					name: "mem_timeline",
					description: "Get chronological timeline of memories",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							limit: { type: "number" },
							...authProps,
						},
						required: requireApiKey ? ["project", "apiKey"] : ["project"],
					},
				},
				{
					name: "mem_suggest_tags",
					description: "Get tag suggestions for a text",
					inputSchema: {
						type: "object",
						properties: {
							title: { type: "string" },
							content: { type: "string" },
							model: { type: "string", description: "Local model to use (e.g. llama3)" },
							...authProps,
						},
						required: requireApiKey
							? ["title", "content", "model", "apiKey"]
							: ["title", "content", "model"],
					},
				},
				{
					name: "mem_judge",
					description: "Evaluate conflicts between memories using local LLM",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							memoryId: { type: "string" },
							model: { type: "string", description: "Local model to use (e.g. llama3)" },
							...authProps,
						},
						required: requireApiKey
							? ["project", "memoryId", "model", "apiKey"]
							: ["project", "memoryId", "model"],
					},
				},
				{
					name: "mem_session_summary",
					description: "Get the summary of a specific session",
					inputSchema: {
						type: "object",
						properties: {
							sessionId: { type: "string" },
							...authProps,
						},
						required: requireApiKey ? ["sessionId", "apiKey"] : ["sessionId"],
					},
				},
				{
					name: "mem_compare",
					description: "Compare two memories using local LLM",
					inputSchema: {
						type: "object",
						properties: {
							memoryId1: { type: "string" },
							memoryId2: { type: "string" },
							model: { type: "string", description: "Local model to use (e.g. llama3)" },
							...authProps,
						},
						required: requireApiKey
							? ["memoryId1", "memoryId2", "model", "apiKey"]
							: ["memoryId1", "memoryId2", "model"],
					},
				},
				{
					name: "mem_stats",
					description: "Get statistics about the brain",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							...authProps,
						},
						required: requireApiKey ? ["project", "apiKey"] : ["project"],
					},
				},
			];

			return {
				tools: availableTools.filter((tool) => authService.isMcpToolEnabled(tool.name)),
			};
		};

		const callToolHandler = async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {
			const params = request.params as { name: string; arguments?: Record<string, unknown> };
			const { name, arguments: args } = params;

			if (!(MEMORY_TOOL_NAMES as Set<string>).has(name)) {
				throw new Error(`Tool ${name} not found`);
			}

			if (!authService.isMcpToolEnabled(name)) {
				throw new Error(`Tool ${name} is disabled`);
			}

			if (authService.isMcpAuthEnabled() && !authService.validate(args?.apiKey as string)) {
				throw new Error("Invalid API Key");
			}

			try {
				switch (name) {
					case "mem_save": {
						const memory = await memoryService.saveMemory(
							args?.project as string,
							args?.type as string,
							args?.title as string,
							args?.content as string,
							args?.tags as string
						);
						return { content: [{ type: "text", text: `Memory saved successfully. ID: ${memory.id}` }] };
					}
					case "mem_update": {
						const success = await memoryService.updateMemory(
							args?.id as string,
							args?.title as string,
							args?.content as string,
							args?.tags as string
						);
						return { content: [{ type: "text", text: success ? "Memory updated." : "Memory not found." }] };
					}
					case "mem_delete": {
						const success = await memoryService.deleteMemory(args?.id as string);
						return { content: [{ type: "text", text: success ? "Memory deleted." : "Memory not found." }] };
					}
					case "mem_search": {
						const memories = await memoryService.searchMemories(
							args?.query as string,
							args?.project as string,
							(args?.mode as "lexical" | "semantic" | "hybrid") || "hybrid",
							(args?.limit as number) || 10
						);
						return { content: [{ type: "text", text: JSON.stringify(memories, null, 2) }] };
					}
					case "mem_context": {
						const memories = await memoryService.getContext(
							args?.project as string,
							(args?.limit as number) || 20
						);
						return { content: [{ type: "text", text: JSON.stringify(memories, null, 2) }] };
					}
					case "mem_get_observation": {
						const memory = await memoryService.getMemory(args?.id as string);
						return {
							content: [{ type: "text", text: memory ? JSON.stringify(memory, null, 2) : "Not found" }],
						};
					}
					case "mem_current_project": {
						if (args?.project) {
							this.currentProject = args.project as string;
							return {
								content: [{ type: "text", text: `Active project set to: ${this.currentProject}` }],
							};
						}
						return {
							content: [
								{
									type: "text",
									text: this.currentProject
										? `Active project: ${this.currentProject}`
										: "No active project set.",
								},
							],
						};
					}
					case "mem_session_start": {
						const id = await memoryService.startSession(args?.project as string, args?.name as string);
						return { content: [{ type: "text", text: `Session started. ID: ${id}` }] };
					}
					case "mem_session_end": {
						const success = await memoryService.endSession(
							args?.sessionId as string,
							args?.summary as string
						);
						return {
							content: [
								{
									type: "text",
									text: success ? "Session ended and summarized." : "Session not found.",
								},
							],
						};
					}
					case "mem_session_summary": {
						const summary = await memoryService.getSessionSummary(args?.sessionId as string);
						return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
					}
					case "mem_timeline": {
						const timeline = await memoryService.getTimeline(
							args?.project as string,
							(args?.limit as number) || 20
						);
						return { content: [{ type: "text", text: JSON.stringify(timeline, null, 2) }] };
					}
					case "mem_suggest_tags": {
						const tags = await memoryService.suggestTags(
							args?.model as string,
							args?.title as string,
							args?.content as string
						);
						return { content: [{ type: "text", text: tags.join(", ") }] };
					}
					case "mem_judge": {
						const verdict = await memoryService.judgeConflicts(
							args?.model as string,
							args?.project as string,
							args?.memoryId as string
						);
						return { content: [{ type: "text", text: JSON.stringify(verdict, null, 2) }] };
					}
					case "mem_compare": {
						const comparison = await memoryService.compareMemories(
							args?.model as string,
							args?.memoryId1 as string,
							args?.memoryId2 as string
						);
						return { content: [{ type: "text", text: JSON.stringify(comparison, null, 2) }] };
					}
					case "mem_stats": {
						const stats = await memoryService.getStats(args?.project as string);
						return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
					}
					default:
						return { content: [{ type: "text", text: `Tool ${name} implemented but handler missing.` }] };
				}
			} catch (error: unknown) {
				return {
					content: [
						{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` },
					],
					isError: true,
				};
			}
		};

		return { listToolsHandler, callToolHandler };
	}
}
