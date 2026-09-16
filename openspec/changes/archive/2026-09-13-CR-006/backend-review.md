# Revisión del backend para CR-006

Inspección estática de `/home/vcorrea/prog-avanz/backend` y Swagger local. Sin cambios ni ejecución de mutaciones en backend. No existe `.codegraph/` en backend; se utilizó lectura dirigida conforme a AGENTS.md.

## Selector de Líneas (D2)

`producto.controller.ts`, método `findAllLineasFor`, expone GET `/api/producto/find-all-for-lineas/select`, acepta `denominacion` con defecto vacío y permite Root, Administrador y Empleado (además de otros roles). Delega en `LineaService.findAllFor`, que devuelve `{data: LineaDto[], total: 1}`. Consumir `data`; no interpretar ese total constante como cantidad real. El repositorio busca por denominación y ordena ascendentemente. Contrato de lectura identificado; no probado con sesión autenticada.

## Ajuste inválido y transacción (D3)

`ProductoService.actualizarPrecios` aplica primero los ajustes a todas las entidades cargadas y solo después invoca persistencia. Un precio inválido lanza Error antes de guardar. `ProductoPersistenceService.actualizarPrecios` está decorado con `@Transactional()`: guarda usando el repositorio del UnitOfWork; el decorador confirma o revierte al capturar error. Evidencia estática de validación previa y transacción, no prueba de concurrencia o integración.

`Producto.actualizarPrecioManteniendoMargen` lanza Error con «El precio final debe ser mayor que 0.»; el filtro global convierte errores no HttpException en 500 y preserva message. No documentar este caso como 400.

## Discrepancias revisadas y decisiones del usuario

- Swagger declara 201 para POST; el controller no establece HttpCode(200). CR-006 y R4 dicen 200. Propuesta: aceptar 200/201 con el mismo cuerpo, sin modificar backend.
- El servicio consulta con skip=0 y take=10000. El contrato pide todos los productos del alcance; no presentar ese límite como cumplimiento global para catálogos mayores.
- No se encontró `CambioPrecio`/`cambioPrecio` en `backend/src`; la persistencia revisada guarda Producto y usuarioUpdated, sin registro explícito de CambioPrecio. El criterio CR-007 no queda demostrado por esta implementación. La ausencia de nombres no prueba ausencia de auditoría externa.

El usuario decidió aceptar 200/201, conservar el límite de 10.000 y excluir CambioPrecio porque otra persona se encarga. Estas decisiones se incorporan explícitamente a proposal, design, specs y tasks; no se modifica el backend.

## Evidencia de comandos

Lecturas y búsquedas de controller, service, entity, persistence adapter, decorador transaccional y filtro global. `rg CambioPrecio|cambioPrecio backend/src` terminó con exit 1 (sin coincidencias). No se corrieron tests, build ni lint; entrega documental. Swagger obtenido previamente mediante GET `/api-json` (curl exit 0 tras autorización de acceso local).
