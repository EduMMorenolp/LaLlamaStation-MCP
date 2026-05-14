import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { DatabaseService } from "../database/connection.js";
import { analysis, memories, sessions } from "../services/index.js";

export async function startMcpServer(dbService: DatabaseService) {
	const mcpServer = new Server(
		{
			name: "lallamastation-brain",
			version: "1.0.0",
		},
		{
			capabilities: { tools: {} },
			instructions: `Engram provides persistent memory that survives across sessions and compactions.

CORE TOOLS (always available):
  mem_save — save decisions, bugs, discoveries, conventions PROACTIVELY (do not wait to be asked)
  mem_search — find past work, decisions, or context from previous sessions
  mem_context — get recent session history
  mem_session_summary — save end-of-session summary (MANDATORY before saying "done")
  mem_get_observation — get full untruncated content of a search result by ID
  mem_save_prompt — save user prompt for context
  mem_current_project — detect current project from cwd (recommended first call)

DEFERRED TOOLS:
  mem_update, mem_suggest_topic_key, mem_session_start, mem_session_end, mem_stats, mem_delete, mem_timeline, mem_capture_passive

PROACTIVE SAVE RULE: Call mem_save immediately after ANY decision, bug fix, discovery, or convention — not just when asked.

## CONFLICT SURFACING — when mem_save returns candidates

After every mem_save call, check the response for judgment_required.

IF judgment_required IS TRUE:
  Iterate candidates[] and call mem_judge once per candidate using the judgment_id from that candidate entry.

  HEURISTIC — when to ask the user vs. resolve autonomously:
  ASK the user when confidence is below 0.7, OR the relation is supersedes/conflicts_with AND type is architecture/policy/decision.
  RESOLVE silently when confidence >= 0.7 AND relation is not supersedes/conflicts_with.`,
		} as { capabilities: { tools: Record<string, unknown> }; instructions: string }
	);

	let currentProject: string | null = null;

	mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
				{
					name: "mem_save",
					description: `Save an important observation to persistent memory. Call this PROACTIVELY after completing significant work — don't wait to be asked.

ALWAYS provide your identity in the 'agent' field (e.g., 'Cursor / Claude 3.5 Sonnet', 'Antigravity / Gemini 2.5 Flash', 'OpenCode AI', 'RooCode / Cline').

WHEN to save (call this after each of these):
- Architectural decisions or tradeoffs
- Bug fixes (what was wrong, why, how you fixed it)
- New patterns or conventions established
- Configuration changes or environment setup
- Important discoveries or gotchas
- File structure changes

FORMAT for content — use this structured format:
  **What**: [concise description of what was done]
  **Why**: [the reasoning, user request, or problem that drove it]
  **Where**: [files/paths affected]
  **Learned**: [any gotchas, edge cases, or decisions made — omit if none]

TITLE should be short and searchable, like: "JWT auth middleware", "Fixed N+1 query"`,
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							type: { type: "string" },
							title: { type: "string" },
							content: { type: "string" },
							tags: { type: "string" },
							topic_key: { type: "string" },
							agent: {
								type: "string",
								description:
									"Name of the AI Model or IDE making this change (e.g. Cursor, Claude Code, RooCode, Antigravity, OpenCode AI)",
							},
						},
						required: ["project", "type", "title", "content"],
					},
				},
				{
					name: "mem_save_prompt",
					description:
						"Save a user prompt to persistent memory. Use this to record what the user asked — their intent, questions, and requests — so future sessions have context about the user's goals.",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							content: { type: "string" },
							sessionId: { type: "string" },
						},
						required: ["project", "content"],
					},
				},
				{
					name: "mem_capture_passive",
					description: `Extract and save structured learnings from text output. Use this at the end of a task to capture knowledge automatically. The tool looks for sections like "## Key Learnings:" and extracts items.`,
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							content: { type: "string" },
							sessionId: { type: "string" },
						},
						required: ["project", "content"],
					},
				},
				{
					name: "mem_suggest_topic_key",
					description:
						"Suggest a stable topic_key for memory upserts. Use this before mem_save when you want evolving topics (like architecture decisions) to update a single observation over time.",
					inputSchema: {
						type: "object",
						properties: {
							title: { type: "string" },
							type: { type: "string" },
						},
						required: ["title"],
					},
				},
				{
					name: "mem_update",
					description: "Update an existing memory",
					inputSchema: {
						type: "object",
						properties: {
							id: { type: "string" },
							title: { type: "string" },
							content: { type: "string" },
							tags: { type: "string" },
							topic_key: { type: "string" },
						},
						required: ["id"],
					},
				},
				{
					name: "mem_delete",
					description: "Delete a memory",
					inputSchema: {
						type: "object",
						properties: { id: { type: "string" } },
						required: ["id"],
					},
				},
				{
					name: "mem_search",
					description: "Search memories using lexical or semantic hybrid search",
					inputSchema: {
						type: "object",
						properties: {
							query: { type: "string" },
							project: { type: "string" },
							mode: { type: "string", description: "lexical, semantic, hybrid" },
							limit: { type: "number" },
						},
						required: ["query", "project"],
					},
				},
				{
					name: "mem_context",
					description: "Get recent memories for a project",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" }, limit: { type: "number" } },
						required: ["project"],
					},
				},
				{
					name: "mem_timeline",
					description: "Get chronological timeline of memories",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" }, limit: { type: "number" } },
						required: ["project"],
					},
				},
				{
					name: "mem_session_start",
					description: "Start a new logical work session",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" }, name: { type: "string" } },
						required: ["project", "name"],
					},
				},
				{
					name: "mem_session_end",
					description: "End the work session and save summary",
					inputSchema: {
						type: "object",
						properties: { sessionId: { type: "string" }, summary: { type: "string" } },
						required: ["sessionId", "summary"],
					},
				},
				{
					name: "mem_session_summary",
					description: `Save a comprehensive end-of-session summary. Call this when a session is ending or when significant work is complete.
FORMAT — use this exact structure in the content field:
## Goal
[One sentence: what were we building/working on]
## Instructions
[User preferences, constraints, or context discovered]
## Discoveries
- [Technical finding, gotcha, or learning 1]
## Accomplished
- ✅ [Completed task 1]
## Next Steps
- [What remains to be done]
## Relevant Files
- path/to/file.ts — [what changed]`,
					inputSchema: {
						type: "object",
						properties: { sessionId: { type: "string" }, summary: { type: "string" } },
						required: ["sessionId", "summary"],
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
							model: { type: "string" },
						},
						required: ["memoryId1", "memoryId2", "model"],
					},
				},
				{
					name: "mem_stats",
					description: "Get statistics about the brain",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" } },
						required: ["project"],
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
							model: { type: "string" },
						},
						required: ["title", "content", "model"],
					},
				},
				{
					name: "mem_get_observation",
					description: "Retrieve a specific memory by ID",
					inputSchema: {
						type: "object",
						properties: { id: { type: "string" } },
						required: ["id"],
					},
				},
				{
					name: "mem_current_project",
					description: "Set or get the active project",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" } },
					},
				},
				{
					name: "mem_judge",
					description: `Record a verdict on a pending memory conflict surfaced by mem_save.
WHEN TO CALL: After mem_save returns judgment_required=true, iterate candidates[] and call mem_judge once per entry using that entry's judgment_id.
PARAMS:
  judgment_id (required) — from candidates[].judgment_id in the mem_save response
  relation    (required) — one of: related, compatible, scoped, conflicts_with, supersedes, not_conflict
  reason      (optional) — free-text explanation of the verdict`,
					inputSchema: {
						type: "object",
						properties: {
							judgment_id: { type: "string" },
							relation: { type: "string" },
							reason: { type: "string" },
						},
						required: ["judgment_id", "relation"],
					},
				},
			],
		};
	});

	mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;
		try {
			switch (name) {
				case "mem_save": {
					const agentName = (args?.agent as string) || "Agente Autónomo MCP";
					const res = await memories.saveMemory(
						dbService,
						args?.project as string,
						args?.type as string,
						args?.title as string,
						args?.content as string,
						args?.tags as string,
						undefined,
						args?.topic_key as string,
						undefined,
						agentName
					);
					return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
				}
				case "mem_save_prompt": {
					const memory = await memories.saveMemory(
						dbService,
						args?.project as string,
						"prompt",
						"User Prompt",
						args?.content as string,
						"prompt",
						args?.sessionId as string
					);
					return { content: [{ type: "text", text: `Prompt saved successfully. ID: ${memory.memory.id}` }] };
				}
				case "mem_capture_passive": {
					const content = args?.content as string;
					const learnings: string[] = [];
					const matches = content.match(/## Key Learnings:[\s\S]*?(?=\n## |$)/i);
					if (matches) {
						const lines = matches[0]
							.split("\n")
							.filter((l: string) => l.trim().startsWith("-") || /^\d+\./.test(l.trim()));
						learnings.push(...lines);
					}
					if (learnings.length === 0) return { content: [{ type: "text", text: "No key learnings found." }] };

					for (const l of learnings) {
						await memories.saveMemory(
							dbService,
							args?.project as string,
							"learning",
							"Passive Learning",
							l,
							"passive",
							args?.sessionId as string
						);
					}
					return { content: [{ type: "text", text: `Captured ${learnings.length} learnings.` }] };
				}
				case "mem_suggest_topic_key": {
					const title = args?.title as string;
					const type = (args?.type as string) || "general";
					const slug = title
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-")
						.replace(/(^-|-$)+/g, "");
					return { content: [{ type: "text", text: `${type}/${slug}` }] };
				}
				case "mem_update": {
					const success = await memories.updateMemory(
						dbService,
						args?.id as string,
						args?.title as string,
						args?.content as string,
						args?.tags as string,
						args?.topic_key as string
					);
					return { content: [{ type: "text", text: success ? "Memory updated." : "Memory not found." }] };
				}
				case "mem_delete": {
					const success = await memories.deleteMemory(dbService, args?.id as string);
					return { content: [{ type: "text", text: success ? "Memory deleted." : "Memory not found." }] };
				}
				case "mem_search": {
					const mems = await memories.searchMemories(
						dbService,
						args?.query as string,
						args?.project as string,
						(args?.mode as "lexical" | "semantic" | "hybrid" | undefined) || "hybrid",
						(args?.limit as number) || 10
					);
					return { content: [{ type: "text", text: JSON.stringify(mems, null, 2) }] };
				}
				case "mem_context": {
					const mems = await memories.getContext(
						dbService,
						args?.project as string,
						(args?.limit as number) || 20
					);
					return { content: [{ type: "text", text: JSON.stringify(mems, null, 2) }] };
				}
				case "mem_get_observation": {
					const memory = await memories.getMemory(dbService, args?.id as string);
					return {
						content: [{ type: "text", text: memory ? JSON.stringify(memory, null, 2) : "Not found" }],
					};
				}
				case "mem_current_project": {
					if (args?.project) {
						currentProject = args.project as string;
						return { content: [{ type: "text", text: `Active project set to: ${currentProject}` }] };
					}
					return {
						content: [
							{
								type: "text",
								text: currentProject ? `Active project: ${currentProject}` : "No active project set.",
							},
						],
					};
				}
				case "mem_session_start": {
					const id = await sessions.startSession(dbService, args?.project as string, args?.name as string);
					return { content: [{ type: "text", text: `Session started. ID: ${id}` }] };
				}
				case "mem_session_end": {
					const success = await sessions.endSession(
						dbService,
						args?.sessionId as string,
						args?.summary as string
					);
					return {
						content: [
							{ type: "text", text: success ? "Session ended and summarized." : "Session not found." },
						],
					};
				}
				case "mem_session_summary": {
					const summary = await sessions.getSessionSummary(dbService, args?.sessionId as string);
					return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
				}
				case "mem_timeline": {
					const timeline = await memories.getTimeline(
						dbService,
						args?.project as string,
						(args?.limit as number) || 20
					);
					return { content: [{ type: "text", text: JSON.stringify(timeline, null, 2) }] };
				}
				case "mem_suggest_tags": {
					try {
						const tags = await analysis.suggestTags(
							args?.model as string,
							args?.title as string,
							args?.content as string
						);
						return { content: [{ type: "text", text: tags.join(", ") }] };
					} catch {
						return {
							content: [
								{
									type: "text",
									text: "OLLAMA_UNAVAILABLE: Por favor, genera las etiquetas tú mismo basándote en tu propia comprensión del texto y luego invoca la herramienta de guardado nuevamente con esas etiquetas.",
								},
							],
						};
					}
				}
				case "mem_judge": {
					const success = await analysis.judge(
						dbService,
						args?.judgment_id as string,
						args?.relation as string,
						args?.reason as string
					);
					return {
						content: [
							{ type: "text", text: success ? "Judgment recorded." : "Failed to record judgment." },
						],
					};
				}
				case "mem_compare": {
					try {
						const comparison = await analysis.compareMemories(
							dbService,
							args?.model as string,
							args?.memoryId1 as string,
							args?.memoryId2 as string
						);
						return { content: [{ type: "text", text: JSON.stringify(comparison, null, 2) }] };
					} catch (e: unknown) {
						const message = e instanceof Error ? e.message : String(e);
						if (message.includes("not found")) {
							return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
						}
						return {
							content: [
								{
									type: "text",
									text: "OLLAMA_UNAVAILABLE: Por favor, usa mem_get_observation para leer ambas memorias en tu contexto y compáralas tú mismo utilizando tus propias capacidades de razonamiento.",
								},
							],
						};
					}
				}
				case "mem_stats": {
					const stats = await memories.getStats(dbService, args?.project as string);
					return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
				}
				default:
					return { content: [{ type: "text", text: `Tool ${name} implemented but handler missing.` }] };
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
		}
	});

	const transport = new StdioServerTransport();
	await mcpServer.connect(transport);
	console.error(`[Brain MCP] MCP Server running on Stdio`);
}
