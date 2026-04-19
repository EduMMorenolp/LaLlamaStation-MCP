# Dashboard (Frontend)

**Ubicacion**: `mcp-frontend/`  
**Stack**: React 19 + Vite 7 + TypeScript  
**Build**: `npm run build`

## Primer Acceso

1. Abre el dashboard en **http://localhost:8080** (Docker) o **http://localhost:5173** (dev)
2. Ingresa tu **Master Key** (la `API_KEY` del archivo `.env`)
3. Opcionalmente activa **Recordar clave** para no tener que ingresarla en cada visita
4. Haz clic en el ojo (👁) para ver/ocultar la clave mientras la escribis

---

## Secciones del Dashboard

### 🏠 Dashboard (Control de Sistema)

Vista principal del sistema. Muestra:

- **4 KPIs superiores**:
  - 🔴/🟢 **Estado del Motor**: si Ollama esta online u offline
  - 💾 **Almacenamiento Local**: GB libres con barra de uso
  - 🌐 **Tunel Ngrok**: estado del tunel + boton START/STOP + URL
  - 🛡️ **Sesiones Activas**: cantidad de requests registrados

- **Ultimos Accesos al Perimetro**: tabla en tiempo real de las ultimas 8 conexiones al servidor

- **Modelos Disponibles**: lista rapida de los modelos instalados (nombres + tamaño)

- **IPs Bloqueadas**: lista de IPs en blacklist con boton UNBAN

---

### ▶ Playground (Terminal de Inferencia)

Terminal directa para chatear con los modelos instalados.

1. Selecciona el modelo desde el selector desplegable
2. Escribe tu prompt en el campo inferior
3. Haz clic en el boton enviar (▶) o presiona Enter
4. Ajusta parametros avanzados con el boton de configuracion (⚙)

**Parametros disponibles**:
- **Temperatura** (0-2): controla la creatividad
- **Context window** (num_ctx): tamano del contexto
- **Top-p, Top-k**: controladores de probabilidad

---

### 🗃️ Repositorio de Modelos

#### Descarga de modelos

**Opcion A — Nombre exacto** (mas rapido):
1. Escribe el nombre con tag exacto: `llama3.2:3b` o `mistral:7b`
2. Haz clic en el boton **＋** → descarga inmediata

**Opcion B — Busqueda en libreria** (exploracion):
1. Escribe un termino: `vision`, `code`, `small`
2. Presiona **Enter** → el servidor consulta `ollama.com/library` en tiempo real
3. Haz clic en la tarjeta del modelo que quieras → descarga automatica

> 💡 Podes explorar todos los modelos disponibles en [ollama.com/library](https://ollama.com/library)

#### Progreso de descarga
Mientras se descarga, aparece una barra de progreso animada con el porcentaje en tiempo real (via WebSocket).

#### Modelos instalados
- **↻ Actualizar**: re-descarga el modelo para obtener la ultima version
- **🗑️ Eliminar**: borra el modelo del disco (pide confirmacion)

---

### 🛡️ Centro de Seguridad

#### Panel de Control
- **Terminales Bloqueadas**: lista de IPs baneadas con boton UNBAN por IP
- **AUTO-PROTOCOLO**: indica que el sistema banea IPs despues de 5 intentos fallidos automaticamente
- **BOTON PANICO**: descarga todos los modelos de VRAM instantaneamente (emergencia de memoria)

#### Auditoria de Accesos

Registro completo de todas las conexiones al servidor:

- **Filtros**: TODOS / OK (exitosos) / ERROR (fallidos)
- **Busqueda**: por IP o por endpoint (`/v1/models`, `/api/status`, etc.)
- **Indicador LED**: punto verde = exitoso, rojo = fallido
- **Boton BAN**: banear la IP directamente desde el log

---

### 🔧 Mantenimiento

Accesible desde el sidebar → **Limpiar Cache**:
- Elimina archivos temporales y descargas huerfanas del workspace de Ollama
- Muestra cuantos GB se liberaron

---

### 🔩 Hardware Sentinel

Monitoreo y control de recursos del sistema:

- **Auto-unload de modelos inactivos**: configura el timeout
- **Configuracion de contexto global**: establece num_ctx para todos los modelos
- **Monitoreo de recursos**: CPU, RAM, GPU, temperatura

---

### ⚙️ Engine Tuner

Calculador de costos operativos:

- **Precio cloud** (USD/1M tokens): para comparar con servicios externos
- **Tarifa de electricidad** (ARS/kWh): costo local de energia
- **Calculos de costo operativo**: cuanto te cuesta cada inferencia

---

### 📊 Telemetria

Graficas y estadisticas de rendimiento:

- **TTFT** (Time To First Token): tiempo hasta la primera respuesta
- **Throughput** (tokens/sec): velocidad de generacion
- **Historicos y percentiles**: tendencias a lo largo del tiempo

---

## Control de Ngrok

El tunel Ngrok te permite exponer el servidor a internet (util para acceder desde fuera de tu red local o para conectar herramientas externas).

| Estado | Significado |
|---|---|
| `LOCAL_ONLY` + boton START | Servidor solo accesible localmente |
| `TUNNEL_ACTIVE` + URL + boton STOP | Servidor accesible desde internet via la URL mostrada |

## Flujos de comunicacin

### Autenticacin
1. Usuario ingresa API key en login
2. Se almacena localmente (opcional)
3. Se enva en header `x-api-key` en cada solicitud
4. Si falla: 401, vuelve a pedir login

### Polling de estado
- `GET /api/status/fast` cada 60 segundos
- Bajo costo, incluye campos clave
- Sustituye `/api/status` (backward compatible)
- Actualiza UI de estado del dashboard

### Eventos WebSocket
- `pull-progress`: Descarga de modelo en progreso
- `security-alert`: Alerta de seguridad
- `new-access`: Nuevo acceso registrado

### Streaming de chat
- Iniciar: `POST /v1/chat/completions` con `stream=true`
- Recibir: SSE chunks con formato OpenAI
- Parsear tokens individuales
- Renderizar markdown a medida que llegan

## Stack de dependencias
```
React 19
   react-dom 19
   axios (HTTP)
   socket.io-client (WebSockets)
   react-markdown (Markdown render)
   remark-gfm (GitHub Flavored Markdown)
   lucide-react (Iconos)
```

## Build y deployment

### Desarrollo
```bash
cd mcp-frontend
npm install
npm run dev
```

### Produccin
```bash
npm run build
# Genera dist/
# Servir con nginx, Express, etc.
```

### Docker
Incluido en `docker-compose.yml` bajo servicio `mcp-frontend`.

## Variables de entorno
```bash
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## Siguiente lectura
- [[Indice-Frontend| Volver a Frontend]]


