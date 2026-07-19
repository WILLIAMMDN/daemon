# Instrucciones operativas para Antigravity

Este repositorio es producción real. Antes de editar, lee en este orden:

1. `AGENTS.md`;
2. `docs/colaboracion-ias.md`;
3. `docs/handoffs/codex-to-antigravity.md`;
4. `docs/sistema-visual-portal-alumno.md` y `docs/portal-alumno.md` cuando el
   alcance sea el portal estudiante.

## Rama y límites

- Trabaja únicamente en `feature/frontend-design-system` o en una rama
  `antigravity/<modulo>` creada desde el `origin/main` indicado en el handoff.
- Nunca hagas commit, merge, push o deploy directamente a `main`.
- No modifiques ramas `codex/*`.
- No mezcles más de un módulo funcional por commit.
- No uses `git reset --hard`, force-push ni descartes cambios ajenos.
- Si un archivo aparece modificado antes de empezar, detente sobre ese archivo
  y regístralo en el handoff; no lo sobrescribas.

## Contrato funcional

- Angular presenta; Laravel autoriza y persiste.
- XP es progreso permanente y DAEMONS es saldo gastable.
- Un `401` invalida la sesión; permisos insuficientes deben responder `403`.
- No elimines rutas, botones, estados, IDs de tour, respuestas de error ni
  acciones existentes para simplificar una pantalla.
- La ficha redundante de usuario se eliminó intencionalmente del sidebar. El
  enlace de navegación `Mi perfil` permanece y el topbar conserva avatar,
  cuenta, saldo, notificaciones y cierre de sesión.
- El hamburguesa móvil debe ser visible, tener al menos 40 px, abrir con un solo
  toque y cerrar con overlay, Escape o navegación.
- No cambies contratos API, autenticación, telemetría o servicios `core` dentro
  de una tarea puramente visual.

## Contrato visual y responsive

- Inter, colores sólidos, tarjetas blancas, borde ligero y radios de 12–16 px.
- Sin degradados, Outfit, glassmorphism, blur decorativo, saltos verticales de
  tarjetas ni animación continua.
- Acciones táctiles de al menos 40 px y foco visible.
- Respeta `prefers-reduced-motion`.
- No inventes métricas, niveles, bloqueos, cursos ni estados.
- Implementa y revisa siempre: loading, datos, vacío, error y reintento.
- Verifica 1440×900, 1024×768, 390×844 y 360×800 sin scroll horizontal.

## Entrega obligatoria

Antes de pedir integración ejecuta:

```powershell
cd frontend-angular
npm run check:architecture
npm run check:student-visual
npm run test:ci
npm run build
```

Después actualiza únicamente `docs/handoffs/antigravity-to-codex.md` con:

- rama, commit base y commit entregado;
- objetivo y archivos cambiados;
- comportamiento preservado;
- evidencia de los comandos;
- capturas desktop/móvil o rutas para reproducirlas;
- riesgos, decisiones abiertas y archivos que Codex no debe tocar.

Codex revisará el diff, lo integrará por cherry-pick en su rama y podrá
corregirlo. Un build verde no sustituye la revisión funcional, visual y de
accesibilidad.
