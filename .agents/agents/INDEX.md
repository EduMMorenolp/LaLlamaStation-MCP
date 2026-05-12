# Índice de Agentes Especializados — LaLlamaStation MCP

Catálogo de agentes con triggers de activación automática y manual.

| Agente | Activar por archivos | Activar por tarea |
|--------|---------------------|-------------------|
| [frontend-dev](./frontend-dev/AGENT.md) | `mcp-frontend/src/**/*.tsx`, `*.css`, `*.html` | componente, UI, estilo, frontend, vite, react |
| [backend-dev](./backend-dev/AGENT.md) | `ollama-mcp-server/src/**/*.ts` | ruta, API, auth, middleware, endpoint, servicio |
| [ollama-ops](./ollama-ops/AGENT.md) | `*ollama*`, `*model*`, `*gpu*` | modelo, inferencia, GPU, descarga, VRAM, stream |
| [documentation](./documentation/AGENT.md) | `*.md`, `obsidian-vault/**` | changelog, doc, readme, documentar, diseño |
| [docker-ops](./docker-ops/AGENT.md) | `*Dockerfile*`, `*docker-compose*`, `*.yml` | docker, contenedor, ngrok, deploy, compose |
| [qa-verification](./qa-verification/AGENT.md) | — | biome, lint, build, verificar, test, typecheck |

## Modo de activación híbrido

- **Automática**: Cuando trabajes con archivos que coincidan con los patrones de un agente, carga su AGENT.md como contexto adicional.
- **Manual**: Invoca cualquier agente escribiendo `@<nombre-agente>` (ej. `@docker-ops revisa la configuración de red`).
