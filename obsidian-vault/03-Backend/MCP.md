# Backend MCP (Model Context Protocol)

## Visin general
MCP es un protocolo que permite a LLMs externos (como Claude Desktop) invocar tools definidos en nuestro servidor.

## Endpoints MCP

### GET /sse
Abre conexin SSE para recibir mensajes MCP.

**Autenticacin requerida**:
- `x-api-key: TU_API_KEY`
- `Authorization: Bearer TU_API_KEY`

**Respuesta**:
- Conexin de larga duracin
- Headers: `Content-Type: text/event-stream`

### POST /messages
Enva mensajes MCP al servidor.

**Autenticacin requerida**: Idem `/sse`

**Body**: Mensaje MCP en formato JSON

## Flujo de conexin MCP

1. Cliente abre `GET /sse` con API key vlida
2. Servidor crea `SSEServerTransport` y conecta MCP server
3. Cliente enva `ListTools`  servidor retorna lista de tools
4. Cliente invoca `CallTool` con parmetros
5. Servidor resuelve tool y enva resultado
6. Loop hasta cerrar conexin

## Tools expuestos

### list_models
Lista modelos instalados.

**Input**:
```json
{
  "apiKey": "TU_API_KEY"
}
```

**Output**: JSON con array de modelos.

### pull_model
Descargar modelo.

**Input**:
```json
{
  "model": "llama3",
  "apiKey": "TU_API_KEY"
}
```

### generate
Generar respuesta a un prompt.

**Input**:
```json
{
  "model": "qwen3.5:4b",
  "prompt": "Qu es AI?",
  "apiKey": "TU_API_KEY",
  "temperature": 0.7,
  "num_ctx": 2048,
  "keep_alive": "5m"
}
```

### chat
Enviar mensaje en conversacin.

**Input**:
```json
{
  "model": "qwen3.5:4b",
  "messages": [
    {"role": "user", "content": "hola"}
  ],
  "apiKey": "TU_API_KEY",
  "session_id": "opcional"
}
```

### unload_models
Liberar VRAM.

**Input**:
```json
{
  "apiKey": "TU_API_KEY"
}
```

### get_server_status
Obtener telemetra.

**Input**:
```json
{
  "apiKey": "TU_API_KEY"
}
```

### delete_model
Eliminar modelo.

**Input**:
```json
{
  "model": "llama3",
  "apiKey": "TU_API_KEY"
}
```

## Notas de implementacin

### Autenticacin en MCP
- Cada tool requiere `apiKey` dentro de sus argumentos
- Validacin centralizada en `OllamaTools.register()`
- Falla con error si API key no vlida

### Sessions
- `SessionManager` crea sesiones por IP + API key
- til para rastrear conexiones MCP en logs

### Escalabilidad
- Implementacin actual: `transport` global nico
- Para alto concurrency multi-cliente, considerar:
  - Mapa de transports por sesin
  - Queue de mensajes MCP
  - Load balancing entre instancias backend

## Ejemplo de cliente MCP (Claude Desktop)

```json
{
  "mcpServers": {
    "lallama": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sse"],
      "env": {
        "MCP_SERVER_URL": "https://tu-ngrok-url/sse",
        "MCP_API_KEY": "TU_API_KEY"
      }
    }
  }
}
```

## Siguiente lectura
- [[Indice-Backend| Volver a Backend]]
- [[API-REST|API REST]]
- [[Seguridad|Seguridad]]


