# Arquitectura del frontend Angular

Esta guía fija los límites de responsabilidad de `frontend-angular` para que
el proyecto pueda crecer sin dependencias circulares ni carpetas de relleno.

## Regla de dependencias

```text
app/routes -> features + core
features   -> core + shared
core       -> shared
shared     -> Angular y librerías externas
```

Reglas obligatorias:

- `shared` no importa nada de `core` ni de `features`;
- `core` no importa ninguna `feature`;
- una `feature` no debe conocer los detalles internos de otra feature;
- las carpetas se crean cuando contienen una implementación real, no como
  marcadores de una arquitectura futura.

La frontera se valida con:

```powershell
cd frontend-angular
npm run check:architecture
```

`npm run test:ci` ejecuta esta comprobación antes de Jest para impedir que una
dependencia incorrecta llegue al pipeline.

## Responsabilidad de cada capa

| Capa | Contiene | No contiene |
| --- | --- | --- |
| `core/` | servicios singleton, sesión, autenticación, guards, interceptores, dominio compartido y shell de la aplicación | páginas de una feature o reglas visuales genéricas |
| `features/` | páginas, componentes, modelos y estado de un caso de uso | infraestructura global o componentes de otras features |
| `shared/` | componentes, directivas y utilidades visuales reutilizables y sin estado de negocio | acceso a API, sesión, roles o navegación específica de un portal |

## Ubicaciones vigentes

```text
src/app/core/componentes/email-verification-banner/
src/app/core/layouts/sidebar-portal/
src/app/core/layouts/portal-sidebar.config.ts
src/app/core/dominio/
src/app/core/servicios/
src/app/features/<contexto>/pages/
src/app/features/<contexto>/componentes/
src/app/shared/componentes/
src/app/shared/directivas/image-fallback.directive.ts
```

El sidebar y el banner de verificación pertenecen a `core`: ambos conocen la
sesión, la autenticación o la configuración del shell. Los componentes
puramente presentacionales, como la moneda DAEMON y los estados vacíos,
permanecen en `shared`.

`shared/componentes/estado-vacio` es la única abstracción editorial para
colecciones vacías. Encapsula `nz-empty`, no conoce servicios ni rutas y recibe
sus acciones por proyección de contenido. Su contrato visual se documenta en
`docs/estados-vacios-daemon.md`.

## Modelos, configuración, directivas y pipes

- Un modelo utilizado solo por una feature se coloca junto a esa feature.
- Un tipo de dominio compartido por varios portales va en `core/dominio`.
- La configuración de arranque sigue en `app.config.ts`; las variables por
  entorno siguen en `src/environments`.
- Una directiva compartida se crea cuando resuelve una conducta DOM repetida.
  `ImageFallbackDirective` estandariza la recuperación ante imágenes rotas y
  evita bucles si también falla el fallback.
- Se prefieren los pipes nativos de Angular. Un pipe propio solo se crea cuando
  existe una transformación pura, repetida y probada; nunca para llamar APIs o
  leer estado de sesión.

## Recursos y uploads

- `public/img`, `public/rive`, `public/audio` y recursos similares son assets
  estáticos versionados que Firebase Hosting puede servir.
- Los archivos de negocio nuevos se suben a Supabase Storage y sus URLs se
  resuelven con `Activos`.
- `public/uploads` contiene material heredado que puede seguir siendo
  referenciado. No se agregan archivos nuevos allí y no se elimina en bloque
  hasta completar una auditoría de referencias y migración.

## Criterio para cambios seguros

Antes de mover un componente se buscan todos sus imports y selectores. Después
del movimiento se conservan su selector, HTML, estilos, IDs y contrato público,
y se ejecutan arquitectura, pruebas y build. Esta regla es especialmente
importante para `sidebar-portal`, cuyos IDs forman parte del tour guiado.
