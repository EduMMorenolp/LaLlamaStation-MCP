---
description: Workflow para crear o modificar componentes React en el frontend (React 19 + Vite 7). Seguir en orden.
---

# Workflow — Implementar en Frontend

## PASO 1 — Buscar contexto previo

```
mem_search(query: "<componente o feature>", project: "lallamaollama", mode: "hybrid")
```

---

## PASO 2 — Identificar el tipo de cambio

| Tipo | Acción |
|------|--------|
| Nuevo componente | Crear `frontend/src/components/<NombreComponent>.tsx` |
| Nueva pestaña en BrainConsole | Modificar `BrainConsole.tsx` + crear el componente |
| Nuevo servicio HTTP | Modificar `services/api.service.ts` |
| Nuevo tipo global | Agregar a `types/` |
| Estilo global nuevo | Modificar `index.css` |
| Página nueva | Agregar ruta en `App.tsx` |

---

## PASO 3 — Crear el componente

**Estructura base:**
```tsx
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { brainApi } from "../services/api.service"; // si necesita datos del brain
// import { api } from "../services/api.service"; // si necesita datos del backend

interface Props {
    // props tipadas
}

export const MiComponente: React.FC<Props> = ({ prop }) => {
    const [data, setData] = useState<TipoData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await brainApi.get("/api/...");
            setData(res.data);
        } catch (e) {
            console.error("Error fetching data", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* contenido */}
        </div>
    );
};
```

---

## PASO 4 — Aplicar design system

**Cards glassmorphism:**
```tsx
<div className="card-glass" style={{ padding: "20px" }}>
    {/* contenido */}
</div>
```

**Botón primario:**
```tsx
<button
    type="button"
    style={{
        padding: "8px 16px",
        borderRadius: "8px",
        background: "var(--accent)",
        border: "none",
        color: "white",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
    }}
>
    Acción
</button>
```

**Labels de sección:**
```tsx
<h3 style={{
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    marginBottom: "16px",
}}>
    TÍTULO SECCIÓN
</h3>
```

**Input estándar:**
```tsx
<input
    style={{
        width: "100%",
        padding: "8px 10px",
        background: "var(--bg-input)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        color: "white",
        fontSize: "13px",
    }}
/>
```

---

## PASO 5 — Si es una nueva pestaña en BrainConsole

1. Importar el componente en `BrainConsole.tsx`
2. Agregar al tipo de `activeTab`:
   ```typescript
   useState<"auditor" | "directives" | "settings" | "scaffold" | "nuevo-tab">
   ```
3. Agregar botón de tab (mismo estilo que los existentes con `Layers` como referencia)
4. Agregar render condicional: `{activeTab === "nuevo-tab" && <NuevoComponente />}`

---

## PASO 6 — Verificar

```bash
cd frontend && npm run build
cd frontend && npm run lint
```

---

## PASO 7 — Guardar en el cerebro

```
mem_save(
    project: "lallamaollama",
    type: "feature",
    title: "Componente: <NombreComponente>",
    agent: "Antigravity / Claude Sonnet",
    content: """
        **What**: <qué hace el componente>
        **Why**: <por qué se necesita>
        **Where**: frontend/src/components/<NombreComponente>.tsx
        **Learned**: <patrones usados, decisiones de diseño>
    """
)
```
