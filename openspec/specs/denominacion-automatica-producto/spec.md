# Capability: denominacion-automatica-producto

## Requirements

### Requirement: Lenguaje ubicuo

El sistema MUST documentar **Denominación automática** como la sugerencia de denominación de Producto formada por Marca, Línea y Presentación en ese orden.

### Requirement: Generación en alta

Al registrar un Producto nuevo, WHEN el usuario ha seleccionado Marca, Línea y Presentación, el campo denominación MUST completarse con la Denominación automática `"{marca} {linea} {presentacion}"` (un espacio entre partes; sin espacios extremos superfluos).

#### Scenario: Completa al tener los tres

- **Given** el formulario de Registrar Producto abierto
- **And** el campo denominación vacío o aún bajo sugerencia activa
- **When** el usuario selecciona Marca "Coca Cola", Línea "Gaseosas" y Presentación "2L"
- **Then** el campo denominación muestra `Coca Cola Gaseosas 2L`

### Requirement: Solo creación

La sugerencia MUST aplicarse únicamente en el flujo de creación. En visualización o edición de un Producto existente, el sistema MUST NOT regenerar la denominación por cambios de Marca, Línea o Presentación.

#### Scenario: Edición de producto existente

- **Given** un Producto existente abierto en el formulario
- **When** se muestran Marca, Línea y Presentación
- **Then** la denominación mostrada es la persistida y no se regenera por este comportamiento

### Requirement: Edición manual

El usuario MUST poder editar manualmente el valor sugerido en el campo denominación desde la PRIMERA interacción. El primer clic o pulsación de tecla MUST NOT mover el cursor de forma inesperada ni reemplazar el texto introducido por el usuario. La escritura rápida de caracteres consecutivos MUST conservar cada carácter introducido y la posición de edición.

(Previously: El usuario MUST poder editar manualmente el valor sugerido en el campo denominación.)

#### Scenario: Editable

- **Given** una Denominación automática ya sugerida
- **When** el usuario modifica el texto del campo
- **Then** el valor editado permanece en el campo

#### Scenario: Primera edición manual preservada

- **Given** una sugerencia automática activa en el formulario de Registrar Producto
- **When** el usuario coloca el cursor dentro del texto y escribe el primer carácter
- **Then** el carácter introducido permanece
- **And** el valor NO se restaura a la sugerencia
- **And** el cursor permanece en la posición de edición del usuario

#### Scenario: Escritura rápida consecutiva preservada

- **Given** una sugerencia automática activa
- **When** el usuario escribe varios caracteres consecutivos sin pausar
- **Then** cada carácter introducido permanece en el valor de denominación
- **And** el valor no vuelve a la sugerencia automática
- **And** el cursor permanece después del carácter introducido más recientemente

### Requirement: No sobrescritura

Una vez que el valor de denominación difiera manualmente de la última sugerencia automática, el sistema MUST NOT sobrescribirlo durante el mismo ciclo de actualización ni después de cambios posteriores de Marca, Línea o Presentación. El valor editado manualmente MUST permanecer como autoridad hasta que el usuario vacíe el campo.

(Previously: WHILE la denominación haya sido modificada manualmente respecto de la última sugerencia, el sistema MUST NOT reemplazarla al cambiar Marca, Línea o Presentación.)

#### Scenario: No sobrescribe edición manual

- **Given** el usuario editó manualmente la denominación a `Mi producto especial`
- **When** cambia la Presentación u otra de las tres selecciones
- **Then** el campo conserva `Mi producto especial`

#### Scenario: Cambio de selector después de la primera edición manual

- **Given** el usuario escribió el primer carácter en una sugerencia automática activa
- **When** el usuario cambia Marca, Línea o Presentación
- **Then** la denominación editada manualmente permanece sin cambios
- **And** el sistema no la restaura ni la reemplaza con una sugerencia automática

### Requirement: Reactivación al vaciar

WHEN el usuario deja el campo denominación vacío (solo espacios o cadena vacía), el sistema MUST reactivar la sugerencia y, si Marca, Línea y Presentación siguen seleccionadas, MUST volver a completar la Denominación automática.

#### Scenario: Vaciar reactiva

- **Given** una denominación editada manualmente
- **And** Marca, Línea y Presentación seleccionadas
- **When** el usuario borra por completo el campo denominación
- **Then** el campo se vuelve a completar con la Denominación automática vigente

#### Scenario: Vaciar solo con espacios reactiva

- **Given** una denominación editada manualmente
- **And** Marca, Línea y Presentación permanecen seleccionadas
- **When** el usuario reemplaza todo el campo por texto compuesto únicamente por espacios
- **Then** el sistema trata el campo como vacío
- **And** el campo vuelve a completarse con la Denominación automática vigente

### Requirement: Sin default backend

Este change MUST NOT introducir un valor por defecto de denominación en el backend ni alterar el contrato HTTP de creación de Producto por este motivo.
