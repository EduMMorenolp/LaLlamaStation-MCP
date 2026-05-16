---
trigger: glob
glob: "backend/**"
description: Reglas específicas para trabajar en el backend de LaLlamaOllama (Express 4 + TypeScript NodeNext, puerto 3016).
---

# Reglas — Backend

## STACK

- **Runtime**: Node.js con TypeScript (`moduleResolution: NodeNext`)
- **Framework**: Express 4
- **Puerto**: 3016 (env `APP_PORT`)
- **Socket.IO**: para eventos en tiempo real hacia el frontend
- **Docker**: `Dockerode` para controlar contenedores (nunca `exec shell`)
- **Auth**: `x-api-key` header o `Authorization: Bearer <key>`

## ESTRUCTURA

```
backend/src/
├── main.ts              → Punto de entrada, TODAS las rutas Express, Socket.IO
├── app.module.ts        → AppModule — instancia OllamaService, AuthService, SessionManager
├── auth/
│   └── auth.service.ts  → validate(key), isOllamaAuthEnabled(), getMcpToolPermissions()
├── ollama/
│   ├── ollama.service.ts → chat(), chatStream(), listModels(), pullModel(), etc.
│   └── ollama.tools.ts   → MCP_TOOL_CATALOG (array de tool definitions)
└── session/
    └── session.manager.ts → Gestión de sesiones por socket
```

## REGLAS CRÍTICAS

### Autenticación
- **TODAS** las rutas `/api/*` y `/v1/*` deben tener `authMiddleware`
- El middleware lee `x-api-key` o `Authorization: Bearer <key>`
- IPs locales y claves válidas **bypass** el rate limiter
- IPs blacklisted → 403 antes del auth check

### Rutas API existentes
```
GET  /api/models              → lista modelos locales
GET  /api/status/fast         → estado rápido (sin GPU/ngrok)
GET  /api/status/full         → estado completo
GET  /api/hardware            → VRAM + auto-unload + num_ctx
GET  /api/engine-stats        → stats + métricas GPU
GET  /api/ngrok/status        → estado del túnel
GET  /api/ngrok/config        → config ngrok
GET  /api/search-models       → scraper ollama.com/library
GET  /api/auth/settings       → config auth
GET  /api/auth/mcp/tools      → tools MCP habilitadas
GET  /api/ip-logs             → logs de accesos

POST /v1/chat/completions     → chat (stream o no stream)
POST /api/pull                → descargar modelo
POST /api/unload              → liberar VRAM
POST /api/ban                 → blacklist IP
POST /api/unban               → quitar IP de blacklist
POST /api/ollama/start|stop|restart → control motor Ollama
POST /api/ngrok/start|stop|authtoken → control ngrok
POST /api/brain/start|stop    → control mcp-brain
POST /api/hardware/auto-unload → config auto-unload
POST /api/hardware/num-ctx    → config contexto global

DELETE /api/models/:name      → eliminar modelo
```

### Agregar una nueva ruta
1. Buscar la sección correcta en `main.ts` (agrupadas por dominio)
2. Agregar SIEMPRE `authMiddleware` como segundo argumento
3. Usar `try/catch` con tipado: `error instanceof Error ? error.message : String(error)`
4. Emitir via Socket.IO si es una operación que el frontend necesita en tiempo real:
   ```typescript
   io.emit("evento", { dato });
   ```

### Docker (Dockerode)
```typescript
// CORRECTO
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const container = docker.getContainer("container-name");
await container.start();

// INCORRECTO — nunca usar:
exec("docker start container-name")
```

### MCP Tool Catalog (`ollama.tools.ts`)
- Agregar toda tool nueva al array `MCP_TOOL_CATALOG`
- El catalog es la fuente de verdad para `/api/auth/mcp/tools`

## VERIFICACIÓN

```bash
cd backend && npm run build
```

Debe terminar con código 0 sin errores TypeScript.
