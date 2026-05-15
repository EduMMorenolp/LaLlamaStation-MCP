---
trigger: always_on
glob:
description: Reglas específicas del proyecto LaLlamaOllama para el agente Antigravity. Complementan las reglas globales de GEMINI.md.
---

# Reglas del Proyecto — LaLlamaOllama

## CEREBRO MCP DE ESTE PROYECTO

- **Nombre del servidor**: `lallamaollama-brain`
- **Proyecto activo**: `lallamaollama`
- **API local (SSE)**: `http://192.168.0.236:3015/sse`
- **Docker stdio**: imagen `lallamaollama-mcp-brain`, datos en `./data/`

Siempre pasar `project: "lallamaollama"` en toda llamada al cerebro.

---

## ESTRUCTURA DEL PROYECTO

```
LaLlamaOllama/
├── backend/          → Express 4 + TypeScript, puerto 3016
├── frontend/         → React 19 + Vite 7, puerto 8080
├── mcp-brain/        → Cerebro MCP, puerto 3015
├── .opencode/agents/ → Agentes de OpenCode AI
├── .agents/          → Reglas y workflows de Antigravity (este directorio)
└── docker-compose.yml
```

## SERVICIOS DOCKER

| Servicio | Container | Puerto |
|----------|-----------|--------|
| `ollama` | `mcp-ollama-motor` | 11434 |
| `backend` | `backend` | 3016 |
| `mcp-brain` | `brain` | 3015 |
| `frontend` | `frontend` | 8080 |
| `ngrok` | `mcp-ngrok-tunnel` | — |

---

## REGLAS DE CÓDIGO

1. **Backend**: Express 4 + TypeScript NodeNext. Toda ruta `/api/*` requiere `authMiddleware`. Usar `Dockerode` (nunca comandos shell).
2. **Frontend**: React 19 + Vite 7. Estética Glassmorphism. Sin Redux — usar hooks + Context API.
3. **mcp-brain**: Arquitectura Use Case — cada función en su propio archivo bajo `services/`. Pasar `dbService` como parámetro (dependency injection).
4. **Linting**: Biome (`npx biome check .`) en la raíz. ESLint en frontend.
5. **Proyecto protegido**: El proyecto `"lallamasollama"` del cerebro NO puede eliminarse (403).

---

## TIPOS DE MEMORIA POR TAREA

| Tarea en este proyecto | `type` |
|------------------------|--------|
| Nueva ruta API en backend | `feature` |
| Nuevo componente React | `feature` |
| Fix en Docker/compose | `bug-fix` o `configuration` |
| Cambio en mcp-brain | `feature` o `architecture` |
| Entrada en CHANGELOG.md | `changelog` |
| Convención establecida | `convention` |
| Decisión de diseño UI | `architecture` |
