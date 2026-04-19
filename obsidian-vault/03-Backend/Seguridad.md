# Seguridad del Backend

## Capas de seguridad activas
1. **Helmet**: Headers de seguridad HTTP
2. **CORS**: Control de origen (actualmente permisivo para dev)
3. **Rate Limit**: 15,000 requests / 15 minutos
4. **API Key Auth**: Validacin centralizada
5. **Blacklist por IP**: Ban automtico de IPs maliciosas
6. **Logging de acceso**: Registro de todas las acciones

## Autenticacin por API Key

### Validacin
- Accepta `x-api-key` o `Authorization: Bearer ...`
- Comparacin en `AuthService.validate()`
- Aplicable a:
  - REST API (`/v1/...`, `/api/...`)
  - MCP endpoints (`/sse`, `/messages`)
  - WebSockets

### Flujo
1. Solicitud llega a middleware `authMiddleware`
2. Extrae API key de headers
3. Valida contra `.env` `API_KEY`
4. Si falla: registra intento en logs y retorna 401

### Ejemplo vlido
```bash
curl -H "x-api-key: mcp_clave_segura_123" \
  http://localhost:3000/v1/models
```

## Blacklist y auto-ban

### Blacklist por IP
- Si IP est en blacklist  respuesta 403
- Checkeo temprano en middleware de seguridad
- Persiste en memoria (se pierde al reiniciar)

### Auto-ban por intentos fallidos
- Despus de N intentos fallidos de auth, IP se balancea automticamente
- Configurable en `OllamaService.reportFailedAuth()`

### Control manual
```bash
# Banear IP
curl -X POST http://localhost:3000/api/ban \
  -H "x-api-key: TU_API_KEY" \
  -d '{"ip": "192.168.1.100"}'

# Desbanear IP
curl -X POST http://localhost:3000/api/unban \
  -H "x-api-key: TU_API_KEY" \
  -d '{"ip": "192.168.1.100"}'
```

## Logging de acceso

### Registro centralizado
- `OllamaService.logRequest(ip, action, status)`
- Almacena: IP, accin (mtodo + ruta), timestamp, estado (Success/Unauthorized)
- Disponible en UI bajo panel de Seguridad

### Eventos especiales
- `security-alert`: Intentos fallidos, bans
- `new-access`: Acceso exitoso (excluye polling)

### Exclusiones de log
- Polling de status (`GET /api/status`, `/api/status/fast`)
- Otros endpoints de bajo trfico configurables

## Rate Limiting

### Lmites globales
- **Ventana**: 15 minutos
- **Mximo**: 15,000 requests
- **Excepciones**: IPs locales (127.0.0.1, ::1) y API keys vlidas

### Comportamiento
- Si limite excedido  429 Too Many Requests
- Headers de respuesta indican estado del lmite
- No diferencia por endpoint (global)

## Recomendaciones para produccin

### Seguridad adicional
1. **TLS/HTTPS**: Usar reverse proxy (nginx, Traefik)
2. **API Key**: Rotar regularmente, usar long random strings
3. **CORS**: Restringir a dominios especficos
4. **Rate Limit**: Aumentar segn traffic esperado
5. **Blacklist Persistente**: Guardar en Redis o DB
6. **Auditora**: Centralizar logs en ELK o similar
7. **Encryption**: Encriptar conexin a Ollama si est remota

### Ejemplo nginx reverse proxy
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/cert.pem;
    ssl_certificate_key /path/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

## Siguiente lectura
- [[Indice-Backend| Volver a Backend]]
- [[API-REST|API REST]]
- [[MCP|MCP Protocol]]


