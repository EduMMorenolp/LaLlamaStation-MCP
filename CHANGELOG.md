# LaLlamaStation MCP — Changelog

Todos los cambios notables del proyecto están documentados aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Unreleased]

### Añadido
- Establecida regla obligatoria para la IA: registrar todos los cambios en el `CHANGELOG.md`.
- Archivo de reglas `.cursorrules` y `.agents/rules/changelog-rules.md` para automatizar este proceso.
- **Persistencia del Chat en ChatPlayground**: historial de mensajes y configuraciones se guardan automáticamente en `localStorage`
  - Las conversaciones se mantienen al navegar entre pestañas
  - Se persisten modelo seleccionado, temperatura, contexto y estadísticas de sesión
  - Los cambios se sincronizan en tiempo real sin afectar el rendimiento
  - El botón limpiar chat también limpia la persistencia

### 🔧 Mejoras de Calidad de Código
- **Biome instalado y configurado** para linting y formateo automático
  - Scripts: `pnpm lint`, `pnpm format`, `pnpm check`
  - Configuración: `biome.json` con reglas estrictas de TypeScript y a11y
- **Correcciones automáticas aplicadas**: 
  - ✅ 43+ problemas de linting corregidos (variables no usadas, imports organizados, etc.)
  - ✅ Todos los botones ahora tienen atributo `type="button"` para accesibilidad
  - ✅ Reemplazo de tipos `any` con `Record<string, unknown>` en componentes clave
  - ✅ Formateo unificado en 30 archivos de código

## [0.3.0] — 2026-03-10 🦙 Renaming + Model Discovery + Ngrok Control

### 💫 Rebrand
- Proyecto renombrado de **SYMBIOSIS MCP** a **LaLlamaStation MCP**
- Título del browser, sidebar, login y meta-tags actualizados
- Clave de `localStorage` unificada bajo `llama_master_key`
- `package.json` del frontend y backend actualizados

### ✨ Nuevas Funcionalidades
- **Búsqueda en Ollama Library**: nuevo endpoint `GET /api/search-models?q=...`
  - Scraper del sitio oficial `ollama.com/library` usando `cheerio`
  - Catálogo de fallback con 8 modelos curados cuando no hay búsqueda activa
- **Control de Ngrok desde la Web**: toggle START/STOP en el widget de Telemetría
  - Usa `dockerode` conectado via `/var/run/docker.sock`
  - Muestra la URL pública del túnel al activarse
  - Botón de copia de URL al portapapeles
- **Guía de uso de modelos**: panel explicativo en la sección Modelos con dos flujos (nombre directo / búsqueda en librería)
- **Soporte para `cheerio`** instalado en el servidor backend

### 🐛 Correcciones
- `TypeError: Cannot read properties of undefined (reading 'startsWith')` en `ModelList.tsx` — filtro defensivo aplicado
- `DELETE /api/models/undefined` — solo se renderiza el botón de eliminar si el modelo tiene nombre
- Modelos mostrando `NaN GB` — ahora muestra `-` cuando el tamaño es 0 o undefined
- Spam de logs por ngrok desconectado — errores `ENOTFOUND`/`ECONNREFUSED` silenciados, timeout de 2s
- `key` warning en listas de React — claves compuestas únicas en logs y modelos

### 🔧 Mejoras de UI/UX
- Dashboard rediseñado: muestra KPIs + últimos accesos + modelos disponibles + IPs bloqueadas
- Sección Seguridad completa: SecurityPanel (Blacklist + PÁNICO) + auditoría de accesos con filtros y búsqueda
- Header del dashboard con subtítulos contextuales por sección
- Playground con tarjeta glassmorphism full-height
- `restart: "no"` para el contenedor ngrok (ya no se reinicia solo)
- Docker socket montado en `mcp-server` para control de contenedores

---

## [0.2.0] — 2026-03-09 🛡️ Seguridad, Telemetría y Limpieza

### ✨ Nuevas Funcionalidades
- **Modo Offline**: switch en el Dashboard para desconectar el motor de inferencia
- **Telemetría de Hardware**: CPU, RAM, VRAM en tiempo real
- **Vault de Credenciales**: gestión de API keys multi-usuario
- **Logs de Refactorización**: modal de historial de cambios del agente
- **Selección de modelo por agente**: en el grafo de agentes

### 🔧 Mejoras
- Panel de Telemetría con KPIs holográficos
- SecurityPanel con botón de Pánico y gestión de blacklist
- Reescrtura total del componente `IpLogs` con filtros y búsqueda
- Animaciones de progreso de descarga vía WebSockets

---

## [0.1.0] — 2026-03-08 🚀 Lanzamiento inicial

### ✨ Funcionalidades base
- **MCP Server**: servidor Express + SSE para Claude Desktop
- **Autenticación**: API Key con rate limiting (5000 req/15min)
- **Seguridad**: Helmet, blacklist de IPs, auto-ban tras 5 intentos fallidos, auditoría
- **Modelos Ollama**: listar, pull, delete, unload VRAM
- **Telemetría**: disco, ngrok, modelos cargados en VRAM
- **WebSockets**: progreso de descargas y alertas de seguridad en tiempo real
- **Frontend**: dashboard Vite + React con diseño glassmorphism oscuro
- **Playground**: terminal de inferencia directa con selección de modelo
- **Docker Compose**: stack completo (Ollama + MCP Server + Frontend + Ngrok)
- **Compatibilidad OpenAI**: endpoints `/v1/models` y `/v1/chat/completions`
