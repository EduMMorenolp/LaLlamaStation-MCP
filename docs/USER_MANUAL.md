# 📖 Manual de Usuario — LaLlamaStation MCP

## Primer Acceso

1. Abre el dashboard en **http://localhost:8080** (Docker) o **http://localhost:5173** (dev)
2. Ingresa tu **Master Key** (la `API_KEY` del archivo `.env`)
3. Optionalmente activa **Recordar clave** para no tener que ingresarla en cada visita
4. Haz clic en el ojo (👁) para ver/ocultar la clave mientras la escribís

---

## Secciones del Dashboard

### 🏠 Dashboard (Control de Sistema)

Vista principal del sistema. Muestra:

- **4 KPIs superiores**:
  - 🔴/🟢 **Estado del Motor**: si Ollama está online u offline
  - 💾 **Almacenamiento Local**: GB libres con barra de uso
  - 🌐 **Túnel Ngrok**: estado del túnel + botón START/STOP + URL
  - 🛡️ **Sesiones Activas**: cantidad de requests registrados

- **Últimos Accesos al Perímetro**: tabla en tiempo real de las últimas 8 conexiones al servidor

- **Modelos Disponibles**: lista rápida de los modelos instalados (nombres + tamaño)

- **IPs Bloqueadas**: lista de IPs en blacklist con botón UNBAN

---

### ▶ Playground (Terminal de Inferencia)

Terminal directa para chatear con los modelos instalados.

1. Selecciona el modelo desde el selector desplegable
2. Escribe tu prompt en el campo inferior
3. Haz clic en el botón enviar (▶) o presiona Enter
4. Ajusta parámetros avanzados con el botón de configuración (⚙)

---

### 🗃️ Repositorio de Modelos

#### Descarga de modelos

**Opción A — Nombre exacto** (más rápido):
1. Escribe el nombre con tag exacto: `llama3.2:3b` o `mistral:7b`
2. Haz clic en el botón **＋** → descarga inmediata

**Opción B — Búsqueda en librería** (exploración):
1. Escribe un término: `vision`, `code`, `small`
2. Presiona **Enter** → el servidor consulta `ollama.com/library` en tiempo real
3. Haz clic en la tarjeta del modelo que quieras → descarga automática

> 💡 Podés explorar todos los modelos disponibles en [ollama.com/library](https://ollama.com/library)

#### Progreso de descarga
Mientras se descarga, aparece una barra de progreso animada con el porcentaje en tiempo real (vía WebSocket).

#### Modelos instalados
- **↻ Actualizar**: re-descarga el modelo para obtener la última versión
- **🗑️ Eliminar**: borra el modelo del disco (pide confirmación)

---

### 🛡️ Centro de Seguridad

#### Panel de Control
- **Terminales Bloqueadas**: lista de IPs baneadas con botón UNBAN por IP
- **AUTO-PROTOCOLO**: indica que el sistema banea IPs después de 5 intentos fallidos automáticamente
- **BOTÓN PÁNICO**: descarga todos los modelos de VRAM instantáneamente (emergencia de memoria)

#### Auditoría de Accesos

Registro completo de todas las conexiones al servidor:

- **Filtros**: TODOS / OK (exitosos) / ERROR (fallidos)
- **Búsqueda**: por IP o por endpoint (`/v1/models`, `/api/status`, etc.)
- **Indicador LED**: punto verde = exitoso, rojo = fallido
- **Botón BAN**: banear la IP directamente desde el log

---

### 🔧 Mantenimiento

Accesible desde el sidebar → **Limpiar Caché**:
- Elimina archivos temporales y descargas huérfanas del workspace de Ollama
- Muestra cuántos GB se liberaron

---

## Control de Ngrok

El túnel Ngrok te permite exponer el servidor a internet (útil para acceder desde fuera de tu red local o para conectar herramientas externas).

| Estado | Significado |
|---|---|
| `LOCAL_ONLY` + botón START | Servidor solo accesible localmente |
| `TUNNEL_ACTIVE` + URL + botón STOP | Servidor accesible desde internet via la URL mostrada |

> ⚠️ **Seguridad**: cuando Ngrok está activo, el servidor es accesible públicamente. Asegurate de tener una API Key fuerte.

---

## Atajos y Tips

| Acción | Cómo |
|---|---|
| Refrescar datos del dashboard | Botón ↻ en el header |
| Ver/ocultar la master key | 👁 en el campo de login |
| Banear una IP rápido | Botón BAN en la auditoría |
| Copiar URL de ngrok | Botón 📋 al lado de la URL |
| Descargar modelo directo | Escribe `nombre:tag` + botón ＋ |

---

## Preguntas Frecuentes

**¿Puedo usar LaLlamaStation con Claude Desktop?**
Sí. Agrega el servidor SSE como herramienta MCP en la configuración de Claude Desktop. Ver [INSTALLATION.md](./INSTALLATION.md#integración-con-claude-desktop).

**¿Los modelos se pierden si reinicio Docker?**
No. Los modelos se almacenan en un volumen Docker persistente (`ollama_data`) que sobrevive a reinicios.

**¿Qué pasa si el espacio en disco baja del 10%?**
La barra de almacenamiento se pone roja como alerta visual. El servidor no bloquea descargas automáticamente, pero es recomendable eliminar modelos que no usás.

**¿Puedo conectar múltiples clientes con la misma API Key?**
Sí, la misma API Key puede ser usada desde múltiples clientes simultáneamente. El rate limit aplica por IP de origen.
