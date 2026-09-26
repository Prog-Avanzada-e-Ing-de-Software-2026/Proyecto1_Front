# Propuesta: CR-003-P2 — Gestión de SuperLínea y asociación editable

## Intención

Incorporar la gestión independiente de SuperLínea y permitir cambiar su asociación al editar una Línea, según `docs/contracts/openapi.json`. Esto amplía el alcance create-only de CR-003 sin alterar su flujo anidado.

## Alcance

### Incluido
- Pestaña de SuperLínea con alta, consulta paginada, búsqueda, edición, eliminación y auditoría.
- Ruta y menú con la misma ubicación visible y comportamiento de permisos que Línea.
- Selector de SuperLínea en edición de Línea; enviar `superLineaId` solo al cambiar la asociación y omitirlo para conservarla.

### Fuera de alcance
- Impresión de SuperLínea, por ausencia de contrato API.
- Restauración de eliminados o requisitos que afirmen semántica de eliminación lógica.
- Abstracción CRUD genérica para otros catálogos.

## Capacidades

### Capacidades nuevas
- `superlinea-management`: CRUD, búsqueda paginada, auditoría, navegación y permisos equivalentes a Línea.

### Capacidades modificadas
- `linea-superlinea-association`: ampliar la asociación desde creación hacia edición opcional, reemplazando el aislamiento create-only de CR-003.
- `superlinea-creation`: permitir alta independiente, preservar el alta anidada y reemplazar la prohibición de gestión autónoma.

## Enfoque

Extender `gestion-producto/superlinea` siguiendo el patrón de Línea, sin abstracción genérica. Servicios y DTO usarán los endpoints documentados. La edición inicializará la asociación y solo incluirá `superLineaId` en `UpdateLineaDto` cuando cambie.

## Áreas afectadas

| Área | Impacto | Descripción |
|---|---|---|
| `src/componentes/gestion-producto/superlinea/` | Modificada | Pantalla, formularios, filtros y servicio CRUD/auditoría. |
| `src/interfaces/gestion-producto/superlinea/` | Modificada | Contratos de consulta y actualización. |
| `src/componentes/gestion-producto/linea/` | Modificada | Selector y payload de edición. |
| `src/App.tsx` | Modificada | Ruta independiente. |
| `src/componentes/menu/menuItems-definicion.ts` | Modificada | Entrada junto a Línea con sus permisos. |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Interpretar eliminación como lógica | Media | Especificar solo la respuesta observable del contrato. |
| Sobrescribir la asociación al editar | Media | Omitir `superLineaId` si no cambió. |
| Regresiones sin runner automatizado | Media | Verificación manual y quality gates con baseline explícito. |

## Plan de reversión

Revertir ruta, menú y módulos independientes; retirar el selector de edición y restaurar el payload previo. El flujo anidado de CR-003 permanece operativo.

## Dependencias

- `docs/contracts/openapi.json` y backend compatible con sus endpoints autenticados.
- Componentes compartidos existentes de tabla, paginación, alertas y auditoría.

## Criterios de éxito

- [ ] Usuarios con acceso visible a Línea pueden gestionar y buscar SuperLíneas, consultar auditoría y reciben errores API normalizados.
- [ ] Una Línea puede cambiar de SuperLínea; guardar sin cambios conserva la asociación.
- [ ] No se expone impresión, restauración ni semántica no documentada.
