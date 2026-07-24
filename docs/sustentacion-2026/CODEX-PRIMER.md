# CODEX PRIMER — Cómo darle contexto a Codex para DAEMON Aula

> Guía paso a paso para que vos uses tu Codex pago (CLI o ChatGPT) y
> ejecute el plan que armamos.

---

## 1. ¿Tenés Codex CLI o ChatGPT Codex?

### Opción A: Codex CLI (recomendada para tu caso)

Es la herramienta de terminal de OpenAI. Si la tenés instalada, hace esto:

```powershell
cd C:\Users\MEDINA\Desktop\daemon-aula-sustentacion\frontend-angular
codex
```

Cuando arranca, **ya está en la carpeta correcta** y ve todos los archivos.
Le pegás el "primer mensaje" de la sección 4 y arranca a trabajar.

### Opción B: ChatGPT Codex (modo agente en la web)

Abrís ChatGPT → elegís el modo Codex/Code → en el primer mensaje le pegás
el "primer mensaje" de la sección 4.

**Limitación:** ChatGPT Codex en la web no ve tus archivos locales hasta
que se los pasás. Tenés que:

- Adjuntar `PROMPT-AGENTE-DEFINITIVO.md` y `PLAN-AGENTE-FIRESTORE-AULA.md`
  como archivos, **o**
- Pegar el contenido completo en el chat.

---

## 2. Antes de lanzar: checklist

Confirmá que tenés esto listo:

- [ ] El worktree existe en `C:\Users\MEDINA\Desktop\daemon-aula-sustentacion`
- [ ] Estás en la rama `sustentacion/firestore-aula` (ver con `git branch --show-current`)
- [ ] Tienes `node_modules` instalado en `frontend-angular/` (si no, corré `npm install` ahí)
- [ ] El build base pasa: `cd frontend-angular && npm run build`
- [ ] Tenés el archivo `docs/sustentacion-2026/PROMPT-AGENTE-DEFINITIVO.md`
- [ ] Tenés el archivo `docs/sustentacion-2026/PLAN-AGENTE-FIRESTORE-AULA.md`

Si algún paso falla, avisame y lo arreglamos antes de lanzar Codex.

---

## 3. El mensaje de arranque (copiá y pegá en Codex)

Acá está el prompt listo para que lo pegues en Codex. No cambies nada, está
optimizado para que Codex entienda el contexto de un saque.

```text
Actúa como arquitecto de software senior especializado en Angular 21,
Firebase y Cloud Firestore. Vas a implementar el módulo DAEMON Aula
según el plan adjunto.

═══════════════════════════════════════════════════════════════════
UBICACIÓN DEL PROYECTO
═══════════════════════════════════════════════════════════════════

Tu working directory es:

  C:\Users\MEDINA\Desktop\daemon-aula-sustentacion\frontend-angular

Este es un git worktree. La rama activa es `sustentacion/firestore-aula`.
Todo tu trabajo queda en este directorio. No toques nada fuera de él.

═══════════════════════════════════════════════════════════════════
DOCUMENTOS DE REFERENCIA (LEELOS COMPLETOS ANTES DE EMPEZAR)
═══════════════════════════════════════════════════════════════════

1. docs/sustentacion-2026/PROMPT-AGENTE-DEFINITIVO.md
   → Rol, mentalidad, rediseño, identidad visual, NG-ZORRO, reglas
     de calidad, prohibiciones. 20 secciones.

2. docs/sustentacion-2026/PLAN-AGENTE-FIRESTORE-AULA.md
   → Especificación técnica: 4 interfaces TS, 4 servicios Firestore,
     reglas de seguridad, árbol de archivos, 11 fases, 16 pasos de
     verificación.

Lee AMBOS documentos antes de escribir una sola línea de código.
Si alguna instrucción entra en conflicto, gana el PROMPT (calidad)
sobre el PLAN (especificación).

═══════════════════════════════════════════════════════════════════
QUÉ VAS A HACER
═══════════════════════════════════════════════════════════════════

Construir un módulo nuevo `features/aula/` dentro de DAEMON que
cumpla los 5 criterios del curso de Programación Web (Auth, Datos,
Formularios, Navegación, UI) usando Firestore como capa de datos.

NO toques nada de lo siguiente (son intocables):
- features/alumno/, features/familias/, features/cuentos/
- features/competencia/, features/laboratorio/, features/mascota/
- features/chatbot/, features/evaluaciones/, features/ranking/
- features/tienda/, features/proyectos/
- core/servicios/api.ts (Laravel)
- core/servicios/autenticacion.ts (Laravel)
- core/servicios/sesion.ts (estado sesión)
- core/servicios/firebase-auth.ts (Auth)
- core/guards/auth-guard.ts, docente-guard.ts, alumno-guard.ts,
  tutor-guard.ts
- backend-laravel/ (PHP)
- database/, legado/

Lo que SÍ puedes crear o modificar:
- features/aula/** (todo el módulo nuevo)
- core/servicios/firestore-app.ts (provider nuevo de Firestore)
- core/layouts/layout-aula/ (layout nuevo)
- app.routes.ts (agregar lazy load de /aula)
- app.config.ts (proveer Firestore)
- firestore.rules (en la raíz del frontend-angular)
- styles.scss o _aula-theme.scss (tema scoped al módulo Aula)

═══════════════════════════════════════════════════════════════════
STACK Y RESTRICCIONES
═══════════════════════════════════════════════════════════════════

- Angular 21 LTS, standalone components, signals cuando aporten.
- TypeScript estricto. NO uses `any` sin justificación documentada.
- NG-ZORRO 21 como ÚNICA librería de componentes (ya está instalado).
  Reusá: nz-table, nz-form, nz-drawer, nz-modal, nz-select,
  nz-date-picker, nz-message, nz-spin, nz-skeleton, nz-tag,
  nz-statistic, nz-empty, nz-result, nz-breadcrumb, nz-icon.
- Firebase SDK directo: firebase/app, firebase/auth, firebase/firestore.
  NO instales @angular/fire.
- SCSS con tokens CSS. No agregues Tailwind al módulo Aula.
- Iconos: @ant-design/icons-angular (ya instalado). Sin emojis.
- Cambios pequeños, validados con build después de cada fase.
- ChangeDetectionStrategy.OnPush en componentes Aula.

═══════════════════════════════════════════════════════════════════
ESTILO VISUAL DEL MÓDULO AULA
═══════════════════════════════════════════════════════════════════

El módulo Aula se ve SERIO Y CORPORATIVO, no infantil.

- Paleta: grafito (#20252A) + bronce (#B88435) + marfil (#F4F2ED)
- Tipografía: Inter / Manrope, ya cargadas en el proyecto
- Radios: contenedores 10px, inputs 6px, tags 4px. NUNCA 9999px
- Sombras sutiles. NO glassmorphism, NO blur, NO degradados intensos
- Tablas densas con información real, no decorativas
- Sin mascota, sin Rive, sin emojis, sin ilustraciones decorativas
- Copy directo y profesional ("Gestión de cursos", no "¡Crea tu
  curso mágico!")

Detalle completo en PROMPT-AGENTE-DEFINITIVO.md secciones 7-10.

═══════════════════════════════════════════════════════════════════
PLAN DE TRABAJO
═══════════════════════════════════════════════════════════════════

Sigue las 11 fases del PLAN, en orden. Entre cada fase:
1. Corré `npm run build` y verificá que pase sin warnings nuevos.
2. Corré `npm run check:architecture` y `npm run check:style-tokens`.
3. Commiteá con mensaje descriptivo en español:
   `feat(aula): <qué hiciste>` o `chore(aula): <qué ajustaste>`.
4. Reportame brevemente qué hiciste y qué esperás que revise.

FASE 0 → Setup: init Firestore, layout-aula, estructura
FASE 1 → 4 interfaces TypeScript (Usuario, Curso, Mision, Entrega)
FASE 2 → 4 servicios Firestore (CRUD + observables)
FASE 3 → firestore.rules + pruebas manuales con emulators
FASE 4 → Páginas de cursos (lista, detalle, crear, editar)
FASE 5 → Páginas de misiones
FASE 6 → Páginas de entregas
FASE 7 → Páginas restantes (inicio, perfil, admin, progreso)
FASE 8 → Routing + lazy load + guards
FASE 9 → Seed de datos demo (3 cuentas + cursos + misiones + entregas)
FASE 10 → Build, fix, tests manuales (16 pasos del plan)
FASE 11 → Documentación (README, guion, checklist)

═══════════════════════════════════════════════════════════════════
VERIFICACIÓN
═══════════════════════════════════════════════════════════════════

Antes de cerrar cualquier fase:

  cd C:\Users\MEDINA\Desktop\daemon-aula-sustentacion\frontend-angular
  npm run build
  npm run check:architecture
  npm run check:style-tokens
  npm run test:ci

Todo debe pasar. Si algo falla, NO avances de fase hasta arreglarlo.

═══════════════════════════════════════════════════════════════════
CÓMO COMUNICARTE CONMIGO
═══════════════════════════════════════════════════════════════════

Después de cada fase, en tu respuesta decime:
1. Qué archivos creaste/modificaste (lista breve).
2. Resultado del build (verde/rojo).
3. Si encontraste alguna decisión que no estaba en el plan.
4. Qué necesita mi revisión o decisión antes de seguir.

Si te trabás o tenés dudas de diseño, PARÁ y preguntame antes de
inventar. Es preferible una pregunta a un supuesto incorrecto.

═══════════════════════════════════════════════════════════════════
COMANDO DE ARRANQUE
═══════════════════════════════════════════════════════════════════

  cd C:\Users\MEDINA\Desktop\daemon-aula-sustentacion\frontend-angular
  npm install            (solo la primera vez, ~5 min)
  npm run build          (verificar baseline, debe pasar)
  git log --oneline -5   (ver el historial)

Si el build baseline falla, decímelo antes de empezar.
Si pasa, arrancá con FASE 0.
```

---

## 4. Mensajes cortos para cada fase (opcional)

Después de que Codex arranque, podés usar estos mensajes cortos para
avanzar fase por fase:

| Cuando termine | Pegale esto |
|---|---|
| FASE 0 | `Seguí con la FASE 1 del plan. Cuando termines, mostrame el build status.` |
| FASE 1 | `Seguí con la FASE 2.` |
| FASE 2 | `Seguí con la FASE 3. Recordá probar las reglas con firebase emulators:start --only firestore.` |
| FASE 3 | `Seguí con la FASE 4.` |
| FASE 4 | `Seguí con la FASE 5. Implementá el validador custom de fechaFuturaValidator.` |
| FASE 5 | `Seguí con la FASE 6.` |
| FASE 6 | `Seguí con la FASE 7.` |
| FASE 7 | `Seguí con la FASE 8. Configurá el lazy loading correctamente.` |
| FASE 8 | `Seguí con la FASE 9. El seed debe dejar 3 cuentas listas para login.` |
| FASE 9 | `Seguí con la FASE 10. Corré los 16 pasos de verificación manual del plan.` |
| FASE 10 | `Seguí con la FASE 11. Generá los 3 docs: README-AULA.md, GUION-SUSTENTACION.md, CHECKLIST-EVIDENCIAS.md.` |
| FASE 11 | `Listo. Generá un REPORTE-FINAL.md con resumen, capturas y verificación.` |

---

## 5. Si Codex se traba o hace algo raro

Cosas que pueden pasar y cómo responder:

**Codex dice "no entiendo el plan"**
→ Pegale el contenido de `PLAN-AGENTE-FIRESTORE-AULA.md` directamente
   en el chat.

**Codex empieza a tocar archivos prohibidos**
→ Pará inmediatamente y decile:
   "PARÁ. Esos archivos están en la lista de intocables. No los modifiques.
   Hacelo de otra forma sin tocarlos."

**Codex pregunta algo de diseño**
→ Si está en el plan, decile "está en el plan, seguí".
→ Si NO está, decime a mí y definimos juntos antes de que Codex improvise.

**Codex reporta error de TypeScript que no puede resolver**
→ Pegame el error exacto y lo revisamos juntos.

**Codex intenta instalar @angular/fire o cualquier dependencia nueva**
→ Pará. Esa es una regla explícita del prompt. Decile:
   "NO instales nada. Reusá lo que ya está en package.json."

**Codex dice que terminó pero no commiteó nada**
→ Pedile que haga `git status` y commitee cada fase con mensaje descriptivo.

---

## 6. Mientras Codex trabaja

Vos podés:

- Ver los archivos en VS Code: `code C:\Users\MEDINA\Desktop\daemon-aula-sustentacion`
- Ver el progreso: `cd al worktree && git log --oneline -20`
- Ver los cambios: `git diff main..HEAD` o contra la rama base
- Probar el build: `cd frontend-angular && npm run build`
- Si algo te preocupa, pegámelo a Mavis (yo) y revisamos

---

## 7. Si necesitás pausar y volver

Codex CLI guarda la sesión. Si cerrás la terminal, podés volver con:

```powershell
cd C:\Users\MEDINA\Desktop\daemon-aula-sustentacion\frontend-angular
codex --resume
```

Si usás ChatGPT Codex en la web, la conversación queda en tu historial.

---

## 8. Al terminar todo

Cuando Codex termine la FASE 11, el proyecto debe tener:

- ✅ Build verde (`npm run build`)
- ✅ Tests pasando (`npm run test:ci`)
- ✅ Linters pasando (`check:architecture`, `check:style-tokens`)
- ✅ 3 cuentas demo listas para login
- ✅ Flujo docente→estudiante→calificación end-to-end
- ✅ Documentación en `docs/sustentacion-2026/`

Si todo eso está, estás listo para la defensa.
Si falta algo, decímelo a Mavis y vemos qué ajustar.

---

**Suerte con Codex. Si te trabás, Mavis está acá para ayudar.**
