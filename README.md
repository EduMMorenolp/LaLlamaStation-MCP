# Ollama Remote MCP Server (Docker + ngrok + Security)

Este proyecto permite exponer tus modelos locales de **Ollama** a través de un túnel seguro de **ngrok** utilizando el protocolo **MCP (Model Context Protocol)**. Está diseñado con una arquitectura modular inspirada en NestJS y corre completamente en Docker.

## 🚀 Características

- **Acceso Remoto Seguro**: Túnel automático con ngrok.
- **Autenticación**: Protección mediante `X-API-KEY`.
- **Arquitectura Modular**: Estructura de componentes (Services, Modules, Tools) en TypeScript.
- **Gestión de Modelos**: Herramienta para descargar modelos (`pull_model`) remotamente.
- **Ready-to-use**: Incluye el motor de Ollama, el servidor MCP y el túnel en un solo `docker-compose`.

---

## 🛠️ Configuración

### 1. Requisitos

- Docker y Docker Compose instalados.
- Un Authtoken de ngrok (puedes obtenerlo gratis en [dashboard.ngrok.com](https://dashboard.ngrok.com)).

### 2. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en el ejemplo:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

- `NGROK_AUTHTOKEN`: Tu token de ngrok.
- `API_KEY`: Una clave secreta de tu elección para proteger el acceso.

---

## 🐳 Despliegue

Inicia el stack completo con Docker:

```bash
docker-compose up -d --build
```

### Verificar el estado

- **Ollama**: Corriendo en `http://localhost:11434`
- **MCP Server**: Corriendo en `http://localhost:3000`
- **ngrok**: Puedes ver tu URL pública en el dashboard de ngrok o en los logs:
  ```bash
  docker logs mcp-ngrok-tunnel
  ```

---

## 🖥️ Uso

Para conectar un cliente MCP (como **Claude Desktop**) desde otra PC, usa el transporte **SSE** con la URL de tu túnel de ngrok:

**Configuración de Claude Desktop (remoto):**

```json
{
  "mcpServers": {
    "ollama-remoto": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/inspector",
        "https://tu-subdominio.ngrok-free.app/sse"
      ]
    }
  }
}
```

### Herramientas Disponibles

En cada llamada a una herramienta, es obligatorio incluir el parámetro `apiKey`.

1. **`list_models`**: Lista los modelos instalados en tu PC local.
2. **`pull_model`**: Descarga un modelo nuevo de la librería de Ollama (ej: `llama3`).
3. **`generate`**: Generación simple de texto.
4. **`chat`**: Interacción de chat manteniendo el contexto de mensajes.

#### Ejemplo de uso (Herramienta `chat`):

```json
{
  "model": "llama3",
  "messages": [{ "role": "user", "content": "¿Cómo estás?" }],
  "apiKey": "tu_clave_segura_definida_en_env"
}
```

---

## 📂 Estructura del Código

- `src/main.ts`: Entrada de la aplicación y servidor Express con SSE.
- `src/app.module.ts`: Orquestación de módulos.
- `src/ollama/`: Lógica de integración con la API de Ollama y herramientas MCP.
- `src/auth/`: Validación de seguridad.

---

## 📄 Licencia

MIT
