import { Server } from "@modelcontextprotocol/sdk/server/index";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types";
import { OllamaService } from "./ollama.service";
import { AuthService } from "../auth/auth.service";
import { z } from "zod";

export class OllamaTools {
  constructor(
    private readonly ollamaService: OllamaService,
    private readonly authService: AuthService,
  ) {}

  register(server: Server) {
    // 1. List Tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_models",
            description: "List installed Ollama models",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: {
                  type: "string",
                  description: "API Key for authentication",
                },
              },
              required: ["apiKey"],
            },
          },
          {
            name: "pull_model",
            description: "Download a new model from Ollama library",
            inputSchema: {
              type: "object",
              properties: {
                model: {
                  type: "string",
                  description: "Name of the model to pull (e.g., llama3)",
                },
                apiKey: {
                  type: "string",
                  description: "API Key for authentication",
                },
              },
              required: ["model", "apiKey"],
            },
          },
          {
            name: "generate",
            description: "Generate a response for a prompt",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string" },
                prompt: { type: "string" },
                apiKey: { type: "string" },
              },
              required: ["model", "prompt", "apiKey"],
            },
          },
          {
            name: "chat",
            description: "Send a chat message to a model",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string" },
                messages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      role: { type: "string" },
                      content: { type: "string" },
                    },
                  },
                },
                apiKey: { type: "string" },
              },
              required: ["model", "messages", "apiKey"],
            },
          },
        ],
      };
    });

    // 2. Call Tools
    server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      // Global Auth Check
      if (!this.authService.validate(args?.apiKey as string)) {
        throw new Error("Invalid API Key");
      }

      try {
        switch (name) {
          case "list_models":
            const models = await this.ollamaService.listModels();
            return {
              content: [
                { type: "text", text: JSON.stringify(models, null, 2) },
              ],
            };

          case "pull_model":
            await this.ollamaService.pullModel(args?.model as string);
            return {
              content: [
                {
                  type: "text",
                  text: `Model ${args?.model} pull initiated/completed successfully.`,
                },
              ],
            };

          case "generate":
            const genResponse = await this.ollamaService.generate(
              args?.model as string,
              args?.prompt as string,
            );
            return {
              content: [{ type: "text", text: genResponse }],
            };

          case "chat":
            const chatResponse = await this.ollamaService.chat(
              args?.model as string,
              args?.messages as any[],
            );
            return {
              content: [{ type: "text", text: chatResponse.content }],
            };

          default:
            throw new Error(`Tool ${name} not found`);
        }
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }
}
