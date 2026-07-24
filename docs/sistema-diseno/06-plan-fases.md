# Plan de implementación por fases

> 5 fases + 1 fase de documentación viva. Cada fase es revertible.

## Ordenamiento por riesgo (no por calendario)

Max no tiene deadline duro. El orden es **por riesgo y por valor
acumulado**:

1. Primero lo que **asegura que nadie rompa el sistema** (Fase 1:
   tokens + linter).
2. Después lo que **reduce la cantidad de trabajo futuro** (Fase 2:
   primitivos reutilizables).
3. Después lo que **valida los primitivos en el mundo real** (Fase 3:
   3 páginas piloto).
4. Después el **resto del portal alumno** (Fase 4).
5. Después el **portal docente y labs** (Fase 5).
6. En paralelo desde la Fase 1: **documentación viva** (Fase 6).

## Fase 1 — Cimientos (5-7 días)

**Objetivo:** que sea imposible meter un color o un gradiente no
justificado sin que el build falle.

### Cambios

1. Crear `src/styles/_tokens.scss` con la lista consolidada de tokens
   (ver `04-tokens-y-tema.md` §3.1).
2. Modificar `src/styles.scss`:
   - Quitar el bloque `:root` con los tokens.
   - Agregar `@import './styles/tokens';` en la posición correcta.
3. Reemplazar `tailwind.config.js` con la versión que consume
   `var(--daemon-*)` (ver `04-tokens-y-tema.md` §3.2).
4. Crear `scripts/check-style-tokens.mjs` con las 6 reglas del linter
   (ver `04-tokens-y-tema.md` §5).
5. Modificar `package.json`:
   - Agregar `"check:style-tokens": "node scripts/check-style-tokens.mjs"`.
   - Sumarlo al script `test:ci` (debe correr antes que Jest).
6. Documentar en `01-auditoria-frontend.md` §6 el estado del linter
   tras la primera ejecución.

### Criterios de salida

- [ ] `npm run check:style-tokens` pasa en limpio (cero violaciones).
- [ ] `npm run build` sigue < 1 MB warning budget.
- [ ] `npm test` (Jest) pasa.
- [ ] `npm run e2e:public` pasa.
- [ ] El PR está abierto y revisado.
- [ ] No se ha tocado ningún archivo de `features/` ni de `shared/`.

### Riesgos

- **R1.1:** algún componente rompe al cambiar el theme de Tailwind.
  Mitigación: ejecutar `npm run build` local antes del PR.
- **R1.2:** el linter tiene falsos positivos en `node_modules` o en
  `*.spec.ts`. Mitigación: excluir esos paths explícitamente.

## Fase 2 — Primitivos reutilizables (1 sprint = 7-10 días)

**Objetivo:** 11 primitivos que cubran los 5 arquetipos.

### Lista de primitivos

| # | Primitivo | Cubre arquetipo | Notas |
|---|---|---|---|
| 1 | `daemon-btn` | todos | Wrap de `nz-button` con CVA (tone, size, fullWidth) |
| 2 | `page-container` | todos | max-width + padding + canvas |
| 3 | `page-header` | B, C, D, E | kicker + título + acciones |
| 4 | `hero-band` | B | slot para kicker, título, desc, acciones, art, progress |
| 5 | `stat-card` | B, B' | label + valor + icono + hint + variante protagonista |
| 6 | `catalog-toolbar` | C | filtros + orden + búsqueda + acciones de página |
| 7 | `catalog-card` | C | cover + body + footer slots |
| 8 | `catalog-aside` | C | aside sticky con header + slots apilables |
| 9 | `bottom-sheet` | C (móvil) | sheet con FAB toggle y overlay |
| 10 | `form-page` | D | grid 2-col responsive + footer de acciones |
| 11 | `classic-field` | A | input con icono lateral + acción derecha (de login) |
| 12 | `auth-card` | A | card con accent superior + slot de form |

### Criterios de salida por primitivo

- [ ] Componente standalone con OnPush.
- [ ] CVA con variantes tipadas y default sensato.
- [ ] Spec Jest con al menos 3 casos (render básico, variante, slot).
- [ ] Sin dependencias de `core/` ni de `features/`.
- [ ] Documentado en `docs/sistema-diseno/catalogo-componentes.md` con
      un ejemplo de uso.

### Riesgos

- **R2.1:** los primitivos se vuelven "Dios components" con 20 props.
  Mitigación: cada primitivo tiene 1 responsabilidad y slots para el
  resto. Si un primitivo necesita más de 6 props, se divide.
- **R2.2:** CVA no soporta algunas combinaciones. Mitigación: usar
  `tailwind-merge` para resolver el último conflicto.

## Fase 3 — Tres páginas piloto (1 sprint = 7-10 días)

**Objetivo:** validar que los primitivos sirven para los 3 arquetipos
más importantes y que el sistema escala.

### Los 3 pilotos

1. **Galería de historias** (`/alumno/proyectos/cuentos`) — C (referencia).
2. **Gestionar misiones docente** (`/docente/misiones`) — E.
3. **Detalle de misión** (`/alumno/misiones/:id`) — D.

### Por cada piloto

1. Antes: screenshot, lista de hex arbitrarios, gradientes, archivos
   tocados.
2. Migración a primitivos + reemplazo de hex por tokens.
3. Después: screenshot, verificación de linter pasa, axe-core pasa,
   bundle < 1 MB, e2e Playwright pasa.
4. Diff resumido: archivos modificados, líneas agregadas/eliminadas.

### Criterios de salida

- [ ] Los 3 pilotos compilan con `npm run build`.
- [ ] El linter pasa con cero violaciones nuevas.
- [ ] axe-core en cada piloto: cero violaciones serias.
- [ ] Lighthouse mobile ≥ 90 (performance + accessibility + best
      practices).
- [ ] e2e Playwright actualizado para los 3 pilotos.
- [ ] Screenshots antes/después agregados a
      `docs/sistema-diseno/pilotos/`.

### Riesgos

- **R3.1:** la galería de historias tiene un SCSS de 1100+ líneas con
  reglas únicas. Migrarla entera en un sprint es optimista. Mitigación:
  dejar un subset de reglas únicas como overrides del primitivo
  `catalog-aside` o `bottom-sheet`.
- **R3.2:** la tabla NG-ZORRO de gestionar-misiones tiene una
  especificidad alta. Si el override no encaja, se reescribe con
  `nz-table` + estilos en SCSS del componente.
- **R3.3:** el detalle de misión es el piloto más "estándar" pero
  también el menos interesante. Mitigación: sirve como control — si
  no funciona aquí, no funcionará en ningún D.

## Fase 4 — Resto del portal alumno (2 sprints = 14-20 días)

**Objetivo:** migrar todas las páginas del portal alumno a primitivos.

### Orden (de menor a mayor riesgo)

1. `/alumno/notificaciones` (D, simple).
2. `/alumno/canjes` (D, lista).
3. `/alumno/resultados` (D, tabla simple).
4. `/alumno/recursos` (C, similar a galería).
5. `/alumno/comunidad` (C, directorio).
6. `/alumno/proyectos` (C, hub).
7. `/alumno/tienda` (C, catálogo con balance).
8. `/alumno/misiones` (C, catálogo principal).
9. `/alumno/ranking` (C+D, mixto).
10. `/alumno/perfil` (D, perfil + insignias).
11. `/alumno/perfil/editar` (D, form).
12. `/alumno/mascota` (C, vestidor).
13. `/alumno/certificado` (D, certificado).
14. `/alumno/certificado/imprimir` (imprimible, no estándar).
15. `/alumno/evaluaciones` (D, examen live).
16. `/alumno/proyectos/cuentos/crear` (D, editor).
17. `/alumno/proyectos/cuentos/:id` (D, lectura inmersiva).
18. `/alumno/competencia` (D, voto en vivo).
19. `/alumno/comunidad/perfil/:id` (D, perfil público).
20. `/alumno/herramientas/*` (mixto, 6 páginas — evalúar caso por caso).
21. `/alumno` (B, dashboard del alumno — se reescribe con `hero-band`).

### Criterios de salida

- [ ] Todas las páginas del portal alumno usan los primitivos.
- [ ] `npm run check:style-tokens` pasa con cero violaciones.
- [ ] `npm run check:student-visual` pasa (script existente).
- [ ] `npm run test:ci` pasa.
- [ ] Bundle inicial se mantiene < 1 MB.

## Fase 5 — Portal docente, labs y familias (2-3 sprints = 14-21 días)

**Objetivo:** migrar el portal docente, los labs y el portal de
familias.

### Orden

1. `/docente/notificaciones` (D, simple).
2. `/docente/perfil` (D, perfil).
3. `/docente` (B', dashboard docente).
4. `/docente/insignias` (E, catálogo).
5. `/docente/aulas` (E, tabla).
6. `/docente/rondas` (E, tabla simple).
7. `/docente/tokens` (E, auditoría).
8. `/docente/alumnos` (E, tabla densa).
9. `/docente/curriculo` (E, CMS).
10. `/docente/evaluaciones` (E, banco).
11. `/docente/evaluaciones/resultados` (E, tabla).
12. `/docente/entregas` (E, cola).
13. `/docente/tienda` (E, admin tienda).
14. `/docente/competencia` (E, control).
15. `/docente/carnets/:id` (imprimible).
16. `/docente/competencia/tv` (público).
17. `/alumno/competencia/tv` (público).
18. `/alumno/herramientas/*` (6 páginas — caso por caso).
19. `/familias/acceso` (A, adaptado al tutor).
20. `/familias` (B', dashboard tutor).
21. `/` (público, landing).

### Criterios de salida (al terminar Fase 5)

- [ ] Todas las 58 rutas usan los primitivos del sistema.
- [ ] Cero hex arbitrarios fuera del allowlist.
- [ ] Cero gradientes en features de alumno o cuentos.
- [ ] Cero `!important` fuera de `_components.scss`.
- [ ] axe-core pasa en las 58 rutas.
- [ ] Lighthouse mobile ≥ 85 en promedio.
- [ ] Bundle inicial < 1 MB warning budget.

## Fase 6 — Documentación viva (paralelo)

**Objetivo:** que un agente nuevo pueda incorporarse leyendo solo este
directorio.

### Documentos a crear/mantener

- [x] `00-resumen-ejecutivo.md` (Fase 0)
- [x] `01-auditoria-frontend.md` (Fase 0)
- [x] `02-inventario-paginas.md` (Fase 0)
- [x] `03-arquetipos.md` (Fase 0, revisar en Fase 3)
- [x] `04-tokens-y-tema.md` (Fase 0, refinar en Fase 1)
- [x] `05-recomendacion-stack.md` (Fase 0)
- [x] `06-plan-fases.md` (Fase 0, este archivo)
- [x] `07-handoff-nuevo-agente.md` (Fase 0)
- [ ] `catalogo-componentes.md` (Fase 2)
- [ ] `guia-migracion-feature.md` (Fase 3) — cookbook para migrar
      una feature existente.
- [ ] `pilotos/galeria-proyectos/{antes,despues}.md` (Fase 3)
- [ ] `pilotos/gestionar-misiones/{antes,despues}.md` (Fase 3)
- [ ] `pilotos/detalle-mision/{antes,despues}.md` (Fase 3)
- [ ] `release-YYYY-MM-DD-sistema-diseno.md` (cada vez que se cierra
      una fase).

### Regla de mantenimiento

> Cuando una decisión de código cambie, actualizar en el mismo PR el
> documento correspondiente de `docs/sistema-diseno/`. Si el cambio
> invalida una decisión cerrada, abrir conversación con Max antes de
> mergear.

## Resumen ejecutivo del plan

| Fase | Duración estimada | Entregable verificable |
|---|---|---|
| 1. Cimientos | 5-7 días | Linter funcionando, tokens consolidados, build verde |
| 2. Primitivos | 7-10 días | 12 primitivos con spec + e2e básico |
| 3. Pilotos | 7-10 días | 3 páginas migradas con antes/después |
| 4. Portal alumno | 14-20 días | 21 páginas del alumno migradas |
| 5. Docente + labs + familias | 14-21 días | 16 páginas restantes migradas |
| 6. Docs vivos | paralelo | Catálogo de componentes + cookbooks |
| **Total** | **6-8 semanas a ritmo de 1 dev** | **58 rutas unificadas en un sistema** |
