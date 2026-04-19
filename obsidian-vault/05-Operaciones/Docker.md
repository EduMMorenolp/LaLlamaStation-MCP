# Docker y Compose

**Archivo principal**: `docker-compose.yml`  
**Versin**: 3.8 (warning obsoleto, funciona)

## Servicios

### ollama (mcp-ollama-motor)
**Imagen**: `ollama/ollama:latest`  
**Puerto interno**: 11434  
**GPU**: `gpus: all`  (configurado)

Almacenamiento:
- Volumen: `ollama_data:/root/.ollama` (RW)

Propsito: Motor de inferencia de modelos LLM.

### mcp-server (mcp-server-app)
**Build**: `./ollama-mcp-server`  
**Puerto externo**: 3000  
**Variables de entorno**: `.env`

Almacenamiento:
- Volumen: `ollama_data:/root/.ollama:ro` (lectura para stats)

Propsito: API gateway, auth, MCP, orquestacin.

### mcp-frontend (mcp-frontend-app)
**Build**: `./mcp-frontend`  
**Puerto externo**: 8080  
**Servidor**: Nginx

Propsito: Dashboard web React.

### ngrok (mcp-ngrok-tunnel)
**Imagen**: `ngrok/ngrok:latest`  
**Variable**: `NGROK_AUTHTOKEN`

Propsito: Exposicin pblica segura del backend (opcional).

## Comandos comunes

### Levantar todo
```bash
docker compose up -d --build
```

### Ver contenedores
```bash
docker ps
```

### Ver logs
```bash
# Backend
docker compose logs --tail=120 mcp-server

# Ollama
docker logs --tail 120 mcp-ollama-motor

# Frontend
docker compose logs --tail 50 mcp-frontend

# Todos
docker compose logs --tail=50 -f
```

### Recrear Ollama (aplicar cambios GPU)
```bash
docker compose up -d --force-recreate ollama
```

### Parar servicios
```bash
docker compose down
```

### Parar y eliminar volmenes
```bash
docker compose down -v
```

## Mantenimiento

### Limpiar imgenes no usadas
```bash
docker image prune -a
```

### Limpiar volmenes no usados
```bash
docker volume prune
```

### Rebuild sin cache
```bash
docker compose build --no-cache
docker compose up -d
```

## Verificar GPU en compose
```bash
# Inspeccionar servicio ollama
docker inspect mcp-ollama-motor --format "{{json .HostConfig.DeviceRequests}}"

# Debera mostrar algo como:
# [{"Capabilities":[["gpu"]],"Count":-1,"DeviceIDs":null}]
```

## Network
- Red automtica: `lallama-station-mcp_default`
- Servcios se comunican por nombre de servicio
- Ejemplo: `http://ollama:11434` desde backend

## Volmenes

### ollama_data
- Almacena modelos descargados
- Compartido entre ollama (RW) y backend (RO)
- Persiste entre reinicios

## Siguiente lectura
- [[Indice-Operaciones| Volver a Operaciones]]
- [[Hardware|Hardware y Recursos]]
- [[Performance-y-GPU|Performance & GPU]]


