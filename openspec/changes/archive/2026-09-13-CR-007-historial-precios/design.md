# Diseño propuesto — CR-007

Estado: diseño consistente con proposal y specs; decisión de paginación (take+1) aprobada por el usuario el 2026-09-13 y registrada como deuda técnica.

## Límites y contratos

Inventario/Catálogo: consulta de solo lectura sobre el historial de precios de un `Producto`. No introduce modelos de dominio nuevos ni duplica fórmulas de precio. El read model del historial se mantiene separado de los flujos de escritura (`precios/actualizacion-masiva-precios`, `precios/lista_precios`, importaciones), que por diseño no se reutilizan aquí.

Tipos: `MotivoCambioPrecio` (union de los 5 valores) y `CambioPrecioDto { fecha: string; precioAnterior: number; precioNuevo: number; motivo: MotivoCambioPrecio }` en `src/interfaces/gestion-producto/historial-precios/interfaces-historial-precios.tsx`.

## Servicio

`ProductoService.obtenerHistorialPrecios(id, skip = 0, take = 10)` en `src/componentes/gestion-producto/producto/services/producto-service.tsx`:

- `ApiService.get('/producto/${id}/historial-precios', { skip, take })`; `ApiService.get` agrega Bearer desde `localStorage.Token` y la base API ya aporta `/api` sin duplicarlo.
- Uso de ruta `producto/:id/historial-precios` conforme al contrato (singular, kebab-case), no `/productos/.../historialPrecios`.

## Modal de historial

Nuevo `src/componentes/gestion-producto/historial-precios/historial-precios-modal.tsx` (carpeta nueva espejando `interfaces/.../historial-precios`).

- Props: `productoId: number`, `onClose: () => void`.
- Reutiliza: `Card` (patrón de `informacion-auditoria.tsx`), `usePaginacion(PAGINACION.TAKE_DEFAULT)`, `Paginacion`, `TablaAGGrid` + `Column<CambioPrecioDto>`, `formatFechaHora`, `formatPrice`, y `Badge` para el motivo.
- Columnas: Fecha, Precio anterior, Precio nuevo, Motivo. El motivo usa un mapa local (`configuracion-motivo.ts`) de enum → `{ etiqueta, clases }` para la insignia; sin lógica de negocio adicional.
- Estados: cargando, error (mensaje + cierre disponible) y vacío en página 1 (mensaje informativo: «El producto no tiene cambios de precio.»).
- `onClose` debe poder cerrar el modal en cualquier estado.

## Paginación y deuda técnica

El endpoint devuelve un arreglo plano sin `total`. Para reutilizar `Paginacion` (que necesita `entidadesTotales` para `Math.ceil(total/take)`):

- Solicitar `take + 1` registros; `hayMas = respuesta.length > take`; mostrar solo `take`.
- `entidadesTotales = skip + mostrados.length + (hayMas ? take : 0)`. Así `Paginacion` habilita «Siguiente» cuando existe página siguiente; se oculta sola cuando hay 0 o 1 página.
- `Paginacion` recibe `take` real (10) y `paginaActual`; `usePaginacion.handlePageChange` recalcula `skip`.

### Deuda técnica

- El total de páginas es aproximado: sin campo `total` en el contrato, cuando hay más de dos páginas los números de botones pueden subestimar el total real. Impacto: UX de paginación numérica imperfecta en historiales largos. Seguimiento sugerido: agregar `total` (o un objeto `{ data, total }`) al endpoint y descartar la heurística; decisión de backend.
- El modal pide `take+1` en cada cambio de página: sobresolicita un registro por página. Impacto: una fila de más por request, despreciable con take bajo. Seguimiento: eliminar al contar con `total`.

## Acciones de fila, modales y permisos

- `ProductoActions` (`src/componentes/gestion-producto/producto/componentes/producto-action.tsx`): agregar prop `onHistorial: (id: number) => void` y un `ActionButton` con el ícono `History` (ya importado, hoy sin uso) con `title` «Historial de precios».
- `DatosTabla` (`componentes/datos-tabla.tsx`): declarar `onHistorial` en `Props` y pasarlo a `ProductoActions` (hoy se pierde en el spread `...actions`).
- `consultar-producto.tsx` ya conecta `onHistorial={handleMostrarHistorialPrecios}` y las props del modal; sin cambios.
- `ProductosModales` (`modales/producto-modales.tsx`): renderizar, cuando `mostrarHistorialPrecios && productoInfo?.id`, el contenedor `fixed inset-0` (mismo patrón de los modales existentes) con `HistorialPreciosModal productoId={productoInfo.id} onClose={onCloseHistorialPrecios}`.
- Permiso nuevo en `domain/permisos-producto.ts`: `puedeVerHistorialPrecios(roles)` = `{ROOT, ADMINISTRADOR, EMPLEADO}`, alineado con el endpoint. La columna de acciones se muestra si `puedeAccionar || puedeVerHistorialPrecios`; dentro de `ProductoActions`, el botón de historial se pinta solo si `puedeVerHistorialPrecios`, y Editar/Eliminar únicamente si `puedeAccionar`, para no ampliar permisos de escritura.

## Alternativas y límites

- No reutilizar `precios/lista_precios` ni `actualizacion-masiva-precios`: son comandos/read models de precios de venta con payloads de escritura incompatibles con un historial de solo lectura. Se reutilizan solo primitivas (tabla, paginación, formato, card).
- No introducir `id` en el DTO ni usar `motivo` como clave de fila: el contrato no lo expone; la tabla usa índices de fila para `key`.
- No calcular variaciones (%, delta) no especificadas en el contrato.
- No tocar mobile (`DatosCard` mantiene el bloque de acciones comentado) ni rutas.

## Verificación prevista

Sin tests automatizados. Capturar baseline con `yarn build`, `yarn lint`, `yarn tsc -b`; comparar salida y exit status después de apply, sin corregir fallos ajenos (build pasa; lint y tsc tienen fallos preexistentes según `openspec/config.yaml`). Inspección del diff y contraste requisito por requisito. Verificación funcional manual sugerida: abrir historial con datos, con lista vacía en página 1, con 404/red y por rol (Root/Admin/Empleado permitido; Vendedor/Repartidor denegado).