# Backend API REST

**Base URL local**: `http://localhost:3000`

## Autenticacin
Todos los endpoints requieren una API key. Enva una de estas opciones:
- Header: `x-api-key: TU_API_KEY`
- Header: `Authorization: Bearer TU_API_KEY`

Ejemplo:
```bash
curl -H "x-api-key: mcp_clave_123" http://localhost:3000/v1/models
```

## Endpoints OpenAI-compatible

### GET /v1/models
Lista modelos instalados en formato OpenAI.

**Respuesta**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "qwen3.5:4b",
      "object": "model",
      "created": 1234567890,
      "owned_by": "ollama"
    }
  ]
}
```

### POST /v1/chat/completions
Enva un prompt y recibe respuesta.

**Modo no-streaming** (`stream=false`):
```json
{
  "model": "qwen3.5:4b",
  "messages": [{"role": "user", "content": "hola"}],
  "stream": false,
  "temperature": 0.7,
  "num_ctx": 2048,
  "top_p": 0.9,
  "top_k": 50
}
```

**Modo streaming** (`stream=true`):
- Respuesta en formato SSE (Server-Sent Events)
- Chunks separados por `data: {...}\n\n`
- Final con `data: [DONE]\n\n`

Soporta:
- `temperature` (0-2, default 0.7)
- `num_ctx` (contexto en tokens)
- `top_p`, `top_k` (parmetros muestreo)

## Endpoints de estado

### GET /api/status/fast
Respuesta rpida para polling de UI (bajo costo).

**Campos**:
- `ollamaRunning`: boolean
- `diskSpace`: { total, used, available }
- `gpu.gpuUtil`: porcentaje de uso
- `gpu.powerDraw`: watts
- `gpu.temp`: grados celsius
- `vram.used`: bytes
- `loadedModels`: string[]
- `engineStats`: { requests, avgLatency, ... }

### GET /api/status/full
Estado completo (costoso, incluye todos los campos).

### GET /api/status
Backward-compatible (actualmente retorna estado completo).

## Endpoints de gestin de modelos

### GET /api/models
Lista modelos con detalles.

### POST /api/pull
Descargar modelo.
```json
{ "model": "llama3" }
```

### DELETE /api/models/:name
Eliminar modelo.

### POST /api/unload
Descargar todos los modelos de VRAM.

### POST /api/clean
Limpiar cach de Ollama.

## Endpoints de seguridad

### POST /api/ban
Banear IP.
```json
{ "ip": "192.168.1.100" }
```

### POST /api/unban
Desbanear IP.

## Endpoints de hardware

### GET /api/hardware
Estado actual (VRAM, auto-unload, contexto global).

### POST /api/hardware/auto-unload
Configura descarga automtica de modelos.
```json
{ "minutes": 5 }
```
(0 = desactivado)

### POST /api/hardware/num-ctx
Configura contexto global.
```json
{ "numCtx": 4096 }
```

## Endpoints de performance

### GET /api/engine-stats
Estadsticas del motor (TTFT, tokens/sec, histricas).

### GET /api/metrics/performance
Mtricas calculadas (promedio, percentil 95, mximo).

### POST /api/engine-stats/electricity-rate
Tarifa de electricidad (ARS/kWh).

### POST /api/engine-stats/cloud-price
Precio cloud (USD per 1M tokens).

## Endpoints de ngrok

### GET /api/ngrok/status
Estado del tnel.

### POST /api/ngrok/start
Iniciar tnel.

### POST /api/ngrok/stop
Detener tnel.

## Endpoints de control Ollama

### POST /api/ollama/start
Iniciar contenedor Ollama.

### POST /api/ollama/stop
Detener contenedor Ollama.

### POST /api/ollama/restart
Reiniciar contenedor Ollama.

## Scraper de modelos

### GET /api/search-models?q=...
Buscar modelos en ollama.com/library (ej: `?q=qwen`).

## Siguiente lectura
- [[Indice-Backend| Volver a Backend]]
- [[MCP|MCP Protocol]]
- [[Seguridad|Capas de Seguridad]]


