#  LaLlamaStation MCP - Obsidian Vault

Bienvenido al vault de documentacin actualizado de **LaLlamaStation MCP**.

## Inicio rapido
1. Comenzar por [[01-Inicio/Getting-Started|Getting Started]]
2. Usa `Ctrl+K` en Obsidian para buscar notas por palabra clave

## Estructura del vault

```
obsidian-vault/
 00_Index.md                     # Hub principal
 01-Inicio/                      # Setup e instalacin
    Getting-Started.md
    Instalacion.md
 02-Arquitectura/                # Diseo del sistema
    Arquitectura.md
    Componentes.md
 03-Backend/                     # Backend server
    API-REST.md
    MCP.md
    Seguridad.md
 04-Frontend/                    # Dashboard React
    Dashboard.md
 05-Operaciones/                 # Docker y operaciones
    Docker.md
    Performance-y-GPU.md
    Hardware.md
 06-Troubleshooting/             # Solucin de problemas
    Errores-Comunes.md
    Runbook.md
 99-Referencia/                  # Comandos y variables
    Comandos.md
    Variables-Entorno.md
 README.md                       # Este archivo
```

## Caractersticas del vault

###  Informacin actualizada
- Cdigo fuente de verdad: `main.ts`, `ollama.service.ts`, `docker-compose.yml`
- Endpoints y variables reales
- Comandos probados

###  Enlaces entrecruzados
- Navegacin entre conceptos relacionados
- Backlinks automticos en Obsidian
- Estructura no-lineal (hyper-text)

###  Fcil bsqueda
- Tags por tema
- Palabras clave en ttulos
- ndices temticos

###  Referencia rpida
- Comandos copiables
- Ejemplos de curl
- Respuestas JSON

## Cmo mantener el vault

### Actualizar documentacin
1. Realizar cambio en cdigo
2. Actualizar nota correspondiente en vault
3. Actualizar enlaces si es necesario
4. Commit con mensaje: `docs: actualizar [tema]`

### Agregar nueva nota
1. Crear en carpeta temtica
2. Nombrar con patrn: `tema.md`
3. Agregar Enlaces a ndice de carpeta
4. Actualizar si es de alto nivel

### Reglas de nomenclatura
- **Carpetas**: `NN-Nombre` (numrico + nombre)
- **Archivos**: `NombreConGuiones.md` (sin nmeros excepto carpeta)
- **Enlaces internos**: `[[carpeta/Archivo]]` con paths relativos

---

**ltima actualizacin**: 19 de abril de 2026  
**Versin del proyecto**: 0.4.0  
**Fuente de verdad**: Cdigo en `src/` + `docker-compose.yml`

