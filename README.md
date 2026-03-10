# 🦙 LaLlamaStation MCP

> **Panel de control local para modelos LLM de Ollama con seguridad avanzada, telemetría en tiempo real y API compatible con OpenAI.**

[![Version](https://img.shields.io/badge/version-0.3.0-blue?style=flat-square)](./CHANGELOG.md)
[![Docker](https://img.shields.io/badge/docker-compose-2496ED?style=flat-square&logo=docker)](./docker-compose.yml)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)

---

## ¿Qué es LaLlamaStation MCP?

LaLlamaStation MCP es un servidor de control (**Model Control Panel**) que envuelve a [Ollama](https://ollama.com) con:

- 🔐 **Seguridad**: autenticación por API Key, blacklist de IPs, auto-ban, rate limiting
- 📊 **Telemetría**: monitor de disco, VRAM, tráfico y sesiones activas
- 🌐 **API OpenAI-compatible**: conecta cualquier cliente que soporte la API de OpenAI (Claude Desktop, LibreChat, etc.)
- 🖥️ **Dashboard Web**: interfaz de administración premium con glassmorphism
- 🔌 **Túnel Ngrok**: expone el servidor al exterior con un click desde la web
- 🔍 **Gestor de Modelos**: busca, descarga y elimina modelos directamente desde el dashboard

---

## Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/lallama-station-mcp.git
cd lallama-station-mcp

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu API_KEY y NGROK_AUTHTOKEN (opcional)

# 3. Levantar el stack completo
docker compose up -d

# 4. Acceder al Dashboard
open http://localhost:8080
```

> Para instalación detallada, ver [`docs/INSTALLATION.md`](./docs/INSTALLATION.md)

---

## Estructura del Proyecto

```
MPC-Ollama-Local/
├── docker-compose.yml          # Stack completo
├── .env.example                # Variables de entorno plantilla
├── CHANGELOG.md                # Historial de versiones
├── docs/                       # Documentación completa
│   ├── ARCHITECTURE.md         # Arquitectura del sistema
│   ├── USER_MANUAL.md          # Manual de usuario
│   ├── INSTALLATION.md         # Guía de instalación
│   └── API.md                  # Referencia de la API REST
├── ollama-mcp-server/          # Backend Node.js + MCP
│   └── src/
│       ├── main.ts             # Entry point Express + endpoints
│       ├── app.module.ts       # Módulo principal
│       ├── auth/               # Autenticación
│       └── ollama/             # Servicio de Ollama
└── mcp-frontend/               # Frontend Vite + React
    └── src/
        ├── App.tsx             # Componente raíz + routing
        ├── components/
        │   ├── Telemetry.tsx   # KPIs + control ngrok
        │   ├── ModelList.tsx   # Gestión de modelos
        │   ├── ChatPlayground.tsx  # Terminal de inferencia
        │   ├── SecurityPanel.tsx   # Blacklist + pánico
        │   └── IpLogs.tsx      # Auditoría de accesos
        └── services/
            └── socket.service.ts   # WebSockets
```

---

## Documentación

| Documento | Descripción |
|---|---|
| [Instalación](./docs/INSTALLATION.md) | Guía paso a paso para Docker y ejecución local |
| [Manual de Usuario](./docs/USER_MANUAL.md) | Cómo usar el dashboard |
| [Arquitectura](./docs/ARCHITECTURE.md) | Diagrama y diseño del sistema |
| [API Reference](./docs/API.md) | Todos los endpoints REST disponibles |
| [Changelog](./CHANGELOG.md) | Historial de versiones |

---

## Tecnologías

| Capa | Stack |
|---|---|
| **Runtime LLM** | [Ollama](https://ollama.com) |
| **Backend** | Node.js, Express, TypeScript, Socket.io |
| **Protocolo MCP** | `@modelcontextprotocol/sdk` |
| **Frontend** | React 19, Vite, TypeScript |
| **Infraestructura** | Docker Compose, Ngrok |
| **Scraping** | Cheerio |
| **Control Docker** | Dockerode |

---

## Licencia

MIT © 2026 ARGenteIA
