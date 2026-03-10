# 🏛️ Arquitectura del Sistema — LaLlamaStation MCP

## Visión General

LaLlamaStation MCP es una plataforma de administración local para modelos de lenguaje que corre completamente en infraestructura propia, sin dependencias de APIs externas de pago.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE / BROWSER                        │
│   Dashboard Web (React)      Claude Desktop / LibreChat         │
└────────────────┬──────────────────────┬────────────────────────-┘
                 │ HTTP / WS            │ SSE / HTTP
                 ▼                      ▼
┌───────────────────────────────────────────────────────────────┐
│                    mcp-server-app :3000                       │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Auth Layer  │  │  Rate Limit  │  │  Security Middleware│  │
│  │  (API Key)   │  │  5000req/15m │  │  IP Blacklist      │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   Express Router                         │  │
│  │  GET  /api/status          POST /api/pull               │  │
│  │  POST /api/ban/unban       DELETE /api/models/:name     │  │
│  │  POST /api/ngrok/start     GET  /api/search-models      │  │
│  │  GET  /api/ngrok/status    POST /api/ngrok/stop         │  │
│  │  POST /v1/chat/completions GET  /v1/models  (OpenAI)    │  │
│  │  GET  /sse                 POST /messages   (MCP)       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────┐  ┌─────────────────────────────────┐  │
│  │   OllamaService   │  │        Socket.io Server         │  │
│  │  - listModels()   │  │  - pull_progress event          │  │
│  │  - chat()         │  │  - security_alert event         │  │
│  │  - pullModel()    │  │  - new_access event             │  │
│  │  - deleteModel()  │  └─────────────────────────────────┘  │
│  │  - getStatus()    │                                        │
│  │  - banIp()        │  ┌─────────────────────────────────┐  │
│  └─────────┬─────────┘  │       Dockerode Client          │  │
│            │            │  - ngrok container start/stop   │  │
│            │            └──────────────┬──────────────────┘  │
└───────────-┼───────────────────────────┼────────────────────-─┘
             │ HTTP :11434               │ /var/run/docker.sock
             ▼                           ▼
┌─────────────────────┐      ┌──────────────────────┐
│  mcp-ollama-motor   │      │   Docker Engine       │
│  (Ollama :11434)    │      │   (Host)              │
│  - pull / delete    │      │   - mcp-ngrok-tunnel  │
│  - generate / chat  │      └──────────────────────┘
│  - ps / tags        │
└─────────────────────┘
             │
             ▼
      [Modelos en disco]
      /root/.ollama/models
      (volumen Docker persistente)
```

---

## Componentes

### `mcp-server-app` (Backend)

| Módulo | Responsabilidad |
|---|---|
| `main.ts` | Entry point, Express, rutas REST |
| `app.module.ts` | Bootstrap del servidor MCP |
| `auth/auth.service.ts` | Validación de API Key |
| `ollama/ollama.service.ts` | Comunicación con Ollama, logs, blacklist |

**Tecnologías**: Node.js 20, TypeScript, Express, Socket.io, Helmet, express-rate-limit, Dockerode, Cheerio, Zod

### `mcp-frontend-app` (Frontend)

| Componente | Responsabilidad |
|---|---|
| `App.tsx` | Estado global, routing, auth |
| `Telemetry.tsx` | KPIs en tiempo real + toggle ngrok |
| `ModelList.tsx` | Discover + gestión de modelos instalados |
| `ChatPlayground.tsx` | Terminal de inferencia |
| `SecurityPanel.tsx` | Blacklist de IPs + botón pánico |
| `IpLogs.tsx` | Auditoría de accesos con filtros |

**Tecnologías**: React 19, Vite 7, TypeScript, Socket.io-client, Axios, Lucide React

---

## Flujos de Datos

### Detección de intruso (auto-ban)
```
Request entrante
    → securityMiddleware (chequea blacklist)
    → authMiddleware (valida API Key)
    → Si falla: reportFailedAuth(ip)
    → Si >= 5 intentos: banIp(ip) + emit "security_alert"
    → Frontend recibe alerta via WebSocket
```

### Descarga de modelo
```
Usuario click "DESCARGAR"
    → POST /api/pull { model: "llama3.2" }
    → OllamaService.pullModel() [async, no bloquea]
    → Stream de progreso recibido de Ollama
    → emit "pull_progress" via Socket.io
    → Frontend actualiza barra de progreso en tiempo real
```

### Control de Ngrok
```
Usuario click "START" en Telemetry
    → POST /api/ngrok/start
    → dockerode.getContainer("mcp-ngrok-tunnel").start()
    → Esperar 3s
    → GET /api/ngrok/status → axios.get("mcp-ngrok-tunnel:4040/api/tunnels")
    → Retornar URL pública al frontend
```

---

## Seguridad

| Capa | Implementación |
|---|---|
| **Transporte** | Ngrok TLS (opcional), localhost por defecto |
| **Autenticación** | API Key via header `x-api-key` o `Authorization: Bearer` |
| **Rate Limiting** | 5000 req/15min (express-rate-limit) |
| **Headers HTTP** | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| **Blacklist** | In-memory Set, auto-ban a los 5 intentos fallidos |
| **IP Tracking** | Header `x-forwarded-for` para clientes detrás de ngrok |

> **Nota de producción**: para uso en redes públicas, considera agregar HTTPS (certbot + nginx reverse proxy) y mover la blacklist a Redis para persistencia entre reinicios.

---

## Variables de Entorno

| Variable | Default | Descripción |
|---|---|---|
| `API_KEY` | `super-secret-mcp-key` | Clave de acceso al servidor |
| `APP_PORT` | `3000` | Puerto del servidor MCP |
| `OLLAMA_URL` | `http://ollama:11434` | URL interna del motor Ollama |
| `NGROK_AUTHTOKEN` | — | Token de autenticación de ngrok |
| `NGROK_CONTAINER_NAME` | `mcp-ngrok-tunnel` | Nombre del contenedor ngrok a controlar |
