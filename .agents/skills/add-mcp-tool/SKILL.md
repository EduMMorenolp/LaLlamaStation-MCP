---
name: add-mcp-tool
description: Use this skill when the user wants to expose a new tool or resource via the Model Context Protocol (MCP) server in LaLlamaStation.
---

# Skill: Expose a new MCP Tool

## Overview
LaLlamaStation MCP includes an MCP Server implementation. MCP allows external clients (like Claude Desktop) to request context (Resources), capabilities (Tools), or predefined tasks (Prompts).

## Implementing a new MCP Tool

### 1. Add Tool Definition
In `ollama-mcp-server/src/mcp/tools.ts` (or similar registry):

```typescript
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Register the tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "my_custom_action",
        description: "What this action does (clear instructions for the LLM)",
        inputSchema: {
          type: "object",
          properties: {
            parameterName: { type: "string", description: "Param description" }
          },
          required: ["parameterName"]
        }
      }
      // ... existing tools
    ]
  };
});
```

### 2. Implement Tool Execution
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "my_custom_action") {
    const param = String(request.params.arguments?.parameterName);
    
    try {
      const result = await doAction(param);
      return {
        content: [
          {
            type: "text",
            text: `Success: ${result}`
          }
        ]
      };
    } catch (e) {
       return {
         isError: true,
         content: [{ type: "text", text: `Error: ${e.message}` }]
       };
    }
  }
  
  throw new Error("Tool not found");
});
```

### 3. Testing
Requires an MCP client (like the MCP Inspector).
```bash
npx @modelcontextprotocol/inspector node dist/mcp/index.js
```

## Checklist
- [ ] Added to `ListToolsRequestSchema`
- [ ] Implemented in `CallToolRequestSchema`
- [ ] Error handling prevents server crash
- [ ] Tested via MCP Inspector
