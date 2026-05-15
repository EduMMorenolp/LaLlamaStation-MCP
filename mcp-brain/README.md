# LaLlamaOllama: MCP Brain Server 🧠

El **MCP Brain Server** es el módulo central de memoria a largo plazo (Long-Term Memory) de LaLlamaOllama, diseñado bajo la especificación del Model Context Protocol (MCP). Proporciona a los agentes de IA persistencia avanzada, descubrimiento relacional y análisis de contexto.

## 🌟 Características Principales

- **Memoria Persistente:** Almacenamiento seguro en SQLite con soporte para operaciones ACID mediante una cola de escritura (WriteQueue) para entornos altamente concurrentes.
- **Detección de Conflictos (Relational Graph):** El sistema evalúa proactivamente si una nueva memoria contradice, expande o reemplaza una existente utilizando grafos relacionales y heurísticas de similitud.
- **Búsqueda Híbrida Avanzada:**
  - *Léxica:* Búsqueda ultrarrápida usando FTS5 nativo de SQLite.
  - *Semántica:* Búsqueda por similitud del coseno usando embeddings generados localmente por **Ollama** (ej. `nomic-embed-text`).
- **Arquitectura de Casos de Uso:** Código altamente modular y puramente funcional, garantizando que cada operación (guardar, analizar, buscar) viva de forma aislada.
- **Interfaces de Comunicación Duales:** 
  - `stdio` (JSON-RPC) para agentes MCP.
  - `Express REST API` para consultas y analíticas desde dashboards.

## 📂 Arquitectura del Proyecto

El servidor utiliza una arquitectura orientada a Casos de Uso (Use Case Pattern) apoyada en Inyección de Dependencias funcional.

```text
mcp-brain/
├── src/
│   ├── index.ts                 # Orquestador e Inicializador
│   ├── database/                # Conexión, WriteQueue y Schemas de DB
│   ├── server/                  # Controladores MCP (stdio) y REST (Express)
│   └── services/                # Lógica de Negocio (Funciones puras)
│       ├── llm/                 # Generación y Embeddings (Ollama)
│       ├── memories/            # CRUD central y Búsquedas Híbridas
│       ├── sessions/            # Gestión de Contextos de Sesión
│       └── analysis/            # Evaluadores, Jueces y Taxonomía IA
```

## 🚀 Requisitos Previos

1. **Node.js** (v18 o superior).
2. **Ollama** ejecutándose localmente o en tu red (para embeddings y razonamiento semántico).
3. **Modelo de Embeddings:** Por defecto el cerebro usa `nomic-embed-text`. Para descargarlo, ejecuta en tu consola de Ollama:
   ```bash
   ollama run nomic-embed-text
   ```

## 🛠️ Instalación y Uso

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. (Opcional) Crea un archivo `.env` en la raíz de `mcp-brain` si tu instancia de Ollama no corre en el puerto predeterminado:
   ```env
   OLLAMA_API_URL=http://127.0.0.1:11434
   BRAIN_PORT=3015
   ```

3. Compila el proyecto:
   ```bash
   npm run build
   ```

4. Levanta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

## 🛡️ Degradación Elegante (Graceful Degradation)

El servidor está diseñado para continuar operando incluso si **Ollama** se encuentra apagado o no disponible:
- **Búsqueda Semántica:** Si los vectores matemáticos no pueden ser generados, la búsqueda híbrida realiza una caída (fallback) automática a una búsqueda léxica exacta (SQLite FTS5).
- **Delegación Cognitiva:** Si fallan las herramientas de análisis (`mem_compare` o `mem_suggest_tags`), el servidor atrapa el error y le instruye dinámicamente al **Agente de IA (MCP Client)** que asuma el control y realice el análisis usando sus propias capacidades y ventana de contexto.

## 🧩 Herramientas MCP Soportadas

Los agentes conectados a este servidor tienen acceso a las siguientes herramientas principales:
- `mem_save`: Guarda decisiones y aprendizajes. Identifica conflictos silenciosamente.
- `mem_search`: Encuentra contexto antiguo vía búsquedas híbridas.
- `mem_judge`: Evalúa si dos memorias parecidas son compatibles o si una reemplaza a la otra.
- `mem_capture_passive`: Escanea outputs largos y extrae automáticamente "Key Learnings".
- `mem_suggest_topic_key`: Agrupa conocimiento que evoluciona bajo una misma etiqueta.
- `mem_session_summary`: Obliga al agente a sintetizar sus hallazgos al final del trabajo.

---
*Desarrollado para el ecosistema modular de LaLlamaOllama.*
