# 📦 Guía de Instalación — LaLlamaStation MCP

## Requisitos del Sistema

| Requisito | Versión mínima | Notas |
|---|---|---|
| Docker Desktop | 24.x+ | Windows/macOS/Linux |
| Docker Compose | v2.x | Incluido con Docker Desktop |
| RAM disponible | 8 GB | 16 GB recomendado para modelos 7B+ |
| Almacenamiento | 20 GB libres | Los modelos ocupan entre 2 GB y 70 GB |
| Node.js (dev local) | 20.x | Solo si no usas Docker |

---

## Opción 1: Docker Compose (Recomendado)

### 1. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
# Clave de acceso al dashboard (cámbiala por algo seguro)
API_KEY=tu_clave_secreta_aqui

# Puerto del servidor MCP (default: 3000)
APP_PORT=3000

# Token de ngrok (opcional — solo si querés túnel externo)
# Obtenerlo en: https://dashboard.ngrok.com/get-started/your-authtoken
NGROK_AUTHTOKEN=
```

### 2. Levantar el stack

```bash
docker compose up -d
```

Esto levanta 3 contenedores:
- `mcp-ollama-motor` — Motor Ollama (puerto 11434)
- `mcp-server-app` — API MCP + Dashboard backend (puerto 3000)
- `mcp-frontend-app` — Dashboard Web (puerto 8080)

### 3. Acceder al Dashboard

Abre en el browser: **http://localhost:8080**

Ingresa la `API_KEY` que definiste en el `.env`.

### 4. Descargar tu primer modelo

Desde el Dashboard → sección **Modelos** → busca `llama3.2` y presiona **DESCARGAR**.

También podés descargarlo manualmente:
```bash
docker exec mcp-ollama-motor ollama pull llama3.2
```

---

## Opción 2: Ejecución Local (Desarrollo)

### Backend

```bash
cd ollama-mcp-server
npm install
cp .env.example .env  # configurar API_KEY y OLLAMA_URL
npm run dev
```

### Frontend

```bash
cd mcp-frontend
npm install
# Configurar .env.local:
echo "VITE_API_URL=http://localhost:3000" > .env.local
echo "VITE_SOCKET_URL=http://localhost:3000" >> .env.local
npm run dev
```

El frontend corre en **http://localhost:5173** en modo dev.

---

## Configurar Ngrok (Túnel Externo)

Para exponer el servidor a internet:

1. Crear cuenta en [ngrok.com](https://ngrok.com) (plan gratuito alcanza)
2. Copiar el authtoken desde el dashboard de ngrok
3. Pegarlo en el `.env`:
   ```env
   NGROK_AUTHTOKEN=2abc123...tu_token
   ```
4. Reiniciar el stack:
   ```bash
   docker compose up -d ngrok
   ```
5. O activarlo desde el Dashboard → Widget de Ngrok → botón **START**

---

## Integración con Claude Desktop

Agrega en `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lallama-station": {
      "url": "http://localhost:3000/sse",
      "headers": {
        "x-api-key": "tu_api_key"
      }
    }
  }
}
```

---

## Solución de Problemas

### El dashboard muestra "Sin conexión"
- Verificar que Ollama está corriendo: `docker ps | grep mcp-ollama-motor`
- Verificar logs: `docker logs mcp-server-app --tail 50`

### Error 401 Unauthorized
- La API Key ingresada no coincide con la del `.env`
- Limpiar localStorage del browser y volver a ingresar

### Los modelos no aparecen después de descargarlos
- Hacer clic en el botón de refrescar (↻) en el header del dashboard

### Ngrok no conecta
- Verificar que el `NGROK_AUTHTOKEN` es válido
- Los tokens gratuitos tienen límite de sesiones simultáneas
