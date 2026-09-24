# Capability: denominacion-automatica-producto

## Requirements

### Requirement: Lenguaje ubicuo

El sistema MUST documentar **Denominación automática** como la sugerencia de denominación de Producto formada por Marca, Línea y Presentación en ese orden.

### Requirement: Generación en alta

Al registrar un Producto nuevo, WHEN el usuario ha seleccionado Marca, Línea y Presentación, el campo denominación MUST completarse con la Denominación automática `"{marca} {linea} {presentacion}"` (un espacio entre partes; sin espacios extremos superfluos).

### Requirement: Solo creación

La sugerencia MUST aplicarse únicamente en el flujo de creación. En visualización o edición de un Producto existente, el sistema MUST NOT regenerar la denominación por cambios de Marca, Línea o Presentación.

### Requirement: Edición manual

El usuario MUST poder editar manualmente el valor sugerido en el campo denominación.

### Requirement: No sobrescritura

WHILE la denominación haya sido modificada manualmente respecto de la última sugerencia, el sistema MUST NOT reemplazarla al cambiar Marca, Línea o Presentación.

### Requirement: Reactivación al vaciar

WHEN el usuario deja el campo denominación vacío (solo espacios o cadena vacía), el sistema MUST reactivar la sugerencia y, si Marca, Línea y Presentación siguen seleccionadas, MUST volver a completar la Denominación automática.

### Requirement: Sin default backend

Este change MUST NOT introducir un valor por defecto de denominación en el backend ni alterar el contrato HTTP de creación de Producto por este motivo.

## Scenarios

### Scenario: Completa al tener los tres

- **Given** el formulario de Registrar Producto abierto
- **And** el campo denominación vacío o aún bajo sugerencia activa
- **When** el usuario selecciona Marca "Coca Cola", Línea "Gaseosas" y Presentación "2L"
- **Then** el campo denominación muestra `Coca Cola Gaseosas 2L`

### Scenario: Editable

- **Given** una Denominación automática ya sugerida
- **When** el usuario modifica el texto del campo
- **Then** el valor editado permanece en el campo

### Scenario: No sobrescribe edición manual

- **Given** el usuario editó manualmente la denominación a `Mi producto especial`
- **When** cambia la Presentación u otra de las tres selecciones
- **Then** el campo conserva `Mi producto especial`

### Scenario: Vaciar reactiva

- **Given** una denominación editada manualmente
- **And** Marca, Línea y Presentación seleccionadas
- **When** el usuario borra por completo el campo denominación
- **Then** el campo se vuelve a completar con la Denominación automática vigente

### Scenario: Edición de producto existente

- **Given** un Producto existente abierto en el formulario
- **When** se muestran Marca, Línea y Presentación
- **Then** la denominación mostrada es la persistida y no se regenera por este comportamiento
