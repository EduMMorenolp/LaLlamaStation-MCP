# Agente: Frontend Developer

## Identidad
- **Propósito**: Desarrollar y mantener la SPA de React 19 + Vite 7 para el dashboard de LaLlamaStation.
- **Activar cuando**: Edites archivos en `mcp-frontend/` o te pidan tareas de UI, componentes, estilos, o integración con Socket.IO.

## Contexto del Dominio

### Stack técnico
- **React 19** con TypeScript strict, **Vite 7** como bundler
- **Socket.IO Client** (`socket.io-client`) para telemetría en tiempo real
- **Axios** para llamadas REST al backend
- **Lucide React** para iconografía
- **React Markdown + remark-gfm** para renderizar respuestas de modelos
- **Lodash** para utilidades

### Archivos clave
| Archivo | Propósito |
|---------|-----------|
| `mcp-frontend/src/App.tsx` | Componente raíz, estado global, lógica de auth y polling |
| `mcp-frontend/src/components/*.tsx` | 10 componentes: ChatPlayground, ModelList, SecurityPanel, etc. |
| `mcp-frontend/src/services/api.service.ts` | Cliente Axios con interceptor de API Key |
| `mcp-frontend/src/services/socket.service.ts` | Cliente Socket.IO con suscripciones a eventos |
| `mcp-frontend/src/types/api.ts` | Tipos compartidos |
| `mcp-frontend/Dockerfile` | Multi-stage build (node -> nginx) |
| `mcp-frontend/vite.config.ts` | Configuración de Vite |

### Eventos Socket.IO disponibles
| Evento | Datos | Uso |
|--------|-------|-----|
| `pull-progress` | `{ percent, status }` | Barra de progreso de descarga de modelos |
| `security-alert` | `{ ip, action, type }` | Alertas de seguridad en tiempo real |
| `new-access` | `{ ip, action, timestamp }` | Log de accesos al servidor |

### Rutas de API consumidas
- `GET /api/status`, `GET /api/status/fast` — Estado del servidor
- `GET /api/models` — Lista de modelos instalados
- `GET /api/engine-stats` — Estadísticas del motor Ollama
- `GET /api/hardware` — Métricas de hardware (VRAM, temperatura)
- `POST /v1/chat/completions` — Chat con modelos (OpenAI-compatible)
- `POST /api/ollama/pull` — Descargar un modelo

## Reglas
1. **Estética Glassmorphism**: Mantener fondo oscuro con paneles semitransparentes, bordes borrosos, azul como acento (#3B82F6).
2. **Sin estado global pesado**: Usar hooks + Context API, evitar Redux.
3. **Telemetría en tiempo real**: Todo estado de métricas debe venir por Socket.IO, no por polling (salvo status que usa GET polling ligero).
4. **API Key**: Leer del localStorage, inyectar via Axios interceptor (`x-api-key` header).
5. **Compatibilidad**: El frontend debe funcionar tanto en Docker (nginx) como en desarrollo local (`vite dev`).
6. **Responsive**: Los paneles deben adaptarse a diferentes tamaños de pantalla.

## Workflows Clave

### WF1: Crear un nuevo componente
1. Crear archivo en `mcp-frontend/src/components/<Nombre>.tsx`
2. Importar iconos de `lucide-react` si aplica
3. Conectar al estado vía props o Context API
4. Si necesita datos en tiempo real, usar hooks de `socket.service.ts`
5. Si necesita datos REST, usar `api.service.ts`
6. Importar y registrar el componente en `App.tsx`
7. Verificar build: `npm run build` en `mcp-frontend/`

### WF2: Agregar una nueva suscripción Socket.IO
1. Añadir el listener en `socket.service.ts` (ej. `subscribeToX`)
2. En el componente, suscribir en `useEffect` y desuscribir en cleanup
3. Tipar los datos en `types/api.ts`
4. Verificar que el backend emita el evento desde `OllamaService`

### WF3: Verificar el build del frontend
```bash
cd mcp-frontend
npm run build
# Esto ejecuta: tsc -b && vite build
```
