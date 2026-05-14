import type { Database } from "sqlite";
import type sqlite3 from "sqlite3";
import { createMemoriesTable } from "./memories.js";
import { createRelationsTable } from "./relations.js";
import { createSessionsTable } from "./sessions.js";
import { createSettingsTable } from "./settings.js";

export async function applySchemas(db: Database<sqlite3.Database, sqlite3.Statement>) {
	await createSessionsTable(db);
	await createMemoriesTable(db);
	await createRelationsTable(db);
	await createSettingsTable(db);
}
