# Arquitectura del Sistema

## Diagrama de flujo conceptual
```
Cliente Externo/Web
    
     [x-api-key header]
       
     Middleware de seguridad
        Auth check
        Rate limit
        Blacklist
       
  Express.js Backend (puerto 3000)
        REST API (OpenAI compatible)
        WebSockets (telemetra real-time)
        MCP SSE (Model Context Protocol)
           
       [HTTP keep-alive pool]
           
    Ollama Container (puerto 11434)
        Inferencia de modelos
        GPU acceleration (CUDA)
           
      Respuesta streaming/batch
```

## Componentes
- **`mcp-ollama-motor`** (Ollama): Runtime de inferencia de modelos LLM
- **`mcp-server-app`** (Node/Express): API gateway, auth, seguridad, MCP
- **`mcp-frontend-app`** (React/Vite): Dashboard web de administracion
- **`mcp-ngrok-tunnel`** (ngrok): Exposicion publica segura (opcional)

## Protocolos principales
- **REST JSON**: `/v1/...`, `/api/...`
- **OpenAI-compatible**: `/v1/models`, `/v1/chat/completions`
- **SSE (Server-Sent Events)**: Streaming de tokens
- **MCP**: Model Context Protocol por SSE + POST
- **WebSockets**: Eventos de telemetria en tiempo real

## Persistencia y volumenes
- **Volumen `ollama_data`**:
  - Montado en Ollama como RW: `/root/.ollama`
  - Montado en backend como RO: `/root/.ollama:ro` (para estadisticas)
  - Contiene modelos descargados y cache

## Hardware y GPU
- **Servicio correctamente configurado para GPU**: `ollama` (contiene el modelo)
- **En compose actual**: `ollama` tiene `gpus: all`
- **NO es necesario** asignar GPU al backend (`mcp-server`)

## Flujo de una solicitud tipica
1. Cliente envia `POST /v1/chat/completions` con `x-api-key`
2. Backend valida API key + rate limit + blacklist
3. Backend parsea modelo, mensajes, opciones
4. Backend aplica queue de concurrencia (evita sobrecargar Ollama)
5. Backend delega a Ollama por HTTP
6. Ollama carga modelo a VRAM (o GPU si esta disponible)
7. Ollama genera respuesta token a token
8. Backend recibe respuesta:
   - Si `stream=true`: envia chunks SSE
   - Si `stream=false`: acumula y retorna JSON completo
9. Backend registra metricas (TTFT, tokens/sec)
10. Cliente recibe respuesta

## Siguiente lectura
- [[Indice-Arquitectura| Volver a Arquitectura]]
- [[Componentes|Componentes del Sistema]]


