# DAEMON — Token Map V1

> **Documento normativo de tokens.** Define **qué tokens existen, qué
> función tienen, qué valor concreto se aprueba, y en qué estado se
> encuentra cada uno.**
>
> **NO es código final.** El nombre exacto de la variable CSS
> (`--daemon-*`, `--student-*`, `--daemon-sidebar-*`, etc.) es una
> **decisión de implementación** que se cierra cuando se abre la
> primera fase de implementación. Aquí se define el **qué** y el
> **para qué**, no el **cómo** se llama en SCSS.
>
> **Anchor:** `00-DAEMON-VISUAL-CONSTITUTION-V1.md` (Constitución V1).
> **Auditoría:** `00-DOCUMENTATION-STATUS.md`.
> **Accesibilidad:** `02-COLOR-ACCESSIBILITY-REPORT-V1.md`.
>
> **Versión:** 1.0 · **Fecha:** 2026-08-06
> **Rama de origen:** `design/daemon-visual-constitution-v1`

---

## Estados posibles

| Estado | Significado |
|---|---|
| **APROBADO** | Listo para implementación. No requiere más discusión. |
| **PROPUESTO** | En revisión de gobernanza. NO se implementa hasta aprobarse. |
| **DEPRECADO** | Existió en código o en draft anterior, ya no se usa. Se mantiene en el mapa como histórico y para guiar la migración. |
| **PROHIBIDO** | No se puede usar. Si un archivo lo usa, es un error de proceso. |
| **EXCEPCIÓN** | Permitido solo en el caso documentado. No escala como precedente. |

---

## 1. Colores de marca (5 colores núcleo)

Anclados en la Constitución V1 §4. Son **inmutables** salvo decisión
de gobernanza que cambie la Constitución.

| Token semántico | Categoría | Valor | Función | On-color | KIDS | TEENS | Estado |
|---|---|---|---|---|---|---|---|
| `marca-navy-900` | marca | `#10105D` | Estructura institucional: sidebar, navegación, texto sobre fondos claros, superficies oscuras controladas. | `#F8FAFC` texto, `#B9C0E4` muted. | sí | sí | **APROBADO** |
| `marca-green-500` | marca | `#76CF1A` | Progreso y crecimiento de marca. Indicador de avance del usuario, completado de marca. NO es success automático. | `#10105D` o `#172033` (texto); sobre fondo blanco NO se usa como texto (contraste 1.96:1). | sí (acento éxito) | sí (uso contenido) | **APROBADO** |
| `marca-yellow-500` | marca | `#FEC514` | Recompensa, DAEMONS, item activo del sidebar, foco visible. Se combina con texto `#10105D`. | `#10105D` (única combinación aprobada). | sí (CTA, DAEMONS) | sí (DAEMONS, foco) | **APROBADO** |
| `marca-orange-500` | marca | `#EB590C` | Misión, reto, energía, advertencia motivacional. NO es warning ni danger. | `#FFFFFF` solo si se verifica contraste en cada uso puntual. Texto blanco (3.52:1) no es válido para texto normal; requiere uso específico (botón con texto grande, no label pequeño). | sí (misiones) | sí (misiones, retos) | **APROBADO** |
| `marca-purple-600` | marca | `#5630CE` | Creatividad, IA, logros, ranking, acento TEENS. | `#FFFFFF` (7.75:1) o `#10105D`. | sí (creatividad) | sí (acción principal, creatividad) | **APROBADO** |

### 1.1 Derivados aprobados (solo cuando sean necesarios)

| Token | Categoría | Valor | Función | Justificación | Estado |
|---|---|---|---|---|---|
| `marca-navy-900-hover` | marca (derivado) | `#0C0C4A` (paso más oscuro) | Hover del fondo `marca-navy-900`. | Contraste contra texto `#F8FAFC` se mantiene alto. Delta L\* mayor que HSL simple. | **PROPUESTO** |
| `marca-navy-900-active` | marca (derivado) | `#080834` (dos pasos más oscuro) | Estado pressed del fondo `marca-navy-900`. | Delta acumulativo respecto a base; verificación de contraste pendiente. | **PROPUESTO** |
| `marca-green-500-hover` | marca (derivado) | `#62B315` (paso más oscuro) | Hover del acento verde. | Para usar como fondo; texto encima sigue siendo navy. | **PROPUESTO** |
| `marca-yellow-500-hover` | marca (derivado) | `#E0AE00` (paso más oscuro) | Hover del foco amarillo / CTA KIDS. | Mantiene contraste navy-900 sobre yellow. | **PROPUESTO** |
| `marca-orange-500-hover` | marca (derivado) | `#C44B0A` (paso más oscuro) | Hover del acento naranja. | Necesario para que white sobre orange pase contraste en texto normal. | **PROPUESTO** |
| `marca-purple-600-hover` | marca (derivado) | `#4526A5` (paso más oscuro) | Hover del acento purple. | White sigue pasando. | **PROPUESTO** |
| `marca-*-subtle` | marca (derivado) | según rol | Fondo tintado del color. | Solo se introduce cuando se use. | **PROPUESTO** (no se pre-aprueba) |
| `marca-*-border` | marca (derivado) | según rol | Borde del color. | Solo se introduce cuando se use. | **PROPUESTO** (no se pre-aprueba) |

**Regla:** los `hover` siempre son **más oscuros que la base**. Los
`subtle` siempre son **más claros y desaturados**. Los `border` son
`hover` o `subtle` según el uso. El `on-color` siempre debe estar
verificado contra el derivado concreto (no se asume que on-color
de la base sirve para el derivado).

### 1.2 Prohibidos como texto

- `#76CF1A` (green-500) como texto sobre `surface` (1.96:1).
- `#FEC514` (yellow-500) como texto sobre `surface` (1.59:1).
- `#FEC514` como fondo bajo texto blanco.
- `#76CF1A` como fondo bajo texto blanco.
- `#EB590C` como fondo bajo texto blanco en tamaño normal (3.52:1, solo
  pasa para texto grande o uso no textual).

---

## 2. Colores semánticos del sistema

Anclados en la Constitución V1 §5.2. Son **independientes de la marca**
y se nombran por su función. Los valores específicos se aprueban
cuando se verifique el contraste (ver
`02-COLOR-ACCESSIBILITY-REPORT-V1.md`).

| Token semántico | Categoría | Valor | Función | On-color | Estado |
|---|---|---|---|---|---|
| `semantic-success` | semántico | `#16A34A` | Confirmación, acción completada. | `#FFFFFF` solo para UI no textual o texto grande. Texto blanco sobre success (3.30:1) NO es válido para texto normal. | **APROBADO** con la salvedad de que el texto blanco encima solo se permite en botones grandes / iconos. |
| `semantic-success-subtle` | semántico | `#DCFCE7` | Fondo tintado de success. | `#14532D` (verde muy oscuro) como texto. | **APROBADO** |
| `semantic-warning` | semántico | `#B54708` | Advertencia suave, atención. | `#FFFFFF` (4.5+:1 verificado). | **APROBADO** |
| `semantic-warning-subtle` | semántico | `#FFF7ED` | Fondo tintado de warning. | `#7C2D12` como texto. | **APROBADO** |
| `semantic-danger` | semántico | `#B42331` | Error, validación fallida, acción destructiva. | `#FFFFFF` (4.5+:1 verificado). | **APROBADO** |
| `semantic-danger-subtle` | semántico | `#FEE2E2` | Fondo tintado de danger. | `#7F1D1D` como texto. | **APROBADO** |
| `semantic-info` | semántico | `#2563EB` | Información neutral. | `#FFFFFF` (4.5+:1 verificado). | **APROBADO** |
| `semantic-info-subtle` | semántico | `#EFF6FF` | Fondo tintado de info. | `#1E3A8A` como texto. | **APROBADO** |

### 2.1 Prohibiciones explícitas (recuerdo)

- ❌ `orange-500` como `danger`.
- ❌ `green-500` (marca) como `success` automático.
- ❌ `yellow-500` (marca) como `warning`.
- ❌ Mezclar marca y semántica en un mismo token.

---

## 3. Neutros

Anclados en la Constitución V1 §4.4.

| Token | Categoría | Valor | Función | On-color | Estado |
|---|---|---|---|---|---|
| `neutral-canvas` | superficie | `#F4F7FB` | Fondo de página, debajo de cards. | `#172033` (text-primary) | **APROBADO** |
| `neutral-surface` | superficie | `#FFFFFF` | Tarjetas, popovers, topbar, modales. | `#172033`, `#667085`, `#98A2B3` (este último solo en controles disabled). | **APROBADO** |
| `neutral-surface-subtle` | superficie | `#F8FAFC` | Fondo de cards secundarios, hover de items neutros. | `#172033` | **APROBADO** |
| `neutral-text-primary` | texto | `#172033` | Texto principal. | sobre cualquier superficie clara (ratio ≥ 15:1). | **APROBADO** |
| `neutral-text-secondary` | texto | `#667085` | Texto secundario, helper, labels. | sobre blanco (4.97:1, AA pero no AAA). | **APROBADO** |
| `neutral-text-disabled` | texto | `#98A2B3` | Texto deshabilitado (solo controles disabled). | sobre blanco (2.58:1, NO AA). | **APROBADO** con restricción de uso (Constitución §7.3). |
| `neutral-border` | borde | `#E4EAF2` | Borde estándar. | — | **APROBADO** |
| `neutral-border-strong` | borde | `#CBD5E1` | Borde con énfasis. | — | **APROBADO** |

---

## 4. Roles de interacción (estudiantes)

Anclados en la Constitución V1 §6. Estos roles **no son clases** ni
**componentes**: son la identidad semántica que un componente debe
referenciar cuando aplique.

| Rol | Categoría | Valor por defecto (KIDS / TEENS) | Función | On-color | Estado |
|---|---|---|---|---|---|
| `student-action-primary` | interacción | KIDS = `#FEC514` (yellow-500), TEENS = `#5630CE` (purple-600) | CTA principal de una vista. | KIDS: `#10105D` (10.53:1). TEENS: `#FFFFFF` (7.75:1). | **APROBADO** (la diferenciación KIDS/TEENS se implementa por tema, Constitución §8). |
| `student-action-primary-hover` | interacción | un paso más oscuro que la base. | Hover del CTA principal. | mismo on-color. | **PROPUESTO** |
| `student-action-primary-active` | interacción | dos pasos más oscuro que la base. | Estado pressed. | mismo on-color. | **PROPUESTO** |
| `student-on-action-primary` | texto | aprobado por contraste contra el fondo del CTA. | Texto encima del CTA. | — | **PROPUESTO** (los valores exactos se aprueban al introducir el token en código, no antes). |
| `student-progress` | interacción | `#76CF1A` (green-500) | Indicador de avance, marca de completado. | `#10105D` o `#172033` (sobre fondo del indicador). NO se usa como texto sobre surface. | **APROBADO** |
| `student-mission` | interacción | `#EB590C` (orange-500) | Acción de misión, reto, energía. | `#FFFFFF` solo si el texto es grande (≥ 18.66 px bold o ≥ 24 px) o si se valida caso a caso. Para label pequeño, se usa un derivado más oscuro. | **APROBADO** con la salvedad de on-color. |
| `student-creative` | interacción | `#5630CE` (purple-600) | Creatividad, IA, logros, ranking. | `#FFFFFF` (7.75:1) o `#10105D` (4.06:1 — verificar). | **APROBADO** |
| `student-reward` | interacción | `#FEC514` (yellow-500) | DAEMONS, recompensa, foco, item activo. | `#10105D` (10.53:1). | **APROBADO** |
| `student-navigation` | interacción | `#10105D` (navy-900) | Estructura del shell, sidebar, fondo institucional. | `#F8FAFC` (sidebar-text), `#B9C0E4` (sidebar-muted), `#FEC514` (item activo, contraste 10.53:1). | **APROBADO** |

### 4.1 Derivados del sidebar (cuando se implementen)

| Token | Categoría | Valor | Función | Estado |
|---|---|---|---|---|
| `student-navigation-text` | interacción (derivado) | `#F8FAFC` | Texto principal sobre `student-navigation`. | **APROBADO** (16.74:1 vs navy). |
| `student-navigation-muted` | interacción (derivado) | `#B9C0E4` | Texto secundario sobre `student-navigation`. | **APROBADO** (9.35:1 vs navy). |
| `student-navigation-divider` | interacción (derivado) | `rgba(255,255,255,0.12)` | Divisor de secciones. | **PROPUESTO** (no textual, contraste no aplica del mismo modo). |
| `student-navigation-hover` | interacción (derivado) | `#1B1B76` | Hover de item. | **PROPUESTO**. |

---

## 5. Tipografía

Anclada en la Constitución V1 §9.

| Token | Categoría | Valor | Función | Estado |
|---|---|---|---|---|
| `font-family-ui` | tipografía | `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | Familia única. | **APROBADO** |
| `font-size-display` | tipografía | `40 px` / peso 700 | Display del hero. | **APROBADO**. Línea: 1.1. |
| `font-size-h1` | tipografía | `32 px` / peso 700 | h1 de página. | **APROBADO**. Línea: 1.15. |
| `font-size-h2` | tipografía | `24 px` / peso 700 | h2 de sección. | **APROBADO**. Línea: 1.2. |
| `font-size-h3` | tipografía | `20 px` / peso 600 | h3 de subsección. | **APROBADO**. Línea: 1.3. |
| `font-size-body-lg` | tipografía | `16 px` / peso 500 | Texto destacado, subtítulo. | **APROBADO**. Línea: 1.5. |
| `font-size-body` | tipografía | `14 px` / peso 400 | Texto por defecto. | **APROBADO**. Línea: 1.5. |
| `font-size-small` | tipografía | `13 px` / peso 400 | Helper, descripción corta. | **APROBADO**. Línea: 1.4. |
| `font-size-caption` | tipografía | `12 px` / peso 500 | Label, kicker, eyebrow. | **APROBADO**. Línea: 1.3. Tracking: 0.075 – 0.12 em si uppercase. |
| `font-size-mini` | tipografía | `10 px` / peso 700 | Contador secundario, eyebrow puramente decorativo. | **APROBADO** con restricción: solo si NO es contenido relevante. (Constitución §9.2). |
| `font-weight-regular` | tipografía | `400` | — | **APROBADO** |
| `font-weight-medium` | tipografía | `500` | — | **APROBADO** |
| `font-weight-semibold` | tipografía | `600` | — | **APROBADO** |
| `font-weight-bold` | tipografía | `700` | — | **APROBADO** |
| `font-weight-extra` | tipografía | `800` | Métrica, número destacado. | **APROBADO** (no se excede 800). |
| `letter-spacing-uppercase` | tipografía | `0.075 – 0.12 em` | Aplicar a texto en mayúsculas. | **APROBADO** |

**Prohibido:** cualquier segunda familia. Cualquier peso > 800.
Cualquier tamaño de texto relevante < 12 px.

---

## 6. Espaciado

Escala de 4 px (Constitución V1 §10). Solo se aprueban los valores
que ya tienen un uso previsto.

| Token | Valor | Función | Estado |
|---|---|---|---|
| `space-1` | `4 px` | micro-separación. | **APROBADO** |
| `space-2` | `8 px` | gap interno de un control. | **APROBADO** |
| `space-3` | `12 px` | padding ligero. | **APROBADO** |
| `space-4` | `16 px` | padding estándar de cards. | **APROBADO** |
| `space-5` | `20 px` | padding cómodo. | **APROBADO** |
| `space-6` | `24 px` | padding de cards grandes. | **APROBADO** |
| `space-8` | `32 px` | padding de hero. | **APROBADO** |
| `space-9` | `40 px` | separación estructural. | **APROBADO** |
| `space-10` | `48 px` | separación entre bloques. | **APROBADO** |
| `space-12` | `64 px` | separación máxima dentro de una vista. | **APROBADO** |
| `space-page-pad` | `clamp(1.5rem, 2.5vw, 2rem)` | padding horizontal de página. | **APROBADO** |
| `space-page-max` | `1280 px` | ancho máximo de página. | **APROBADO** |

**Prohibido:** cualquier valor que no esté en la escala (22, 28, 36, etc.)
sin justificación documentada y aprobación de gobernanza.

---

## 7. Radios

Anclados en la Constitución V1 §12.

| Token | Valor | Función | Estado |
|---|---|---|---|
| `radius-xs` | `6 px` | chips pequeños, checkboxes. | **APROBADO** |
| `radius-sm` | `10 px` | inputs estándar, badges, items de navegación. | **APROBADO** |
| `radius-md` | `14 px` | cards estándar. | **APROBADO** |
| `radius-lg` | `18 px` | cards grandes, paneles. | **APROBADO** |
| `radius-xl` | `24 px` | hero, banner. | **APROBADO** |
| `radius-pill` | `999 px` | elemento único (avatar, status dot). | **APROBADO** con restricción: no se usa en cards ni en items de navegación. |

---

## 8. Sombras

Ancladas en la Constitución V1 §14. **Neutras y suaves, sin tinte de
color.** Aprobadas como **rgba sobre navy 16,16,93** (NO negro puro) para
mantener la coherencia institucional.

| Token | Valor | Función | Estado |
|---|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Sombra mínima (separa cards del fondo). | **APROBADO** |
| `shadow-sm` | `0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Cards normales. | **APROBADO** |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` | Dropdowns, popovers, tooltips. | **APROBADO** |
| `shadow-lg` | `0 12px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)` | Modal, drawer, overlay. | **APROBADO** |
| `shadow-ring` | `0 0 0 3px rgba(254,197,20,0.5)` | Foco visible (no decoración). | **PROPUESTO** (hasta validar SC 1.4.11). |

**Prohibido:** cualquier sombra con tinte de color (`box-shadow: 0 0
20px #5630CE`), cualquier glow ornamental, sombras encadenadas que
produzcan neón o resplandor.

---

## 9. Movimiento

Anclado en la Constitución V1 §17.

| Token | Valor | Función | Estado |
|---|---|---|---|
| `motion-fast` | `120 ms` | hover, focus, toggle. | **APROBADO** |
| `motion-normal` | `180 ms` | mostrar / ocultar panel. | **APROBADO** |
| `motion-slow` | `240 ms` | entrada de hero, transición de página. | **APROBADO** |
| `motion-ease` | `cubic-bezier(0.2, 0.7, 0.25, 1)` | curva institucional. | **APROBADO** |

**Prohibido:** `transition: all`. `transform: translateY` decorativo
en hover. Animación en bucle fuera de carga o espera.

---

## 10. Resumen de estados

| Estado | Cantidad |
|---|---|
| APROBADO | 85 (recuento real) |
| PROPUESTO | 9 (derivados de marca, hover, subtle, border, on-color — no se pre-aprueban) |
| DEPRECADO | 0 (este mapa es V1) |
| PROHIBIDO | 0 aquí (los antipatrones viven en Constitución §19, no como tokens) |
| EXCEPCIÓN | 0 (no se han solicitado excepciones en V1) |

---

## 11. Regla de oro

**No se introduce un token que no esté en este mapa, en estado
`APROBADO` o `PROPUESTO` yendo a `APROBADO` por gobernanza.** Esta es la
condición necesaria (no suficiente) para que el linter
`check:style-tokens` acepte la propuesta.
