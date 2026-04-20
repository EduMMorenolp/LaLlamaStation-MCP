# Runbook de Operacin

Gua de procedimientos operacionales da a da.

##  Startup diario

1. **Levantar stack**:
```bash
cd /path/to/LaLlamaStation
docker compose up -d --build
```

2. **Verificar contenedores**:
```bash
docker ps
```
Esperar status `Up` en:
- `mcp-ollama-motor`
- `mcp-server-app`
- `mcp-frontend-app`

3. **Abrir frontend**:
```
http://localhost:8080
```

4. **Health check rpido**:
```bash
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/status/fast | jq .
```

Esperar:
- `ollamaRunning: true`
- `gpu.gpuUtil` > 0 (si GPU)

##  Verificacin de estado

### Estado general
```bash
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/status/fast | jq '.'
```

### Performance metrics
```bash
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/metrics/performance | jq '.'
```

### Logs backend
```bash
docker compose logs --tail=100 mcp-server
```

### Logs Ollama
```bash
docker logs --tail=100 mcp-ollama-motor
```

##  Configuracin de recursos

### Auto-unload (liberar VRAM inactivo)
```bash
# 5 minutos inactividad
curl -X POST http://localhost:3000/api/hardware/auto-unload \
  -H "x-api-key: TU_API_KEY" \
  -d '{"minutes": 5}'
```

### Context window global
```bash
# 4096 tokens mximo por request
curl -X POST http://localhost:3000/api/hardware/num-ctx \
  -H "x-api-key: TU_API_KEY" \
  -d '{"numCtx": 4096}'
```

### Tarifa electricidad (Engine Tuner)
```bash
curl -X POST http://localhost:3000/api/engine-stats/electricity-rate \
  -H "x-api-key: TU_API_KEY" \
  -d '{"rateARS": 50}'  # ARS/kWh
```

### Precio cloud comparativo
```bash
curl -X POST http://localhost:3000/api/engine-stats/cloud-price \
  -H "x-api-key: TU_API_KEY" \
  -d '{"pricePerMToken": 0.50}'  # USD/1M tokens
```

##  Descargar modelo

### Va API
```bash
curl -X POST http://localhost:3000/api/pull \
  -H "x-api-key: TU_API_KEY" \
  -d '{"model": "qwen3.5:4b"}'
```

### Va UI
Dashboard  Modelos  Buscar  Descargar

Observar progreso en logs:
```bash
docker compose logs -f mcp-server | grep -i pull
```

##  Limpieza

### Descargar modelos de VRAM
```bash
curl -X POST http://localhost:3000/api/unload \
  -H "x-api-key: TU_API_KEY"
```

### Limpiar cach Ollama
```bash
curl -X POST http://localhost:3000/api/clean \
  -H "x-api-key: TU_API_KEY"
```

### Eliminar modelo del disco
```bash
curl -X DELETE http://localhost:3000/api/models/qwen3.5:4b \
  -H "x-api-key: TU_API_KEY"
```

##  Seguridad

### Ver logs de acceso
```bash
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/status/full | jq '.accessLogs | .[-10:]'
```

### Banear IP
```bash
curl -X POST http://localhost:3000/api/ban \
  -H "x-api-key: TU_API_KEY" \
  -d '{"ip": "192.168.1.100"}'
```

### Desbanear IP
```bash
curl -X POST http://localhost:3000/api/unban \
  -H "x-api-key: TU_API_KEY" \
  -d '{"ip": "192.168.1.100"}'
```

##  Incident response

### 1. Backend no responde
```bash
# Restart backend
docker compose up -d --build mcp-server

# Verificar logs
docker compose logs --tail=200 mcp-server
```

### 2. Ollama crash/freeze
```bash
# Force restart Ollama
docker compose up -d --force-recreate ollama

# Ver estado
docker logs --tail=100 mcp-ollama-motor
```

### 3. GPU no se usa
Seguir: [[Errores-Comunes#3 Ollama responde pero no usa GPU]]

### 4. Frontend no carga
```bash
# Rebuild frontend
docker compose up -d --build mcp-frontend

# Logs
docker compose logs --tail=50 mcp-frontend
```

### 5. Ataque de rate limit
- Verificar IP atacante en logs de seguridad
- Banear IP: `POST /api/ban`
- Aumentar lmite si es legtimo

##  Rotacin y mantenimiento

### Semanal
- Revisar logs de seguridad
- Verificar VRAM libre
- Comprobar GPU offload en generaciones

### Mensual
- Actualizar composefile
- Revisar modelos no usados y eliminar
- Rotar API key

### Trimestral
- Rebuild completo sin cache
- Actualizar imgenes base
- Revisar performance trends

##  Comando rpido de diagnstico
```bash
#!/bin/bash
echo "=== Docker Status ==="
docker ps

echo -e "\n=== Backend Logs (ltimas 50 lneas) ==="
docker compose logs --tail=50 mcp-server

echo -e "\n=== Ollama Logs (ltimas 50 lneas) ==="
docker logs --tail=50 mcp-ollama-motor

echo -e "\n=== API Health ==="
API_KEY=$(grep API_KEY .env | cut -d'=' -f2)
curl -s -H "x-api-key: $API_KEY" http://localhost:3000/api/status/fast | jq '.'
```

## Siguiente lectura
- [[Indice-Troubleshooting| Volver a Troubleshooting]]
- [[Errores-Comunes|Errores Comunes]]



