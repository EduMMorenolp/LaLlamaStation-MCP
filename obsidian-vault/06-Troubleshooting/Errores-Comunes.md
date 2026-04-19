# Errores Comunes y Soluciones

## 1. Frontend muestra OFFLINE pero backend est corriendo
**Sntoma**: Dashboard marca `Ollama: OFFLINE`  
**Logs**: Pero `docker ps` muestra `mcp-ollama-motor` Up

**Causa**: Endpoint `/api/status/fast` no retornaba `ollamaRunning`

**Solucin**:
- Verificar que backend est actualizado
- Llamar a `/api/status/fast` manualmente:
```bash
curl -H "x-api-key: TU_API_KEY" http://localhost:3000/api/status/fast | jq '.ollamaRunning'
```
- Si `false`, verificar logs Ollama:
```bash
docker logs mcp-ollama-motor | tail -50
```

## 2. Error `require is not defined` en backend
**Sntoma**: Servidor crashes con `ReferenceError: require is not defined`  
**Stack**: runtime ESM

**Causa**: Uso de `require()` en contexto ESM (JavaScript modules)

**Solucin**:
- Reemplazar: `const { exec } = require('child_process')`
- Con: `import { exec } from 'node:child_process'`
- Verificar `package.json` tiene `"type": "module"`

## 3. Ollama responde pero no usa GPU
**Sntoma**: Inferencias en CPU, sin aceleracin  
**Verificacin**: `nvidia-smi` muestra 0% utilizacin

**Causa**: GPU no asignada correctamente a contenedor Ollama

**Solucin**:
1. Verificar compose tiene `gpus: all` bajo servicio `ollama`:
```yaml
ollama:
  image: ollama/ollama:latest
  gpus: all  #  Esencial
```

2. Recreate contenedor:
```bash
docker compose up -d --force-recreate ollama
```

3. Verificar GPU asignada:
```bash
docker inspect mcp-ollama-motor \
  --format "{{json .HostConfig.DeviceRequests}}"
```

Debera mostrar GPU.

4. Revisar logs Ollama:
```bash
docker logs mcp-ollama-motor | grep -i cuda
```

Buscar:
- `found 1 CUDA devices` 
- `offloaded 33/33 layers to GPU` 

## 4. Build frontend falla con error de tipos
**Sntoma**: `npm run build` falla con TS2339 o similar  
**Ejemplo**: `NodeJS.Timeout is not assignable to SetInterval`

**Causa**: Tipos de TypeScript mal importados en browser context

**Solucin**:
```typescript
//  Incorrecto
const timerRef = useRef<NodeJS.Timeout | null>(null);

//  Correcto
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

Luego:
```bash
npm run build
```

## 5. Chat tarda mucho o se corta
**Sntoma**: Respuestas lentas o conexin se interrumpe  
**Verificacin**: Ver logs backend

**Causa comn**: Cold start (modelo no en VRAM an)

**Solucin**:
1. Primera carga de modelo tarda 10-30s (normal)
2. Subsecuentes mucho ms rpidas
3. Aumentar timeout cliente si es necesario
4. Verificar logs Ollama:
```bash
docker logs --tail 100 mcp-ollama-motor
```

5. Reducir `num_ctx` si timeout persiste

## 6. MCP retorna 401 Unauthorized
**Sntoma**: Error al conectar `/sse` desde cliente MCP  
**Logs**: `[SSE-AUTH-FAIL]`

**Causa**: API key no vlida en header

**Solucin**:
1. Verificar API key en `.env`:
```bash
cat .env | grep API_KEY
```

2. Enviar exactamente en header:
```bash
curl http://localhost:3000/sse \
  -H "x-api-key: VALOR_EXACTO"
```

3. Verificar no hay espacios extras o caracteres invisibles

## 7. ngrok no levanta
**Sntoma**: `/api/ngrok/status` retorna `{"running": false}`  
**Logs**: Errores en contenedor ngrok

**Causa**: Token invlido o problema conectividad

**Solucin**:
1. Verificar `NGROK_AUTHTOKEN` en `.env`
2. Obtener nuevo token en [dashboard.ngrok.com](https://dashboard.ngrok.com)
3. Recreate:
```bash
docker compose up -d --force-recreate mcp-ngrok-tunnel
```

4. Ver logs:
```bash
docker logs mcp-ngrok-tunnel
```

## 8. Conexin rechazada a Ollama
**Sntoma**: Backend retorna error conectando a Ollama  
**Error**: `ECONNREFUSED 127.0.0.1:11434`

**Causa**: Ollama no est corriendo

**Solucin**:
```bash
docker compose up -d ollama
```

Esperar 5 segundos para que inicie.

## 9. Rate limit alcanzado
**Sntoma**: Respuesta 429 Too Many Requests

**Causa**: Ms de 15,000 requests en 15 minutos

**Solucin**:
- Esperar 15 minutos o
- Usar API key vlida (excluye del lmite)
- Optimizar polling en dashboard

## 10. Logs voluminosos o crash por memoria
**Sntoma**: Contenedor se reinicia, `/var/log` lleno

**Causa**: Logging excesivo o memory leak

**Solucin**:
1. Reducir verbosidad de logs
2. Implementar rotacin de logs
3. Revisar cdigo para memory leaks
4. Aumentar lmite de memoria en compose

```yaml
services:
  mcp-server:
    deploy:
      resources:
        limits:
          memory: 2G
```

## Siguiente lectura
- [[Indice-Troubleshooting| Volver a Troubleshooting]]
- [[Runbook|Runbook Operacional]]


