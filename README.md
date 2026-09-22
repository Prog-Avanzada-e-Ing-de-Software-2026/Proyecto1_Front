# Frontend de Gestión

Guía para instalar, configurar y ejecutar el frontend localmente. El proyecto usa React, TypeScript y Vite.

## Inicio rápido

1. Instalá Node.js 24 y habilitá Corepack.
2. Instalá las dependencias con Yarn.
3. Verificá la URL de la API.
4. Iniciá el servidor de desarrollo.

```bash
corepack enable
yarn install
yarn dev
```

El servidor de desarrollo queda disponible en el puerto `5173`. El comando `dev` usa `vite --host`, por lo que el servidor escucha en todas las interfaces de red del equipo.

## Requisitos previos

- **Node.js 24**. Es la versión declarada por el proyecto.
- **Corepack** para usar la versión de Yarn definida por el repositorio.
- **Yarn 4.18.0**, administrado mediante Corepack. No uses npm ni pnpm en este proyecto.

Después de instalar Node.js, habilitá Corepack y comprobá la versión de Yarn:

```bash
corepack enable
yarn --version
```

## Instalación

Desde la raíz del repositorio, instalá las dependencias respetando el lockfile:

```bash
yarn install
```

## Configuración

El frontend consume únicamente la variable de entorno `VITE_API_URL`, que define la URL base de la API.

Vite carga los archivos de entorno al iniciar el proceso:

| Archivo | Cuándo se carga | Precedencia sobre `.env` |
| --- | --- | --- |
| `.env` | Siempre | Base |
| `.env.development` | Al ejecutar `yarn dev` | `VITE_API_URL` definida aquí reemplaza la del archivo base |
| `.env.production` | Al ejecutar `yarn build` | `VITE_API_URL` definida aquí reemplaza la del archivo base |

Cada archivo debe conservar la misma estructura. Reemplace el marcador por la URL correspondiente al entorno, sin incluir credenciales:

```env
VITE_API_URL=<URL_BASE_DE_LA_API>
```

Si los archivos de entorno se retiran del repositorio, los valores reales deben gestionarse fuera de este, por ejemplo mediante la configuración local del equipo o las variables de entorno del sistema de despliegue.

Vite carga estas variables al iniciar el proceso. Después de modificar un archivo de entorno, reinicie el servidor de desarrollo o ejecute nuevamente la compilación.

## Desarrollo

Iniciá el servidor de Vite:

```bash
yarn dev
```

Abrí la dirección que Vite informe en la terminal; la configuración del proyecto establece el puerto `5173`.

## Comandos útiles

| Objetivo | Comando |
| --- | --- |
| Ejecutar en desarrollo | `yarn dev` |
| Generar la compilación de producción | `yarn build` |
| Ejecutar ESLint | `yarn lint` |
| Verificar tipos de TypeScript | `yarn tsc -b` |
| Previsualizar la compilación | `yarn preview` |
| Servir el directorio `dist` | `yarn start` |
