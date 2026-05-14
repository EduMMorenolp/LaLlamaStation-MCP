# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [1.1.0] - 2026-05-14

### Added
- **Transporte SSE (Server-Sent Events)**: Nuevos endpoints `GET /sse` y `POST /messages` para comunicación remota vía HTTP SSE, permitiendo que agentes externos (OpenCode AI, Claude Desktop, etc.) se conecten al servidor MCP sin necesidad de stdio local.
- **Dual Transport**: El servidor MCP ahora soporta tanto `StdioServerTransport` (procesos locales) como `SSEServerTransport` (conexiones remotas HTTP), gracias a la refactorización de `createMcpServer()` como función independiente.
- **Endpoint `/mcp`**: Health-check para verificar accesibilidad remota.
- **Sincronización Multi-IDE mejorada**: Configuración diferenciada por tipo de cliente (`type: "remote"` para OpenCode AI, `type: "url"` para Claude Desktop/Antigravity/RooCode/Windsurf).
- **Soporte para Windsurf** como target de sincronización MCP.
- **Variable `HOST_IP`**: Nueva variable de entorno para configurar dinámicamente la URL del endpoint SSE.

### Changed
- **Sincronización MCP (`POST /api/mcp/sync`)**: Refactorizada para generar configuraciones SSE en lugar de comandos stdio locales.

### Fixed
- **`transport.handlePostMessage()`**: Ahora incluye `req.body` como tercer argumento para manejo correcto de mensajes MCP entrantes.

## [1.0.0] - 2026-05-13

### Added
- **MCP Brain Server** primera versión oficial e independiente (standalone).
- Arquitectura altamente modular basada en patrón de **Casos de Uso** e Inyección Funcional.
- Persistencia robusta en SQLite con una **WriteQueue** dedicada para garantizar soporte multi-agente en entornos de alta concurrencia.
- Sistema Híbrido de búsqueda: **Léxica** nativa (SQLite FTS5) + **Semántica** vectorizada (Embeddings vía Ollama).
- Detección Dinámica de Conflictos: Grafo relacional para solicitar juicios cuando las memorias colisionan (`mem_judge`).
- Soporte para claves evolutivas en el tiempo mediante `topic_key`.
- Captura de información contextual: `mem_save_prompt` para historial de usuario puro y `mem_capture_passive` para la ingesta silenciosa.
- **Delegación Cognitiva (Graceful Degradation):** Si el backend local LLM (Ollama) está desconectado, el servidor no falla abruptamente. En su lugar, instruye vía MCP al Agente LLM cliente para que asuma el procesamiento analítico (`mem_compare`, `mem_suggest_tags`).
- Servidores duales y aislados lógicamente: Protocolo MCP por Standard IO (`stdio`) y Servidor REST para dashboards vía Express API.
