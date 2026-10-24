# Snowflake Emulator Documentation

Referencia SQL en español del [Snowflake Emulator](https://github.com/OswaldOniSango/snowflake-emulator), publicada como sitio estático mediante GitHub Actions y GitHub Pages.

**Sitio:** https://OswaldOniSango.github.io/snowflake-emulator-documentation/

## Contenido y alcance

- 947 nombres registrados en DuckDB 1.5.5, incluidas funciones, operadores, macros y utilidades.
- 13 traducciones Snowflake → DuckDB y 2 funciones del contexto de sesión.
- Fichas con firmas, sintaxis, ejemplos, limitaciones y evidencia.
- UDF SQL, metodología, búsqueda, filtros, paginación y tema claro/oscuro.

Los datos corresponden a la auditoría del **21 de octubre de 2026**. Son una instantánea, no una consulta en vivo al emulador. La presencia en el catálogo no afirma compatibilidad con Snowflake ni que se haya probado cada firma. Los conjuntos se superponen: no sumar sus conteos como funciones únicas compatibles.

## Desarrollo local

Usar Node.js 24, indicado en `.nvmrc` (no hay dependencias externas de npm).

```sh
npm test
npm run preview
```

Abrir http://127.0.0.1:8462/. Para otro puerto: `PORT=8463 npm run preview`.
La página carga JSON mediante `fetch`; usar HTTP en lugar de abrir `index.html` directamente con `file://`.

## Publicación automática

El flujo [.github/workflows/pages.yml](.github/workflows/pages.yml):

1. Valida el inventario, las fichas y los recursos estáticos en cada pull request.
2. Vuelve a validar cuando hay cambios en `main`.
3. Publica únicamente `dist/` en GitHub Pages si la validación pasa.

También se puede ejecutar manualmente desde **Actions → Documentation · GitHub Pages → Run workflow**, seleccionando `main`. La publicación requiere que **Settings → Pages → Build and deployment → Source** esté configurado en **GitHub Actions**. El entorno de despliegue se llama `github-pages`.

El sitio de GitHub Pages es **público**. No colocar datos privados, credenciales ni configuraciones de Sites dentro de `dist/`. El flujo no utiliza secretos personales: concede al trabajo de despliegue los permisos `pages: write` e `id-token: write` del token de Actions. Las acciones se fijan a revisiones concretas.

## Editar la documentación

| Archivo | Contenido |
|---|---|
| `dist/index.html` | Estructura, navegación y recursos |
| `dist/styles.css` | Diseño y reglas adaptables |
| `dist/app.js` | Navegación, búsqueda y renderizado de fichas |
| `dist/emulator.json` | 15 fichas con tratamiento propio del emulador |
| `dist/native.json` | Catálogo DuckDB agrupado por nombre, con firmas distintas |
| `dist/duckdb-functions.json` | 2950 filas originales del catálogo auditado |
| `dist/inventario-funciones.md` | Informe de la auditoría |
| `verify.mjs` | Validación de datos y recursos |

Antes de cambiar versiones o conteos, regenerar el catálogo desde el motor utilizado por el emulador y verificar las variantes que se quieran declarar como disponibles. Actualizar conjuntamente los JSON, los números y fechas de la interfaz, el informe y las comprobaciones de `verify.mjs`. El despliegue no regenera el inventario automáticamente.

## Acceso y administración

- **Visitar el sitio:** usar el enlace de GitHub Pages al inicio de este documento.
- **Ver despliegues y errores:** abrir la pestaña **Actions** de este repositorio.
- **Ver la dirección y configuración:** abrir **Settings → Pages**.
- **Editar el código:** crear una rama, enviar un pull request y fusionarlo después de validar los cambios.

La copia anterior en ChatGPT Sites es una publicación independiente. Cambiar este repositorio no actualiza esa copia, y publicar aquí no modifica sus permisos de acceso.

Proyecto independiente para aprender y experimentar. No es documentación oficial de Snowflake.
