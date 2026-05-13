import * as fs from "node:fs";
import * as path from "node:path";
import { type Database, open } from "sqlite";
import sqlite3 from "sqlite3";

export class DatabaseService {
	private db!: Database<sqlite3.Database, sqlite3.Statement>;

	public async initialize(): Promise<void> {
		// Guardar la base de datos dentro del mismo mcp-brain para portabilidad
		const brainDir = path.resolve(process.cwd(), "data");
		if (!fs.existsSync(brainDir)) {
			fs.mkdirSync(brainDir, { recursive: true });
			console.log(`[Database] Created brain directory at ${brainDir}`);
		}

		const dbPath = path.join(brainDir, "lallama-memory.db");

		this.db = await open({
			filename: dbPath,
			driver: sqlite3.Database,
		});

		await this.createTables();

		// Colores ANSI
		const cyan = "\x1b[36m";
		const yellow = "\x1b[33m";
		const green = "\x1b[32m";
		const reset = "\x1b[0m";

		console.log(`
        ${green}✅ Database Connection Established${reset}
        -----------------------------------
        ${yellow}Type:${reset}     ${cyan}SQLite3 (FTS5 Enabled)${reset}
        ${yellow}File:${reset}     ${cyan}${dbPath}${reset}
        ${yellow}Modo:${reset}     ${cyan}${process.env.NODE_ENV || "development"}${reset}
        -----------------------------------
        `);
	}

	private async createTables(): Promise<void> {
		await this.db.exec(`
			CREATE TABLE IF NOT EXISTS sessions (
				id TEXT PRIMARY KEY,
				project TEXT NOT NULL,
				name TEXT,
				summary TEXT,
				createdAt INTEGER NOT NULL,
				endedAt INTEGER
			);

			CREATE TABLE IF NOT EXISTS memories (
				id TEXT PRIMARY KEY,
				project TEXT NOT NULL,
				type TEXT NOT NULL,
				title TEXT NOT NULL,
				content TEXT NOT NULL,
				tags TEXT,
				sessionId TEXT,
				vector TEXT, -- JSON array of floats for embeddings
				createdAt INTEGER NOT NULL,
				updatedAt INTEGER NOT NULL,
				FOREIGN KEY (sessionId) REFERENCES sessions (id)
			);

			-- FTS5 table for lexical search
			CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
				id UNINDEXED,
				title,
				content,
				tags,
				content='memories',
				content_rowid='rowid'
			);

			-- Triggers to keep FTS table in sync
			CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
				INSERT INTO memories_fts(rowid, id, title, content, tags) 
				VALUES (new.rowid, new.id, new.title, new.content, new.tags);
			END;
			
			CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
				INSERT INTO memories_fts(memories_fts, rowid, id, title, content, tags) 
				VALUES ('delete', old.rowid, old.id, old.title, old.content, old.tags);
			END;

			CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
				INSERT INTO memories_fts(memories_fts, rowid, id, title, content, tags) 
				VALUES ('delete', old.rowid, old.id, old.title, old.content, old.tags);
				INSERT INTO memories_fts(rowid, id, title, content, tags) 
				VALUES (new.rowid, new.id, new.title, new.content, new.tags);
			END;
		`);
	}

	public getDb(): Database<sqlite3.Database, sqlite3.Statement> {
		if (!this.db) {
			throw new Error("Database not initialized. Call initialize() first.");
		}
		return this.db;
	}
}
