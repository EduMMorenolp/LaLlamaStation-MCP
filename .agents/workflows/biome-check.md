---
description: Workflow de verificación y linting con Biome. Ejecutar antes de dar cualquier tarea por terminada.
---

# Workflow — Biome: Verificación y Lint

## CUÁNDO EJECUTAR

Ejecutar `npx biome check .` **siempre** antes de reportar una tarea como completada.
Nunca entregar código que no pase la verificación.

---

## PASO 1 — Verificar desde la raíz

```bash
# Verifica lint + formato en todo el proyecto
npx biome check .

# Si hay errores de formato (no de lint), aplicar fix automático:
npx biome check --write .
```

---

## PASO 2 — Interpretar la salida

### ✅ Sin errores
```
Checked 42 files in 89ms.
Found 0 errors.
```
→ Continuar.

### ⚠️ Errores de formato (auto-corregibles)
```
backend/src/main.ts format ━━━━━━━━━━━━━━━━
  × Expected a tab but found 4 spaces.
```
→ Ejecutar `npx biome check --write .` y verificar de nuevo.

### ❌ Errores de lint (requieren corrección manual)
```
backend/src/foo.ts lint ━━━━━━━━━━━━━━━━━━━
  × This variable is declared but never used.
    1 │ const unused = "valor";
```
→ Corregir el código y volver al Paso 1.

---

## PASO 3 — Frontend (ESLint separado)

El frontend no usa Biome, sino ESLint:

```bash
cd frontend && npm run lint
```

Interpretar igual que Biome: 0 errores = OK.

---

## PASO 4 — Verificación de tipos TypeScript

Además de Biome, verificar tipos en backend y mcp-brain:

```bash
# Backend
cd backend && npm run build

# mcp-brain (solo verificación de tipos)
cd mcp-brain && npx tsc --noEmit
```

---

## ERRORES FRECUENTES Y SOLUCIONES

| Error | Solución |
|-------|----------|
| `Expected a tab` | Cambiar spaces por tabs |
| `Trailing comma expected` | Agregar `,` al final de arrays/objects multi-línea |
| `Expected ';'` | Agregar punto y coma |
| `Use double quotes` | Cambiar `'` por `"` |
| `This variable is declared but never used` | Eliminar la variable o usar `_nombreVariable` |
| `Forbidden non-null assertion` | Usar optional chaining `?.` en lugar de `!` |
| `Use === instead of ==` | Reemplazar `==` por `===` |

---

## SCOPE DE BIOME

✅ `backend/` — TypeScript + JSON
✅ `mcp-brain/` — TypeScript + JSON
✅ Archivos JSON en la raíz
❌ `frontend/` — usa ESLint
❌ `node_modules/` — ignorado por `.gitignore`
❌ `dist/` — ignorado por `.gitignore`
