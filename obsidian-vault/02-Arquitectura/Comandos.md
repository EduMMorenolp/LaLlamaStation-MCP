# Comandos tiles

Referencia rpida de comandos frecuentes.

## Docker

### Lifecycle
```bash
# Levantar todo
docker compose up -d --build

# Levantar solo backend
docker compose up -d --build mcp-server

# Recrear Ollama (aplicar cambios GPU)
docker compose up -d --force-recreate ollama

# Parar todo
docker compose down

# Parar y eliminar volmenes
docker compose down -v

# Ver estado
docker ps
docker ps -a
```

### Logs
```bash
# Backend (ltimas 120 lneas)
docker compose logs --tail=120 mcp-server

# Ollama
docker logs --tail 120 mcp-ollama-motor

# Frontend
docker compose logs --tail 50 mcp-frontend

# Seguir logs en vivo
docker compose logs -f mcp-server

# Filtrar por palabra clave
docker compose logs mcp-server | grep -i error
```

### Limpieza
```bash
# Limpiar imgenes no usadas
docker image prune -a

# Limpiar volmenes no usados
docker volume prune

# Rebuild sin cache
docker compose build --no-cache
docker compose up -d
```

## API (con curl)

### Autenticacin
```bash
# Incluir API key en header
curl -H "x-api-key: TU_API_KEY" http://localhost:3000/...

# O con Bearer token
curl -H "Authorization: Bearer TU_API_KEY" http://localhost:3000/...
```

### Modelos
```bash
# Listar modelos
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/v1/models

# Descargar modelo
curl -X POST http://localhost:3000/api/pull \
  -H "x-api-key: TU_API_KEY" \
  -d '{"model": "qwen3.5:4b"}'

# Eliminar modelo
curl -X DELETE http://localhost:3000/api/models/qwen3.5:4b \
  -H "x-api-key: TU_API_KEY"
```

### Status
```bash
# Estado rpido
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/status/fast | jq '.'

# Estado completo
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/status/full | jq '.'

# Performance metrics
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/metrics/performance | jq '.'
```

### Chat
```bash
# No-streaming
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "x-api-key: TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.5:4b",
    "messages": [{"role": "user", "content": "hola"}],
    "stream": false
  }' | jq '.'

# Streaming
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "x-api-key: TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.5:4b",
    "messages": [{"role": "user", "content": "hola"}],
    "stream": true
  }'
```

### Hardware
```bash
# Ver estado
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/hardware | jq '.'

# Auto-unload (5 minutos)
curl -X POST http://localhost:3000/api/hardware/auto-unload \
  -H "x-api-key: TU_API_KEY" \
  -d '{"minutes": 5}'

# Context window (4096 tokens)
curl -X POST http://localhost:3000/api/hardware/num-ctx \
  -H "x-api-key: TU_API_KEY" \
  -d '{"numCtx": 4096}'

# Unload models from VRAM
curl -X POST http://localhost:3000/api/unload \
  -H "x-api-key: TU_API_KEY"

# Clean cache
curl -X POST http://localhost:3000/api/clean \
  -H "x-api-key: TU_API_KEY"
```

### Seguridad
```bash
# Ver logs de acceso
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/status/full | jq '.accessLogs'

# Banear IP
curl -X POST http://localhost:3000/api/ban \
  -H "x-api-key: TU_API_KEY" \
  -d '{"ip": "192.168.1.100"}'

# Desbanear IP
curl -X POST http://localhost:3000/api/unban \
  -H "x-api-key: TU_API_KEY" \
  -d '{"ip": "192.168.1.100"}'
```

### ngrok
```bash
# Ver estado del tnel
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/ngrok/status | jq '.'

# Iniciar tnel
curl -X POST http://localhost:3000/api/ngrok/start \
  -H "x-api-key: TU_API_KEY"

# Detener tnel
curl -X POST http://localhost:3000/api/ngrok/stop \
  -H "x-api-key: TU_API_KEY"
```

## npm / Build

### Backend
```bash
# Install deps
cd ollama-mcp-server
npm install

# Build
npm run build

# Dev mode
npm run dev

# Start compiled
npm start
```

### Frontend
```bash
# Install deps
cd mcp-frontend
npm install

# Build
npm run build

# Dev server
npm run dev

# Preview build
npm run preview
```

## GPU Monitoring

### nvidia-smi
```bash
# Mostrar estado
nvidia-smi

# Actualizar cada segundo
nvidia-smi -l 1

# Ver procesos
nvidia-smi pmon

# Monitorear especficamente Ollama
nvidia-smi -l 1 | grep ollama
```

## Diagnostics

### System info
```bash
# Docker version
docker --version
docker compose --version

# Verify GPU
docker exec mcp-ollama-motor nvidia-smi

# Check network
docker inspect mcp-ollama-motor --format "{{json .NetworkSettings}}"
```

## Siguiente lectura
- [[Variables-Entorno]]


