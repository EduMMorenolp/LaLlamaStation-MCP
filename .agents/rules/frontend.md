---
trigger: glob
glob: "frontend/**"
description: Reglas específicas para trabajar en el frontend de LaLlamaOllama (React 19 + Vite 7, puerto 8080).
---

# Reglas — Frontend

## STACK

- **Framework**: React 19
- **Bundler**: Vite 7
- **Lenguaje**: TypeScript
- **Estado**: hooks + Context API (NO Redux)
- **Estilos**: CSS Modules + `index.css` global (design system)
- **Estética**: Glassmorphism (`.card-glass`), dark mode, var CSS
- **Íconos**: `lucide-react`
- **HTTP**: `axios` via `brainApi` y `api.service.ts`
- **WebSockets**: Socket.IO via `socket.service.ts`

## ESTRUCTURA

```
frontend/src/
├── App.tsx                  → Router principal, layout global
├── main.tsx                 → ReactDOM.render, providers
├── index.css                → Design system: variables, clases base, animaciones
├── App.css                  → Estilos del App shell
├── components/
│   ├── AiEngineTuner.tsx    → Tuner de parámetros del motor IA
│   ├── BrainAuditor.tsx     → Auditoría de memorias del cerebro MCP
│   ├── BrainConsole.tsx     → Panel principal del cerebro (tabs)
│   ├── BrainDirectives.tsx  → Directivas centrales por proyecto
│   ├── BrainScaffold.tsx    → Generador de agentes/rules/workflows
│   ├── BrainSettings.tsx    → Configuración del cerebro
│   ├── ChatPlayground.tsx   → Chat interactivo con modelos
│   ├── ConnectionPanel.tsx  → Panel de conexión y ngrok
│   ├── HardwareSentinel.tsx → Monitor de VRAM y hardware
│   ├── IpLogs.tsx           → Logs de acceso por IP
│   ├── ModelList.tsx        → Gestión de modelos Ollama
│   ├── SecurityPanel.tsx    → Panel de seguridad y auth
│   └── Telemetry.tsx        → Métricas y telemetría
├── services/
│   ├── api.service.ts       → axios instance para backend (baseURL env)
│   └── socket.service.ts    → Socket.IO client
└── types/                   → Tipos TypeScript compartidos
```

## DESIGN SYSTEM

### Variables CSS globales (`index.css`)
```css
--accent         /* Azul principal */
--bg             /* Fondo base */
--bg-card        /* Fondo tarjeta */
--bg-input       /* Fondo input */
--border         /* Color borde */
--text           /* Texto principal */
--text-dim       /* Texto secundario */
--text-muted     /* Texto muy tenue */
--font-mono      /* Fuente monoespaciada */
--transition     /* Transición estándar */
```

### Clases de utilidad
```css
.card-glass      /* Tarjeta glassmorphism */
.flex-between    /* display:flex + space-between */
```

## REGLAS CRÍTICAS

### Estilos
- **NUNCA** usar TailwindCSS
- **SIEMPRE** usar inline styles con `var(--token)` o clases del design system
- **NO** crear estilos globales nuevos sin actualizar `index.css`
- Glassmorphism: `backdrop-filter: blur(...)` + `rgba(...)` en background + border semi-transparente

### Componentes
- **Functional components** con `React.FC` o tipos explícitos
- **Props tipadas** siempre — nunca `any`
- **Imports de React**: `import type React from "react"` (React 19 no requiere import para JSX)
- **Iconos**: `import { IconName } from "lucide-react"` — tamaño estándar `size={16}` para botones, `size={24}` para cards

### HTTP y Estado
```typescript
// Usar siempre brainApi para llamadas al mcp-brain
import { brainApi } from "../services/api.service";

// Para el backend principal, usar la otra instancia
import { api } from "../services/api.service";
```

- Estado local: `useState` + `useCallback` + `useEffect`
- Estado global: Context API (no Redux)
- No hacer fetch en render directo — siempre dentro de `useCallback`/`useEffect`

### Patrones establecidos
- **Toast notifications**: sistema ya implementado en `BrainConsole.tsx` — reutilizar el mismo patrón
- **Tabs**: botones con estado `activeTab` y renderizado condicional `{activeTab === "x" && <Componente />}`
- **Loading states**: `disabled` + texto alternativo ("Cargando...", "Guardando...")

## VERIFICACIÓN

```bash
cd frontend && npm run build
cd frontend && npm run lint
```
