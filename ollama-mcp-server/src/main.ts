import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { AppModule } from "./app.module.js";

const app = express();
app.use(express.json()); // Necesario para procesar JSON en la API estándar
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

// --- Middleware de Autenticación para API Estándar ---
const authMiddleware = (req: Request, res: Response, next: Function) => {
  const apiKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.toString().replace("Bearer ", "");

  if (appModule.authService.validate(apiKey as string)) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized: Invalid API Key" });
  }
};

// --- Rutas de Compatibilidad OpenAI ---

// 1. Listar modelos (OpenAI Format)
app.get("/v1/models", authMiddleware, async (req, res) => {
  try {
    const models = await appModule.ollamaService.listModels();
    res.json({
      object: "list",
      data: models.map((m) => ({
        id: m.name,
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: "ollama",
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Chat Completions (OpenAI Format)
app.post("/v1/chat/completions", authMiddleware, async (req, res) => {
  const { model, messages, stream } = req.body;

  try {
    const response = await appModule.ollamaService.chat(model, messages);

    // Simplificado para no-streaming por ahora
    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: response,
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Endpoints MCP (SSE) ---

let transport: SSEServerTransport | null = null;

app.get("/sse", async (req: Request, res: Response) => {
  console.log("New SSE connection");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport active");
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Servidor Híbrido Iniciado`);
  console.log(`----------------------------------`);
  console.log(`MCP SSE: http://localhost:${port}/sse`);
  console.log(`OpenAI API: http://localhost:${port}/v1`);
  console.log(`----------------------------------\n`);
  console.log(`Utiliza tu API_KEY definida en el .env para autenticarte.`);
});
