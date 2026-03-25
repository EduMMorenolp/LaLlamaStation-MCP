# ROADMAP — LaLlamaStation MCP

## Objetivo
Posibles mejoras futuras del proyecto.

> Nota: este roadmap apunta a evolucionar el **MCP server + gateway OpenAI-compatible + dashboard** sin perder el foco en "local-first" (Ollama) y en la operación segura (API keys, auditoría, telemetría).

## Modelos Personalizados

### Camino A: Especializacion sin reentrenar
- Crear modelos derivados con perfil tecnico (por ejemplo, Node.js + React).
- Ajustar comportamiento con instrucciones, parametros y contexto del proyecto.
- Empaquetar “perfiles” reutilizables (p. ej. `code-review`, `frontend`, `backend`, `ops`) con:
	- System prompt + reglas de estilo
	- presets de inferencia (temperature, top_p/top_k, num_ctx)
	- contexto curado (arquitectura, endpoints, convenciones)
- Gating de perfiles: checklist + mini-evaluaciones automáticas antes de publicar un perfil.
- Ventajas: rapido, bajo costo, menor riesgo.
- Ideal para: validar valor en corto plazo.

### Camino B: Fine-tuning real (LoRA/QLoRA)
- Entrenar una variante especializada con dataset propio.
- Pipeline de datos (curado + dedupe + seguridad):
	- anonimización/redacción de secretos
	- separación por dominios (código, ops, soporte)
	- conjunto de evaluación fijo para regresión
- Criterios de salida: mejoras medibles (calidad, seguridad, latencia) vs perfiles del Camino A.
- Estrategia de despliegue y rollback: versionado de adaptadores LoRA + promoción por ambientes.
- Ventajas: mayor profundidad de especializacion.
- Costos: mayor complejidad, tiempo y recursos.
- Ideal para: cuando el Camino A no alcance la calidad esperada.

## Mejoras Futuras del Proyecto

### 1. Seguridad y gobierno
- Roles y permisos por tipo de usuario.
- Limites por API key y cuotas de uso.
- Auditoria completa de operaciones criticas.
- Multi-API keys (no solo una “master key”):
	- claves por usuario/servicio, con estado (activa/revocada) y metadata (owner, etiqueta)
	- hashing de API keys en persistencia (nunca guardar en plano)
	- rotación de claves y expiración opcional
- Control de exposición cuando ngrok está activo:
	- allowlist/denylist de IP o CIDR
	- hardening de CORS (orígenes permitidos configurables)
	- opción de “modo maintenance” (solo lectura / deny write endpoints)
- Rate limiting granular:
	- por API key y por endpoint (ej. más estricto para `/v1/chat/completions`)
	- límites por modelo (evitar saturar GPU con un solo modelo)
- Auditoría y alertas:
	- persistencia de logs (no solo en memoria)
	- exportación (CSV/JSON) y retención configurable
	- webhooks/alertas (p. ej. ban automático, pico de 401, pico de 429)
- Seguridad operativa:
	- guías de reverse proxy con TLS (Nginx/Caddy) para escenarios públicos
	- healthchecks + hardening de contenedores (capabilities, read-only fs donde aplique)

### 2. Calidad de respuestas
- Evaluaciones repetibles para medir calidad de codigo.
- Benchmark interno para comparar modelos/perfiles.
- Flujo de mejora continua basado en metricas.
- Soporte OpenAI “streaming” (`stream=true`) y métricas de latencia por chunk.
- Presets de inferencia por caso de uso (chat, coding, análisis) visibles en UI.
- "Prompt tracing" (sin guardar contenido sensible por default):
	- métricas: tokens in/out, duración, modelo, parámetros
	- muestreo configurable para debugging
- Guardrails opcionales:
	- modo JSON estricto (cuando el cliente lo pide)
	- validación de payloads (zod) y mensajes de error consistentes

### 3. Plataforma y operacion
- Registro interno de modelos y versiones.
- Rollback rapido a modelos estables.
- Observabilidad de latencia, errores y consumo.
- Observabilidad técnica completa:
	- logs estructurados (JSON) con correlación request-id
	- endpoint `/metrics` (Prometheus) para: RPS, p95/p99, 4xx/5xx, pulls, VRAM, disco
	- trazas OpenTelemetry (export a Jaeger/Tempo opcional)
- Persistencia de estado crítico:
	- blacklist persistente + expiración (TTL)
	- auditoría y estadísticas persistentes (SQLite/Postgres)
	- configuración persistida (sin rebuild)
- Operación y resiliencia:
	- colas para operaciones pesadas (pull/delete/clean) con estado y cancelación
	- límites de concurrencia de inferencias por GPU/CPU
	- endpoints de mantenimiento (vacuum DB, compaction, backup)
- Entornos y releases:
	- versionado de API (deprecations claras)
	- pipeline CI (lint/build/test) + publicación de imágenes Docker versionadas
	- runbook de producción (backup/restore, rotación de key, incidentes)

### 4. Persistencia y datos
- Auditoría persistente (DB) con filtros por IP, endpoint, status y rango de fechas.
- Exportación de reportes: accesos, bloqueos, uso por modelo, consumo estimado.
- Retención configurable y “privacy mode” (evitar guardar prompts/respuestas por default).

### 5. Compatibilidad MCP / OpenAI
- MCP:
	- múltiples conexiones SSE simultáneas (manejo correcto de transports por cliente)
	- cierre limpio de sesión y TTL real de sesiones
	- ampliar herramientas MCP (operaciones de modelos y estado) con contratos estables
- OpenAI-compatible:
	- compatibilidad incremental (streaming, errores, headers, `usage` consistente)
	- endpoints opcionales (embeddings) si el runtime lo soporta
	- límites y mensajes de error “drop-in” para clientes populares (LibreChat, etc.)

### 6. Testing, DX y calidad de entrega
- Suite de tests (unit + integración) para auth, seguridad, endpoints críticos y scraping.
- E2E del dashboard para flujos: login, pull modelo, ban/unban, ngrok toggle.
- Validación fuerte de configuración (schema + defaults) y documentación automática.
- Pre-commit + CI (lint/format/build/tests) + escaneo de dependencias.

### 7. UI/UX (sin cambiar la identidad visual)
- Estados de carga y fallos más claros para operaciones largas (pull/delete/clean).
- Historial de operaciones (jobs) con estado: running/success/failed.
- Pantalla/área de “Incidentes” con alertas recientes (ban, errores pull, espacio bajo).
