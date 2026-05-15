# 🧠 Shared Brain — Configuración para Agentes del Equipo

Este archivo describe cómo conectar cualquier agente IA (OpenCode, Claude Desktop, Cursor, RooCode, Windsurf, Antigravity, etc.) al **cerebro compartido** de LaLlamaOllama.

---

## 📡 Conexión al Brain MCP Server

### Opción A: SSE Remoto (Recomendado para equipo)

```jsonc
// opencode.json / claude_desktop_config.json / mcp_config.json
{
  "mcpServers": {
    "lallamaollama-brain": {
      "type": "url",              // "remote" para OpenCode AI
      "url": "http://<brain-host>:3015/sse"
    }
  }
}
```

### Opción B: Stdio Local (Desarrollo)

```jsonc
{
  "mcpServers": {
    "lallamaollama-brain": {
      "type": "stdio",
      "command": "node",
      "args": ["ruta/a/mcp-brain/dist/index.js"],
      "env": {
        "DATA_DIR": "./data"
      }
    }
  }
}
```

---

## ⚠️ Reglas Obligatorias para el Agente

> **IMPORTANTE**: Copia y pega este bloque en las instrucciones de sistema de tu agente, o en el archivo de configuración del IDE:

```markdown
# Shared Brain Compliance Rules

You are connected to a shared brain MCP server (`lallamaollama-brain`).
This is a TEAM-WIDE memory system used by ALL members of the project.

## MANDATORY RULES

1. **REGISTER ALL CHANGES**: Call `mem_save` AFTER EVERY modification you make.
   - "change" = any file edit, config change, bug fix, decision, or discovery.

2. **IDENTIFY YOURSELF**: Always pass `agent` in EVERY tool call:
   - Example: `agent: "OpenCode AI / DeepSeek V4"` or `agent: "Cursor / Claude 3.5 Sonnet"`
   - This identifies who made each change in the shared timeline.

3. **CHECK CONTEXT FIRST**: Before starting work, call `mem_search` or `mem_context` 
   to see what other team members have done.

4. **COMPLIANCE IS TRACKED**: Every tool call is automatically logged in the audit system.
   - To check your own compliance: call `mem_my_compliance`
   - The system will warn you if you haven't registered changes recently.
   - Low compliance scores are visible to the team.

5. **SESSION DISCIPLINE**:
   - Call `mem_session_start` when beginning focused work
   - Call `mem_session_summary` when finishing (include what was accomplished)
   - Call `mem_session_end` to close the session

## Audit System

The brain automatically logs:
- Every tool call you make (tool name, args, timestamp, duration)
- Your compliance score (% of calls that are `mem_save`)
- Whether you've registered changes recently

You cannot opt out of this logging — it happens server-side.
```

---

## 📋 Team Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. mem_search / mem_context     ← Read existing work   │
│  2. Do your work                                        │
│  3. mem_save                     ← Register changes     │
│  4. mem_my_compliance            ← Verify compliance    │
│  5. Repeat                                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Agent not found in audit" | Pasaste el campo `agent` en tus tool calls? |
| Compliance score bajo | Llama a `mem_save` después de tus cambios |
| No veo memorias de otros agentes | Verifica que todos usen el mismo `project` |
| Conexión SSE falla | Verifica que el brain esté corriendo en `http://host:3015/sse` |

---

## 📊 Compliance is Shared Accountability

> El brain no juzga — registra. Cada miembro del equipo puede ver:
> - Qué cambió, quién lo cambió, y cuándo
> - El timeline completo del proyecto
> - Decisiones arquitectónicas y descubrimientos
>
> Usa `mem_my_compliance` para mantenerte accountable.
