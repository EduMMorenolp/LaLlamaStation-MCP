---
description: Workflow para agregar un nuevo use case, tabla, endpoint REST o tool MCP en mcp-brain. Seguir en orden.
---

# Workflow — Implementar en mcp-brain

## PASO 1 — Buscar contexto previo

```
mem_search(query: "<funcionalidad>", project: "lallamaollama", mode: "hybrid")
```

---

## PASO 2 — Identificar el tipo de cambio

### A) Nuevo use case (función de negocio)
→ Crear archivo en `services/<dominio>/<verboX>.ts`

### B) Nueva tabla SQLite
→ Crear `database/schemas/<nombre>.ts` + registrar en `schemas/index.ts`

### C) Nuevo endpoint REST
→ Modificar `server/api.ts`

### D) Nueva tool MCP
→ Modificar `server/mcp.ts` (dos secciones: definición + handler)

---

## WORKFLOW A — Nuevo Use Case

**1. Crear el archivo:**
```typescript
// services/<dominio>/<verboNombre>.ts
import type { DatabaseService } from "../../database/connection.js";

export async function verboNombre(
    dbService: DatabaseService,
    // ...params
): Promise<ResultType> {
    const db = dbService.getDb();

    // Lectura directa:
    const rows = await db.all(`SELECT * FROM tabla WHERE campo = ?`, [valor]);

    // Escritura siempre con enqueueWrite:
    await dbService.enqueueWrite(async () => {
        await db.run(`INSERT INTO tabla (...) VALUES (?)`, [valor]);
    });

    return resultado;
}
```

**2. Exportar en el barrel:**
```typescript
// services/<dominio>/index.ts
export * from "./<verboNombre>.js";
```

---

## WORKFLOW B — Nueva Tabla SQLite

**1. Crear schema:**
```typescript
// database/schemas/<nombre>.ts
import type { Database } from "sqlite";
import type sqlite3 from "sqlite3";

export async function createXTable(db: Database<sqlite3.Database, sqlite3.Statement>) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS x (
            id          TEXT PRIMARY KEY,
            campo       TEXT NOT NULL,
            created_at  INTEGER NOT NULL,
            updated_at  INTEGER NOT NULL
        )
    `);

    // Migración segura de columnas existentes:
    const columns = await db.all("PRAGMA table_info(x)");
    const hasNuevo = columns.some((col: { name: string }) => col.name === "nuevo");
    if (!hasNuevo) {
        await db.exec("ALTER TABLE x ADD COLUMN nuevo TEXT;");
    }

    // Seeds (idempotentes):
    await db.run(
        `INSERT OR IGNORE INTO x (id, campo, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        "seed-id", "valor", Date.now(), Date.now()
    );
}
```

**2. Registrar en applySchemas:**
```typescript
// database/schemas/index.ts
import { createXTable } from "./x.js";

export async function applySchemas(db) {
    // ... schemas existentes ...
    await createXTable(db); // agregar al final
}
```

---

## WORKFLOW C — Nuevo Endpoint REST

```typescript
// En server/api.ts, dentro de la sección correcta:

app.get("/api/x", async (req, res) => {
    try {
        const result = await serviceName.listX(dbService);
        res.json(result);
    } catch (e: unknown) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});

app.post("/api/x", async (req, res) => {
    const { campo } = req.body;
    if (!campo) return res.status(400).json({ error: "campo es obligatorio" });
    try {
        const result = await serviceName.saveX(dbService, { campo });
        res.status(201).json(result);
    } catch (e: unknown) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
```

---

## WORKFLOW D — Nueva Tool MCP

**1. Definición (ListToolsRequestSchema handler):**
```typescript
{
    name: "nombre_tool",
    description: `Descripción clara para el modelo.
FLUJO: qué debe hacer el agente antes/después de llamar esta tool.`,
    inputSchema: {
        type: "object",
        properties: {
            campo: { type: "string", description: "Descripción del campo" },
        },
        required: ["campo"],
    },
},
```

**2. Handler (CallToolRequestSchema switch):**
```typescript
case "nombre_tool": {
    const campo = args?.campo as string;
    const result = await serviceName.funcionX(dbService, campo);
    response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    break;
}
```

**3. Si es read-only, agregar a READ_ONLY_TOOLS:**
```typescript
const READ_ONLY_TOOLS = new Set([
    // ... tools existentes ...
    "nombre_tool", // ← agregar aquí
]);
```

---

## PASO FINAL — Verificar y guardar

```bash
cd mcp-brain && npx tsc --noEmit
npx biome check mcp-brain/
```

```
mem_save(
    project: "lallamaollama",
    type: "feature",
    title: "<Use case / endpoint / tool>: <nombre>",
    agent: "Antigravity / Claude Sonnet",
    content: """
        **What**: <descripción>
        **Why**: <motivación>
        **Where**: <archivos modificados>
        **Learned**: <gotchas, patrones, edge cases>
    """
)
```
