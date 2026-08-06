# DAEMON — Constitución Visual V1

> **Documento normativo, no de implementación.**
> **Versión:** 1.0 · **Fecha:** 2026-08-06 · **Estado:** PENDIENTE DE APROBACIÓN
> **Rama de origen:** `design/daemon-visual-constitution-v1`
> **Audiencia:** equipo DAEMON, agentes de diseño e implementación,
> revisores de PR, owner de marca.
>
> **Esta Constitución NO contiene** código, no define componentes, no
> dibuja páginas concretas, no propone grids de layouts específicos, no
> prescribe la composición del dashboard ni del shell. Define **reglas,
> decisiones y límites** que cualquier propuesta posterior debe respetar.
>
> **Documentos vigentes asociados (este paquete V1):**
> - `00-DOCUMENTATION-STATUS.md` — auditoría del resto de la documentación.
> - `01-TOKEN-MAP-V1.md` — mapa semántico de tokens (qué existe, qué se
>   propone, qué está prohibido).
> - `02-COLOR-ACCESSIBILITY-REPORT-V1.md` — informe de contraste WCAG
>   verificado de las combinaciones definidas.
>
> **Anexo informativo (no normativo):**
> - `daemon-student-baseline-v1.md` — inventario de hallazgos del estado
>   actual del portal del estudiante (ramas previas). Útil para entender
>   el problema, no prescribe la solución.

---

## Índice

1. Autoridad y alcance
2. Personalidad de DAEMON
3. Principios de diseño
4. Paleta núcleo
5. Marca versus semántica
6. Roles de interacción
7. Superficies y neutros
8. KIDS versus TEENS
9. Tipografía
10. Espaciado
11. Densidad
12. Radios
13. Bordes
14. Sombras
15. Iconografía
16. Ilustraciones y personajes
17. Movimiento
18. Accesibilidad
19. Antipatrones (prohibidos)
20. Gobernanza
21. Creación de tokens
22. Excepciones
23. Revisión y aprobación

---

## 1. Autoridad y alcance

### 1.1 Qué es este documento

La **Constitución Visual V1** es la fuente de verdad de **primer nivel**
del sistema visual DAEMON. Establece:

- La paleta de marca inmutable.
- La separación entre marca y semántica.
- Los principios y antipatrones.
- Los roles de interacción (no de implementación).
- Las reglas de accesibilidad de color.
- El proceso de gobernanza para introducir o cambiar reglas.

### 1.2 Qué NO es este documento

- No prescribe **cómo** se implementa en SCSS, Tailwind, CSS-in-JS ni
  Angular.
- No define **componentes** (botones, cards, modales, menús, etc.).
- No define **layouts** concretos (sidebar, topbar, dashboard, etc.).
- No propone grids, columnas, anchos, alturas ni posiciones.
- No aprueba el uso de un framework, librería o herramienta.
- No es un manual de uso para diseñadores — es un contrato normativo.

### 1.3 A quién obliga

- A cualquier feature, módulo, página o pieza nueva del producto DAEMON.
- A cualquier PR que modifique estilos, clases, tokens o temas.
- A cualquier revisión de diseño que proponga cambios visuales.
- A agentes (humanos o IA) que trabajen sobre el repositorio.

### 1.4 Precedencia

Si dos documentos vigentes entran en conflicto, la presente Constitución
prevalece. Si una decisión de implementación contradice la Constitución,
la decisión se considera **no aprobada** hasta resolverse.

### 1.5 Versiones

- **V1** (este documento) — primera versión normativa.
- Cambios futuros requieren PR + revisión de gobernanza (§20, §22, §23).
- Las versiones se numeran `Vn` por cada ruptura incompatible. Las
  revisiones de detalle incrementan `Vn.m` (menor).

---

## 2. Personalidad de DAEMON

DAEMON es una plataforma educativa para niños y adolescentes peruanos.
Su identidad visual se sostiene sobre tres palabras rectoras:

1. **Institucional.** No es un juego, no es una red social, no es un
   feed. Es un campus con reglas, progresión y pertenencia.
2. **Serena.** No compite por la atención con brillos, animaciones
   agresivas o estridencia cromática. La calma comunica seguridad.
3. **Progresiva.** El usuario se mueve hacia adelante (nivel, racha,
   dominio). El sistema visual acompaña ese avance sin estridencia.

### 2.1 Lo que DAEMON es

- Un **campus digital** con jerarquía, navegación y atribución clara.
- Una **academia** donde enseñar, aprender y certificar son las
  acciones centrales.
- Una **comunidad** con identidad reconocible (mascotas, colores
  propios, ritos) sin volverse tribal.

### 2.2 Lo que DAEMON **no** es

- **No** es un videojuego oscuro con efectos neón, glows, scans ni
  estética hacker.
- **No** es una red social con feeds infinitos y cards infinitas.
- **No** es una app preescolar con burbujas, ojos gigantes y emojis
  por doquier.
- **No** es una consola de trading con métricas parpadeando.
- **No** es un dashboard corporativo frío sin identidad.
- **No** es un folleto escolar saturado de color y de decoración.

### 2.3 Tono de comunicación visual

- **Directo**: la información importante no compite con decoración.
- **Cercano**: las microinteracciones son amables, no condescendientes.
- **Consistente**: el mismo gesto visual significa lo mismo en toda la
  plataforma.

---

## 3. Principios de diseño

Doce principios rectores. Cualquier propuesta de cambio debe poder
explicarse contra estos.

1. **Tokens primero, código después.** Un valor visual nuevo se
   introduce como token antes de usarse en cualquier lugar.
2. **Una sola fuente de verdad.** No se aceptan dos definiciones
   distintas del mismo concepto (color, espacio, radio, sombra, etc.).
3. **Jerarquía, no decoración.** El color y el peso comunican
   significado; nunca decoran sin propósito.
4. **Una acción principal por vista.** Cada superficie tiene una sola
   acción priorizada por color, posición y tamaño. Las demás son
   secundarias.
5. **El silencio también comunica.** El espacio en blanco es una
   decisión. La densidad alta sin aire comunica saturación.
6. **El estado vacío también comunica.** No se simulan datos para
   llenar huecos. Se comunica honestamente que no hay contenido.
7. **Accesibilidad por defecto, no como bonus.** Toda decisión se
   valida contra WCAG 2.2 AA antes de aprobarse.
8. **Coherencia sobre creatividad.** Una solución nueva debe poder
   justificarse contra el sistema existente antes de aprobarse.
9. **El cambio se mide.** Ningún cambio de token afecta a más de un
   módulo sin documentarse y medirse.
10. **Lo que se hereda se honra.** Los IDs, contratos de datos y
    servicios no se renombran sin justificación funcional.
11. **Lo que se prohíbe se enforce.** Las reglas prohibitivas tienen
    un linter o un gate que las hace cumplir.
12. **La revisión es una conversación, no un visto bueno.** Toda
    aprobación pasa por dos revisores como mínimo (ver §23).

---

## 4. Paleta núcleo

### 4.1 Cinco colores inmutables

Estos cinco colores son **decisión de marca aprobada**. No se sustituyen
por otros colores principales, no se renombran, no se les cambia el
hex sin pasar por gobernanza (§20).

| # | Hex | Nombre técnico | Función |
|---|---|---|---|
| 1 | `#10105D` | navy-900 | Estructura institucional, navegación, sidebar, texto sobre fondos claros cuando corresponde, superficies oscuras controladas. |
| 2 | `#76CF1A` | green-500 | Progreso, crecimiento de marca, avance del usuario, indicador de "completado" cuando comunica avance de marca (no es success automático). |
| 3 | `#FEC514` | yellow-500 | Recompensa, DAEMONS, selección activa, item activo del sidebar, foco visible. Normalmente se combina con texto `#10105D`. |
| 4 | `#EB590C` | orange-500 | Misión, reto, energía, advertencia motivacional. **No** sustituye a warning ni a danger. |
| 5 | `#5630CE` | purple-600 | Creatividad, IA, logros, ranking, acento TEENS. |

### 4.2 Reglas de uso de los cinco colores

1. **No se usan los cinco a la vez** en una misma sección. La proporción
   visual orientativa es 65–75 % neutros y superficies, 15–25 % estructura
   institucional (navy), 5–10 % acentos (uno o dos como máximo).
2. **`#10105D` no se usa como fondo de tarjetas blancas**. Es estructura
   (sidebar, navegación, topbar cuando corresponde, texto sobre claros).
3. **`#76CF1A` no sustituye automáticamente a "success"**. Success es un
   rol semántico (§5.2) y puede tener su propio verde más oscuro y
   menos saturado si las comprobaciones de contraste lo requieren.
4. **`#FEC514` no se usa como fondo bajo texto blanco**. El texto que
   acompaña a `#FEC514` es `#10105D` (ratio 10.53:1, ver
   `02-COLOR-ACCESSIBILITY-REPORT-V1.md`).
5. **`#EB590C` no se usa para errores ni para validaciones fallidas**.
   Es motivacional. El rojo danger es otro rol (§5.2).
6. **`#5630CE` no se usa como fondo masivo de página**. Se usa como
   acento (icono, indicador, borde, badge) o como superficie de un
   elemento interactivo (botón, tarjeta destacada).

### 4.3 Derivados permitidos

Por cada color base, cuando sea estrictamente necesario, se permiten
**estos derivados** y solo estos:

- `base` — el color aprobado.
- `hover` — más oscuro en un paso fijo (no generado por escala completa).
- `active` — más oscuro que hover, usado durante la pulsación.
- `subtle` — fondo tintado del color (saturación baja, luminosidad alta).
- `border` — un paso más claro o más oscuro que `subtle`, pensado para
  contornos.
- `on-color` — el color del texto que va **encima** del derivado, ya
  verificado por contraste WCAG.

**No** se generan escalas 50–950 a priori. Cada derivado que se introduzca
debe justificar:

- su función;
- su contraste contra `on-color`;
- su relación con el color base (delta de luminosidad documentado).

**No** se afirma que una interpolación HSL equivale a una transformación
CIELAB L\*. Si se necesita un delta perceptual, se documenta con la
métrica real (L\* en CIELAB, no la aproximación HSL).

### 4.4 Neutros de marca

Acompañan a los cinco colores. No son "marca" en sí mismos, pero son
la paleta a la que el sistema recurre por defecto.

| Token | Hex | Función |
|---|---|---|
| canvas | `#F4F7FB` | Fondo de página, debajo de tarjetas. |
| surface | `#FFFFFF` | Tarjetas, popovers, topbar, modales. |
| surface-subtle | `#F8FAFC` | Fondo de cards secundarios, hover de items neutros. |
| text-primary | `#172033` | Texto principal. |
| text-secondary | `#667085` | Texto secundario, labels, descripciones. |
| text-disabled | `#98A2B3` | Texto deshabilitado. Ver §18 para restricciones. |
| border | `#E4EAF2` | Borde estándar. |
| border-strong | `#CBD5E1` | Borde con énfasis (divisor visible, card elevada). |

---

## 5. Marca versus semántica

Una causa frecuente de desorden visual es mezclar **color de marca**
("este es el morado de DAEMON") con **rol semántico** ("esto significa
error"). La Constitución los separa formalmente.

### 5.1 Colores de marca

Los cinco colores núcleo (§4.1) **no son** errores, ni warnings, ni
success, ni info. Son marca. Se usan donde la marca tiene algo que decir.

### 5.2 Roles semánticos

Los roles semánticos son **independientes** de la marca y se nombran
por su función, no por su color.

| Rol semántico | Significado | Color propuesto (cuando se apruebe) |
|---|---|---|
| `success` | Confirmación, acción completada correctamente. | verde más oscuro que `green-500` (verificar contraste). |
| `warning` | Advertencia suave que requiere atención. | naranja oscuro con buen contraste sobre blanco. |
| `danger` | Error, validación fallida, acción destructiva. | rojo con buen contraste. |
| `info` | Información neutral. | azul con buen contraste. |

Los colores específicos de los roles semánticos se aprueban en el
mapa de tokens (`01-TOKEN-MAP-V1.md`) tras verificar contraste.

### 5.3 Prohibición explícita

**Está prohibido** que un componente use directamente un color de marca
cuando necesita un rol semántico. Por ejemplo:

- ❌ "El error es `#EB590C`." → NO. `orange-500` es marca, no error.
- ❌ "El success es `#76CF1A`." → NO. `green-500` es marca, no success
  semántico (puede coincidir si se verifica y se documenta, pero el
  vínculo no es automático).
- ❌ "El primary del botón es `#FEC514` y le pongo texto blanco." → NO.
  `yellow-500` se combina con texto `#10105D`.

---

## 6. Roles de interacción

La Constitución **no prescribe** clases, componentes ni tokens finales.
Prescribe **qué roles de interacción debe reconocer el sistema** y
cuál es su color base aprobado. La implementación decidirá el nombre
del token concreto (prefijo, sufijo, convención) en `01-TOKEN-MAP-V1.md`.

### 6.1 Roles canónicos

| Rol | Función | Color base | on-color (texto encima) |
|---|---|---|---|
| `--student-action-primary` | Acción principal del usuario (CTA destacado). | `#5630CE` (purple-600) para TEENS, `#FEC514` (yellow-500) para KIDS. | `#FFFFFF` sobre purple, `#10105D` sobre yellow. |
| `--student-action-primary-hover` | Estado hover del primario. | derivado un paso más oscuro. | mismo on-color. |
| `--student-action-primary-active` | Estado active/pressed. | derivado dos pasos más oscuro. | mismo on-color. |
| `--student-on-action-primary` | Texto que va **encima** del fondo del CTA. | aprobado por contraste. | — |
| `--student-progress` | Indicador de avance, completado, racha. | `#76CF1A` (green-500) como marca; rol semántico `success` aparte. | `#10105D` o `#FFFFFF` según fondo. |
| `--student-mission` | Acción de misión, reto, energía. | `#EB590C` (orange-500). | `#FFFFFF` solo si se verifica contraste; alternativa más oscura. |
| `--student-creative` | Creatividad, IA, logros, ranking. | `#5630CE` (purple-600). | `#FFFFFF` o `#10105D` según fondo. |
| `--student-reward` | DAEMONS, recompensa, foco amarillo. | `#FEC514` (yellow-500). | `#10105D` (única combinación aprobada). |
| `--student-navigation` | Estructura del shell, sidebar, fondo institucional. | `#10105D` (navy-900). | `#F8FAFC` (sidebar-text) o `#B9C0E4` (sidebar-muted). |

### 6.2 Lo que estos roles **no** son

- No son **clases de Tailwind**. Su traducción a utility classes o a
  CSS custom properties es una decisión de implementación posterior.
- No son **botones**. Un botón es un componente; este rol describe
  qué color aplica a un botón cuando es la acción principal.
- No son **estados del sistema**. Loading, error, success, empty,
  disabled son estados. Estos roles son de **identidad**, no de
  estado.

### 6.3 Restricciones de mezcla

- Un CTA **no puede** combinar `student-reward` con texto blanco.
- Un indicador de `student-progress` **no puede** tener texto blanco
  encima (contraste insuficiente).
- Un fondo de `student-navigation` (navy) **no puede** tener
  `student-mission` (orange) como texto decorativo: el orange sobre
  navy puede no pasar AA para texto normal.

---

## 7. Superficies y neutros

### 7.1 Jerarquía de superficies

| Nivel | Token | Uso |
|---|---|---|
| 0 | `canvas` | Fondo de página (debajo de todo). |
| 1 | `surface` | Tarjetas, popovers, topbar. |
| 2 | `surface-subtle` | Fondo de cards secundarios dentro de un surface. |
| 3 | (elevated) | Modal, drawer. Mismo blanco con sombra. |

### 7.2 Reglas

- Las superficies se separan con **borde sutil** (`border`) o con
  **sombra suave** (ver §14). No se separan con bloques de color
  pálido usado como decoración.
- **No se encierran todos los contenidos en cards.** Una página puede
  respirar sin necesidad de que cada bloque tenga su propio card.
- Las cards no son decorativas: si un bloque no necesita
  jerarquía visual, no se mete en una card.

### 7.3 Texto

| Token | Hex | Uso |
|---|---|---|
| `text-primary` | `#172033` | Texto principal. |
| `text-secondary` | `#667085` | Texto secundario, helper text, labels. |
| `text-disabled` | `#98A2B3` | **Solo** para controles realmente deshabilitados. No para "información no prioritaria". |

`text-disabled` está por debajo del ratio 4.5:1 contra `surface`
(2.58:1). Su uso está restringido a:

- Labels de inputs o botones disabled.
- Texto dentro de un control disabled.

**No se permite** usar `text-disabled` para "información que se ve menos
porque sí". Si la información es necesaria, debe alcanzar al menos 4.5:1.

---

## 8. KIDS versus TEENS

### 8.1 Principio rector: una sola base

**KIDS y TEENS comparten**:

- DOM, rutas, servicios, datos, lógica de negocio, accesibilidad,
  contratos, grilla estructural, tipografía, paleta núcleo, tokens.
- Componentes del sistema.
- Layout general del portal.

**No existen**:

- Páginas duplicadas (`*-kids`, `*-teens` como páginas).
- Componentes duplicados.
- Variantes preescolares.

La diferenciación se aplica por **clase** en el host del layout
(`theme-kids`, `theme-teens`) que reescribe los valores de los
**roles de interacción** y la **densidad**. No se duplica nada.

### 8.2 KIDS — qué puede variar

- **Densidad:** ligeramente menor. Más aire entre elementos.
- **Tamaño táctil:** mínimo 48×48 px en controles primarios.
- **Frecuencia de ilustración funcional:** mayor. La mascota aparece
  en hero, vacíos y confirmaciones.
- **Acompañamiento textual:** más cálido. El "Hola, {{nombre}}!" en
  lugar de "Hola, {{nombre}}".
- **Color del CTA primario:** `student-reward` (yellow-500).
- **Acento de éxito:** `student-progress` (green-500).
- **Radio:** ligeramente más amplio en cards (sin pasar a "cápsula").
- **Movimiento:** ligeramente más expresivo (entradas suaves,
  celebracion más visible al confirmar misión).

### 8.3 TEENS — qué puede variar

- **Densidad:** mayor. Más información por vista, sin saturar.
- **Tamaño táctil:** mínimo 44×44 px en controles primarios.
- **Frecuencia de ilustración funcional:** selectiva. Mascota solo en
  vacío y recompensas. Sin ilustración en hero.
- **Acompañamiento textual:** sobrio.
- **Color del CTA primario:** `student-action-primary` (purple-600).
- **Acento de éxito:** `student-progress` (green-500), más contenido.
- **Color de "ranking / creatividad":** `student-creative` (purple-600).
- **Color de "misiones":** `student-mission` (orange-500).
- **Radio:** estándar, sin cápsula.
- **Movimiento:** sutil. Sin celebración visual cuando no es un
  desbloqueo real.

### 8.4 Lo que ninguna variante puede hacer

- ❌ Páginas duplicadas (panel-alumno-kids.html, panel-alumno-teens.html).
- ❌ Componentes duplicados (sidebar-kids, sidebar-teens).
- ❌ Estética preescolar (burbujas, ojos gigantes, emojis, redondeo
  excesivo, cápsulas blandas).
- ❌ Estética de videojuego oscuro (neón, glows, scans, circuitos).
- ❌ Estética hacker (terminales, monoespaciado como body, glitch).
- ❌ Decoraciones flotantes, blobs, puntos animados, shapes decorativas
  en el shell.
- ❌ Cinco colores fuertes compitiendo en una misma sección.

---

## 9. Tipografía

### 9.1 Familia

- **Única familia:** `Inter` con fallback a `ui-sans-serif`,
  `system-ui`, `-apple-system`, `Segoe UI`, `sans-serif`.
- **No se introduce** una segunda familia (ni siquiera para una
  "ocasión especial"). No se introduce `Poppins`, `Nunito`, `Outfit`,
  `Fredoka` ni equivalentes.
- **No se modifica** el peso de Inter con sustitutos (no se simula
  "bold" con CSS si la fuente no lo trae).

### 9.2 Tamaño mínimo

- **Texto normal:** mínimo 12 px.
- **Texto caption (label, kicker):** puede ir a 10 px **solo** si es
  texto **no relevante** para la tarea principal (eyebrow decorativo,
  contador secundario). **10 px no está permitido** para:
  - Instrucciones que el usuario debe leer para completar una acción.
  - Etiquetas de controles.
  - Mensajes de estado.
  - Números que el usuario necesita leer (saldo, XP, etc.).
- **Texto por defecto:** 14 px.
- **Texto destacado:** 16 px.
- **Subtítulos / h3:** 20 px.
- **h2:** 24 px.
- **h1:** 32 px.
- **Display:** 40 px.

### 9.3 Peso y jerarquía

| Uso | Peso |
|---|---|
| Texto por defecto | 400 |
| Texto destacado (helper, body-lg) | 500 |
| Subtítulos (h3) | 600 |
| Títulos (h1, h2) | 700 |
| Métrica, número destacado | 700–800 |

**No se usa** peso 900. La jerarquía se construye con tamaño y
contexto, no con grosor extremo.

### 9.4 Line-height

- Headings: 1.1 – 1.25.
- Body: 1.5.
- Caption: 1.3.

### 9.5 Letter-spacing

- Mayúsculas (uppercase, eyebrow, label): 0.075 – 0.12 em.
- Texto normal: 0 (no tracking).

### 9.6 Tamaño responsive

Cuando un tamaño cambia con el viewport, se usa `clamp()` o un
breakpoint explícito. No se permite el "tamaño que se ve bien en mi
monitor".

---

## 10. Espaciado

### 10.1 Escala base

Escala de **4 px** (no de 3, no de 5, no de 8). Esto es una decisión
de consistencia, no de preferencia visual.

```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

No se añaden valores intermedios arbitrarios. Si 22 px "se ve mejor",
se usa 20 o 24, no se introduce 22.

### 10.2 Tokens derivados

| Token | Valor (px) | Función orientativa |
|---|---|---|
| space-1 | 4 | micro-separación (entre icono y label). |
| space-2 | 8 | gap interno de un control. |
| space-3 | 12 | padding ligero, gap entre items cercanos. |
| space-4 | 16 | padding estándar de cards, gap entre items. |
| space-5 | 20 | padding cómodo, gap entre grupos. |
| space-6 | 24 | padding de cards grandes, separación entre secciones. |
| space-8 | 32 | separación mayor, padding de hero. |
| space-9 | 40 | separación estructural. |
| space-10 | 48 | separación entre bloques. |
| space-12 | 64 | separación máxima dentro de una vista. |

### 10.3 Compuestos

- `page-padding-x`: `clamp(1.5rem, 2.5vw, 2rem)` (24 – 32 px).
- `page-max-width`: `1280 px`.
- `section-gap`: `var(--space-6)` o `var(--space-8)` según jerarquía.

---

## 11. Densidad

### 11.1 Concepto

La densidad combina **espaciado**, **tamaño tipográfico** y **cantidad
de información por vista**. Tres niveles canónicos:

| Nivel | Uso | Espaciado | Tipografía | Información por vista |
|---|---|---|---|---|
| **Cómoda (KIDS)** | Hero, onboarding, vistas de bienvenida. | amplio (space-6+) | 16+ | baja |
| **Estándar (TEENS)** | Dashboard, listados, vistas de trabajo. | medio (space-4 / space-6) | 14 | media |
| **Compacta (tablas)** | Tablas admin, listados densos. | reducido (space-2 / space-3) | 13 | alta |

### 11.2 Reglas

- Una vista no combina más de dos densidades a la vez. Si una tabla
  convive con un hero en la misma página, la tabla es la zona densa
  y el hero es la zona cómoda, sin gradientes entre ambas.
- La densidad **no se logra quitando aire**: se logra ajustando
  espaciado, tipografía y agrupamiento.
- El padding interno de un control **no se reduce** por debajo de
  `space-2 × 1` para "ahorrar espacio".

---

## 12. Radios

### 12.1 Escala

| Token | Valor (px) | Uso orientativo |
|---|---|---|
| `radius-xs` | 6 | chips pequeños, checkboxes. |
| `radius-sm` | 10 | inputs estándar, badges. |
| `radius-md` | 14 | cards estándar. |
| `radius-lg` | 18 | cards grandes, paneles. |
| `radius-xl` | 24 | hero, banner. |
| `radius-pill` | 999 | elemento único (avatar, status dot). **No se usa en cards, no se usa en items de navegación.** |

### 12.2 Reglas

- **Las cards de contenido usan** `radius-md` o `radius-lg`. Nunca
  pill.
- **Los items de navegación (sidebar, menús) usan** `radius-sm` o
  `radius-md` con padding lateral generoso. **No son pill**, no son
  cápsula, no son completamente redondeados.
- **El radio excesivo** (≥ 24 px en una card pequeña) está prohibido.
  Comunica blandura y resta jerarquía.
- **No** se usan radios distintos para el mismo tipo de elemento en
  la misma vista.

---

## 13. Bordes

### 13.1 Reglas

- Borde estándar: `1 px solid var(--border)` (`#E4EAF2`).
- Borde con énfasis: `1 px solid var(--border-strong)` (`#CBD5E1`).
- Los bordes son **neutros**. No se usa borde de color azul, morado,
  púrpura o navy para decorar.
- El borde de foco es `outline` con `box-shadow` amarillo
  (`student-reward` con opacidad reducida), no un cambio de `border-color`.
- Los divisores de sección dentro de una card pueden ser
  `border-top: 1 px solid var(--border)`.

### 13.2 Prohibiciones

- ❌ Borde de color (`border: 1px solid #5630CE`).
- ❌ Borde punteado como decoración.
- ❌ Borde doble (`border: 3px double`).
- ❌ Borde con gradiente.
- ❌ Borde "neon" (`box-shadow: 0 0 8px #5630CE`).

---

## 14. Sombras

### 14.1 Reglas

- Las sombras son **neutras y suaves**. No se permiten sombras con
  tinte azul, morado, púrpura, navy o de cualquier color.
- Sombra mínima: `shadow-xs` (casi imperceptible, separa cards del
  fondo).
- Sombra estándar: `shadow-sm` (cards normales).
- Sombra elevada: `shadow-md` (dropdowns, popovers, tooltips).
- Sombra modal: `shadow-lg` (modales, drawer, overlays).
- La sombra **no compite** con el borde. Una card usa **una** de las
  dos para separarse del fondo, no las dos.

### 14.2 Prohibiciones

- ❌ `box-shadow: 0 0 20px #5630CE` (glow de marca).
- ❌ `box-shadow: 0 10px 30px rgba(86, 48, 206, 0.3)` (tinte morado).
- ❌ `box-shadow: 0 0 0 4px rgba(254, 197, 20, 0.5)` como decoración
  (solo permitido como foco, no como ornamento).
- ❌ Múltiples sombras encadenadas que produzcan "neón" o "resplandor".

---

## 15. Iconografía

### 15.1 Estilo

- **Una sola familia** de iconos (la vigente en el sistema, definida
  en el mapa de tokens).
- **Estilo sólido** (`solid` o `filled`). No se mezcla outline + solid
  en la misma vista.
- **Tamaño base** de iconos en cuerpo: 16 – 20 px.
- **Tamaño medio**: 24 px.
- **Tamaño destacado**: 32 – 48 px.
- **Tamaño hero** (si aplica): 56 – 96 px.

### 15.2 Prohibiciones

- ❌ Iconos 3D genéricos (esferas con gradiente, planos isométricos
  estilo "stock").
- ❌ Iconos con sombra propia o efecto de volumen cuando el resto de
  la UI es plano.
- ❌ Iconos multicolores en una misma familia visual (excepto cuando
  el color codifica estado: success / warning / danger).
- ❌ Emoji como icono de UI.
- ❌ Iconos animados por defecto (rotación, rebote, pulse) sin razón.

### 15.3 Color

- Icono neutro: `text-secondary` o `text-primary` según contexto.
- Icono de acción: color del rol (e.g. icono de `student-progress`
  en `green-500`).
- Icono de marca: solo en momentos donde la marca es protagonista
  (logo DAEMON, mascota).

---

## 16. Ilustraciones y personajes

### 16.1 Principios

- La ilustración es **funcional**, no decorativa. Si no comunica
  algo que la interfaz no puede, no se pone.
- La mascota **no aparece** en cada vista. Su presencia se dosifica:
  hero (KIDS), empty states, recompensas, celebración.
- La mascota **no compite** con la información. Si la información
  requiere atención, la mascota cede el espacio.

### 16.2 Estilo

- Trazo plano, no foto.
- Paleta limitada, coherente con la marca. **No** se añaden colores
  nuevos para una ilustración.
- No caricaturesco extremo, no infantil preescolar, no hiperrealista.
- La mascota puede variar de pose/expresión por estado (alegre,
  neutro, confundido) sin cambiar de estilo.

### 16.3 Prohibiciones

- ❌ Ilustración de fondo con un fondo espacial oscuro que tape la
  legibilidad del texto.
- ❌ Imágenes bitmap con `background-blend-mode: multiply` sobre
  fondos de marca.
- ❌ Cinco colores de marca compitiendo en una sola ilustración.
- ❌ Mascota o personaje en cada pantalla.

---

## 17. Movimiento

### 17.1 Tiempos y curvas

- `--motion-fast: 120ms` — micro-interacciones (hover, focus, toggle).
- `--motion-normal: 180ms` — transiciones de UI (mostrar/ocultar panel).
- `--motion-slow: 240ms` — entradas de hero, transiciones de página.
- Curva: `cubic-bezier(0.2, 0.7, 0.25, 1)` (curva institucional,
  no rebote, no elástico).

### 17.2 Reglas

- El movimiento **comunica causa-efecto**, no decora.
- Una entrada no dura más de 240 ms.
- Una salida es más rápida que una entrada (180 ms vs 240 ms).
- Los `transform: translateY(-Npx)` decorativos están prohibidos
  como hover de cards. Una card se eleva con sombra, no con traslación.
- Las animaciones en bucle están prohibidas salvo:
  - carga (spinner, skeleton);
  - espera de acción del usuario (pulse de "esperando confirmación").

### 17.3 `prefers-reduced-motion`

- Se respeta **siempre**. Bajo `reduce`, todas las animaciones se
  reducen a `0.001ms` o se eliminan.
- La accesibilidad del movimiento es **un derecho**, no un toggle.

---

## 18. Accesibilidad

### 18.1 Estándar

- **WCAG 2.2 AA** mínimo en todo el producto.
- **WCAG 2.2 AAA** deseable para texto crítico (texto principal,
  instrucciones, errores de validación).

### 18.2 Contraste de color

| Tipo de contenido | Mínimo AA | Deseable AAA |
|---|---|---|
| Texto normal (< 18 px o < 14 px bold) | 4.5 : 1 | 7 : 1 |
| Texto grande (≥ 18.66 px bold o ≥ 24 px) | 3 : 1 | 4.5 : 1 |
| UI no textual (iconos, bordes de control, focus rings) | 3 : 1 | 4.5 : 1 |

### 18.3 Combinaciones prohibidas (texto normal)

Ver `02-COLOR-ACCESSIBILITY-REPORT-V1.md` para el detalle. Reglas
generales:

- ❌ Texto blanco sobre `#76CF1A` (green-500).
- ❌ Texto blanco sobre `#FEC514` (yellow-500).
- ❌ Texto blanco sobre `#EB590C` (orange-500) para texto normal.
- ❌ Texto blanco sobre `#16A34A` (success propuesto) para texto normal.
- ❌ `#FEC514` como texto sobre `surface` blanco.
- ❌ `#76CF1A` como texto sobre `surface` blanco.
- ❌ `#98A2B3` (text-disabled) para información necesaria.

### 18.4 Combinaciones aprobadas (texto normal)

- ✅ `#FFFFFF` sobre `#10105D` (16.74:1).
- ✅ `#10105D` sobre `#FEC514` (10.53:1).
- ✅ `#FFFFFF` sobre `#5630CE` (7.75:1).
- ✅ `#172033` sobre `#FFFFFF` (16.27:1).
- ✅ `#172033` sobre `#F4F7FB` (15.14:1).
- ✅ `#667085` sobre `#FFFFFF` (4.97:1, AA pero no AAA).

### 18.5 No solo color

- El estado **no se comunica solo por color**. Un error se marca con
  icono + texto + color. Un éxito se marca con icono + texto + color.
- El foco se comunica con cambio de fondo y/o sombra de anillo, no
  solo con cambio de color de borde.

### 18.6 Otros requisitos

- Targets táctiles ≥ 44 × 44 px (48 × 48 px en KIDS).
- Foco visible en todo control interactivo.
- `aria-current` en item activo del sidebar.
- `aria-label` en iconos sin texto.
- Estructura de headings sin saltar niveles.
- Idioma principal declarado en `<html lang>`.
- `prefers-reduced-motion` respetado.

---

## 19. Antipatrones (prohibidos)

Lista cerrada de patrones visuales **prohibidos** en cualquier
implementación DAEMON.

### 19.1 Decoración

- Gradientes decorativos (lineales, radiales, cónicos).
- Glassmorphism (`backdrop-filter: blur`, `backdrop-blur-*`).
- Transparencias ornamentales sin propósito funcional.
- Blobs, manchas orgánicas, formas libres decorativas.
- Puntos flotantes, partículas, shapes decorativas en el shell.
- Circuitos, líneas técnicas, estética hacker.
- Neón, glows, resplandor coloreado.
- Sombras con tinte de color (azul, morado, púrpura, navy, rosa).
- Tarjetas con radio excesivo (≥ 24 px en card pequeña).
- Cápsulas de navegación (items completamente redondeados a pill).
- Pills sin función (no se usan como decoración).
- Fondos de color pálido como decoración.
- Todos los contenidos encerrados en cards (no todo merece un card).
- Iconos 3D genéricos.
- Ilustraciones sin función.
- Cinco colores fuertes compitiendo en una sección.

### 19.2 Texto

- Texto blanco sobre `#FEC514` o `#76CF1A` (sin contraste).
- Texto sobre imagen con blend mode que reduce legibilidad.
- Texto blanco sobre fondo claro.
- Texto con peso 900 o más.
- Texto menor a 12 px para contenido relevante.
- Texto en mayúsculas sin `letter-spacing`.
- Texto justificado en UI (solo en bloques largos, nunca en cards).

### 19.3 Interacción

- `transform: translateY` decorativo en hover de cards.
- Animaciones en bucle fuera de carga o espera.
- Animaciones de más de 240 ms sin razón funcional.
- `transition: all` (siempre se nombra la propiedad).
- Auto-play de video o audio.
- Cursor pointer sobre elementos no interactivos.

### 19.4 Layout

- Contenido que excede el viewport horizontal sin scroll explícito.
- Cards que no respiran (padding interno < `space-3`).
- Sección que mezcla tres densidades (cómoda + estándar + compacta
  en la misma vista).
- Sidebar con floating shapes decorativas en TEENS.
- Hero con fondo espacial oscuro + ilustración que tapa texto.

### 19.5 Identidad

- Color de marca usado como semántica (orange como error, green como
  success automático, yellow como warning).
- Modificar los cinco colores núcleo sin pasar por gobernanza.
- Introducir un sexto color de marca sin aprobación.

---

## 20. Gobernanza

### 20.1 Quién decide

- **Aprobaciones estructurales** (cambios a la Constitución, paleta
  núcleo, antipatrones, accesibilidad): Max (owner de marca) + un
  revisor adicional.
- **Aprobaciones de tokens** (añadir token nuevo, deprecar, reasignar):
  Max + un implementador con conocimiento del sistema.
- **Aprobaciones de componentes** (introducir primitivo compartido):
  Max + un implementador + evidencia de reutilización real (al menos
  dos features lo necesitan).
- **Cambios cosméticos** dentro del sistema aprobado: un implementador
  con PR + revisión de CI.

### 20.2 Quién propone

- Cualquier miembro del equipo o agente.
- Las propuestas se hacen como **PR a este directorio
  `docs/sistema-diseno/`**.

### 20.3 Cómo se mide

- Toda propuesta debe acompañarse de:
  - Cambio propuesto (diff de tokens o de reglas).
  - Justificación contra los principios de §3.
  - Resultado de linter de estilo (ver §20.5).
  - Capturas de antes / después cuando aplique.
  - Lista de archivos afectados.

### 20.4 Versionado

- Cambios incompatibles → bump mayor (`V1` → `V2`).
- Cambios compatibles → bump menor (`V1.0` → `V1.1`).
- Cada cambio queda registrado en el changelog de la Constitución
  (sección 23 ampliada o anexo).

### 20.5 Linter de estilo

- El linter de tokens del proyecto (`check:style-tokens`) es **parte**
  del enforcement de la Constitución.
- El linter de visual del portal alumno (`check:student-visual`) es
  **parte** del enforcement.
- Estos linters pueden ampliarse para enforce las nuevas reglas que
  la Constitución agregue.

---

## 21. Creación de tokens

### 21.1 Cuándo se crea un token nuevo

Solo cuando:

1. El valor se va a usar en **más de un lugar** del sistema.
2. El valor es **semánticamente estable** (no es un ajuste cosmético
   de un solo componente).
3. El valor pasa las pruebas de contraste y de uso del rol que
   representa.

### 21.2 Cuándo **no** se crea un token

- Para un color que solo aparece en una ilustración.
- Para un padding que solo usa un componente.
- Para un valor "único" que no tiene función reutilizable.
- Para evitar repetir un número dos veces en el mismo archivo.

### 21.3 Cómo se nombra

- Categoría → rol → modificador.
- Ejemplos válidos: `--daemon-text-primary`, `--student-action-primary-hover`.
- Evitar: nombres cromáticos (`--daemon-purple-600` en el contrato de
  tokens está permitido como alias del color, pero el nombre que las
  features consumen es el **rol**, no el color).

### 21.4 Cómo se introduce

1. PR al `01-TOKEN-MAP-V1.md` con la fila nueva, estado `PROPUESTO`.
2. Revisión de gobernanza (§20).
3. Si se aprueba, el token se mueve a `APROBADO` y se documenta:
   - Función.
   - On-color (qué color va encima).
   - Contraste verificado contra `on-color`.
   - Dónde se va a usar.
4. Implementación en `_tokens.scss` y, si aplica, en `tailwind.config.js`.
5. Validación de linter.

---

## 22. Excepciones

### 22.1 Cuándo una excepción es legítima

Una excepción a la Constitución se permite solo cuando:

- Cumple una **normativa legal** (por ejemplo, un logo externo con
  colores fijos que no se pueden cambiar).
- Atiende una **necesidad técnica irrenunciable** (por ejemplo, un
  asset externo con paleta limitada).
- Refleja una **decisión de Max documentada** por escrito.

### 22.2 Cómo se documenta una excepción

- La excepción se registra como una **entrada explícita** en
  `01-TOKEN-MAP-V1.md` con estado `PROHIBIDO` revertido a `EXCEPCIÓN`
  en la columna de estado, con la justificación legal/técnica y la
  aprobación de Max.
- La excepción se lista en `00-DOCUMENTATION-STATUS.md` para que sea
  visible en cualquier revisión.
- La excepción **no escala**: no puede usarse como precedente para
  nuevas excepciones.

### 22.3 Excepciones que la Constitución **nunca** concede

- ❌ Quitar accesibilidad WCAG AA.
- ❌ Usar un color fuera de la paleta núcleo como color principal.
- ❌ Romper la jerarquía de tokens (clases que pisan tokens).
- ❌ Gradientes, glassmorphism o glows como estilo aprobado.
- ❌ Duplicación de páginas KIDS / TEENS.

---

## 23. Revisión y aprobación

### 23.1 Revisión periódica

- La Constitución se revisa **una vez por trimestre** o cuando se
  solicita un cambio mayor.
- La revisión la conduce Max + un implementador con conocimiento del
  sistema.

### 23.2 Aprobación de un cambio

Un cambio a la Constitución se aprueba cuando:

1. Hay un PR con diff justificado contra los principios de §3.
2. Hay evidencia de linter pasando.
3. Hay **dos aprobaciones** (Max + un revisor adicional) en el PR.
4. La versión se incrementa según §20.4.
5. El changelog al final de este documento se actualiza.

### 23.3 Aprobación silenciosa

- **No existe.** Ningún cambio a la Constitución se considera aprobado
  sin los dos vistos buenos explícitos.

### 23.4 Changelog

| Fecha | Versión | Cambio | Aprobado por |
|---|---|---|---|
| 2026-08-06 | V1.0 | Creación inicial de la Constitución. | Max (pendiente segundo revisor). |

---

## Anexo A — referencias

- `00-DOCUMENTATION-STATUS.md` — auditoría de toda la documentación
  del sistema de diseño.
- `01-TOKEN-MAP-V1.md` — mapa de tokens aprobados, propuestos,
  deprecados y prohibidos.
- `02-COLOR-ACCESSIBILITY-REPORT-V1.md` — informe de contraste WCAG
  verificado.
- `daemon-student-baseline-v1.md` — inventario del estado actual del
  portal del estudiante (anexo informativo, no normativo).
- `daemon-student-visual-v1.md` — marcado como
  **BORRADOR NO APROBADO — NO IMPLEMENTAR** en su cabecera.
- WCAG 2.2 — https://www.w3.org/TR/WCAG22/
- WCAG 2.1 contrast ratio — https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio

---

**Fin del documento.** Constitución Visual DAEMON V1.0 — 2026-08-06.
