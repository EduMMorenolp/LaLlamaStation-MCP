# Performance y GPU

## Mejoras implementadas

### Streaming token a token
- Endpoint `/v1/chat/completions` con `stream=true`
- Formato SSE compatible con OpenAI
- Permite UI responsivo (tokens aparecen sin esperar final)

### Mtricas de rendimiento
- **TTFT** (Time To First Token): latencia hasta primer token
- **Throughput**: tokens/segundo durante generacin
- Histricos y percentiles (p95, mximo) en `/api/metrics/performance`

### Optimizaciones backend
- **Pool HTTP keep-alive**: Reutiliza conexiones a Ollama
- **Queue de concurrencia**: Limita requests simultneos a Ollama
- **Cache asincrnico GPU**: Evita bloquear ruta crtica
- **Endpoints separados**: `/api/status/fast` vs `/api/status/full`

## Verificar GPU en funcionamiento

### 1. Logs de Ollama (prueba definitiva)
```bash
docker logs mcp-ollama-motor | grep -i cuda
```

Buscar:
- `found X CUDA devices`  GPU detectada
- `offloaded Y/Z layers to GPU`  Layers en GPU
- `offloaded 0/Z layers to GPU`  CPU fallback

### 2. Endpoint `/api/status/fast`
```bash
curl -H "x-api-key: TU_API_KEY" \
  http://localhost:3000/api/status/fast | jq '.gpu'
```

Campos esperados:
- `gpuUtil`: 0-100 %
- `powerDraw`: watts
- `temp`: grados celsius
- `vram.used`: bytes

### 3. Monitoreo host (nvidia-smi)
```bash
nvidia-smi -l 1  # Actualizar cada segundo
```

Buscar:
- GPU-Util aumenta durante inferencia
- Power Draw aumenta
- Procesos `ollama` visibles

## Troubleshooting performance

### Inferencia lenta
1. Verificar TTFT en `/api/metrics/performance`
2. Revisar logs GPU offload
3. Aumentar `num_ctx` si es necesario
4. Reducir tamao de modelo

### Cold start (primera carga lenta)
- Primera carga de modelo puede tardar 10-30s
- Modelo se carga a VRAM/GPU
- Subsecuentes mucho ms rpidas (modelo en cache)
- Se descarga automticamente despus de inactividad

### Timeout en streaming
- Aumentar timeout del cliente
- Reducir `num_ctx` o `temperature`
- Verificar conectividad backend  Ollama

### Alto uso CPU, bajo GPU
- Sntoma: GPU-Util = 0%, CPU = 100%
- Causa: `offloaded 0/... layers`
- Fix: Verificar `gpus: all` en compose + recreate + drivers

## Configuracin GPU en compose

Verificar (estado actual):
```yaml
ollama:
  image: ollama/ollama:latest
  gpus: all  #  Esto es esencial
  # ...
```

Si no est:
```yaml
gpus: all  # Agregar bajo ollama
```

Luego recreate:
```bash
docker compose up -d --force-recreate ollama
```

## Calculadora de costo

Dashboard  **Engine Tuner**:
1. Configurar tarifa electricidad (ARS/kWh)
2. Configurar precio cloud (USD/1M tokens)
3. Sistema calcula costo operativo vs cloud

Frmula:
```
costo_local = (tokens * power_watts * duracion) / (1000 * 3600) * tarifa_ars
costo_cloud = tokens / 1_000_000 * precio_usd
```

## Siguiente lectura
- [[Indice-Operaciones| Volver a Operaciones]]
- [[Hardware|Hardware y Recursos]]
- [[Docker|Docker & Compose]]


