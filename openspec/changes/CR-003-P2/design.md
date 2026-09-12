# Diseño: CR-003-P2 — Gestión de SuperLínea y asociación editable

## Enfoque técnico

Se ampliará `gestion-producto/superlinea` con la composición activa de Línea: pantalla coordinadora, componentes responsivos, hook/modal, formulario, servicio Axios e interfaces. Se reutilizarán `TablaAGGrid`, `Paginacion`, `InformacionAuditoria`, alertas, confirmaciones, filtros y `parseApiError`; no se creará un CRUD genérico. Los endpoints y DTO se limitarán a `docs/contracts/openapi.json`.

## Decisiones de arquitectura

| Opción | Tradeoff | Decisión y fundamento |
|---|---|---|
| Extender `createCrudService` | Incluye impresión no soportada | No usarlo para SuperLínea; ampliar su servicio explícito evita exponer contratos inexistentes. |
| Pantalla específica basada en Línea | Duplica estructura visual | Elegida: conserva límites, estado y convenciones reales sin ampliar el impacto. |
| Comparar la asociación en el formulario | Requiere conservar el ID inicial | Elegida: `transformData` toma `LineaDto.superLinea.id`; el submit agrega `superLineaId` únicamente si difiere. |
| Roles propios para SuperLínea | Podrían divergir de Línea | Rechazada: menú y ruta copiarán exactamente ubicación y guardas de Línea. |

## Flujo de datos y trazabilidad

```text
Menú → /admin/superlinea → ConsultarSuperlineas
  → filtros/skip/take → SuperLineaService → API
  → tabla/tarjetas → detalle | formulario | auditoría | eliminación

Editar Línea → GET /linea/{id} → superLinea.id inicial
  → GET /superlinea/select → selector
  → comparar ID inicial/actual → PUT (con ID cambiado | sin superLineaId)
```

| Requisitos | Realización concreta |
|---|---|
| Gestión, búsqueda y auditoría | La pantalla mantiene `data`, `total`, carga, filtros y paginación; el servicio implementa búsqueda, detalle, alta, actualización, eliminación y auditoría. Tabla/tarjetas no ofrecen impresión ni restauración; `deletedAt` e `incluirEliminados` no se interpretan como garantía de un mecanismo de borrado. |
| Validación y errores | Yup exige denominación y máximo 255. Formulario/listado permanecen abiertos y conservan datos ante error. `parseApiError` normaliza el cuerpo; fallbacks por estado comunican 403 protegido, 404 inexistente y 409 por denominación o, al eliminar, Líneas activas asociadas. Solo un éxito cierra/refresca. |
| Navegación/permisos | “SuperLíneas” será hermana de “Líneas” bajo Configuración, sin roles propios; `/admin/superlinea` será hermana de `linea` bajo la misma `PrivateRoute`. |
| Asociación de Línea | El selector se renderiza en alta y edición, carga solo `/superlinea/select`, inicializa desde `superLinea`, bloquea alta sin opción y muestra fallos. El payload conserva los demás campos; 403/404 dejan el formulario abierto. |
| Alta anidada | Se conserva el botón `+` y `RegistrarSuperlinea`; cancelar no desmonta Línea/Producto. Al crear, se recargan opciones sin seleccionar automáticamente. |

## Cambios de archivos

| Archivo | Acción | Descripción |
|---|---|---|
| `src/interfaces/gestion-producto/superlinea/interfaces-superlinea.tsx` | Modificar | Alinear DTO, filtros y payloads create/update. |
| `src/componentes/gestion-producto/superlinea/services/superlinea-service.ts` | Modificar | Implementar los siete contratos explícitos, sin impresión/restauración. |
| `src/componentes/gestion-producto/superlinea/interfaces/interfaces-validaciones-superlinea.tsx` | Modificar | Añadir transformación para edición y validación compartida. |
| `src/componentes/gestion-producto/superlinea/utils/registrar-superlinea.tsx` | Modificar | Admitir alta independiente/anidada y edición, mensajes y errores conservando estado. |
| `src/componentes/gestion-producto/superlinea/utils/consultar-superlinea.tsx` | Crear | Coordinar consulta, paginación, CRUD, auditoría y alertas. |
| `src/componentes/gestion-producto/superlinea/componentes/filtros-superlinea.tsx` | Crear | Filtro contractual y opción `incluirEliminados`. |
| `src/componentes/gestion-producto/superlinea/componentes/datos-tabla.tsx` | Crear | Tabla y acciones de escritorio. |
| `src/componentes/gestion-producto/superlinea/componentes/datos-card.tsx` | Crear | Presentación y acciones móviles. |
| `src/componentes/gestion-producto/superlinea/componentes/header.tsx` | Crear | Título, estadísticas y alta, sin impresión. |
| `src/componentes/gestion-producto/superlinea/componentes/header-lg.tsx` | Crear | Encabezado móvil sin impresión. |
| `src/componentes/gestion-producto/superlinea/hooks/use-superlinea-modal.ts` | Crear | Estado de alta, edición y auditoría. |
| `src/componentes/gestion-producto/superlinea/modales/superlinea-modal.tsx` | Crear | Componer formulario e `InformacionAuditoria`. |
| `src/interfaces/gestion-producto/linea/interfaces-linea.tsx` | Modificar | Representar la respuesta como `superLinea` y tipar actualización opcional. |
| `src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-linea.tsx` | Modificar | Inicializar `superLineaId` desde `superLinea.id`. |
| `src/componentes/gestion-producto/linea/utils/registrar-actualizar-linea.tsx` | Modificar | Cargar selector en ambos modos y omitir el ID sin cambio. |
| `src/componentes/gestion-producto/linea/services/linea-service.tsx` | Modificar | Tipar `actualizar` con `UpdateLineaDto`. |
| `src/App.tsx` | Modificar | Registrar la ruta hermana. |
| `src/componentes/menu/menuItems-definicion.ts` | Modificar | Añadir la entrada con paridad exacta. |

## Interfaces / contratos

`SearchSuperLineaParams` contiene `denominacion?`, `skip?`, `take?`, `incluirEliminados?`; `UpdateSuperLineaDto` exige `usuarioUpdatedId`; `UpdateLineaDto` exige `usuarioUpdatedId` y admite `superLineaId?`. El servicio devuelve `SuperLineaListResponseDto`, `SuperLineaDto`, `Auditoria` o `ResponsePost` según OpenAPI.

## Estrategia de verificación

No existe runner automatizado. Se hará revisión estática del payload (alta, edición sin cambio y reasignación), y prueba manual de búsqueda/paginación, CRUD, auditoría, alta anidada/cancelación, catálogo vacío, permisos equivalentes y respuestas 403/404/409 simuladas o provistas por API. Después: `yarn build`, `yarn lint` y `yarn tsc -b`, separando los fallos preexistentes documentados de regresiones nuevas.

## Matriz de amenazas

N/A — la nueva ruta es navegación declarativa de React Router; no introduce enrutamiento de comandos, shell, subprocesos, VCS/PR, clasificación de ejecutables ni integración de procesos. Todas las filas de la matriz de procesos son N/A y no generan pruebas RED.

## Migración / despliegue

No requiere migración de datos ni bandera. El despliegue puede revertirse retirando ruta, menú y módulos nuevos, y restaurando el formulario/payload de Línea; el alta anidada permanece preservada.

## Preguntas abiertas

Ninguna.
