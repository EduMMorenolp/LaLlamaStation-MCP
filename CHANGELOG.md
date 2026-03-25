# LaLlamaStation MCP — Changelog

Todos los cambios notables del proyecto están documentados aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Unreleased]

## [0.4.0] — 2026-03-25

### Añadido
- **Blindaje & Seguridad**:
  - API_KEY obligatoria en startup: El servidor fallará si `API_KEY` no está configurada en `.env` o docker-compose
  - SessionManager: Nuevo servicio para manejar sesiones aisladas por IP (Fase 1 - Prevenir interferencia de estado global)
  - Autenticación en SSE/MCP: Las conexiones `/sse` y `/messages` ahora requieren `x-api-key` válida
  - Cleanup seguro: `deleteModel()` y `cleanWorkspace()` ahora rastrean operaciones en progreso para evitar conflictos
  - Auto-unload mejorado: Mejor manejo de errores con notificaciones explícitas al usuario
- Establecida regla obligatoria para la IA: registrar todos los cambios en el `CHANGELOG.md`.
- Archivo de reglas `.cursorrules` para automatizar el proceso de documentación.
- **Persistencia del Chat en ChatPlayground**: historial de mensajes y configuraciones se guardan automáticamente en `localStorage`
  - Las conversaciones se mantienen al navegar entre pestañas
  - Se persisten modelo seleccionado, temperatura, contexto y estadísticas de sesión
  - Los cambios se sincronizan en tiempo real sin afectar el rendimiento
- **Biome instalado** para linting y formateo automático
  - Scripts: `pnpm lint`, `pnpm format`, `pnpm check`
  - Configuración: `biome.json` con reglas estrictas de TypeScript y a11y
- **Interfazes compartidas** (`mcp-frontend/src/types/api.ts`):
  - `StatusResponse` - Respuesta completa del servidor de estado con propiedades VRAM
  - `AccessLogEntry` - Entrada de log de acceso con propiedades tipadas
  - `OllamaModel` - Modelo de Ollama con propiedades name, model, size, digest
  - `LoadedModel` - Modelo cargado en VRAM con propiedades name, size_vram, percentage
  - `ChatMessage` - Mensaje de chat estructura con role y content
  - `EngineStats` - Estadísticas del motor con tokensSession y timeSession
  - `VramInfo` - Información de VRAM con total, used, free, available
- **Contratos limpios API + frontend**
  - Contrato OpenAI `/v1/chat/completions` con `usage` real (tokens de prompt/completion) y validación de payload
  - Cliente API centralizado en frontend (`mcp-frontend/src/services/api.service.ts`) con interceptor para `x-api-key`
  - Helpers de sesión de API key (`setApiKey`, `clearApiKey`, persistencia opcional)

### Mejorado
- **Calidad de Código**:
  - 43+ problemas de linting corregidos (variables no usadas, imports organizados, etc.)
  - Todos los botones ahora tienen atributo `type="button"` para accesibilidad
  - Reemplazo de tipos `any` con tipos específicos en componentes clave
  - Formateo unificado en 31 archivos de código
- **Error Handling**:
  - Type guards implementados para manejo seguro de `unknown` en catch blocks
  - Manejo seguro de propiedades undefined con nullish coalescing operator (`??`)
- **Tipado TypeScript**:
  - Función `VramBadge` tipada correctamente con interfaz específica para parámetro vram
  - Tipado de `loadedModels.map()` con LoadedModel interface
  - Props interfaces mejoradas con parámetros opcionales donde sea apropiado
- **Integración Backend/Frontend**:
  - `OllamaService.chat()` ahora retorna estructura enriquecida (`message`, `prompt_eval_count`, `eval_count`, `total_duration`)
  - `App.tsx` migrado a cliente API compartido para eliminar headers duplicados y llamadas axios dispersas
  - Componentes migrados a cliente unificado: `Telemetry`, `ModelList`, `HardwareSentinel`, `AiEngineTuner`

### Corregido
- **App.tsx**:
  - Removido import no usado `AxiosError`
  - Cambio de `useState<StatusResponse | null>` a `useState<StatusResponse | undefined>` para coherencia de tipos
- **Telemetry.tsx**:
  - Error handling mejorado con type guard `instanceof Error`
  - Acceso seguro a `status?.recentLogs?.length` con nullish coalescing
- **HardwareSentinel.tsx**:
  - Key element usando `String()` con fallback a index en map loops
  - Props interface para aceptar `status` opcional
  - Tipado correcto de parámetro vram en VramBadge
- **AiEngineTuner.tsx**:
  - Props interface para aceptar `status` opcional
- **IpLogs.tsx**:
  - Props mejoradas con tipos específicos: `logs?: AccessLogEntry[]`, `status?: StatusResponse`
  - Importación correcta de tipos desde api.ts
- **ollama.tools.ts**:
  - Caracteres de escape `\t` reemplazados con indentación real en ChatMessage type
  - CallToolRequestHandler mejorado con type assertion para request.params
  - Error handling en catch block usando variable tipada como string
- **ollama.service.ts**:
  - Session cache logic mejorada para evitar acceso undefined con variable intermedia
- **Contrato y UX**:
  - `usage` en `/v1/chat/completions` dejó de retornar ceros y ahora usa métricas reales de inferencia
  - `ollama.tools.ts` actualizado para leer el nuevo shape de respuesta de `chat` sin romper herramientas MCP
  - Auto-scroll de `ChatPlayground` corregido para reaccionar a nuevos mensajes y estado de carga
  - Documentación de eventos Socket alineada con nombres reales en kebab-case (`pull-progress`, `security-alert`, `new-access`)

### Cambiado
- **StatusResponse**: Cambio de `Record<string, any>` a interfaz con propiedades específicas
  - Agregadas propiedades VRAM: `vramFreeMb`, `vramTotalMb`, `vramUsedMb`
  - Agregadas propiedades modelos: `models` (LoadedModel[]), `recentLogs` (AccessLogEntry[])
  - Mantenida compatibilidad con `[key: string]: any` para propiedades adicionales
- **OllamaModel**: De `Record<string, any>` a interfaz con propiedades esperadas
- **LoadedModel**: De `Record<string, any>` a interfaz con propiedades tipadas
- **EngineStats**: De `Record<string, any>` a interfaz que extiende Record
- **Servicio API Frontend**:
  - Reemplazo del `api.service.ts` anterior (orientado a `/sse`) por una capa HTTP real para endpoints REST del dashboard

### Información de Build
- **Frontend Build**: ✅ Exitoso
  - TypeScript compilation: 0 errores
  - Vite production build: 361.9 KB JS (111.4 KB gzip)
  - Build time: 7.17 segundos
  - Módulos transformados: 1829
- **Backend Build**: ✅ Exitoso
  - TypeScript compilation en ollama-mcp-server: 0 errores
  - Types resueltos para OllamaService y OllamaTools
  - Y más tipos específicos
- **Reducción de tipos `any`**: Reemplazados en:
  - `App.tsx` - Estados y callbacks tipados correctamente
  - `components/Telemetry.tsx` - Props tipadas como `StatusResponse`
  - `components/AiEngineTuner.tsx` - Estados tipados como `EngineStats`
  - `components/HardwareSentinel.tsx` - Props y callbacks tipados
  - `ollama-mcp-server` - Tipos locales definidos para ChatMessage
- **Errores de tipo reducidos**: De 101 errores originales a ~55 (46% reducción)
- **Build Fase 2 (2026-03-25)**: ✅ Exitoso
  - Frontend (`pnpm run build`): TypeScript + Vite OK
  - Bundle frontend: `361.53 kB` JS (`111.63 kB` gzip), `1830` módulos transformados
  - Backend (`pnpm run build`): `tsc` completado sin errores

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
