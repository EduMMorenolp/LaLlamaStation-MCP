---
activation: always
---

# LaLlamaStation MCP — Reglas del Agente

## Contexto del Proyecto
LaLlamaStation MCP es un servidor que expone modelos locales de **Ollama** a través de un túnel seguro **ngrok** y provee una **API compatible con OpenAI** junto con el protocolo **MCP (Model Context Protocol)**. 
Tiene un dashboard web integrado. Todo corre en **Docker**.

## Arquitectura (Monorepo)
```
LaLlamaStation MCP/
├── ollama-mcp-server/    # Backend: Node.js + Express + Socket.io + Model Context Protocol
├── mcp-frontend/         # Frontend: React 19 + Vite (Dashboard)
├── docker-compose.yml    # Orquestación (Server + Ngrok + UI)
```

## Reglas Backend (`ollama-mcp-server`)
- **API Compatible**: Mantener compatibilidad estricta con el spec de la API de OpenAI (rutas `/v1/chat/completions`, formato de request/response, streaming con `data: `).
- **Seguridad**: Nunca exponer endpoints públicos sin validar el `API_KEY`.
- **Telemetría**: Toda petición debe registrar su consumo (tokens calculados estimativamente) y emitir eventos vía WebSocket al frontend.
- **Dockerode**: Usar `dockerode` para gestionar el estado de los contenedores si es necesario.
- **MCP**: Usar `@modelcontextprotocol/sdk` para la implementación del server MCP.

## Reglas Frontend (`mcp-frontend`)
- **Estilos**: Estética Black & Blue con Glassmorphism (comparte identidad con ARGenteIA Web).
- **Sockets**: Conectarse via `socket.io-client` para recibir telemetría (VRAM, tráfico, requests) en tiempo real.
- **Sin estado global pesado**: Usar hooks sencillos y Context API.

## Desarrollo y Configuración
- Todas las configuraciones sensibles van en el archivo `.env`. (Ver `.env.example`).
- Evitar hardcodear `localhost`, usar IPs dinámicas o resolución Docker.
- Comando para desarrollo local: No recomendado sin Docker, usar `docker compose up -d` y re-buildeo.
