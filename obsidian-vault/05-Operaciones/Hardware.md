# Hardware y Recursos

## Monitoreo VRAM

### Endpoint API
```bash
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/hardware
```

**Respuesta**:
```json
{
  "vram": {
    "total": 24576,
    "used": 8192,
    "available": 16384
  },
  "autoUnloadMinutes": 5,
  "globalNumCtx": 2048
}
```

### Auto-unload de modelos

Libera VRAM automticamente despus de inactividad.

```bash
# Activar auto-unload (5 minutos de inactividad)
curl -X POST http://localhost:3000/api/hardware/auto-unload \
  -H "x-api-key: TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 5}'

# Desactivar auto-unload
curl -X POST http://localhost:3000/api/hardware/auto-unload \
  -H "x-api-key: TU_API_KEY" \
  -d '{"minutes": 0}'
```

### Context window global

Tamao mximo de contexto por inferencia.

```bash
# Configurar 4096 tokens
curl -X POST http://localhost:3000/api/hardware/num-ctx \
  -H "x-api-key: TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"numCtx": 4096}'
```

## Requisitos del sistema

### Mnimos
| Componente | Requisito |
|-----------|-----------|
| CPU | 2 cores |
| RAM | 8 GB |
| Almacenamiento | 20 GB (modelos) |
| GPU | Opcional |

### Recomendados
| Componente | Requisito |
|-----------|-----------|
| CPU | 8+ cores |
| RAM | 32 GB |
| Almacenamiento | 100 GB SSD (modelos + cache) |
| GPU | NVIDIA 8GB+ VRAM |

### Produccin
| Componente | Requisito |
|-----------|-----------|
| CPU | 16+ cores |
| RAM | 64 GB |
| Almacenamiento | 500 GB SSD |
| GPU | NVIDIA A100 / L40 / RTX 6000 |

## Modelo y VRAM estimada

| Modelo | Tamao | VRAM (full offload) | VRAM (50% offload) |
|--------|--------|------------------|-------------------|
| 3.5b | ~2GB | 4-6 GB | 2-3 GB |
| 7b | ~4GB | 8-10 GB | 4-6 GB |
| 13b | ~8GB | 14-16 GB | 8-10 GB |
| 70b | ~40GB | 80GB+ | 40GB+ |

*Nota: Estimaciones aproximadas, varan por modelo y formato (Q4, Q8, etc.)*

## Limpieza de recursos

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

## Escalabilidad

### Mltiples contenedores backend
Para alto concurrency, considerar:
1. Load balancer (nginx, Traefik)
2. Multiple instancias `mcp-server`
3. Cach compartida (Redis) para sesiones

### Sharding de Ollama
- Mltiples instancias Ollama en puertos diferentes
- Backend distribuye requests

## Siguiente lectura
- [[Indice-Operaciones| Volver a Operaciones]]
- [[Docker|Docker & Compose]]
- [[Performance-y-GPU|Performance & GPU]]


