---
title: ADR-005: Una aplicación y dos perfiles de experiencia KIDS/TEENS
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# ADR-005: Una aplicación y dos perfiles de experiencia KIDS/TEENS

- Estado: Aceptado
- Fecha: 2026-08-02
- Alcance: portal del estudiante y contenido de cuentos
- Implementación visual: paquetes posteriores; este ADR no rediseña pantallas

## Contexto

DAEMON reconoce `KIDS` y `TEENS` como niveles/audiencias de estudiante. El rol
(`alumno`, `docente`, `admin`, `tutor`) es un concepto distinto. El frontend ya
dispone de `NivelAlumno`, `temaPortalAlumno`, las clases `theme-kids` y
`theme-teens`, pero el tema actual describe principalmente color y conserva
campos legacy. No existe todavía un contrato único para densidad, navegación,
asistencia, ilustración, movimiento y tono.

Duplicar rutas, páginas, servicios o modelos por audiencia multiplicaría la
deuda y podría producir diferencias de seguridad. A la vez, aplicar solo otro
color no satisface necesidades de comprensión, autonomía y protección de
menores.

## Decisión

Se mantiene una sola aplicación, un solo dominio, las mismas rutas principales
y los mismos repositorios/casos de uso. KIDS y TEENS se expresan con un perfil
de experiencia tipado y configuración composable.

```ts
interface PerfilExperienciaEstudiante {
  readonly audiencia: "kids" | "teens";
  readonly tema: "kids" | "teens";
  readonly densidad: "comoda" | "estandar";
  readonly navegacion: "guiada" | "autonoma";
  readonly nivelAsistencia: "alto" | "medio";
  readonly frecuenciaIlustracion: "alta" | "selectiva";
  readonly movimiento: "expresivo" | "sutil";
  readonly tonoContenido: "infantil-claro" | "juvenil-directo";
}
```

La implementación extiende la fuente existente, no crea otra lista de niveles:

- `nivel-alumno.ts` continúa definiendo `NivelAlumno`;
- una función pura convierte `NivelAlumno` en
  `PerfilExperienciaEstudiante`;
- `tema-portal-alumno.ts` conserva clase/atributo del host y deja de exponer
  colores concretos cuando terminen sus consumidores legacy;
- `_tokens.scss` define variantes semánticas de densidad, tipografía, tamaño de
  control, movimiento y superficies mediante `--daemon-*`;
- componentes reciben inputs/slots/configuración tipados en vez de duplicarse o
  acumular ramas `@if (esKids())`.

## Perfiles iniciales

| Dimensión          | KIDS                                       | TEENS                               |
| ------------------ | ------------------------------------------ | ----------------------------------- |
| Densidad           | Cómoda, menos decisiones simultáneas       | Estándar, más contexto útil         |
| Navegación         | Guiada, siguiente paso explícito           | Autónoma, acciones rápidas          |
| Asistencia         | Alta, instrucciones breves y ejemplos      | Media, ayuda bajo demanda           |
| Ilustración        | Alta y contextual, sin ruido decorativo    | Selectiva y con estética madura     |
| Mascota/personajes | Mayor presencia cuando explican o celebran | Presencia secundaria                |
| Movimiento         | Expresivo pero corto y no distractor       | Sutil                               |
| Tono               | Claro, amable y literal                    | Directo, juvenil y no infantilizado |
| Progreso           | Bloques simples con significado            | Mayor detalle sin cambiar fórmulas  |

`prefers-reduced-motion`, contraste, teclado, lector de pantalla y zoom tienen
prioridad sobre la variante. “Expresivo” nunca autoriza movimiento continuo,
parpadeos o una acción inaccesible.

## Fuente de verdad y fallo seguro

- PostgreSQL `usuarios.nivel`, servido por Laravel, es canónico.
- Firebase claims/Firestore pueden recibir una proyección mínima para reglas,
  pero no modificar el nivel.
- El cliente no infiere audiencia por edad, ruta, tema, localStorage ni aspecto
  visual.
- `normalizarNivelAlumno()` puede usar TEENS como fallback exclusivamente
  visual. Un nivel ausente o inválido no amplía lectura, publicación,
  comentarios ni privacidad; el servidor/reglas fallan cerrados.
- Cambiar el tema no cambia rol, aula, ownership, XP, DAEMONS ni consentimiento.

## Cuentos, visibilidad y moderación

La plataforma no hace cuentos anónimamente públicos. El comportamiento inicial
conservador es:

### Compartido

- todo cuento nace como borrador privado;
- publicación significa solicitar revisión, no cambiar un flag desde Angular;
- solo una versión aprobada puede ser visible;
- visibilidad inicial aprobable: aula/organización autenticada;
- exposición pública fuera de DAEMON no forma parte del enum inicial y exige una
  decisión futura explícita del propietario;
- reportes, ocultamiento, bloqueo de comentarios, borrado lógico y auditoría se
  resuelven en Laravel/PostgreSQL y se proyectan a Firestore;
- nombres, avatares y datos de menores se minimizan.

### KIDS

- publicación limitada al aula después de revisión docente/admin y de la
  política institucional/consentimiento aplicable;
- comentarios de texto bloqueados por defecto;
- reacciones de lista cerrada pueden habilitarse en cuentos aprobados;
- compartir externamente o habilitar comentarios requiere una política de
  producto/privacidad verificable, no un ajuste visual.

### TEENS

- puede solicitar publicación para aula o comunidad DAEMON autenticada;
- sigue requiriendo moderación antes de hacerse visible;
- comentarios solo en cuentos aprobados, vía Laravel, con rate limit, reporte y
  capacidad de bloqueo;
- no se habilitan mensajes privados ni acceso anónimo por pertenecer a TEENS.

Estas restricciones son configuración/capacidad de servidor, no ramas de HTML.
Son deliberadamente conservadoras porque no existe una política aprobada de
publicación web abierta para contenido de menores.

## Privacidad y bienestar

- No se almacena fecha de nacimiento nueva para seleccionar un tema.
- El portal familiar conserva su acceso explícito y verificado; no recibe chats,
  texto de evidencias, credenciales ni saldo DAEMONS.
- Uso de pantalla continúa como segundos agregados por día con retención de 45
  días; no se agregan páginas visitadas, teclas, texto o vigilancia.
- El ranking contextual permanece visible con identidad reducida y sin saldo.
- Logs/telemetría no incluyen cuerpo del cuento, prompts completos, correo del
  tutor, URLs firmadas ni PII innecesaria.

## Arquitectura de componentes

Preferencias de implementación:

- tokens semánticos y clases de tema en el host;
- variantes mediante inputs discriminados;
- content adapters para tono e instrucciones;
- slots/composición para ayudas opcionales;
- una configuración pura y testeable por audiencia;
- estados funcionales compartidos: initial, loading, saving, saved, empty,
  offline, permission denied, validation/server error y retry.

No se crean `DashboardKids`/`DashboardTeens`, servicios duplicados ni forks de
modelos. Un componente especializado solo se acepta si la interacción es
realmente distinta y comparte dominio/casos de uso.

## Criterios de aceptación futuros

- tests unitarios cubren ambos perfiles y fallback inválido;
- snapshots/component tests demuestran la misma operación de dominio;
- visual regression cubre KIDS/TEENS en móvil, tablet y escritorio;
- Axe/Playwright y prueba manual cubren teclado, foco, contraste, zoom y
  movimiento reducido;
- ninguna regla Laravel/Firestore consulta colores o decisiones de UI;
- no hay templates dominados por ramas completas KIDS/TEENS.

## Consecuencias

### Positivas

- La experiencia cambia de forma significativa sin duplicar producto ni
  seguridad.
- Audiencia, rol y nivel de gamificación permanecen claramente separados.
- Las restricciones conservadoras evitan publicar contenido de menores por
  defecto.

### Costes

- Se deberán retirar campos de color legacy de forma compatible.
- Contenido e interacción necesitarán pruebas por cada perfil y viewport.
- La habilitación futura de comunidad/comentarios KIDS requiere decisión de
  producto y privacidad explícita.

## Referencias

- `frontend-angular/src/app/core/dominio/nivel-alumno.ts`
- `frontend-angular/src/app/core/dominio/tema-portal-alumno.ts`
- `frontend-angular/src/styles/_tokens.scss`
- `docs/privacidad-kids-teens.md`
- `docs/portal-familias.md`
- [Angular: accesibilidad](https://angular.dev/best-practices/a11y)
- [WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
