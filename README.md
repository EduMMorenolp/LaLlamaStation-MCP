# Ollama Remote MCP & OpenAI Server (Docker + ngrok + Security)

Este proyecto permite exponer tus modelos locales de **Ollama** a través de un túnel seguro de **ngrok** utilizando el protocolo **MCP (Model Context Protocol)** y una **API compatible con OpenAI**. Está diseñado con una arquitectura modular inspirada en NestJS y corre completamente en Docker.

## 🚀 Características

- **Acceso Remoto Seguro**: Túnel automático con ngrok que permite conectarte desde cualquier lugar del mundo.
- **Servidor Híbrido**: Soporte nativo para **MCP (Claude Desktop)** y **API OpenAI** (Chatbox, TypingMind, etc.) en un solo lugar.
- **Autenticación Robusta**: Todas las peticiones requieren una `API_KEY` personalizada (vía Headers o parámetros).
- **Arquitectura Modular**: Código organizado en servicios y módulos de TypeScript.
- **Gestión Total de Modelos**: Permite descargar nuevos modelos (`pull_model`) remotamente.
- **Todo-en-Uno**: Orquestación con `docker-compose` que incluye Ollama, el puente MCP y el túnel ngrok.

---

## 🛠️ Configuración Paso a Paso

### 1. Requisitos Previos

- Tener instalado **Docker** y **Docker Compose**.
- Tener una cuenta en [ngrok](https://ngrok.com/) y obtener tu **Authtoken**.

### 2. Preparar el Entorno

Copia el archivo de ejemplo y rellena tus datos:

```bash
cp .env.example .env
```

Edita el archivo `.env`:

- `NGROK_AUTHTOKEN`: Tu token de ngrok.
- `API_KEY`: Define una clave secreta (ej: `MiClaveSegura2026`).
- `APP_PORT`: Puerto (por defecto `5555`).

### 3. Lanzar el Servidor

```bash
docker-compose up -d --build
```

---

## 🔗 Cómo Conectarse desde el Exterior

Obtén tu URL pública ejecutando:

```bash
docker logs mcp-ngrok-tunnel
```

Busca la línea: `https://tu-subdominio.ngrok-free.app`.

### Opcion A: Usar con Claude Desktop (MCP)

Configura tu `claude_desktop_config.json` usando el transporte **SSE**:

```json
{
  "mcpServers": {
    "ollama-remoto": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/inspector",
        "https://TU-URL-DE-NGROK.ngrok-free.app/sse"
      ]
    }
  }
}
```

### Opcion B: Usar con Apps de Terceros (API OpenAI)

Cualquier aplicación que soporte OpenAI (como Chatbox) puede conectarse:

- **Base URL**: `https://TU-URL-DE-NGROK.ngrok-free.app/v1`
- **API Key**: La clave que definiste en el `.env`.
- **Endpoints soportados**: `/v1/models` y `/v1/chat/completions`.

---

## 🧰 Herramientas MCP Disponibles

Si usas MCP, estas herramientas están a tu disposición (el parámetro `apiKey` es obligatorio):

1.  **`list_models`**: Lista los modelos descargados.
2.  **`pull_model`**: Descarga un modelo nuevo (ej: `llama3`).
3.  **`chat`**: Interacción de chat fluida.
4.  **`generate`**: Generación simple de texto.

---

## 🧪 Verificación del Sistema

Prueba la conectividad local (requiere `npm install` en la raíz):

```bash
node test/test_ngrok.js
```

Prueba la API OpenAI (remota):

```bash
curl -H "Authorization: Bearer TU_API_KEY" https://TU-URL-DE-NGROK.ngrok-free.app/v1/models
```

---

## 🛡️ Seguridad y Mantenimiento

- **Persistencia**: Los modelos se guardan en el volumen `ollama_data`.
- **Logs de Actividad**: `docker logs -f mcp-server-app`.
- **Importante**: No compartas tu URL de ngrok ni tu API Key públicamente.

---

## 📄 Licencia

MIT
