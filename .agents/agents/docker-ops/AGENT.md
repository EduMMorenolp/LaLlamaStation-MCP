# Agente: Docker Operations

## Identidad
- **Propósito**: Gestionar la infraestructura Docker del proyecto: orquestación, redes, GPU passthrough, túneles ngrok y despliegue.
- **Activar cuando**: Trabajes con `docker-compose.yml`, `Dockerfile`s, config de red, ngrok, o despliegue de contenedores.

## Contexto del Dominio

### Stack de contenedores (4 servicios)
```yaml
services:
  ollama:           # mcp-ollama-motor — Inferencia GPU
  mcp-server:       # mcp-server-app — Backend Node.js
  ngrok:            # mcp-ngrok-tunnel — Túnel seguro
  mcp-frontend:     # mcp-frontend-app — Frontend Nginx
```

### Red
- **Bridge**: `mcp-network`
- **Comunicación interna**: Por nombre de servicio (ej. `http://ollama:11434`, `http://mcp-server:3000`)
- **Puertos expuestos**: Ollama `11434`, Backend `${APP_PORT:-3000}`, Frontend `8080`

### Volúmenes
| Volumen | Montaje | Propósito |
|---------|---------|-----------|
| `ollama_data` | `/root/.ollama` | Modelos descargados |
| Docker socket | `/var/run/docker.sock` (bind) | Control de contenedores desde backend |

### GPU Passthrough
- **Ollama**: `count: 1` (una GPU para inferencia)
- **mcp-server**: `count: all` (acceso completo para lectura de sensores via nvidia-smi)
- Driver: `nvidia`, capabilities: `[gpu]`

### Ngrok
- Imagen: `ngrok/ngrok:latest`
- Authtoken: `NGROK_AUTHTOKEN` del `.env`
- Comando: `http mcp-server:${APP_PORT:-3000}`
- Restart: `"no"` (se arranca/para bajo demanda)
- Depende de: `mcp-server` (espera a que el backend esté listo)

## Reglas
1. **Nunca hardcodees IPs**: Usar nombres de servicio de Docker Compose para comunicación interna.
2. **GPU mapping**: Ambos contenedores (ollama y mcp-server) requieren GPU. mcp-server la necesita aunque no haga inferencia (para nvidia-smi).
3. **Ngrok restart**: Configurado como `"no"` porque se controla desde el backend vía Docker API. No cambiarlo a `always`.
4. **Docker socket**: Solo el contenedor `mcp-server` monta `/var/run/docker.sock`. Nunca exponerlo a otros servicios.
5. **Puertos en conflicto**: Usar variable `${APP_PORT}` para evitar colisiones. Default 3000.
6. **Biome en CI**: El root del proyecto tiene Biome 2.x, no ESLint. Usar `biome check .` para lint.

## Workflows Clave

### WF1: Levantar el stack completo
```bash
docker compose build --no-cache    # Rebuildear todos los servicios
docker compose up -d               # Levantar en background
docker compose logs -f             # Ver logs en tiempo real
```

### WF2: Debug de conectividad
```bash
# Verificar que los contenedores están corriendo
docker ps

# Ver logs de ngrok
docker compose logs ngrok

# Probar conexión backend -> ollama
docker exec mcp-server-app curl -s http://ollama:11434/api/tags

# Verificar red
docker network inspect mcp-network

# Ver GPU disponible en contenedores
docker exec mcp-server-app nvidia-smi --query-gpu=memory.total --format=csv,noheader
```

### WF3: Gestión de ngrok
```bash
# Iniciar túnel manualmente
docker compose start ngrok

# Detener túnel
docker compose stop ngrok

# Ver URL pública del túnel (desde API)
curl -s http://localhost:3000/api/status | jq .ngrokUrl
```

### WF4: Rebuild de un solo servicio
```bash
docker compose build mcp-server
docker compose up -d mcp-server
```
