# Componentes del Sistema

## Ollama (Inferencia de modelos)

**Contenedor**: `mcp-ollama-motor`
**Puerto interno**: 11434
**Funcion**: Ejecutar modelos LLM y generar inferencias

### Caracteristicas

- Soporta multiples modelos (Llama, Qwen, Mistral, etc.)
- GPU acceleration (CUDA) automatico si GPU disponible
- API REST compatible con OpenAI
- Keep-alive de modelos configurable

### Volumen

- `ollama_data:/root/.ollama` (RW) - almacena modelos descargados

## Backend (API Gateway + MCP)

**Contenedor**: `mcp-server-app`
**Puerto interno**: 3000
**Stack**: Node.js + Express + TypeScript

### Responsabilidades

- Validacion de API keys
- Rate limiting y seguridad
- Traduccion REST <-> Ollama
- Streaming de respuestas (SSE)
- MCP transport (SSE + POST)
- Telemetria y metricas
- WebSockets para eventos

### Modulos internos

- `AuthService`: Validacion de credenciales
- `OllamaService`: Orquestacion de llamadas a Ollama
- `OllamaTools`: Definicion de tools MCP
- `SessionManager`: Sesiones de usuario MCP

## Frontend (Dashboard)

**Contenedor**: `mcp-frontend-app`
**Puerto externo**: 8080
**Stack**: React 19 + Vite + TypeScript

### Vistas principales

- **Dashboard**: Estado general (VRAM, GPU, modelos cargados)
- **Playground**: Chat interactivo con streaming
- **Modelos**: Descargar, eliminar, gestionar
- **Seguridad**: Logs de acceso, blacklist, IPs
- **HW Sentinel**: VRAM auto-unload, contexto global
- **Engine Tuner**: Precio cloud, tarifa electricidad, metricas
- **Telemetria**: TTFT, tokens/sec, historicos

### Comunicacion

- REST polling a `/api/status/fast` (cada 60s)
- WebSockets para eventos en tiempo real
- SSE para streaming de chat

## ngrok (Exposicion publica)

**Contenedor**: `mcp-ngrok-tunnel`
**Funcion**: Crear tunel publico seguro a backend

### Caracteristicas

- Autenticacion por token
- HTTPS automatico
- URL publica dinamica o estatica
- Acceso desde herramientas externas (Claude Desktop, etc.)

### Uso

- Dashboard o API: `GET /api/ngrok/status`
- Control: `POST /api/ngrok/start`, `stop`

## Siguiente lectura

- [[Indice-Arquitectura|Volver a Arquitectura]]
- [[Arquitectura|Arquitectura general]]
