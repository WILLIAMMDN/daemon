# Handoff para Antigravity — dominio académico y libro de calificaciones

## Dependencia y propiedad

No iniciar este trabajo sobre contratos inventados. Consumir la API únicamente
después de que `codex/academic-mastery-foundation` sea revisada y esté integrada
en la rama base acordada.

Propiedad de Antigravity para esta tarea:

```text
frontend-angular/src/app/features/alumno/pages/mi-dominio/
frontend-angular/src/app/features/docente/pages/libro-calificaciones/
frontend-angular/src/app/core/servicios/academico.ts (solo métodos/tipos nuevos)
```

No modificar en esta tarea:

```text
core/layouts/sidebar-portal/
core/guards/
core/interceptores/
features/autenticacion/
styles.scss
angular.json
package*.json
```

El perfil eliminado del sidebar no debe restaurarse. Las rutas nuevas pueden
enlazarse desde el módulo académico existente; cualquier cambio de navegación
global debe proponerse en un commit separado.

## Prompt operativo

Implementa dos consumidores Angular del contrato documentado en
`docs/release-2026-07-20-academic-mastery.md`.

1. Alumno `/alumno/mi-dominio`: resumen, objetivos con evidencia, nivel de
   dominio, porcentaje y cantidad de evidencias. Explica en lenguaje infantil
   que es progreso, no una etiqueta fija. No muestres ranking aquí.
2. Docente `/docente/libro-calificaciones`: selector de sus aulas, tabla
   adaptable con ítem, categoría, alumno, porcentaje, estado y fecha; filtro por
   alumno/actividad y detalle de objetivos alineados.
3. Usa Angular signals y el patrón de caché ya existente. No vuelvas a pedir el
   mismo endpoint al regresar a la ruta mientras el dato siga fresco; ofrece
   actualización explícita y revalida tras calificar.
4. Implementa estados `loading`, skeleton estable, vacío, error con reintento y
   datos. Nunca muestres simultáneamente spinner y contenido viejo sin una
   indicación de actualización.
5. Mantén Inter, colores sólidos, superficies blancas y el sistema visual del
   portal. Sin gradientes ni glassmorphism.
6. Móvil primero: sin scroll horizontal de página; convierte la tabla en cards
   por debajo del breakpoint correspondiente. Targets táctiles mínimos de 44 px,
   foco visible, etiquetas accesibles y `aria-live` para carga/errores.
7. No cambies autenticación, interceptor, sidebar ni estilos globales para
   resolver un detalle local.

## Contratos

```text
GET /api/v1/alumno/dominio
GET /api/v1/academico/libro-calificaciones?id_aula={id}
```

Definir tipos explícitos; no usar `any`. No calcular dominio en el navegador:
el backend es la autoridad. El frontend puede agrupar y ordenar, pero no alterar
porcentajes ni umbrales.

## Criterios de aceptación

- El alumno nunca puede seleccionar ni inspeccionar otro `id_alumno`.
- El docente no conserva datos de un aula anterior al cambiar de selector.
- Regresar a la ruta reutiliza caché fresca y no bloquea el sidebar.
- 320, 360, 390, 768, 1024 y 1440 px sin cortes ni controles invisibles.
- Navegación completa con teclado; foco no oculto por header/bottom-nav.
- Pruebas unitarias de servicio/estado y pruebas de componente para loading,
  empty, error y success.
- `npm run test:ci`, `npm run check:architecture` y `npm run build` sin nuevas
  advertencias.

Entregar commits pequeños y separados: primero tipos/servicio, luego pantalla
alumno, luego pantalla docente y pruebas. No mezclar el resto del rediseño
pendiente de Antigravity en este pull request.
