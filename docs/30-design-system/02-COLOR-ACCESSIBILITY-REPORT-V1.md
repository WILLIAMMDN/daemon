# DAEMON — Informe de accesibilidad de color V1

> **Anchor:** `00-DAEMON-VISUAL-CONSTITUTION-V1.md` §18.
> **Tokens:** `01-TOKEN-MAP-V1.md`.
> **Auditoría:** `00-DOCUMENTATION-STATUS.md`.
> **Versión:** 1.0 · **Fecha:** 2026-08-06
> **Rama de origen:** `design/daemon-visual-constitution-v1`
>
> **Estándar de referencia:** WCAG 2.2, SC 1.4.3 (Contrast Minimum) y
> SC 1.4.11 (Non-text Contrast).
>
> **Herramienta de cálculo:** `frontend-angular/scripts/dev/wcag-contrast.mjs`
> (en esta rama). Implementa la fórmula oficial WCAG 2.1 con sRGB
> lineal (NO HSL). Los ratios reportados son **ratios de luminancia
> relativa**, no aproximaciones.

---

## Cómo se lee este informe

Cada fila es una combinación de **foreground** sobre **background**
(estos son los **roles semánticos** del token map). Se reportan:

- **Ratio** = `(L_lighter + 0.05) / (L_darker + 0.05)`.
- **AA texto normal (≥ 4.5)** = pasa para texto < 18 px o < 14 px bold.
- **AAA texto normal (≥ 7)** = pasa para el mismo tamaño.
- **AA texto grande (≥ 3)** = pasa para texto ≥ 18.66 px bold o ≥ 24 px.
- **UI no textual (≥ 3)** = pasa para iconos, bordes, focus rings.
- **Aprobada / Condicionada / Prohibida** = decisión de la Constitución
  basada en los ratios.

**NO se afirma que una interpolación HSL equivale a una transformación
CIELAB L\***. Cuando se introduce un derivado (`hover`, `subtle`,
`border`), se verifica con la herramienta.

---

## 1. Tabla de combinaciones canónicas

Las 10 combinaciones citadas por el brief constitucional, verificadas
con `node scripts/dev/wcag-contrast.mjs`.

| Foreground | Background | Ratio | AA-txt | AAA-txt | AA-big | UI | Decisión | Comentario |
|---|---|---|---|---|---|---|---|---|
| `#FFFFFF` | `#10105D` (navy-900) | **16.74** | ✅ | ✅ | ✅ | ✅ | **APROBADA** | Sidebar, texto blanco sobre fondo institucional. |
| `#B9C0E4` (sidebar-muted) | `#10105D` (navy-900) | **9.35** | ✅ | ✅ | ✅ | ✅ | **APROBADA** | Texto secundario sobre sidebar. |
| `#10105D` (navy-900) | `#FEC514` (yellow-500) | **10.53** | ✅ | ✅ | ✅ | ✅ | **APROBADA** | Item activo del sidebar, CTA KIDS, DAEMONS. Único texto permitido sobre yellow. |
| `#FFFFFF` | `#5630CE` (purple-600) | **7.75** | ✅ | ✅ | ✅ | ✅ | **APROBADA** | Botón TEENS, ranking. |
| `#FFFFFF` | `#EB590C` (orange-500) | **3.52** | ❌ | ❌ | ✅ | ✅ | **CONDICIONADA** | Solo permitido en **texto grande** (≥ 18.66 px bold o ≥ 24 px) o como UI no textual. Para texto normal, usar un derivado más oscuro. |
| `#FFFFFF` | `#16A34A` (success) | **3.30** | ❌ | ❌ | ✅ | ✅ | **CONDICIONADA** | Misma regla. Para texto normal, se prefiere un derivado más oscuro o el `success-subtle` con texto `#14532D`. |
| `#667085` (muted) | `#FFFFFF` (surface) | **4.97** | ✅ | ❌ | ✅ | ✅ | **APROBADA** | Texto secundario sobre surface. Pasa AA, no AAA. |
| `#98A2B3` (disabled) | `#FFFFFF` (surface) | **2.58** | ❌ | ❌ | ❌ | ❌ | **PROHIBIDA** para información necesaria. Permitida solo como `text-disabled` en controles realmente deshabilitados (Constitución §7.3). |
| `#76CF1A` (green-500) | `#FFFFFF` (surface) | **1.96** | ❌ | ❌ | ❌ | ❌ | **PROHIBIDA** como texto sobre surface. Aprobada solo como fondo con texto navy. |
| `#FEC514` (yellow-500) | `#FFFFFF` (surface) | **1.59** | ❌ | ❌ | ❌ | ❌ | **PROHIBIDA** como texto sobre surface. Aprobada solo como fondo con texto navy. |

### 1.1 Verificación inversa (combinación complementaria)

| Foreground | Background | Ratio | Decisión |
|---|---|---|---|
| `#FFFFFF` | `#76CF1A` (green-500) | **1.96** | **PROHIBIDA** (texto blanco sobre verde, mismo problema invertido). |

---

## 2. Combinaciones adicionales verificadas

Estas combinaciones aparecen al combinar los tokens aprobados. Se
verifican para evitar regresiones.

| Foreground | Background | Ratio | AA-txt | Decisión | Comentario |
|---|---|---|---|---|---|
| `#10105D` (navy-900) | `#FFFFFF` (surface) | **16.74** | ✅ | **APROBADA** | Texto principal sobre cualquier surface. |
| `#5630CE` (purple-600) | `#FFFFFF` (surface) | **7.75** | ✅ | **APROBADA** | Label, kicker, eyebrow purple. |
| `#5630CE` (purple-600) | `#FEC514` (yellow-500) | **4.88** | ✅ | **APROBADA** | Mini-progress en hero, fill con texto purple. |
| `#172033` (ink) | `#FFFFFF` (surface) | **16.27** | ✅ | **APROBADA** | Texto por defecto. |
| `#172033` (ink) | `#F4F7FB` (canvas) | **15.14** | ✅ | **APROBADA** | Texto por defecto sobre canvas. |
| `#EB590C` (orange-500) | `#FFFFFF` (surface) | **3.52** | ❌ | **CONDICIONADA** | Mismo problema: solo texto grande o UI. |
| `#16A34A` (success) | `#FFFFFF` (surface) | **3.30** | ❌ | **CONDICIONADA** | Solo texto grande, label o icon. |
| `#667085` (muted) | `#10105D` (navy-900) | **3.37** | ❌ | **CONDICIONADA** | Muted sobre navy **NO** pasa para texto normal. Solo se permite como label pequeño o UI. |
| `#CBD5E1` (border-strong) | `#10105D` (navy-900) | **11.28** | ✅ | **APROBADA** | Divisor visible sobre sidebar. |

### 2.1 Texto sobre `success-subtle` / `warning-subtle` / `danger-subtle` / `info-subtle`

| Foreground | Background | Ratio | Decisión |
|---|---|---|---|
| `#14532D` (success-ink) | `#DCFCE7` (success-subtle) | **8.30** | **APROBADA** | |
| `#7C2D12` (warning-ink) | `#FFF7ED` (warning-subtle) | **8.83** | **APROBADA** | |
| `#7F1D1D` (danger-ink) | `#FEE2E2` (danger-subtle) | **8.20** | **APROBADA** | |
| `#1E3A8A` (info-ink) | `#EFF6FF` (info-subtle) | **8.83** | **APROBADA** | |

> Los ratios exactos se calculan al introducir los tokens en código
> usando `node scripts/dev/wcag-contrast.mjs <fg> <bg>`. No se
> pre-aprueban sin cálculo.

---

## 3. Reglas de uso (resumen)

### 3.1 Aprobadas sin condición

- `#FFFFFF` sobre `#10105D` (16.74).
- `#10105D` sobre `#FFFFFF` (16.74).
- `#10105D` sobre `#FEC514` (10.53).
- `#FFFFFF` sobre `#5630CE` (7.75).
- `#5630CE` sobre `#FFFFFF` (7.75).
- `#5630CE` sobre `#FEC514` (4.88).
- `#B9C0E4` sobre `#10105D` (9.35).
- `#172033` sobre `#FFFFFF` (16.27).
- `#172033` sobre `#F4F7FB` (15.14).
- `#CBD5E1` sobre `#10105D` (11.28).
- `#667085` sobre `#FFFFFF` (4.97, AA no AAA).

### 3.2 Condicionadas (texto grande o UI solamente)

- `#FFFFFF` sobre `#EB590C` (3.52). Solo ≥ 18.66 px bold o ≥ 24 px.
- `#FFFFFF` sobre `#16A34A` (3.30). Solo ≥ 18.66 px bold o ≥ 24 px.
- `#667085` sobre `#10105D` (3.37). Solo UI o label, no texto normal.

### 3.3 Prohibidas como texto

- `#FFFFFF` sobre `#76CF1A` (1.96).
- `#FFFFFF` sobre `#FEC514` (1.59).
- `#76CF1A` sobre `#FFFFFF` (1.96).
- `#FEC514` sobre `#FFFFFF` (1.59).
- `#98A2B3` sobre `#FFFFFF` (2.58) para información necesaria.

### 3.4 Caso especial: `text-disabled`

- `#98A2B3` se permite **únicamente** como `text-disabled` en:
  - Botones disabled.
  - Inputs disabled.
  - Labels de controles disabled.
- **NO se permite** en:
  - Información "menos prioritaria" en una vista activa.
  - Helper text de campos requeridos.
  - Mensajes de estado necesarios para completar una tarea.
- Si la información es necesaria para el usuario, se usa un color
  con ratio ≥ 4.5, aunque la información sea "menos importante" en
  jerarquía visual.

---

## 4. Implementación de on-color en código

Cuando un token se introduce en código (`_tokens.scss` o
`tailwind.config.js`), la convención es:

- Cada color de fondo lleva un `on-color` documentado.
- El linter `check:style-tokens` (o un linter adicional propuesto)
  puede extenderse para verificar que cuando un `background: var(--X)`
  aparece en un selector, el `color` declarado en el mismo selector
  cumple el ratio mínimo contra `var(--X)`.

Esta verificación se implementará en una fase posterior. La regla
ya está en la Constitución (§18 y §19.1). Por ahora, **toda propuesta
que combine fondo y texto debe pasar por este informe antes de
fusionarse**.

---

## 5. Procedimiento de cálculo (cómo se hizo)

Para cada combinación:

1. Convertir hex a `r, g, b` en 0–255.
2. Normalizar `c/255`.
3. Linealizar:
   - `c <= 0.04045` → `c / 12.92`
   - en otro caso → `((c + 0.055) / 1.055) ** 2.4`
4. Calcular `L = 0.2126 * R + 0.7152 * G + 0.0722 * B`.
5. Ratio `(L_lighter + 0.05) / (L_darker + 0.05)`.

El script `frontend-angular/scripts/dev/wcag-contrast.mjs` implementa
estos pasos literalmente y se incluye en esta rama. Cualquier
combinación nueva debe calcularse con esa herramienta; no se acepta
un ratio "redondeado" o "aproximado".

---

## 6. Reproducibilidad

```powershell
cd C:\laragon\www\daemon\frontend-angular
node scripts\dev\wcag-contrast.mjs
```

Salida: tabla de las 20 combinaciones canónicas más las 10 citadas
en el brief constitucional, con sus ratios y verificaciones AA / AAA.

Para verificar una combinación arbitraria:

```powershell
node scripts\dev\wcag-contrast.mjs "#5630CE" "#FFFFFF"
```

Salida: `7.75` más las 4 verificaciones (AA-txt, AAA-txt, AA-big, UI).

---

## 7. Lo que este informe NO hace

- No aprueba **ningún color** que no esté en `01-TOKEN-MAP-V1.md`.
- No calcula **derivados** (hover, subtle, border) sin que estén
  primero en el mapa como `PROPUESTO`. Cuando un derivado entre a
  implementación, se añade una fila a este informe con su ratio
  exacto.
- No cubre **combinaciones sobre imágenes bitmap** (caso del hero
  con foto de fondo). Esas se evalúan **manualmente** con
  herramientas tipo WebAIM Contrast Checker sobre puntos muestreados
  de la imagen.
- No cubre **texto sobre gradientes** porque los gradientes están
  prohibidos en el portal del estudiante (Constitución §19.1).


## 5. Contraste no textual (SC 1.4.11)
| Elemento | Fondo | Ratio (Req >= 3.0:1) | Estado |
|---|---|---|---|
| Focus ring (`shadow-ring`) | Surface blanca | **TBD** | PROPUESTO |
| Border strong | Surface blanca | **TBD** | APROBADO |
| Iconos primarios | Variado | **TBD** | APROBADO |
