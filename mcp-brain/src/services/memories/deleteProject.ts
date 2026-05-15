import type { DatabaseService } from "../../database/connection.js";

export interface DeleteProjectResult {
	deletedMemories: number;
	deletedDirectives: number;
}

export async function deleteProject(
	dbService: DatabaseService,
	project: string,
): Promise<DeleteProjectResult> {
	const db = dbService.getDb();
	let deletedMemories = 0;
	let deletedDirectives = 0;

	await dbService.enqueueWrite(async () => {
		const memoriesRes = await db.run(`DELETE FROM memories WHERE project = ?`, [project]);
		deletedMemories = memoriesRes.changes || 0;

		const directivesRes = await db.run(`DELETE FROM core_directives WHERE project = ?`, [project]);
		deletedDirectives = directivesRes.changes || 0;
	});

	return { deletedMemories, deletedDirectives };
}
