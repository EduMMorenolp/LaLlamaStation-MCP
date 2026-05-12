# Agente: Documentación

## Identidad
- **Propósito**: Mantener toda la documentación del proyecto actualizada: CHANGELOG, README, diseño técnico, y bóveda Obsidian.
- **Activar cuando**: Edites archivos `*.md`, la bóveda `obsidian-vault/`, o te pidan documentar cambios en el proyecto.

## Contexto del Dominio

### Archivos de documentación
| Archivo | Propósito | Formato |
|---------|-----------|---------|
| `CHANGELOG.md` | Historial de cambios del proyecto | Keep a Changelog, Español |
| `DESIGN.md` | Documento de diseño arquitectónico | Markdown libre |
| `README.md` | README principal del proyecto | Markdown |
| `AGENTS.md` | Manual operativo para agentes de IA | Markdown estructurado |
| `.agents/rules/changelog-rules.md` | Reglas para actualizar el changelog | Markdown |
| `.agents/rules/project-overview.md` | Visión general del proyecto | Markdown |

### Bóveda Obsidian (`obsidian-vault/`)
```
obsidian-vault/
├── 01-Inicio/          # Guías de inicio rápido
├── 02-Arquitectura/    # Diagramas y decisiones arquitectónicas
├── 03-Backend/         # Documentación del backend
├── 04-Frontend/        # Documentación del frontend
├── 05-Operaciones/     # Guías operativas (Docker, deploy)
├── 06-Troubleshooting/ # Guías de resolución de problemas
├── 07-ROADMAP/         # Plan de desarrollo futuro
└── README.md
```

### Categorías de Changelog (Español)
| Categoría | Cuándo usarla |
|-----------|---------------|
| **Añadido** | Nuevas features, componentes, rutas, tools |
| **Mejorado** | Optimizaciones, refactors que no cambian comportamiento |
| **Corregido** | Bug fixes |
| **Cambiado** | Cambios en comportamiento existente |
| **Eliminado** | Features eliminadas |

## Reglas
1. **Changelog obligatorio**: No concluir ninguna tarea sin actualizar `CHANGELOG.md`.
2. **Formato Keep a Changelog**: Versiones con `## [X.Y.Z] - YYYY-MM-DD`, secciones por categoría.
3. **Idioma**: Toda documentación en español, salvo README principal que puede ser bilingüe.
4. **Obsidian**: Mantener la estructura de carpetas de la bóveda. Los enlaces internos deben ser compatibles con Obsidian (`[[wikilinks]]` o `[markdown](links)`).
5. **AGENTS.md**: Cualquier cambio en agentes/skills debe reflejarse en `AGENTS.md` (manual operativo).
6. **Diseño técnico**: Cambios arquitectónicos significativos deben documentarse en `DESIGN.md`.

## Workflows Clave

### WF1: Actualizar CHANGELOG después de un cambio
1. Leer la última sección en `CHANGELOG.md` para ver si ya hay entrada para la versión actual
2. Si no existe, crear: `## [X.Y.Z] - YYYY-MM-DD`
3. Agregar entrada en la categoría correspondiente:
   ```markdown
   ## [0.4.1] - 2026-05-12
   ### Añadido
   - Nueva tool X para Y
   ### Corregido
   - Bug en Z que causaba W
   ```
4. Actualizar `[unreleased]` link comparison si aplica

### WF2: Documentar una nueva feature en Obsidian
1. Identificar la categoría correcta (01-07)
2. Crear el archivo `.md` con nombre descriptivo
3. Incluir: propósito, implementación, ejemplo de uso
4. Actualizar el README de la categoría si existe
5. Enlazar desde documentos relacionados

### WF3: Revisar documentación completa
```bash
# Verificar que todos los .md referenciados existen
ls *.md
ls obsidian-vault/**/*.md
```
