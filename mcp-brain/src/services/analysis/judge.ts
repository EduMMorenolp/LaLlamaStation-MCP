import type { DatabaseService } from "../../database/connection.js";

export async function judge(
	dbService: DatabaseService,
	judgmentId: string,
	relation: string,
	reason?: string
): Promise<boolean> {
	const parts = judgmentId.split(":");
	if (parts.length !== 2) return false;
	const [sourceId, targetId] = parts;
	const db = dbService.getDb();
	const id = `rel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

	await dbService.enqueueWrite(async () => {
		await db.run(
			`INSERT INTO relations (id, sourceId, targetId, relation, reason, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
			[id, sourceId, targetId, relation, reason || "", Date.now()]
		);
	});
	return true;
}
