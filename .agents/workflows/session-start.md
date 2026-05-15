---
description: Workflow de inicio de sesión para LaLlamaOllama. Recupera contexto del cerebro antes de comenzar a trabajar.
---

# Workflow — Inicio de Sesión en LaLlamaOllama

Al comenzar cualquier conversación sobre este proyecto, ejecutar en orden:

## PASO 1 — Activar proyecto

```
mem_current_project(project: "lallamaollama")
```

## PASO 2 — Cargar contexto reciente

```
mem_context(project: "lallamaollama", limit: 10)
```

## PASO 3 — Buscar contexto del tema actual

```
mem_search(
  query: "<tema del pedido del usuario>",
  project: "lallamaollama",
  mode: "hybrid",
  limit: 5
)
```

Usar el contexto recuperado para:
- No repetir trabajo ya hecho
- Respetar decisiones arquitectónicas previas
- Mantener consistencia con convenciones establecidas

> Si un resultado aparece truncado, recuperar el contenido completo con:
> `mem_get_observation(id: "<id>")`
