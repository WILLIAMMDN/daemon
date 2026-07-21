# DAEMON — Decisión de color de marca: morado + amarillo

> Decisión cerrada con Max el **2026-07-20** durante la implementación
> de la Fase 1 del sistema de diseño. Cierra D-11 de las decisiones
> del plan maestro.

---

## TL;DR

**El color de marca de DAEMON es morado + amarillo.**

- **Morado** (`#5e34d7`) es el primario de marca, identificado con la
  galería de historias (que se vuelve el "padre" visual del proyecto).
- **Amarillo** (`#ffc414`) sigue siendo el color de los DAEMONS (moneda
  gastable) y se mantiene universal.
- **Cada portal/level tiene su propio tema** encima de la marca:
  - KIDS → cyan (`#00b4d8`)
  - TEENS → azul (`#1677ff`) con acento amarillo
  - Docente → cyan-teal (`#19c1d0`)
  - Tutor (familias) → amarillo + dark purple ink (`#24194f`)
- **Público/auth** (sin tema de portal) → hereda el brand morado.

---

## Los 3 morados que se aprobaron

| Token | Hex | Uso |
|---|---|---|
| `--daemon-primary` | `#5e34d7` | Botones primarios, progress bars, links, focus rings (default brand) |
| `--daemon-primary-dark` | `#5730cf` | Hover, active, avatar, estado elevado (más oscuro y saturado) |
| `--daemon-primary-soft` | `#7359c8` | Chips, bordes de acento, fondos con saturación (no para tintes muy claros) |

> **Nota:** `#7359c8` no es un "soft" tradicional (tinte muy claro). Es
> el morado más claro de los 3. Para fondos muy claros se usa Tailwind
> opacity utility (`bg-primary/10`).

---

## Estructura de 4 capas de tokens

```scss
/* LAYER 1 — Universales (no se sobreescriben) */
:root {
  --daemon-canvas: #f4f7fb;     --daemon-surface: #ffffff;
  --daemon-border:  #e4eaf2;     --daemon-ink: #172033;
  --daemon-accent:  #ffc414;     --daemon-accent-soft: #fff7d6;
  --daemon-success: #12a150;     --daemon-warning: #f5a000;
  --daemon-danger:  #b42331;     --daemon-info: #2563eb;
}

/* LAYER 2 — Brand (default en :root = morado) */
:root {
  --daemon-primary:      #5e34d7;
  --daemon-primary-soft: #7359c8;
  --daemon-primary-dark: #5730cf;
}

/* LAYER 3 — Niveles y portales (colores directos) */
:root {
  --daemon-kids:    #00b4d8;     --daemon-kids-soft:    #e8f9fc;
  --daemon-teens:   #1677ff;     --daemon-teens-soft:   #edf5ff;
  --daemon-docente: #19c1d0;     --daemon-docente-soft: #e9fbfd;
  --daemon-tutor:   #ffc414;     --daemon-tutor-soft:   #fff8dc;
  --daemon-tutor-ink: #24194f;
}

/* LAYER 4 — Portal themes (sobrescriben --daemon-primary por contexto) */
.theme-kids    { --daemon-primary: #00b4d8; --daemon-primary-dark: #0077b6; --daemon-primary-soft: #e8f9fc; }
.theme-teens   { --daemon-primary: #1677ff; --daemon-primary-dark: #0958d9; --daemon-primary-soft: #e8f1ff; }
.theme-docente { --daemon-primary: #19c1d0; --daemon-primary-dark: #0e8a96; --daemon-primary-soft: #e9fbfd; }
.theme-tutor   { --daemon-primary: #ffc414; --daemon-primary-dark: #dca003; --daemon-primary-soft: #fff7d6; --daemon-ink: #24194f; }
```

---

## Cómo se asigna el tema

| Contexto | Clase en el host | Resultado |
|---|---|---|
| Visitante en `/` o `/login` | (ninguna) | Morado + amarillo (la marca) |
| Alumno KIDS | `.theme-kids` en `layout-alumno` | Cyan + amarillo |
| Alumno TEENS | `.theme-teens` en `layout-alumno` | Azul + amarillo |
| Docente | `.theme-docente` en `layout-docente` | Cyan-teal + amarillo |
| Tutor / familia | `.theme-tutor` en `layout-tutor` | Amarillo + dark purple |

**El layout es el responsable de aplicar la clase correcta** al host. La
implementación actual está en `tema-portal-alumno.ts` (campo `claseTema`)
y en los `layout-*.html`.

---

## Archivos modificados (esta decisión)

| Archivo | Cambio |
|---|---|
| `src/styles/_tokens.scss` | Reescrito con 4 capas: universales, brand, niveles, portal themes. Cambio de `--daemon-primary` de `#1677ff` a `#5e34d7`. |
| `src/styles/_components.scss` | `daemon-btn.ant-btn-primary` y `daemon-avatar` ahora usan `var(--daemon-primary-dark)` y `var(--daemon-primary)`. El student-premium override también migrado. |
| `src/app/core/dominio/tema-portal-alumno.ts` | Agregado campo `claseTema: 'theme-kids' \| 'theme-teens'`. Mantiene campos legacy por compatibilidad. |
| `src/app/core/layouts/layout-alumno/layout-alumno.html` | `[class]="'theme-' + temaPortal().atributo"` en vez de los `[style.--student-primary]` bindings. |
| `src/app/core/layouts/layout-alumno/layout-alumno.scss` | Migrado de hex hardcoded a `var(--daemon-*)`. |
| `src/app/core/layouts/layout-docente/layout-docente.html` | Agregado `class="portal theme-docente"`. |
| `src/app/core/layouts/layout-tutor/layout-tutor.html` | Agregado `class="family-portal theme-tutor"`. |
| `src/app/core/layouts/layout-tutor/layout-tutor.scss` | Migrado de hex hardcoded a `var(--daemon-*)`. |

---

## Verificación

| Check | Resultado |
|---|---|
| `npm run check:style-tokens` | ✅ exit 0 |
| `npm run build` | ✅ exit 0, **939.37 kB** initial |
| Bundle CSS contiene `#5e34d7` (primary morado) | ✅ |
| Bundle CSS contiene `#5730cf` (primary-dark) | ✅ |
| Bundle CSS contiene `#7359c8` (primary-soft) | ✅ |
| Bundle CSS contiene `.theme-kids` y `.theme-teens` | ✅ |
| Dev server en 4201 | ✅ vivo |

---

## Cómo verlo

```powershell
# 1. Limpia caché del navegador (Ctrl + Shift + R en la app)
# 2. Visita:
http://localhost:4201/login              # ve el morado en el botón
http://localhost:4201/                    # ve el morado en la landing
http://localhost:4201/alumno/galeria-de-historias  # ve la galería morado
# 3. Loguéate como TEENS → todo se vuelve azul+amarillo (porque .theme-teens)
# 4. Loguéate como KIDS → todo se vuelve cyan+amarillo (porque .theme-kids)
```

---

## Próximas decisiones relacionadas

- **D-12:** Evaluar si las **NG-ZORRO tags** deben migrar a tokens
  también. Hoy los tags en `_components.scss` tienen hex hardcoded
  (azul, verde, oro, rojo, cyan, morado, slate). El morado
  `#7c3aed` del tag compite con nuestro brand `#5e34d7`. Decidir
  si unificamos o si los tags mantienen su variedad categórica.
- **D-13:** Evaluar si agregar un `--daemon-primary-tint` (tinte
  muy claro, ~`#efe9fb`) para fondos de cards. Hoy se usa
  `bg-primary/10` de Tailwind como workaround.
- **D-14:** Decidir si los features en `features/**` que tienen
  hex arbitrarios (baseline del linter = 1602 violaciones) deben
  migrar en esta PR o en Fases 3-5 según el plan original.

---

## Conversación que llevó a esta decisión

1. Max vio la galería de historias funcionando y le gustó la
   combinación morado + amarillo.
2. Propuse cambiar `--daemon-primary` de azul a morado.
3. Max eligió los 3 morados específicos: `#5730cf`, `#5e34d7`, `#7359c8`.
4. Max pidió que la galería fuera el "padre" del diseño.
5. Acordamos que TEENS es "amarillo con azul" (mantener la
   combinación actual), KIDS es cyan, docente es cyan-teal,
   tutor es amarillo.
6. Implementé las 4 capas de tokens + las clases theme-* + las
   apliqué en los layouts. Build verde.

---

## Cambio de decisiones

D-11 (morado como brand) está cerrada. Para cambiarla:
1. Actualizar este documento con la nueva decisión.
2. Actualizar `_tokens.scss` con los nuevos hexes.
3. Regenerar baseline del linter.
4. Re-deploy.
5. Comunicar a quien esté usando tokens en componentes nuevos.
