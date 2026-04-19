# Postman Collection

Coleccion completa de Postman con todos los 28 endpoints de la API de LaLlamaStation MCP.

## Contenido

- **28 endpoints** organizados en 10 carpetas tematicas
- **Variables de entorno** preconfiguradas (base_url, api_key, model)
- **Ejemplos de request/response** para cada endpoint
- **Autenticacion configurada** (x-api-key header)

## Como importar

### Opcion 1: Importar el archivo JSON

1. Abre Postman
2. Click en `Import` (parte superior izquierda)
3. Selecciona `Upload Files`
4. Elige el archivo `LaLlamaStation-MCP-Postman-Collection.json`
5. Click `Import`

### Opcion 2: Copiar/Pegar URL

Si el archivo esta en un servidor, tambien puedes:
1. Click `Import`
2. Pega la URL del archivo
3. Click `Import`

## Configuracion inicial

### 1. Variables de Entorno

La coleccion incluye 3 variables que puedes personalizar:

- **base_url**: `http://localhost:3000` (URL del backend)
- **api_key**: `mcp_test_key` (tu API key)
- **model**: `qwen3.5:4b` (modelo por defecto)

Para cambiar las variables:

**Opcion A - Global (para toda la coleccion)**:
1. Click en el icono de ojo (arriba a la derecha) → `Globals`
2. Busca las variables
3. Modifica los valores

**Opcion B - Por cada request**:
1. En cada request, ve a `Params` o `Body`
2. Reemplaza manualmente los valores

### 2. Autenticacion

Todos los endpoints usan autenticacion por header:

```
x-api-key: {{api_key}}
```

Cambia el valor de `{{api_key}}` en las variables si tu clave es diferente.

## Carpetas de endpoints

### 1. Models (OpenAI Compatible)
- `GET /v1/models` - Listar modelos (formato OpenAI)
- `GET /api/models` - Listar modelos (con detalles)

### 2. Chat & Completions
- `POST /v1/chat/completions` - Chat NO-STREAMING
- `POST /v1/chat/completions` - Chat STREAMING

### 3. Status & Monitoring
- `GET /api/status/fast` - Estado rapido
- `GET /api/status/full` - Estado completo
- `GET /api/status` - Estado general
- `GET /api/metrics/performance` - Metricas de rendimiento
- `GET /api/engine-stats` - Estadisticas del motor

### 4. Model Management
- `POST /api/pull` - Descargar modelo
- `DELETE /api/models/:name` - Eliminar modelo
- `POST /api/unload` - Descargar todos los modelos de VRAM
- `POST /api/clean` - Limpiar cache
- `GET /api/search-models?q=...` - Buscar modelos

### 5. Hardware Management
- `GET /api/hardware` - Info de hardware
- `POST /api/hardware/auto-unload` - Configurar auto-unload
- `POST /api/hardware/num-ctx` - Establecer contexto

### 6. Engine Configuration
- `POST /api/engine-stats/electricity-rate` - Tarifa de electricidad
- `POST /api/engine-stats/cloud-price` - Precio de referencia cloud

### 7. Ollama Service Control
- `POST /api/ollama/start` - Iniciar Ollama
- `POST /api/ollama/stop` - Detener Ollama
- `POST /api/ollama/restart` - Reiniciar Ollama

### 8. Security & Access Control
- `POST /api/ban` - Agregar IP a blacklist
- `POST /api/unban` - Remover IP de blacklist

### 9. ngrok Tunnel Management
- `GET /api/ngrok/status` - Estado del tunel
- `POST /api/ngrok/start` - Iniciar tunel
- `POST /api/ngrok/stop` - Detener tunel

### 10. MCP Protocol
- `GET /sse` - Conexion SSE para MCP
- `POST /messages` - Enviar mensaje MCP

## Ejemplos de uso

### Ejemplo 1: Listar modelos

```
GET http://localhost:3000/v1/models
Header: x-api-key: mcp_test_key
```

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

### Ejemplo 2: Chat NO-STREAMING

```
POST http://localhost:3000/v1/chat/completions
Header: x-api-key: mcp_test_key
Header: Content-Type: application/json

Body:
{
  "model": "qwen3.5:4b",
  "messages": [
    {
      "role": "user",
      "content": "Hola, como te llamas?"
    }
  ],
  "stream": false,
  "temperature": 0.7,
  "num_ctx": 2048
}
```

**Respuesta**:
```json
{
  "id": "chatcmpl-xyz",
  "object": "text_completion",
  "created": 1234567890,
  "model": "qwen3.5:4b",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 45,
    "total_tokens": 55
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Soy un asistente de IA creado por Ollama."
      },
      "finish_reason": "stop"
    }
  ]
}
```

### Ejemplo 3: Chat STREAMING

```
POST http://localhost:3000/v1/chat/completions
Header: x-api-key: mcp_test_key
Header: Content-Type: application/json

Body:
{
  "model": "qwen3.5:4b",
  "messages": [
    {
      "role": "user",
      "content": "Explica brevemente Machine Learning"
    }
  ],
  "stream": true
}
```

**Respuesta** (Server-Sent Events):
```
data: {"choices":[{"delta":{"content":"Machine"}}],"model":"qwen3.5:4b"}

data: {"choices":[{"delta":{"content":" Learning"}}],"model":"qwen3.5:4b"}

data: [DONE]
```

### Ejemplo 4: Estado rapido

```
GET http://localhost:3000/api/status/fast
Header: x-api-key: mcp_test_key
```

**Respuesta**:
```json
{
  "ollamaRunning": true,
  "diskSpace": {
    "total": 1099511627776,
    "used": 549755813888,
    "available": 549755813888
  },
  "gpu": {
    "gpuUtil": 45.2,
    "powerDraw": 120,
    "temp": 62
  },
  "vram": {
    "used": 8589934592
  },
  "loadedModels": ["qwen3.5:4b"],
  "engineStats": {
    "requests": 156,
    "avgLatency": 450,
    "maxLatency": 2100
  }
}
```

### Ejemplo 5: Descargar modelo

```
POST http://localhost:3000/api/pull
Header: x-api-key: mcp_test_key
Header: Content-Type: application/json

Body:
{
  "model": "llama3"
}
```

**Respuesta**:
```json
{
  "status": "pulling",
  "model": "llama3"
}
```

## Autenticacion

Todos los endpoints requieren autenticacion. Tienes 2 opciones:

### Opcion 1: x-api-key header
```
curl -H "x-api-key: mcp_test_key" http://localhost:3000/v1/models
```

### Opcion 2: Authorization Bearer
```
curl -H "Authorization: Bearer mcp_test_key" http://localhost:3000/v1/models
```

## Rate Limiting

La API tiene rate limiting configurado:
- **15,000 requests** por **15 minutos**
- Los endpoints locales (127.0.0.1) y con API key valida estan exentos

## Streaming

Para endpoints que soportan streaming (como `/v1/chat/completions`):
- Establece `"stream": true` en el body
- La respuesta sera en formato SSE (Server-Sent Events)
- Los chunks estaran separados por `data: {...}\n\n`
- La respuesta termina con `data: [DONE]\n\n`

## Troubleshooting

### Problema: "Unauthorized: Invalid API Key"

**Solucion**:
1. Verifica que el header `x-api-key` este presente
2. Verifica que la API key sea correcta
3. Comprueba que el servidor esta corriendo (`docker-compose up`)

### Problema: "Connection refused"

**Solucion**:
1. Verifica que el backend esta corriendo: `docker compose ps`
2. Comprueba que el puerto 3000 es correcto
3. Si usas ngrok, usa la URL publica en lugar de localhost

### Problema: "CORS error"

**Solucion**:
- El CORS esta habilitado por defecto
- Si sigues viendo errores, comprueba el header `Origin`

## Notas

- La coleccion usa variables Postman (`{{base_url}}`, `{{api_key}}`, `{{model}}`)
- Puedes crear environments para dev/prod
- Todos los requests tienen ejemplos de body y response
- Para streaming, Postman mostrara los chunks en tiempo real

---

**Version**: 1.0.0  
**Fecha**: 19 de abril de 2026  
**Endpoints**: 28  
**Autenticacion**: x-api-key
