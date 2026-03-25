# 🔌 Referencia de API — LaLlamaStation MCP

Base URL: `http://localhost:3000`

**Autenticación**: todos los endpoints (excepto `/sse` y `/messages`) requieren:
```http
x-api-key: tu_api_key
# o alternativamente:
Authorization: Bearer tu_api_key
```

---

## Endpoints de Estado y Telemetría

### `GET /api/status`
Retorna el estado completo del sistema.

**Response:**
```json
{
  "diskSpace": { "free": 874.7, "total": 931.5, "unit": "GB" },
  "loadedModels": [{ "name": "llama3.2:latest", "size": 2048 }],
  "ngrokInfo": { "url": "https://xxxx.ngrok.io", "active": true, "latency": 0 },
  "timestamp": "2026-03-10T05:13:29.000Z",
  "recentLogs": [{ "ip": "::ffff:172.18.0.1", "action": "GET /v1/models", "status": "Success", "timestamp": "..." }],
  "blacklistedIps": ["192.168.1.100"]
}
```

---

## Endpoints de Modelos

### `GET /v1/models`
Lista todos los modelos instalados (formato OpenAI).

**Response:**
```json
{
  "object": "list",
  "data": [
    { "id": "llama3.2:latest", "object": "model", "created": 1741585200, "owned_by": "ollama" }
  ]
}
```

### `POST /v1/chat/completions`
Inferencia de texto (formato OpenAI compatible).

**Body:**
```json
{
  "model": "llama3.2:latest",
  "messages": [{ "role": "user", "content": "Hola, ¿cómo estás?" }]
}
```

**Response:**
```json
{
  "id": "chatcmpl-1741585200000",
  "object": "chat.completion",
  "model": "llama3.2:latest",
  "choices": [{ "index": 0, "message": { "role": "assistant", "content": "¡Hola! ..." }, "finish_reason": "stop" }]
}
```

### `POST /api/pull`
Inicia la descarga de un modelo (async — progreso via WebSocket).

**Body:** `{ "model": "llama3.2:3b" }`
**Response:** `{ "message": "Pulling model llama3.2:3b started" }`

### `DELETE /api/models/:name`
Elimina un modelo instalado.

**Response:** `{ "message": "Model llama3.2:3b deleted" }`

### `POST /api/unload`
Descarga todos los modelos de la VRAM (libera memoria GPU).

**Response:** `{ "message": "VRAM freed successfully" }`

### `GET /api/search-models?q=query`
Busca modelos en la librería oficial de Ollama mediante scraping.

**Response:**
```json
{
  "models": [
    { "name": "llama3.2", "title": "Llama 3.2", "desc": "...", "tags": ["3B", "11B"], "pulls": "20M+" }
  ],
  "query": "llama",
  "source": "https://ollama.com/library?q=llama"
}
```

---

## Endpoints de Seguridad

### `POST /api/ban`
Añade una IP a la blacklist.

**Body:** `{ "ip": "192.168.1.100" }`
**Response:** `{ "message": "IP 192.168.1.100 banned" }`

### `POST /api/unban`
Elimina una IP de la blacklist.

**Body:** `{ "ip": "192.168.1.100" }`
**Response:** `{ "message": "IP 192.168.1.100 unbanned" }`

---

## Endpoints de Ngrok

### `GET /api/ngrok/status`
Estado actual del contenedor ngrok.

**Response:**
```json
{ "running": true, "url": "https://xxxx.ngrok.io" }
// o si está apagado:
{ "running": false, "url": null }
```

### `POST /api/ngrok/start`
Inicia el contenedor ngrok.

**Response:** `{ "message": "Ngrok iniciado", "running": true }`

### `POST /api/ngrok/stop`
Detiene el contenedor ngrok.

**Response:** `{ "message": "Ngrok detenido", "running": false }`

---

## Endpoints de Mantenimiento

### `POST /api/clean`
Purga archivos temporales y descargas huérfanas.

**Response:** `{ "message": "Workspace cleaned", "freed": 1.23 }`

---

## Protocolo MCP (SSE)

Para integración con Claude Desktop u otros clientes MCP:

### `GET /sse`
Abre una conexión SSE (Server-Sent Events) para el protocolo MCP.

### `POST /messages`
Envía mensajes MCP al servidor (usado internamente por el SDK).

---

## WebSockets (Socket.io)

El frontend se conecta a `ws://localhost:3000` y escucha los siguientes eventos:

| Evento | Payload | Descripción |
|---|---|---|
| `pull-progress` | `{ model, percent, status }` | Progreso de descarga de modelo |
| `security-alert` | `{ type, ip, message }` | Alerta de seguridad (ban, intento, etc.) |
| `new-access` | `{ ip, action, status, timestamp }` | Nueva solicitud registrada |

---

## Códigos de Error Comunes

| Código | Causa |
|---|---|
| `401 Unauthorized` | API Key inválida o ausente |
| `403 Forbidden` | IP en blacklist |
| `429 Too Many Requests` | Rate limit alcanzado (5000 req/15min) |
| `500 Internal Server Error` | Error del servidor (ver logs con `docker logs mcp-server-app`) |
