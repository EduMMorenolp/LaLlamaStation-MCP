# Getting Started

## Requisitos minimos
- **Docker**: Docker Desktop (Windows/Mac) o Docker Engine (Linux)
- **GPU** (opcional): NVIDIA GPU + drivers + CUDA (recomendado para inferencia rpida)
- **docker compose**: incluido en Docker Desktop o instalable por separado

## Paso 1: Clonar y configurar
```bash
git clone <repo>
cd LaLlamaStation\ MCP
cp .env.example .env
```

## Paso 2: Editar `.env`
Define estos valores mnimos:
```bash
API_KEY=mcp_clave_segura_123
APP_PORT=3000
NGROK_AUTHTOKEN=tu_token_aqui  # solo si expones publico
OLLAMA_URL=http://ollama:11434
```

## Paso 3: Levantar el stack
```bash
docker compose up -d --build
```

Verifica que los contenedores esten corriendo:
```bash
docker ps
```

## URLs locales despus de arrancar
- **Frontend Dashboard**: `http://localhost:8080`
- **Backend API REST**: `http://localhost:3000`
- **MCP SSE endpoint**: `http://localhost:3000/sse`

## Paso 4: Probar con curl
```bash
curl -H "x-api-key: mcp_clave_segura_123" \
  http://localhost:3000/v1/models
```

Deberas recibir un JSON con la lista de modelos.

## Paso 5 (Opcional): Build local
Si prefires compilar el proyecto localmente:

**Backend**:
```bash
cd ollama-mcp-server
npm install
npm run build
```

**Frontend**:
```bash
cd mcp-frontend
npm install
npm run build
```

## Siguiente lectura
- [[Instalacion|Instalacion detallada]]


