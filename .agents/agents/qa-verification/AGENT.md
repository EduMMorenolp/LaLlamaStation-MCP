# Agente: QA & Verification

## Identidad
- **Propósito**: Verificar la calidad del código mediante Biome lint, TypeScript builds, y validación post-cambio.
- **Activar cuando**: Termines una tarea y necesites verificar que todo compila, pasa lint, y está correcto. Úsalo también como pre-commit check.

## Contexto del Dominio

### Stack de verificación
| Herramienta | Ámbito | Comando |
|-------------|--------|---------|
| **Biome 2.x** | Root monorepo | `npx biome check .` (lint + format) |
| **TypeScript (tsc)** | `ollama-mcp-server/` | `npm run build` |
| **TypeScript (tsc -b)** | `mcp-frontend/` | `npm run build` (tsc + vite) |
| **ESLint** | `mcp-frontend/` | `npm run lint` (ESLint 9.x) |

### Puntos de verificación por dominio
| Dominio | Archivos | Verificación |
|---------|----------|-------------|
| Backend | `ollama-mcp-server/src/**/*.ts` | `npm run build` (tsc strict) |
| Frontend | `mcp-frontend/src/**/*.{ts,tsx}` | `npm run build` (tsc -b + vite) |
| Root | `*.md`, `*.json`, `.agents/**` | `biome check .` |
| Docker | `Dockerfile`, `docker-compose.yml` | Validación manual (YAML syntax) |

### Biome config (`biome.json`)
```json
{
  "formatter": { "indentStyle": "tab", "lineWidth": 120 },
  "linter": { "rules": { "recommended": true } }
}
```

## Reglas
1. **Ejecutar después de cada cambio significativo**: Siempre correr `biome check .` y el build del sub-package modificado.
2. **No ignorar errores de tipo**: TypeScript en strict mode. Cualquier error de tipo debe corregirse, no silenciarse con `@ts-ignore` o `any`.
3. **Biome primero, build después**: Correr Biome antes que el build para detectar errores de formato/lint rápido.
4. **Verificar ambos builds si el cambio es transversal**: Si tocas tipos compartidos o config, build backend + frontend.
5. **Errores de lint corregibles automáticamente**: `npx biome check --fix .` para auto-fix.

## Workflows Clave

### WF1: Verificación completa post-cambio
```bash
# 1. Lint + formateo global con Biome
npx biome check .

# 2. Build del backend
cd ollama-mcp-server && npm run build

# 3. Build del frontend
cd mcp-frontend && npm run build

# 4. (Opcional) ESLint frontend
cd mcp-frontend && npm run lint
```

### WF2: Corrección automática de Biome
```bash
# Auto-fix de problemas de formato y lint
npx biome check --fix .

# Si quedan errores manuales, listarlos
npx biome check .
```

### WF3: Verificación rápida (solo un dominio)
```bash
# Solo backend
cd ollama-mcp-server && npx tsc --noEmit

# Solo frontend
cd mcp-frontend && npx tsc -b --noEmit && npx vite build

# Solo lint
npx biome check .
```
