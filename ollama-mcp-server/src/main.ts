import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { AppModule } from "./app.module.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

const app = express();

// --- Middleware de Seguridad (Fase 1) ---
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
const port = process.env.APP_PORT || 3000;
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: "*", // En producción se debe restringir
  },
});

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
appModule.bootstrap(server, io);

// --- Middleware de Seguridad Avanzada (Fase 2) ---
const securityMiddleware = (req: Request, res: Response, next: Function) => {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
  
  if (appModule.ollamaService.isBlacklisted(ip)) {
    return res.status(403).json({ error: "Forbidden: Your IP is blacklisted" });
  }
  next();
};

app.use(securityMiddleware);

const authMiddleware = (req: Request, res: Response, next: Function) => {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
  const apiKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.toString().replace("Bearer ", "");

  const action = `${req.method} ${req.path}`;

  if (appModule.authService.validate(apiKey as string)) {
    appModule.ollamaService.logRequest(ip, action, "Success");
    next();
  } else {
    appModule.ollamaService.logRequest(ip, action, "Unauthorized");
    appModule.ollamaService.reportFailedAuth(ip);
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

httpServer.listen(port, () => {
  console.log(`\n🚀 Servidor Híbrido Blindado Iniciado`);
  console.log(`----------------------------------`);
  console.log(`MCP SSE: http://localhost:${port}/sse`);
  console.log(`OpenAI API: http://localhost:${port}/v1`);
  console.log(`WebSockets: Activo`);
  console.log(`----------------------------------\n`);
  console.log(`Utiliza tu API_KEY definida en el .env para autenticarte.`);
});

export { io };
