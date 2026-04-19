
## Root `.env` (proyecto principal)

Ubicacin: `LaLlamaStation MCP/.env`

### API_KEY
**Descripcin**: Clave de autenticacin para acceder a la API  
**Tipo**: string  
**Ejemplo**: `API_KEY=mcp_clave_segura_123`  
**Requerido**:  S  
**Notas**:
- Enviada en header `x-api-key` o `Authorization: Bearer`
- En produccin: mnimo 32 caracteres, random
- Si es dbil, cualquiera puede acceder

### NGROK_AUTHTOKEN
**Descripcin**: Token de autenticacin para ngrok (exposicin pblica)  
**Tipo**: string  
**Ejemplo**: `NGROK_AUTHTOKEN=abc123xyz789`  
**Requerido**:  No (solo si usas ngrok)  
**Notas**:
- Obtenido de [dashboard.ngrok.com](https://dashboard.ngrok.com)
- Vaco = ngrok desactivado (sin exposicin pblica)
- Permite acceso remoto seguro desde Claude Desktop, etc.

### APP_PORT
**Descripcin**: Puerto del servidor backend dentro del contenedor  
**Tipo**: number  
**Ejemplo**: `APP_PORT=3000`  
**Default**: 3000  
**Requerido**:  No  
**Notas**:
- Puerto interno del contenedor
- Expuesto externalmente en `docker-compose.yml` (lnea ports)

### OLLAMA_URL
**Descripcin**: URL interna para comunicacin backend  Ollama  
**Tipo**: string  
**Ejemplo**: `OLLAMA_URL=http://ollama:11434`  
**Default**: `http://ollama:11434`  
**Requerido**:  No  
**Notas**:
- En Docker: `ollama` = nombre del servicio
- Para Ollama remota: `http://ip:puerto`
- No incluir path de API (`/api`)

## Frontend `.env` (`mcp-frontend/.env`)

### VITE_API_URL
**Descripcin**: URL base del backend (REST API)  
**Tipo**: string  
**Ejemplo**: `VITE_API_URL=http://localhost:3000`  
**Default**: `http://localhost:3000`  
**Requerido**:  No  
**Notas**:
- URL desde donde ejecuta el navegador
- En desarrollo local: `http://localhost:3000`
- En produccin remota: `https://api.ejemplo.com`

### VITE_SOCKET_URL
**Descripcin**: URL para conexin WebSocket (eventos en tiempo real)  
**Tipo**: string  
**Ejemplo**: `VITE_SOCKET_URL=http://localhost:3000`  
**Default**: `http://localhost:3000`  
**Requerido**:  No  
**Notas**:
- Mismo backend, mismo puerto
- HTTPS en produccin (wss://)

## Flujo de variables en docker-compose

```yaml
# docker-compose.yml
services:
  mcp-server:
    environment:
      - API_KEY=${API_KEY}
      - NGROK_AUTHTOKEN=${NGROK_AUTHTOKEN}
      - APP_PORT=${APP_PORT}
      - OLLAMA_URL=${OLLAMA_URL}
    # Lee de root .env
```

## Configuracin de ejemplo

### Desarrollo local
```bash
# .env
API_KEY=dev_key_123
NGROK_AUTHTOKEN=
APP_PORT=3000
OLLAMA_URL=http://ollama:11434
```

```bash
# mcp-frontend/.env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### Produccin remota
```bash
# .env
API_KEY=mcp_prod_abc123def456_min32char_seguro
NGROK_AUTHTOKEN=2_abc123xyz789_token_valido
APP_PORT=3000
OLLAMA_URL=http://ollama-vm-interna:11434
```

```bash
# mcp-frontend/.env
VITE_API_URL=https://api.miempresa.com
VITE_SOCKET_URL=https://api.miempresa.com
```

## Verificar variables en contenedor

```bash
# Ver valor actual dentro de contenedor
docker exec mcp-server-app env | grep API_KEY

# Ver toda la configuracin
docker exec mcp-server-app env | sort
```

## Rotacin de API_KEY

1. Generar nueva clave:
```bash
# En PowerShell
$newKey = -join ((0..31) | ForEach-Object { [char]((65..90)+(97..122)+(48..57) | Get-Random) })
Write-Output $newKey
```

2. Actualizar `.env`:
```bash
API_KEY=nueva_clave_segura_xyz
```

3. Rebuild y restart:
```bash
docker compose up -d --build mcp-server
```

4. Notificar clientes de nueva key

## Siguiente lectura
- [[Comandos]]

- [[../../03-Backend/Seguridad]]

