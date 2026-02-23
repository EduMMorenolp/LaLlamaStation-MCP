# Ollama Remote MCP Server (Docker + ngrok + Security)

Este proyecto permite exponer tus modelos locales de **Ollama** a través de un túnel seguro de **ngrok** utilizando el protocolo **MCP (Model Context Protocol)**. Está diseñado con una arquitectura modular inspirada en NestJS y corre completamente en Docker.

## 🚀 Características

- **Acceso Remoto Seguro**: Túnel automático con ngrok que permite conectarte desde cualquier lugar del mundo.
- **Autenticación Robusta**: Todas las herramientas requieren una `apiKey` personalizada para prevenir el uso no autorizado.
- **Arquitectura Modular**: Código organizado en servicios y módulos de TypeScript para facilitar su mantenimiento.
- **Gestión Total de Modelos**: No solo puedes chatear, sino también descargar nuevos modelos (`pull_model`) remotamente.
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

- `NGROK_AUTHTOKEN`: Pega aquí tu token de ngrok.
- `API_KEY`: Define una clave secreta (ej: `MiClaveSegura2026`). **La necesitarás en cada petición**.
- `APP_PORT`: Puerto donde correrá el servidor (por defecto `5555`).

### 3. Lanzar el Servidor

```bash
docker-compose up -d --build
```

---

## 🖥️ Cómo Conectarse desde el Exterior

Una vez que el servidor esté corriendo, necesitas obtener la **URL pública** que ngrok ha generado para ti.

### Obtener tu URL de ngrok

Ejecuta el siguiente comando en tu terminal para ver la URL:

```bash
docker logs mcp-ngrok-tunnel
```

Busca una línea que diga algo como: `https://abcd-123.ngrok-free.app`. Esa es tu puerta de enlace.

### Configurar Claude Desktop (u otro cliente)

Añade la configuración a tu cliente MCP usando el transporte **SSE**:

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

---

## 🧰 Herramientas Disponibles y Ejemplos

Cada herramienta es una "capacidad" que le das a la IA remota. **Recuerda que el parámetro `apiKey` es obligatorio en todas**.

### 1. `list_models`

Lista qué modelos tienes descargados físicamente en tu PC.

- **Argumentos**: `{ "apiKey": "tu_clave" }`

### 2. `pull_model`

Descarga un modelo nuevo de la librería de Ollama directamente a tu PC. Muy útil si quieres probar un modelo nuevo sin estar frente a tu computadora.

- **Argumentos**: `{ "model": "ministral-3:8b", "apiKey": "tu_clave" }`

### 3. `chat`

Interacción fluida con el modelo. Soporta historial de mensajes.

- **Ejemplo de argumentos**:
  ```json
  {
    "model": "ministral-3:8b",
    "messages": [{ "role": "user", "content": "Hola, ¿quién eres?" }],
    "apiKey": "tu_clave"
  }
  ```

````

### 4. `generate`
Generación simple de texto para tareas rápidas de un solo prompt.
- **Argumentos**: `{ "model": "mistral", "prompt": "Escribe un poema", "apiKey": "tu_clave" }`

---

## 🧪 Verificación del Sistema

Hemos incluido un pequeño script para verificar que el túnel esté funcionando correctamente desde tu conexión local:

```bash
node test/test_ngrok.js
````

Si ves el mensaje `✅ Conexión establecida con éxito!`, significa que el puente entre internet y tu servidor local está abierto y funcionando.

---

## 📂 Estructura del Proyecto

```text
├── ollama-mcp-server/    # Código fuente del Servidor MCP (TypeScript)
│   ├── src/
│   │   ├── auth/         # Lógica de validación de API Key
│   │   ├── ollama/       # Servicios y Herramientas (Tools)
│   │   └── main.ts       # Punto de entrada SSE/Express
├── test/                 # Scripts de prueba de conectividad
├── docker-compose.yml    # Orquestador de contenedores
└── README.md             # Esta guía
```

---

## 🛡️ Seguridad y Mantenimiento

- **Persistencia**: Los modelos se guardan en un volumen de Docker llamado `ollama_data`, por lo que no se borran al reiniciar los contenedores.
- **Logs**: Para ver qué está pasando con las peticiones, usa `docker logs -f mcp-server-app`.
- **API Key**: Nunca compartas tu `.env` ni subas el archivo al repositorio (ya está en el `.gitignore`).

---

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.
