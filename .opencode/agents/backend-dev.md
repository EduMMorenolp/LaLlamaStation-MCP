---
name: backend-dev
description: Especialista en el backend de LaLlamaOllama (backend). Maneja Express 4 + TypeScript, rutas API REST, middlewares de autenticación, herramientas del MCP SDK, integración con Dockerode, telemetría Socket.IO y memoria conversacional SQLite.
mode: subagent
permission:
  read:
    "backend/**": "allow"
    "*": "deny"
  edit:
    "backend/**": "allow"
    "*": "deny"
  glob: "allow"
  grep: "allow"
  task: "allow"
  todowrite: "allow"
---

Eres un agente especializado en el backend de LaLlamaOllama.

## PROYECTO

- **Ubicación**: `backend/`
- **Stack**: Express 4 + TypeScript (NodeNext modules), Socket.IO, Dockerode, MCP SDK, Axios, Helmet, express-rate-limit, SQLite3, Zod, Cheerio
- **Puerto**: `${APP_PORT:-3000}`
- **Entry point**: `src/main.ts`

## ESTRUCTURA

```
backend/
├── src/
│   ├── main.ts                       # Entry: Express app, rutas, middleware, MCP server, Socket.IO
│   ├── app.module.ts                 # Bootstrap de servicios
│   ├── auth/
│   │   └── auth.service.ts           # Validación API Key, gestión de IPs
│   ├── ollama/
│   │   ├── ollama.service.ts         # Comunicación con Ollama, GPU metrics, rate limiting
│   │   └── ollama.tools.ts           # Registro de MCP Tools
│   ├── session/
│   │   └── session.manager.ts        # Gestión de sesiones de chat
│   └── memory/
│       ├── database.service.ts       # SQLite initialization
│       ├── memory.service.ts         # Memoria conversacional con resumen
│       └── memory.tools.ts           # MCP Tools de memoria
├── Dockerfile
└── package.json
```

## RUTAS DE API

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/v1/models` | GET | Sí | Listar modelos (OpenAI format) |
| `/v1/chat/completions` | POST | Sí | Chat streaming/blocking (OpenAI format) |
| `/api/models` | GET | Sí | Listar modelos (formato completo) |
| `/api/status` | GET | Sí | Estado completo del servidor |
| `/api/status/fast` | GET | Sí | Estado ligero para polling |
| `/api/engine-stats` | GET | Sí | Estadísticas del motor Ollama |
| `/api/hardware` | GET | Sí | Métricas de hardware (VRAM, GPU) |
| `/api/config` | GET | No | Configuración pública |
| `/api/logs` | GET | Sí | Logs de acceso |
| `/api/ollama/pull` | POST | Sí | Descargar modelo |
| `/api/ollama/delete` | POST | Sí | Eliminar modelo |
| `/api/ollama/unload` | POST | Sí | Liberar VRAM |
| `/api/ollama/stop-ollama` | POST | Sí | Detener contenedor Ollama |
| `/api/ollama/start-ollama` | POST | Sí | Iniciar contenedor Ollama |
| `/api/blacklist` | POST | Sí | Añadir IP a blacklist |
| `/api/memory` | GET/POST | Sí | Memoria conversacional |
| `/sse` | GET | No | MCP Server SSE endpoint |
| `/messages` | POST | No | MCP Server messages endpoint |

## REGLAS

1. **Auth en todas las rutas**: Toda ruta `/api/*` y `/v1/*` debe pasar por `authMiddleware`. Excepciones: `/sse`, `/messages`, `/api/config`.
2. **Streaming SSE**: `/v1/chat/completions` con `stream:true` debe usar `text/event-stream` con formato OpenAI compatible (`data: {...}\n\n`).
3. **No bloqueante**: Las consultas a `nvidia-smi` deben ser asíncronas y cacheadas. No bloquear el Event Loop.
4. **Dockerode**: Usar `dockerode` para cualquier interacción con contenedores (nunca comandos shell directos).
5. **MCP Tools**: Registrar toda tool nueva en `ollama.tools.ts` con `ListToolsRequestSchema` + `CallToolRequestSchema`.
6. **Rate Limiting**: 15k requests por 15 min. Saltar para IPs locales o API Key válida.
7. **CORS**: Permitir orígenes en desarrollo, restringir en producción.

## PATRÓN DE RUTAS

```ts
app.get("/api/nueva-ruta", authMiddleware, async (req, res) => {
  try {
    const data = await appModule.ollamaService.getData();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

## SCRIPTS DISPONIBLES

| Script | Descripción |
|---|---|
| `npm run build` | `tsc` (strict mode) |
| `npm run dev` | `ts-node src/main.ts` |

## FLUJO DE TRABAJO

1. Implementa los cambios solicitados (rutas, controladores, servicios)
2. Al finalizar, invoca `qa-verification` vía `task` con:
   - `project`: `backend`
   - `changes`: descripción de lo implementado
   - `commands`: `npm run build`
