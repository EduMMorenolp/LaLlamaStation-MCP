import type { OllamaService } from "../ollama/ollama.service.js";
import type { DatabaseService } from "./database.service.js";

export interface Memory {
	id: string;
	project: string;
	type: string;
	title: string;
	content: string;
	tags: string;
	sessionId?: string;
	createdAt: number;
	updatedAt: number;
	score?: number; // solo para resultados semánticos
}

export class MemoryService {
	// Usaremos nomic-embed-text por defecto para embeddings, es un estandar ligero en Ollama
	private embeddingModel = "nomic-embed-text";

	constructor(
		private readonly dbService: DatabaseService,
		private readonly ollamaService: OllamaService
	) {}

	setEmbeddingModel(model: string) {
		this.embeddingModel = model;
	}

	async saveMemory(
		project: string,
		type: string,
		title: string,
		content: string,
		tags?: string,
		sessionId?: string
	): Promise<Memory> {
		const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
		const now = Date.now();

		let vectorJson: string | null = null;
		try {
			// Generar vector embedding
			const embeddings = await this.ollamaService.embed(this.embeddingModel, `${title}\n${content}`);
			if (embeddings && embeddings.length > 0) {
				vectorJson = JSON.stringify(embeddings[0]);
			}
		} catch (err) {
			console.warn(
				"[MemoryService] Warning: Could not generate embeddings. Ensure embedding model is downloaded.",
				err
			);
		}

		const db = this.dbService.getDb();
		await db.run(
			`INSERT INTO memories (id, project, type, title, content, tags, sessionId, vector, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[id, project, type, title, content, tags || "", sessionId || null, vectorJson, now, now]
		);

		return { id, project, type, title, content, tags: tags || "", sessionId, createdAt: now, updatedAt: now };
	}

	async updateMemory(id: string, title?: string, content?: string, tags?: string): Promise<boolean> {
		const db = this.dbService.getDb();
		const memory = await this.getMemory(id);
		if (!memory) return false;

		const newTitle = title || memory.title;
		const newContent = content || memory.content;
		const newTags = tags || memory.tags;
		const now = Date.now();

		let vectorJson: string | null = null;
		if (title || content) {
			// Necesitamos regenerar el embedding si cambia el texto
			try {
				const embeddings = await this.ollamaService.embed(this.embeddingModel, `${newTitle}\n${newContent}`);
				if (embeddings && embeddings.length > 0) {
					vectorJson = JSON.stringify(embeddings[0]);
				}
			} catch (_err) {}
		}

		if (vectorJson) {
			await db.run(
				`UPDATE memories SET title = ?, content = ?, tags = ?, vector = ?, updatedAt = ? WHERE id = ?`,
				[newTitle, newContent, newTags, vectorJson, now, id]
			);
		} else {
			await db.run(`UPDATE memories SET title = ?, content = ?, tags = ?, updatedAt = ? WHERE id = ?`, [
				newTitle,
				newContent,
				newTags,
				now,
				id,
			]);
		}
		return true;
	}

	async deleteMemory(id: string): Promise<boolean> {
		const db = this.dbService.getDb();
		const res = await db.run(`DELETE FROM memories WHERE id = ?`, [id]);
		return (res.changes || 0) > 0;
	}

	async getMemory(id: string): Promise<Memory | undefined> {
		const db = this.dbService.getDb();
		const row = await db.get(
			`SELECT id, project, type, title, content, tags, createdAt, updatedAt FROM memories WHERE id = ?`,
			[id]
		);
		return row as Memory | undefined;
	}

	async searchMemories(
		query: string,
		project: string,
		mode: "lexical" | "semantic" | "hybrid" = "hybrid",
		limit: number = 10
	): Promise<Memory[]> {
		const db = this.dbService.getDb();

		if (mode === "lexical") {
			const rows = await db.all(
				`SELECT m.id, m.project, m.type, m.title, m.content, m.tags, m.createdAt, m.updatedAt 
                 FROM memories_fts f 
                 JOIN memories m ON f.id = m.id 
                 WHERE f.memories_fts MATCH ? AND m.project = ? 
                 ORDER BY rank LIMIT ?`,
				[`"${query}"*`, project, limit]
			);
			return rows as Memory[];
		}

		if (mode === "semantic" || mode === "hybrid") {
			let queryVector: number[] = [];
			try {
				const emb = await this.ollamaService.embed(this.embeddingModel, query);
				if (emb && emb.length > 0) queryVector = emb[0];
			} catch (err) {
				console.error("[MemoryService] Semantic search failed. Falling back to lexical.", err);
				if (mode === "hybrid") return this.searchMemories(query, project, "lexical", limit);
				return [];
			}

			if (queryVector.length === 0) return [];

			const allRows = await db.all(
				`SELECT id, project, type, title, content, tags, vector, createdAt, updatedAt 
                 FROM memories WHERE project = ? AND vector IS NOT NULL`,
				[project]
			);

			const results = allRows.map((row: any) => {
				const vec: number[] = JSON.parse(row.vector);
				const score = this.cosineSimilarity(queryVector, vec);
				return { ...row, vector: undefined, score } as Memory;
			});

			results.sort((a, b) => (b.score || 0) - (a.score || 0));
			return results.slice(0, limit);
		}

		return [];
	}

	async getContext(project: string, limit: number = 20): Promise<Memory[]> {
		const db = this.dbService.getDb();
		return await db.all(
			`SELECT id, project, type, title, content, tags, createdAt, updatedAt 
             FROM memories WHERE project = ? ORDER BY createdAt DESC LIMIT ?`,
			[project, limit]
		);
	}

	async getStats(project: string): Promise<any> {
		const db = this.dbService.getDb();
		const count = await db.get(`SELECT COUNT(*) as total FROM memories WHERE project = ?`, [project]);
		const types = await db.all(`SELECT type, COUNT(*) as count FROM memories WHERE project = ? GROUP BY type`, [
			project,
		]);
		return {
			total: count?.total || 0,
			types,
		};
	}

	async getTimeline(project: string, limit: number = 20): Promise<Memory[]> {
		const db = this.dbService.getDb();
		const rows = await db.all(
			`SELECT id, project, type, title, content, tags, createdAt, updatedAt 
             FROM memories WHERE project = ? ORDER BY createdAt ASC LIMIT ?`,
			[project, limit]
		);
		return rows as Memory[];
	}

	async startSession(project: string, name: string): Promise<string> {
		const db = this.dbService.getDb();
		const id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
		const now = Date.now();
		await db.run(`INSERT INTO sessions (id, project, name, createdAt) VALUES (?, ?, ?, ?)`, [
			id,
			project,
			name,
			now,
		]);
		return id;
	}

	async endSession(sessionId: string, summary: string): Promise<boolean> {
		const db = this.dbService.getDb();
		const now = Date.now();
		const res = await db.run(`UPDATE sessions SET summary = ?, endedAt = ? WHERE id = ?`, [
			summary,
			now,
			sessionId,
		]);
		return (res.changes || 0) > 0;
	}

	async suggestTags(model: string, title: string, content: string): Promise<string[]> {
		try {
			const prompt = `You are a taxonomy expert. Analyze this memory and provide exactly 3 to 5 comma-separated tags that categorize it well. Return ONLY the comma separated string, no markdown.\n\nTitle: ${title}\nContent: ${content}\nTags:`;
			const response = await this.ollamaService.generate(model, prompt, { temperature: 0.1, num_ctx: 1024 });
			return response
				.split(",")
				.map((t) => t.trim().toLowerCase())
				.filter(Boolean);
		} catch (e) {
			console.warn("[MemoryService] Failed to suggest tags", e);
			return ["ai", "memory"];
		}
	}

	async judgeConflicts(model: string, project: string, memoryId: string): Promise<any> {
		const target = await this.getMemory(memoryId);
		if (!target) return { error: "Memory not found" };

		const neighbors = await this.searchMemories(`${target.title} ${target.content}`, project, "semantic", 5);
		const filtered = neighbors.filter((n) => n.id !== memoryId);

		if (filtered.length === 0) return { conflict: false, reason: "No similar memories found for comparison." };

		try {
			const prompt = `Analyze if there is a conflict or contradiction between the TARGET memory and the EXISTING memories.
TARGET: [${target.type}] ${target.title} - ${target.content}
EXISTING:
${filtered.map((f) => `- [${f.type}] ${f.title} - ${f.content}`).join("\n")}

Does the target memory contradict the existing ones? Respond with YES or NO, followed by a brief explanation.`;
			const response = await this.ollamaService.generate(model, prompt, { temperature: 0.1, num_ctx: 2048 });
			const conflict = response.toLowerCase().includes("yes");
			return { conflict, reason: response };
		} catch (_e) {
			return { error: "LLM evaluation failed" };
		}
	}

	async getSessionSummary(sessionId: string): Promise<any> {
		const db = this.dbService.getDb();
		const session = await db.get(`SELECT * FROM sessions WHERE id = ?`, [sessionId]);
		if (!session) return { error: "Session not found" };
		const memories = await db.all(`SELECT * FROM memories WHERE sessionId = ?`, [sessionId]);
		return { session, memories_count: memories.length, memories };
	}

	async compareMemories(model: string, memAId: string, memBId: string): Promise<any> {
		const memA = await this.getMemory(memAId);
		const memB = await this.getMemory(memBId);

		if (!memA || !memB) return { error: "One or both memories not found" };

		try {
			const prompt = `Compare these two memories and provide a brief analysis of their relationship, similarities, and any differences.
Memory A: [${memA.type}] ${memA.title} - ${memA.content}
Memory B: [${memB.type}] ${memB.title} - ${memB.content}
Analysis:`;
			const analysis = await this.ollamaService.generate(model, prompt, { temperature: 0.1, num_ctx: 2048 });
			return { analysis, memA: memA.title, memB: memB.title };
		} catch (_e) {
			return { error: "LLM comparison failed" };
		}
	}

	private cosineSimilarity(A: number[], B: number[]): number {
		let dotproduct = 0;
		let mA = 0;
		let mB = 0;
		for (let i = 0; i < A.length; i++) {
			dotproduct += A[i] * B[i];
			mA += A[i] * A[i];
			mB += B[i] * B[i];
		}
		if (mA === 0 || mB === 0) return 0;
		return dotproduct / (Math.sqrt(mA) * Math.sqrt(mB));
	}
}
