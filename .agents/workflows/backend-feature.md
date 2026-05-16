---
description: Workflow para implementar una nueva ruta o funcionalidad en el backend (Express 4 + TypeScript). Seguir en orden.
---

# Workflow — Implementar en Backend

## PASO 1 — Buscar contexto previo

```
mem_search(query: "<tema de la ruta>", project: "lallamaollama", mode: "hybrid")
```

Verificar si la funcionalidad ya existe o si hay decisiones previas que afectan el diseño.

---

## PASO 2 — Identificar dónde agregar

Abrir `backend/src/main.ts` y ubicar la sección correcta por dominio:

| Dominio | Buscar en main.ts |
|---------|-------------------|
| Modelos Ollama | `// Rutas de Compatibilidad OpenAI` |
| Telemetría / Estado | `// --- Endpoints de Telemetría` |
| Auth | `// --- Auth Settings` |
| Hardware | `// --- Hardware Sentinel` |
| Engine/Stats | `// --- AI Engine Tuner` |
| Ngrok | `// --- Control de Ngrok` |
| Ollama Motor | `// --- Control de Ollama Motor` |
| Brain | `// --- Control de Cerebro MCP` |
| Nuevo dominio | Agregar bloque comentado al final |

---

## PASO 3 — Implementar la ruta

```typescript
// Patrón obligatorio:
app.<method>("/api/<ruta>", authMiddleware, async (req, res) => {
    try {
        const result = await appModule.ollamaService.<método>(/*params*/);
        res.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: message });
    }
});
```

**Reglas de implementación:**
- `authMiddleware` SIEMPRE como segundo argumento
- Usar `Dockerode` para operaciones de contenedores (nunca `exec`)
- Si requiere emit a frontend: `io.emit("evento", { dato })`
- Parámetros de body con tipado explícito: `const { campo } = req.body as { campo: string }`

---

## PASO 4 — Si es una nueva MCP Tool (opcional)

Si la funcionalidad también debe exponerse como MCP Tool:
1. Agregar la definición al array `MCP_TOOL_CATALOG` en `ollama/ollama.tools.ts`
2. Agregar handler en `ollama.service.ts` si necesita lógica nueva

---

## PASO 5 — Verificar con Biome

```bash
npx biome check backend/
```

Corregir cualquier error antes de continuar.

---

## PASO 6 — Verificar TypeScript

```bash
cd backend && npm run build
```

Código 0 = OK.

---

## PASO 7 — Actualizar Postman Collection

Abrir `postman-collection/LaLlamaOllama-Postman-Collection.json` y agregar:
- La nueva request en la carpeta correcta
- Headers: `x-api-key: {{API_KEY}}`
- URL: `{{BASE_URL}}/api/<ruta>`
- Body example si es POST/PUT

Ver workflow `postman.md` para el proceso detallado.

---

## PASO 8 — Guardar en el cerebro

```
mem_save(
    project: "lallamaollama",
    type: "feature",
    title: "Nueva ruta: <METHOD> /api/<ruta>",
    agent: "Antigravity / Claude Sonnet",
    content: """
        **What**: <qué hace la ruta>
        **Why**: <por qué se necesita>
        **Where**: backend/src/main.ts L<número>
        **Learned**: <cualquier gotcha o decisión>
    """
)
```
