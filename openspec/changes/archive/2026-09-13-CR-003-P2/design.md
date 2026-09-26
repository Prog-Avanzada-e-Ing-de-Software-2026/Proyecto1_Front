# Diseño: CR-003-P2 — Gestión de SuperLínea y asociación editable

## Enfoque técnico

Se completará `gestion-producto/superlinea` con los patrones existentes y contratos OpenAPI, sin CRUD genérico. La edición independiente no incorpora estado sucio. El formulario actual de Línea ampliará su selector para permitir reasignar la SuperLínea.

## Decisiones de arquitectura

| Opción | Tradeoff | Decisión y fundamento |
|---|---|---|
| Extender `createCrudService` | Incluye impresión no soportada | No usarlo para SuperLínea; ampliar su servicio explícito evita exponer contratos inexistentes. |
| Pantalla específica basada en Línea | Duplica estructura visual | Elegida: conserva límites, estado y convenciones reales sin ampliar el impacto. |
| Comparar la asociación en el formulario de Línea | Requiere conservar el ID inicial | Elegida: `transformData` toma `Linea.superlinea.id`; el submit agrega `superLineaId` solo si difiere, sin acoplarse al estado global del formulario. |
| Deshabilitar «Actualizar» sin cambios en SuperLínea | Evitaría envíos redundantes, pero ampliaría el alcance | Diferida como deuda técnica no normativa; no condiciona esta implementación. |
| Roles propios para SuperLínea | Podrían divergir de Línea | Rechazada: menú y ruta copiarán exactamente ubicación y guardas de Línea. |

## Flujo de datos y trazabilidad

```text
Menú → /admin/superlinea → ConsultarSuperlineas
  → filtros/skip/take → SuperLineaService → API
  → tabla/tarjetas → detalle | formulario | auditoría | eliminación

Editar Línea → GET /linea/{id} → superlinea.id inicial
  → GET /superlinea/select → selector
  → comparar ID inicial/actual → PUT (con ID cambiado | sin superLineaId)
```

| Requisitos | Realización concreta |
|---|---|
| Gestión, búsqueda y auditoría | La pantalla mantiene datos, total, carga, filtros y paginación; el servicio cubre búsqueda, detalle, alta, actualización, eliminación y auditoría. No ofrece impresión/restauración ni interpreta `deletedAt` como semántica de borrado. |
| Validación y errores | Yup exige denominación y máximo 255. `parseApiError` normaliza errores; 403, 404 y 409 reciben mensajes contextuales. Solo el éxito cierra y refresca. |
| Navegación/permisos | “SuperLíneas” será hermana de “Líneas” bajo Configuración, sin roles propios; `/admin/superlinea` será hermana de `linea` bajo la misma `PrivateRoute`. |
| Asociación de Línea | `RegistrarActualizarLineaForm` reutiliza `SuperlineasSelector` en ambos modos y carga `/superlinea/select`. En edición, `transformData` inicializa `superLineaId` desde `linea.superlinea.id`; el submit lo incluye en `UpdateLineaDto` solo si difiere del ID inicial. Los fallos se muestran sin cerrar el formulario. |
| Alta anidada | Se conserva el botón `+` y `RegistrarSuperlinea`; cancelar no desmonta Línea/Producto. Al crear, se recargan opciones sin seleccionar automáticamente. |

## Cambios de archivos

| Archivo | Acción | Descripción |
|---|---|---|
| `src/interfaces/gestion-producto/superlinea/interfaces-superlinea.tsx` | Modificar | Alinear DTO, filtros y payloads. |
| `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` | Modificar | Implementar contratos sin impresión/restauración. |
| `src/componentes/gestion-producto/superlinea/interfaces/interfaces-validaciones-superlinea.tsx` | Modificar | Normalizar defaults de edición. |
| `src/componentes/gestion-producto/superlinea/utils/registrar-superlinea.tsx` | Modificar | Preservar alta/edición y evitar envíos simultáneos, sin exigir cambios detectados. |
| `src/componentes/gestion-producto/superlinea/utils/consultar-superlinea.tsx` | Crear | Coordinar listado, CRUD y auditoría. |
| `src/componentes/gestion-producto/superlinea/componentes/filtros-superlinea.tsx` | Crear | Filtros contractuales. |
| `src/componentes/gestion-producto/superlinea/componentes/datos-tabla.tsx` | Crear | Tabla y acciones de escritorio. |
| `src/componentes/gestion-producto/superlinea/componentes/datos-card.tsx` | Crear | Presentación y acciones móviles. |
| `src/componentes/gestion-producto/superlinea/componentes/header.tsx` | Crear | Título, estadísticas y alta, sin impresión. |
| `src/componentes/gestion-producto/superlinea/componentes/header-lg.tsx` | Crear | Encabezado móvil sin impresión. |
| `src/componentes/gestion-producto/superlinea/hooks/use-superlinea-modal.ts` | Crear | Estado modal. |
| `src/componentes/gestion-producto/superlinea/modales/superlinea-modal.tsx` | Crear | Formularios y auditoría. |
| `src/interfaces/gestion-producto/linea/interfaces-linea.tsx` | Modificar | Preservar `superlinea`; tipar `superLineaId` opcional. |
| `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx` | Modificar | Inicializar `superLineaId` desde `linea.superlinea.id`. |
| `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx` | Modificar | Mostrar el selector en ambos modos y omitir el ID sin cambio. |
| `src/componentes/gestion-producto/linea/services/linea-service.tsx` | Modificar | Tipar `actualizar` con `UpdateLineaDto`. |
| `src/App.tsx` | Modificar | Registrar la ruta hermana. |
| `src/componentes/menu/menuItems-definicion.ts` | Modificar | Añadir la entrada con paridad exacta. |

## Interfaces / contratos

Contratos siguen OpenAPI. En edición, `observacion` nula se representa como `""` y vuelve como `null` si queda vacía.

## Estrategia de verificación

No existe runner automatizado. La revisión estática verificará DTO opcional, defaults, selector en ambos modos y comparación con el ID inicial. La prueba manual confirmará que Línea omite `superLineaId` sin reasignación, lo envía al cambiar, muestra fallos sin cerrar y preserva alta/flujo anidado. SuperLínea admitirá actualización válida sin estado sucio y bloqueará envíos simultáneos. Después se ejecutarán `yarn build`, `yarn lint` y `yarn tsc -b`, distinguiendo baseline.

## Matriz de amenazas

N/A — la nueva ruta es navegación declarativa de React Router; no introduce enrutamiento de comandos, shell, subprocesos, VCS/PR, clasificación de ejecutables ni integración de procesos. Todas las filas de la matriz de procesos son N/A y no generan pruebas RED.

## Migración / despliegue

No requiere migración de datos ni bandera. El despliegue puede revertirse retirando ruta, menú y módulos nuevos, y restaurando el formulario/payload de Línea; el alta anidada permanece preservada.

## Preguntas abiertas

Ninguna.
