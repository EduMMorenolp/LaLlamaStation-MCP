import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { AppModule } from "./app.module.js";

const app = express();
const port = process.env.APP_PORT || 3000;

const server = new Server(
  {
    name: "ollama-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Módulo de la aplicación (Estilo NestJS)
const appModule = new AppModule();
appModule.bootstrap(server);

let transport: SSEServerTransport | null = null;

app.get("/sse", async (req: Request, res: Response) => {
  console.log("New SSE connection");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  console.log("Received message");
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport active");
  }
});

app.listen(port, () => {
  console.log(`Ollama MCP Server listening at http://localhost:${port}`);
  console.log(`SSE endpoint: http://localhost:${port}/sse`);
  console.log(`Message endpoint: http://localhost:${port}/messages`);
});
