import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getStatus = async (apiKey: string) => {
  const response = await api.get("/sse", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  // Nota: get_server_status es una tool, pero para el frontend 
  // expondremos un endpoint o usaremos la tool via MCP si fuera necesario.
  // Por ahora, consumiremos el endpoint que implementamos en el servicio.
  return response.data;
};

// Como el servidor es un MCP Server, las herramientas se llaman via JSON-RPC o SSE.
// Pero para el Dashboard, añadiremos un endpoint de conveniencia en main.ts si es necesario, 
// o usaremos el objeto appModule directamente si el frontend corre en el mismo proceso (no es el caso).

// Implementaremos un helper para llamar a las tools via la API de compatibilidad o SSE.
export const callTool = async (name: string, args: any) => {
  // Para simplicidad en esta fase, el frontend usará fetch/axios a los endpoints de main.ts
  // que expondremos para telemetría.
  const response = await api.get(`/api/status?apiKey=${args.apiKey}`);
  return response.data;
};

export const unloadVram = async (apiKey: string) => {
   // Llamada al endpoint de descarga (lo añadiremos a main.ts)
   return api.post("/api/unload", {}, { headers: { Authorization: `Bearer ${apiKey}` } });
}
