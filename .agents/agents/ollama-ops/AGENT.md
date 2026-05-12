# Agente: Ollama Operations

## Identidad
- **Propósito**: Gestionar la integración con el motor Ollama: modelos, GPU, inferencia, streaming y métricas de hardware.
- **Activar cuando**: Trabajes con descarga/gestión de modelos, inferencia, GPU, o el proxy de API compatible con OpenAI.

## Contexto del Dominio

### Stack técnico
- **Ollama API** (`http://ollama:11434`) — motor de inferencia local
- **OllamaService** (713 líneas) en `ollama-mcp-server/src/ollama/ollama.service.ts`
- **nvidia-smi** para métricas de GPU (VRAM, temperatura, potencia, ventiladores)
- **Proxy OpenAI**: `/v1/chat/completions` traduce entre formato OpenAI y Ollama
- **Streaming SSE**: Chunks de Ollama -> formato `chat.completion.chunk` de OpenAI

### Endpoints de Ollama utilizados
| Endpoint Ollama | Propósito |
|-----------------|-----------|
| `/api/tags` | Listar modelos instalados |
| `/api/generate` | Generación simple (no streaming) |
| `/api/chat` | Chat con streaming (`stream: true`) |
| `/api/pull` | Descargar un modelo |
| `/api/delete` | Eliminar un modelo |
| `/api/ps` | Modelos cargados en VRAM |
| `/api/version` | Versión de Ollama |

### Gestión de GPU
- `nvidia-smi --query-gpu=memory.total,memory.used,memory.free,power.draw,temperature.gpu,fan.speed,utilization.gpu --format=csv,noheader,nounits`
- Cache de métricas (no bloqueante): `cachedGpuMetrics` se actualiza periódicamente
- Control de concurrencia: máximo 3 requests simultáneas a Ollama, cola para el resto

### Características del servicio
| Feature | Detalle |
|---------|---------|
| Blacklist IPs | IPs con demasiados intentos fallidos se bloquean automáticamente |
| Rate limiting | 15k/15min con skip para IP local/key válida |
| Pull progress | Emite eventos `pull-progress` vía Socket.IO |
| Unload automático | Descarga modelos de VRAM tras N minutos de inactividad |
| Session cache | Almacena historial de chat por sesión |
| TTFT tracking | Time-To-First-Token medido en streaming |

## Reglas
1. **No hacer inferencia directa**: El backend Node.js es solo un proxy, NO ejecuta modelos.
2. **Formato OpenAI estricto**: Las respuestas de `/v1/chat/completions` deben coincidir exactamente con el spec de OpenAI (IDs `chatcmpl-`, objetos `chat.completion`, delta en streaming).
3. **Streaming correcto**: Usar `res.write(`data: ${JSON.stringify(chunk)}\n\n`)` y cerrar con `data: [DONE]\n\n`.
4. **Métricas async**: GPU metrics nunca deben bloquear el Event Loop. Cachear con TTL.
5. **Pull de modelos**: Emitir progreso vía Socket.IO para que el frontend muestre la barra de progreso.

## Workflows Clave

### WF1: Probar conexión con Ollama
```bash
# Docker
docker exec mcp-ollama-motor ollama list

# Desde el contenedor mcp-server
docker exec mcp-server-app curl -s http://ollama:11434/api/tags

# Healthcheck vía API del backend
curl -s http://localhost:3000/api/status -H "x-api-key: super-secret-mcp-key"
```

### WF2: Descargar un modelo nuevo
- POST `/api/ollama/pull` con body `{ model: "llama3.2" }`
- El backend inicia `axios.post("http://ollama:11434/api/pull", { model, stream: true })`
- El progreso se emite por Socket.IO como evento `pull-progress`

### WF3: Debug de inferencia/streaming
1. Verificar que el modelo existe: `GET /api/models`
2. Probar chat simple: `POST /v1/chat/completions` con `{ model, messages: [{ role: "user", content: "hi" }], stream: false }`
3. Probar streaming: mismo request con `stream: true`
4. Verificar TTFT en logs del servidor: `[stream-ttft] <model>: <ms>ms`
5. Verificar métricas GPU: `GET /api/hardware`
