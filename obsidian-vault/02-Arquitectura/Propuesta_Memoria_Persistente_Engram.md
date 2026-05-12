# 🧠 Propuesta Técnica: Sistema de Memoria Persistente (Estilo Engram) en LaLlamaStation

Este documento detalla la viabilidad, el diseño y la arquitectura para dotar a **LaLlamaStation MCP** de un sistema de **memoria persistente a largo plazo** para agentes de IA (al estilo de *Engram*), potenciando la plataforma de un simple panel de control a un **Middleware de Orquestación y Memoria Cognitiva**.

---

## 1. Visión General: ¿Por qué en LaLlamaStation?

Los agentes de IA (como Claude Code, Cursor, Antigravity o el propio Gemini) olvidan el contexto de desarrollo al cerrar la sesión o reiniciar el hilo de chat. *Engram* resuelve esto exponiendo un servidor MCP con herramientas de persistencia y búsqueda en SQLite.

Al integrar este concepto en **LaLlamaStation**, obtenemos beneficios únicos que un binario aislado no puede ofrecer:

1. **Cero Configuración Adicional**: Al usar LaLlamaStation como proxy MCP principal, los agentes obtienen las herramientas de memoria automáticamente junto con las de Ollama.
2. **Superpoder Semántico (Ollama Embeddings)**: Mientras que Engram depende exclusivamente de búsqueda léxica (FTS5), LaLlamaStation puede generar **vectores de embeddings** usando modelos locales en Ollama (ej. `nomic-embed-text` o `all-minilm`) para ofrecer búsquedas semánticas híbridas ultra-precisas.
3. **Consola Visual "Cerebro" (Frontend)**: Podemos diseñar una interfaz premium con glassmorphism en el dashboard de React, permitiendo al usuario auditar, buscar, editar, borrar y categorizar los recuerdos del agente de manera gráfica.

---

## 2. Arquitectura de Componentes

El sistema se compone de tres capas perfectamente integradas en el ecosistema actual de LaLlamaStation:

```mermaid
graph TD
    subgraph Agente_IA [Agente de IA (Cursor/Claude Code/etc.)]
        A[Llamada MCP]
    end

    subgraph Backend [mcp-server (Node.js + TS)]
        B[MCP Server Router] -->|Ollama Tools| C[Ollama Service]
        B -->|Memory Tools| D[Memory Service]
        D -->|SQL & FTS5| E[(SQLite Local DB)]
        D -->|Genera Vectors| C
    end

    subgraph Frontend [mcp-frontend (React)]
        F[Dashboard Web] -->|Socket.IO| G[Real-time Events]
        F -->|REST API| D
    end

    C -->|Inferencia / Embeddings| H[(Ollama Engine)]
```

### A. Capa de Datos (SQLite + FTS5)
* **Motor**: SQLite3 integrado en Node.js (usando `sqlite3` o `sqlite` para promesas, altamente portátil y seguro de instalar en entornos multi-plataforma/Docker).
* **Ubicación de la BD**: `.data/lallama-memory.db` (en el volumen persistente de Docker para evitar pérdidas).
* **FTS5**: Activación de una tabla virtual FTS5 para indexar y buscar rápidamente de forma léxica en títulos, descripciones y lecciones aprendidas.

### B. Capa de Inferencia Semántica (Ollama Vector Embeddings)
* Cada vez que el agente llama a `mem_save`, el `MemoryService` extrae el contenido clave y hace una llamada interna asíncrona a Ollama para generar embeddings vectoriales del recuerdo.
* Los vectores de floats (ej. dimensión 768) se guardan en una columna JSON de SQLite.
* **Cálculo de Similitud**: Se realiza una comparación de distancia coseno en memoria (Node.js) al buscar. Como el volumen típico de recuerdos de un proyecto es de cientos o miles (no millones), esto es instantáneo y evita depender de bases de datos vectoriales complejas como Chroma o pgvector.

### C. Capa de Eventos en Tiempo Real (Socket.IO)
* Al guardar, actualizar o borrar recuerdos, el backend emite eventos (`memory-saved`, `memory-deleted`) a través de Socket.IO.
* Esto permite que la interfaz web del usuario se actualice al instante a medida que el agente trabaja en segundo plano.

---

## 3. Catálogo de Herramientas MCP Propuestas (10 Herramientas Clave)

Para mantenerlo ágil, modular y altamente compatible con el ecosistema de agentes, proponemos implementar estas herramientas clave:

| Herramienta MCP | Parámetros Clave | Propósito |
|---|---|---|
| `mem_save` | `title`, `content`, `type`, `tags`, `project` | Guarda un nuevo recuerdo (decisión, bugfix, arquitectura, regla). |
| `mem_update` | `id`, `title`, `content`, `tags` | Actualiza un recuerdo existente. |
| `mem_delete` | `id` | Elimina un recuerdo. |
| `mem_search` | `query`, `project`, `mode` (`lexical` o `semantic`) | Busca recuerdos relevantes usando FTS5 o similitud de vectores de Ollama. |
| `mem_context` | `project`, `limit` | Recupera recuerdos recientes para inyectar contexto automático. |
| `mem_timeline` | `project`, `limit` | Obtiene una vista cronológica de los hitos del proyecto. |
| `mem_session_start` | `session_name`, `project` | Inicia una sesión lógica de trabajo para agrupar recuerdos. |
| `mem_session_end` | `session_id`, `summary` | Finaliza la sesión y guarda un resumen estructurado. |
| `mem_stats` | `project` | Devuelve métricas (número de recuerdos, distribución de tipos, top tags). |
| `mem_suggest_tags`| `title`, `content` | Analiza el texto para proponer etiquetas adecuadas. |

---

## 4. Diseño del Frontend: La Consola "Cerebro" (React + Glassmorphism)

Se propone agregar una pestaña **"Cerebro" (o "Memoria")** en el Dashboard actual. El diseño respetará estrictamente la estética **Premium Dark Mode** y contará con:

1. **Métricas Principales (KPI Cards)**:
   * Total de Recuerdos
   * Sesiones de Trabajo Registradas
   * Modelo de Embedding Activo (Ollama)
2. **Timeline de Eventos interactivo**:
   * Una línea de tiempo vertical de estilo futurista que muestra las decisiones, bugfixes y descubrimientos del agente con colores diferenciados por categoría.
3. **Buscador Híbrido**:
   * Barra de búsqueda con un interruptor deslizante para cambiar entre:
     * 🔍 **Léxico (FTS5)**: Coincidencias exactas de palabras.
     * 🧠 **Semántico (IA)**: Conceptos relacionados (por ejemplo, buscar "base de datos" y encontrar "SQLite" o "PostgreSQL" sin que las palabras coincidan textualmente).
4. **Editor y Administrador de Recuerdos**:
   * Un panel de detalle interactivo donde el desarrollador humano puede editar el texto del recuerdo, cambiar etiquetas, o borrar "alucinaciones" o información obsoleta con un click, garantizando control total sobre la memoria del agente.

---

## 5. Plan de Implementación de 4 Fases

Si decides seguir adelante con esta característica en el futuro, podemos dividir el desarrollo en fases incrementales y seguras:

### Fase 1: Base de Datos y Servicio de Memoria (Backend)
* Instalar dependencias livianas de SQLite (`sqlite3` y `sqlite`).
* Crear la estructura de tablas (`memories`, `sessions`, `embeddings`) y migraciones automáticas al arrancar.
* Implementar `MemoryService` en Node.js.

### Fase 2: Registro de Herramientas MCP
* Integrar el catálogo de herramientas de memoria en `ollama.tools.ts` de forma opcional (que se puedan activar/desactivar en la configuración de LaLlamaStation).
* Implementar los manejadores de solicitudes (`CallToolRequestSchema`) para cada herramienta de memoria.

### Fase 3: Integración de Embeddings (Ollama)
* Añadir lógica en `MemoryService` para consumir el endpoint de embeddings de Ollama de manera asíncrona.
* Implementar el algoritmo de Similitud Coseno nativo para la búsqueda semántica.

### Fase 4: Consola "Cerebro" en el Frontend
* Crear la vista de Memoria en React con estilos e iconos premium (lucide-react).
* Conectar Socket.IO para actualización en tiempo real y diseñar la visualización del timeline y buscador híbrido.

---

> [!NOTE]
> Esta adición transformaría a LaLlamaStation en uno de los servidores MCP locales más avanzados disponibles, uniendo la gestión de infraestructura y el almacenamiento del estado cognitivo en un solo lugar.

> [!IMPORTANT]
> **No se ha realizado ninguna modificación al código fuente del backend o frontend en este paso**, respetando la directiva de mantener la propuesta como un diseño previo para análisis y discusión.
