import type { DatabaseService } from "../../database/connection.js";
import type { Template, TemplateVariable } from "./types.js";

export interface SaveTemplateInput {
	tool: string;
	type: string;
	name: string;
	description?: string;
	content: string;
	variables?: TemplateVariable[];
	output_path?: string;
}

function generateId(tool: string, type: string, name: string): string {
	const slug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
	return `${tool}-${type}-${slug}`;
}

export async function saveTemplate(
	dbService: DatabaseService,
	input: SaveTemplateInput,
): Promise<Template> {
	const db = dbService.getDb();
	const id = generateId(input.tool, input.type, input.name);
	const now = Date.now();
	const variables = JSON.stringify(input.variables ?? []);

	await dbService.enqueueWrite(async () => {
		await db.run(
			`INSERT INTO templates (id, tool, type, name, description, content, variables, output_path, is_seed, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
			id,
			input.tool,
			input.type,
			input.name,
			input.description ?? null,
			input.content,
			variables,
			input.output_path ?? null,
			now,
			now,
		);
	});

	return {
		id,
		tool: input.tool,
		type: input.type,
		name: input.name,
		description: input.description ?? null,
		content: input.content,
		variables: input.variables ?? [],
		output_path: input.output_path ?? null,
		is_seed: false,
		created_at: now,
		updated_at: now,
	};
}
