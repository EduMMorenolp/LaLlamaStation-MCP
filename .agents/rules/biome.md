---
trigger: always_on
glob:
description: Reglas de Biome — linter y formatter global del proyecto LaLlamaOllama. Aplica a backend/ y mcp-brain/. El frontend usa ESLint separado.
---

# Reglas — Biome (Linter + Formatter)

## CONFIGURACIÓN ACTIVA (`biome.json` en raíz)

```json
{
  "formatter": {
    "indentStyle": "tab",
    "indentWidth": 4,
    "lineWidth": 120
  },
  "javascript": {
    "formatter": {
      "trailingCommas": "es5",
      "semicolons": "always",
      "quoteStyle": "double"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none"
    }
  }
}
```

## CONVENCIONES OBLIGATORIAS

| Regla | Valor |
|-------|-------|
| Indentación | **tabs** (no spaces) |
| Ancho de línea | **120 caracteres** |
| Comillas JS/TS | **dobles** (`"`) |
| Semicolons | **siempre** (`;`) |
| Trailing commas JS | **es5** (en arrays y objects multi-línea) |
| Trailing commas JSON | **ninguna** |
| Linter | **recommended** rules habilitadas |

## COMANDOS

```bash
# Verificar (sin aplicar cambios) — ejecutar desde la raíz
npx biome check .

# Verificar + aplicar formato automático
npx biome check --write .

# Solo formatear (sin lint)
npx biome format --write .

# Solo lint (sin format)
npx biome lint .

# Verificar un directorio específico
npx biome check backend/
npx biome check mcp-brain/
```

## CUÁNDO EJECUTAR

- **Antes de dar una tarea por terminada**: `npx biome check .`
- **Después de crear archivos nuevos**: el agente debe formatear antes de reportar
- **Si hay errores de lint**: corregirlos antes de continuar
- **El frontend** usa ESLint: `cd frontend && npm run lint`

## ERRORES COMUNES A EVITAR

```typescript
// ❌ MAL — comillas simples
import { foo } from './bar'

// ✅ BIEN — comillas dobles
import { foo } from "./bar.js"

// ❌ MAL — sin semicolon
const x = 1

// ✅ BIEN
const x = 1;

// ❌ MAL — spaces
function foo() {
    const x = 1;   // 4 spaces
}

// ✅ BIEN — tabs
function foo() {
	const x = 1;   // 1 tab
}

// ❌ MAL — sin trailing comma en multilinea
const obj = {
    a: 1,
    b: 2
}

// ✅ BIEN — es5 trailing comma
const obj = {
    a: 1,
    b: 2,
};
```

## SCOPE

Biome aplica a **todos los archivos** en el repo respetando `.gitignore`.
Esto incluye `backend/`, `mcp-brain/`, y archivos de configuración `.json`.
El frontend (`frontend/`) tiene su propio ESLint (`npm run lint`).
