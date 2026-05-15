# 🧠 Postman Collection — LaLlamaStation Brain MCP

Esta carpeta contiene herramientas para debuggear y testear el **Shared Brain MCP Server**.

## 📂 Archivos

| Archivo | Propósito |
|---|---|
| `LaLlamaStation Brain MCP.postman_collection.json` | Colección Postman completa (29 requests) |
| `get-session-id.js` | Helper para extraer sessionId de la conexión SSE |
| `README.md` | Esta guía |

## 🚀 Cómo usar

### 1. Importar la colección en Postman

1. Abre Postman
2. `File → Import` (o `Ctrl+O`)
3. Selecciona `LaLlamaStation Brain MCP.postman_collection.json`
4. Ve a la pestaña **Variables** y verifica:
   - `brain_url` → `http://localhost:3015` (o tu URL)
   - `my_agent_identity` → `Postman Debug Client` (o tu nombre)

### 2. Obtener un sessionId (necesario para MCP)

**Opción A — Helper script (recomendado):**
```bash
node postman/get-session-id.js
```
Esto se conecta al SSE, extrae el sessionId y te da comandos curl listos para usar.

**Opción B — curl manual:**
```bash
# Terminal 1: Conectar SSE (esperar)
curl -N http://localhost:3015/sse

# Busca en la salida algo como:
# event: endpoint
# data: /messages?sessionId=abc123...
```

**Opción C — Postman directamente:**
1. Ejecuta `GET {{brain_url}}/sse` (carpeta Setup)
2. Revisa los headers de respuesta
3. Si ves `Set-Cookie` o eventos SSE, extrae el sessionId

### 3. Probar los endpoints

Una vez tengas el `sessionId`, asígnelo a la variable `{{session_id}}` y ejecuta:

```
🔌 Setup & Health Check
  → GET /mcp              (verificar que el servidor está vivo)

📡 MCP Protocol
  → Initialize            (negociar protocolo MCP)
  → ListTools             (ver catálogo de herramientas)
  → mem_save              (guardar una memoria de prueba)
  → mem_my_compliance     (ver tu compliance)
  → mem_search            (buscar memorias)

🐛 Debug Scenarios
  → Compliance Flow       (verificar que audit y reminder funcionan)
```

## 🔍 Flujo de Debugging Recomendado

```
1. GET /mcp                    → ¿Servidor vivo?
2. GET /sse                    → Obtener sessionId
3. POST /messages (Initialize) → Negociar protocolo
4. POST /messages (ListTools)  → ¿Se ven las 17+ herramientas?
5. POST /messages (mem_save)   → ¿Guarda correctamente?
6. POST /messages (mem_search) → ¿Aparece el Compliance Reminder? (si no has guardado)
7. POST /messages (mem_my_compliance) → ¿Score de compliance correcto?
```

## 📊 Verificación de las Capas de Auditoría

| Capa | Cómo verificarla en Postman |
|---|---|
| **Capa 1 — Auditoría** | Ejecuta cualquier tool → se registra automáticamente en SQLite |
| **Capa 3 — Compliance Reminder** | Ejecuta `mem_search` SIN haber hecho `mem_save` → respuesta incluye reminder |
| **Capa 4 — Agent Identity** | Ejecuta `ListTools` → cada tool tiene campo `agent` en su schema |
| **Capa 5 — mem_my_compliance** | Ejecútalo varias veces entre saves para ver el score cambiar |

## 🐛 Troubleshooting

| Síntoma | Causa | Solución |
|---|---|---|
| `No active SSE session` | sessionId inválido o expirado | Obtén un nuevo sessionId con `get-session-id.js` |
| `ECONNREFUSED` | Brain no está corriendo | `cd mcp-brain && npm start` |
| `Unexpected token` | Puerto incorrecto | Verifica `BRAIN_PORT` en tu .env |
| Compliance siempre 0% | No has hecho mem_save | Ejecuta `mem_save` primero |
