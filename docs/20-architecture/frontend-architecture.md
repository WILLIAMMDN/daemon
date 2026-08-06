---
title: Arquitectura del frontend Angular
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

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
| `ui/` | contenedores y encabezados de página reutilizables (`page-container`, `page-header`) que unifican el layout de módulos | estado de negocio, acceso a API o sesión |
| `features/` | páginas, componentes, modelos y estado de un caso de uso | infraestructura global o componentes de otras features |
| `shared/` | componentes, directivas y utilidades visuales reutilizables y sin estado de negocio | acceso a API, sesión, roles o navegación específica de un portal |

### Capa `ui/`

`src/app/ui/` aloja piezas de layout sin lógica de negocio que cualquier módulo
puede usar (depende solo de Angular, tokens y Tailwind):

- `ui/layouts/page-container.ts` — selector `daemon-page-container`: contenedor
  con ancho máximo, padding responsive y transición de layout.
- `ui/layouts/page-header.ts` — selector `daemon-page-header`: encabezado de
  página con kicker, título y descripción, alineado al sistema de tokens
  `--daemon-*` (sin colores hardcodeados).

La capa `ui/` está en el mismo lado de la regla que `shared`: no importa `core`
ni `features`. Sus estilos usan exclusivamente tokens del sistema de diseño.

## Ubicaciones vigentes

```text
src/app/core/componentes/email-verification-banner/
src/app/core/layouts/sidebar-portal/
src/app/core/layouts/portal-sidebar.config.ts
src/app/core/dominio/
src/app/core/modelos/
src/app/core/servicios/
src/app/ui/layouts/
src/app/features/<contexto>/pages/
src/app/features/<contexto>/componentes/
src/app/shared/componentes/
src/app/shared/directivas/image-fallback.directive.ts
```

El sidebar y el banner de verificación pertenecen a `core`: ambos conocen la
sesión, la autenticación o la configuración del shell. Los componentes
puramente presentacionales, como la moneda DAEMON y los estados vacíos,
permanecen en `shared`.

## Modelos, configuración, directivas y pipes

- Un modelo utilizado solo por una feature se coloca junto a esa feature.
- Un tipo de dominio compartido por varios portales va en `core/dominio`.
- Los DTOs que describen las respuestas del backend (tienda, docentes,
  competencia, certificados, etc.) viven en `core/modelos/dto.ts`. Los
  servicios de `features/` los importan para tipar sus métodos, y las páginas
  tipan sus señales con ellos. No se redefinen los mismos campos en cada
  página; si un endpoint cambia, el DTO es el único lugar a editar.
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
