# Estado documental del sistema de diseño DAEMON

> **Auditoría:** 2026-08-06
> **Auditado por:** Mavis (root session `mvs_1507a987fb6146d6932c999ea1c1d77a`)
> **Rama de origen:** `design/daemon-visual-constitution-v1`
> **Constitutional anchor:** `00-DAEMON-VISUAL-CONSTITUTION-V1.md`
>
> **Estados admitidos:**
> - **VIGENTE** — fuente de verdad actual, sin conflicto con la Constitución.
> - **PARCIALMENTE VIGENTE** — vigente con salvedades; ver columna "Conflicto".
> - **SUSTITUIDO** — reemplazado por otro documento. Ver "Sustituido por".
> - **OBSOLETO** — histórica; conserva valor de lectura pero NO se aplica.
> - **BORRADOR NO APROBADO** — no debe usarse como guía de implementación.
>
> **Auditoría explícita de decisiones D-01 a D-10:**
> - D-01 (Opción C de stack): **VIGENTE** (ver `05-recomendacion-stack.md`).
> - D-02 (Una sola fuente de verdad de tokens): **VIGENTE** (reforzada por la Constitución §21).
> - D-03 (Linter de tokens obligatorio): **VIGENTE** (enforcement en `04-tokens-y-tema.md` §5; ampliado por Constitución §20.5).
> - D-04 (5 arquetipos, galería como referencia C): **VIGENTE** (ver `03-arquetipos.md`).
> - D-05 (Inter única fuente): **VIGENTE** (Constitución §9.1 lo confirma).
> - D-06 (Sin gradientes ni glassmorphism en alumno): **VIGENTE** (Constitución §19.1 lo amplía como antipatrón global).
> - D-07 (DAEMONS = ámbar, XP = azul, éxito = verde, error = rojo): **VIGENTE CON SALVEDAD** — la Constitución §5 separa marca y semántica, así que "XP = azul" y "éxito = verde" pasan de ser reglas de color a ser **roles semánticos**; los colores específicos de cada rol se aprueban en `01-TOKEN-MAP-V1.md` con verificación de contraste.
> - D-08 (No migrar módulos en bloque): **VIGENTE** (Constitución §3.8 lo confirma).
> - D-09 (No actualizar Angular ni NG-ZORRO en el rediseño): **VIGENTE**.
> - D-10 (Sidebar morado y topbar compactos se preservan, IDs intactos): **OBSOLETA COMO DESCRIPCIÓN VISUAL** — la Constitución V1 redefine el sidebar como **navy-900 plano** (`#10105D`), no morado. El espíritu de la decisión (preservar IDs y contratos) **sigue vigente**; el color de fondo deja de ser morado y pasa a navy. Ver Constitución §1.4 (precedencia).

---

## Tabla de auditoría

| Documento | Propósito | Estado | Conflicto | Decisión | Sustituido por |
|---|---|---|---|---|---|
| `00-DAEMON-VISUAL-CONSTITUTION-V1.md` | Constitución normativa del sistema visual. | **VIGENTE** (ancla) | — | Es la fuente de verdad. | — |
| `00-DOCUMENTATION-STATUS.md` | Esta tabla. | **VIGENTE** | — | Auditoría única de la documentación. | — |
| `01-TOKEN-MAP-V1.md` | Mapa semántico de tokens (Aprobado / Propuesto / Deprecado / Prohibido). | **VIGENTE** (ancla) | — | Fuente de verdad de tokens. | — |
| `02-COLOR-ACCESSIBILITY-REPORT-V1.md` | Informe WCAG de combinaciones de color. | **VIGENTE** (ancla) | — | Fuente de verdad de accesibilidad de color. | — |
| `00-resumen-ejecutivo.md` | Resumen del plan maestro (decisiones D-01 a D-10, estado del proyecto, navegación). | **PARCIALMENTE VIGENTE** | D-10: dice "sidebar morado" pero la Constitución §11 redefine el sidebar como navy-900 plano. La sección "3. Estado del proyecto" sigue siendo lectura válida. | Mantener como lectura histórica del plan. Marcar la sección 2 (D-10) como **OBSOLETA** mediante nota al pie o apéndice. No aplicar D-10 a partir de la V1. | (parcialmente) **Constitución V1** |
| `01-auditoria-frontend.md` | Inventario técnico del frontend: stack detectado, estructura de carpetas, 3 paletas conviviendo, hex arbitrarios. | **VIGENTE** | — | El inventario de archivos y stacks sigue siendo exacto. Las "3 paletas" que documenta son precisamente lo que la Constitución V1 corrige. | — |
| `02-inventario-paginas.md` | 58 rutas mapeadas a 5 arquetipos. | **VIGENTE** | — | La taxonomía de arquetipos (A/B/C/D/E) no entra en conflicto con la Constitución. Las notas de inspección pueden re-validarse cuando un módulo entre a la cola de migración. | — |
| `03-arquetipos.md` | 5 arquetipos con composición, tokens dominantes, componentes reutilizables. | **PARCIALMENTE VIGENTE** | §"Tokens dominantes" de cada arquetipo referencia los tokens viejos (`#1677ff`, `#ffc414`, `#5e34d7`) que la Constitución V1 redefine o reemplaza. La **estructura** de los arquetipos es válida; los **colores** deben migrar a los tokens aprobados en `01-TOKEN-MAP-V1.md`. | Mantener la estructura. Cuando se migre cada arquetipo, reemplazar los colores de ejemplo por los tokens V1. | (parcialmente) **Constitución V1** + **01-TOKEN-MAP-V1.md** |
| `04-tokens-y-tema.md` | Guía técnica de tokens y linter. | **PARCIALMENTE VIGENTE** | §3.1 lista los tokens antiguos (`--daemon-primary: #5e34d7`, paleta extendida de Tailwind con hex). La Constitución V1 reemplaza `--daemon-primary` por `--daemon-purple-600: #5630CE` y `navy-900: #10105D` como estructurales. La parte §5 (linter) y §6 (orden de tokens al modificar) **siguen vigentes** y se alinean con Constitución §21. | Mantener las secciones técnicas (linter, orden, Tailwind config). Reemplazar §3.1 con la lista consolidada V1. | (parcialmente) **01-TOKEN-MAP-V1.md** + **Constitución V1** |
| `05-recomendacion-stack.md` | Decisión cerrada Opción C (SCSS + Tailwind + NG-ZORRO + CVA + clsx + tailwind-merge). | **VIGENTE** | — | La Constitución §10 (tipografía) y §20 (gobernanza) presuponen este stack. | — |
| `06-plan-fases.md` | 5 fases + 1 fase de documentación. | **PARCIALMENTE VIGENTE** | El plan se escribió **antes** de la Constitución V1. Las fases presuponen decisiones (D-07) que la Constitución matiza (separación marca/semántica). Las fases en sí (Fase 1 cimientos, Fase 2 primitivos, etc.) siguen siendo un orden razonable, pero **cada fase debe re-validarse contra la Constitución** antes de arrancar. | Mantener el plan como guía de orden, no como contrato de entregables. | (reemplaza el plan operativo) **Constitución V1** como ancla. |
| `07-handoff-nuevo-agente.md` | Guía rápida para un agente que llega al repo. | **PARCIALMENTE VIGENTE** | El TL;DR dice "lee el estado actual en `00-resumen-ejecutivo.md` antes de proponer cambios". Con la Constitución V1, el orden es: **Constitución V1 → 01-TOKEN-MAP-V1.md → 02-COLOR-ACCESSIBILITY-REPORT-V1.md → 00-resumen-ejecutivo.md (histórico)**. | Actualizar la regla de oro #1 y el orden de lectura para que apunten a la Constitución V1. | (sigue) **Constitución V1** como primera lectura. |
| `08-brand-color-purples.md` | Decisión D-11: morado + amarillo como marca, paleta de portales. | **OBSOLETO** | D-11 contradice la Constitución V1. La Constitución dice que la marca son **5 colores núcleo** (navy, green, yellow, orange, purple) y que el morado de galería (`#5e34d7`) **no** es el estructural (que pasa a ser navy-900). La paleta de portales (KIDS cyan, TEENS azul, etc.) se **redistribuye** entre los 5 colores núcleo. | Conservar el documento como histórico de la decisión D-11. Marcar como OBSOLETO en su cabecera. Las decisiones de paleta que siguen vigentes (yellow = DAEMONS universal) se mantienen. | **Constitución V1** §4 + **01-TOKEN-MAP-V1.md** |
| `daemon-student-baseline-v1.md` | Inventario de hallazgos del estado actual del portal del estudiante (hex hardcodeados, gradientes, riesgos). | **PARCIALMENTE VIGENTE** (anexo informativo) | El inventario de hex arbitrarios y gradientes sigue siendo exacto. Las **soluciones propuestas** en este documento NO están aprobadas (avanzó a shell, dashboard, primitivos `daemon-*`, etc.). | Conservar como anexo informativo. La **sección 6 (mapping)** y la **sección 9 (riesgos)** se mantienen como referencia útil. Las **secciones 8 (componentes propuestos)**, **10 (métricas)**, **12 (dashboard)**, **13 (estados)** NO se aplican. | (sustituye sus conclusiones) **Constitución V1** + **01-TOKEN-MAP-V1.md** |
| `daemon-student-visual-v1.md` | Especificación prematura de shell, dashboard, componentes `daemon-*`. | **BORRADOR NO APROBADO** | Sí — todo el documento. Avanza prematuramente hacia implementación antes de existir una Constitución. | Conservar **solo** como referencia histórica de la dirección que se descartó. Su cabecera ya está marcada con banner "BORRADOR NO APROBADO — NO IMPLEMENTAR". NO se aplica nada de su contenido. | **Constitución V1** |

---

## Contradicciones detectadas y resueltas

| # | Contradicción | Resolución |
|---|---|---|
| 1 | `08-brand-color-purples.md` dice que el primario de marca es `#5e34d7` (morado galería); la Constitución V1 dice que el estructural es `#10105D` (navy) y `#5630CE` (purple-600) es creatividad / acento TEENS. | **Primario de marca = navy-900.** Purple-600 = rol de creatividad / IA / ranking. Morado galería (`#5e34d7`) queda en el mapa de tokens como **DEPRECADO** (no se introduce, sigue existiendo en archivos viejos hasta migrar). |
| 2 | `00-resumen-ejecutivo.md` D-10 dice "sidebar morado"; la Constitución V1 dice "sidebar navy plano sin gradientes". | **D-10 se reinterpreta:** el espíritu (preservar IDs y contrato) se mantiene; el color cambia a navy-900. D-10 como descripción visual queda OBSOLETA. |
| 3 | `04-tokens-y-tema.md` §3.1 propone `--daemon-primary: #5e34d7`. La Constitución V1 dice que `--daemon-primary` debe coincidir con `--daemon-purple-600: #5630CE` o ser un alias semántico. | **Resolución:** el mapa de tokens V1 redefine `--daemon-primary` como alias de `student-action-primary`, cuyo valor depende del tema (TEENS = purple-600, KIDS = yellow-500). |
| 4 | `daemon-student-visual-v1.md` propone 5 colores núcleo y derivados sin pasar por aprobación constitucional. | **Resolución:** el documento queda BORRADOR. Los 5 colores núcleo aprobados son los de la Constitución V1 §4.1 (idénticos en hex a los del draft, pero con funciones reasignadas). |
| 5 | El sidebar actual usa `radial-gradient` (en `sidebar-portal.scss:192-193`); la Constitución §19.1 prohíbe gradientes decorativos. | **Resolución:** las propuestas de rediseño del sidebar deben partir de fondo plano `navy-900`. La eliminación de los gradientes existentes es un objetivo de la primera fase de implementación, no del documento constitucional. |
| 6 | `06-plan-fases.md` Fase 1 describe mover tokens a `_tokens.scss` con la lista vieja. | **Resolución:** la Fase 1 ahora parte del mapa de tokens V1 (`01-TOKEN-MAP-V1.md`). El resto de las fases (2 primitivos, 3 páginas piloto, etc.) se re-validan antes de arrancar. |
| 7 | `07-handoff-nuevo-agente.md` recomienda leer primero `00-resumen-ejecutivo.md`. | **Resolución:** el orden de lectura pasa a ser Constitución V1 → mapa de tokens → informe WCAG → resumen ejecutivo (histórico). |
| 8 | D-07 dice "DAEMONS = ámbar, XP = azul, éxito = verde, error = rojo" como reglas de color; la Constitución V1 §5 separa marca y semántica. | **Resolución:** ámbar sigue siendo DAEMONS (es marca). XP, éxito y error pasan a ser **roles semánticos** cuyos colores específicos se aprueban en `01-TOKEN-MAP-V1.md` con verificación de contraste. La regla "ámbar = DAEMONS" se mantiene; las otras tres se trasladan al mapa de tokens. |

---

## Cómo se interpreta "VIGENTE" después de esta auditoría

- **VIGENTE** = se aplica tal como está, sin cambios pendientes contra la Constitución.
- **PARCIALMENTE VIGENTE** = la **estructura** y la **intención** siguen siendo válidas; el **contenido** específico (sobre todo colores y tokens) debe migrarse a las fuentes V1 antes de usarse como guía de implementación.
- **SUSTITUIDO** = no se aplica; la fuente vigente está en otra parte.
- **OBSOLETO** = no se aplica; conserva valor histórico o de contexto.
- **BORRADOR NO APROBADO** = no se aplica; cualquier uso es un error de proceso.

---

## Anexo — Próxima auditoría

Esta tabla se re-validará cuando:

- Se introduzca un nuevo documento al directorio `docs/sistema-diseno/`.
- Se apruebe un cambio incompatible con un documento marcado VIGENTE.
- Se cierre la próxima fase del plan (Fase 1 → 2 → 3 → 4 → 5).

La próxima fecha objetivo de re-auditoría es la primera semana tras
la aprobación de la Constitución V1 por el segundo revisor (ver
`00-DAEMON-VISUAL-CONSTITUTION-V1.md` §23.2).
