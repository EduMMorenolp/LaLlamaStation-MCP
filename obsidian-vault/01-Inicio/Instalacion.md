# Instalacion Detallada

## Requisitos del sistema
### Hardware
- **CPU**: 2+ cores (recomendado 4+)
- **RAM**: 8GB mnimo (16GB recomendado)
- **GPU** (opcional): NVIDIA con CUDA
- **Almacenamiento**: 50GB+ para modelos

### Software
- Docker 24.0+
- docker-compose 2.20+
- Para GPU: NVIDIA drivers + CUDA toolkit

## Instalacin en Windows
1. Descargar e instalar [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Habilitar WSL2 si no est activado
3. Clonar el repo
4. Ejecutar `docker compose up -d --build`

## Instalacin en macOS
1. Instalar [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Clonar el repo
3. Ejecutar `docker compose up -d --build`

Nota: GPU en macOS usa Metal; NVIDIA solo en Linux.

## Instalacin en Linux
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar docker-compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Para GPU NVIDIA
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
sudo apt-get install nvidia-docker2
sudo systemctl restart docker
```

## Validar instalacin
```bash
docker --version
docker compose --version
```

## Cambios .env comunes
```bash
# Desarrollo local
API_KEY=dev_key_123
APP_PORT=3000
NGROK_AUTHTOKEN=  # vaco para desarrollo

# Produccin
API_KEY=mcp_prod_key_xyz123_secreto_largo
APP_PORT=3000
NGROK_AUTHTOKEN=tu_token_real_aqui
```

## Siguiente lectura

[[Indice-Arquitectura]]
