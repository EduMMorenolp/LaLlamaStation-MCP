---
name: debug-docker-ngrok
description: Use this skill when there are issues with the LaLlamaStation MCP Docker stack, specifically related to the ngrok tunnel, port binding, or network connectivity between the Ollama host and the internal server.
---

# Skill: Debug Docker & Ngrok Connectivity

## Expected Architecture
- The backend Node.js container runs on an internal port (e.g., 3000)
- The Ngrok container tunnels that internal port to a public URL
- The host machine running Ollama must be accessible from within the container

## Common Issues & Fixes

### 1. Ngrok Fails to Connect or Exits
**Symptom**: Ngrok container restarts constantly, no public URL generated.
**Check**:
- Ensure `NGROK_AUTHTOKEN` is set correctly in `.env`.
- Check logs: `docker compose logs ngrok`
- Is Ngrok pointing to the correct internal hostname? (Must point to the backend container name, e.g., `server:3000`).

### 2. Cannot Reach Ollama from Container
**Symptom**: Backend gives 500 errors, terminal says "Connection refused" when reaching Ollama.
**Check**:
- By default, Ollama listens only on `127.0.0.1`. Inside Docker, `127.0.0.1` is the container itself, NOT the host.
**Fix**:
1. On the host machine running Ollama, ensure it listens on all interfaces.
   - Edit Systemd/Plist: Add env var `OLLAMA_HOST=0.0.0.0`
   - Restart Ollama service.
2. In the `.env` file of LaLlamaStation, set `OLLAMA_BASE_URL` to `http://host.docker.internal:11434` (Windows/Mac) or the host's LAN IP (Linux).

### 3. API Key Unauthorized (401)
**Symptoms**: Clients testing the OpenAI endpoint get 401 Unauthorized.
**Fix**:
- Check that the client is sending `Authorization: Bearer <API_KEY_FROM_ENV>`.
- The API key in `.env` must match exactly.

### 4. Telemetry Socket Disconnected
**Symptoms**: Dashboard shows no real-time data or VRAM graphs are empty.
**Fix**:
- Check if CORS in the backend allows the frontend's origin (especially if frontend runs on a different port locally).
- Ensure `VITE_API_URL` pointing to backend is correct.
