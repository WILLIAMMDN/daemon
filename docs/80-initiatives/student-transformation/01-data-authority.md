---
title: Paquete 1: arquitectura y autoridad de datos
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Paquete 1: arquitectura y autoridad de datos

- Estado: Paquete 1 completado; gate E2E aplazado de forma segura al Paquete 2
- Fecha: 2026-08-02
- Rama: `refactor/student-production-hardening`
- Cambios productivos: ninguno

## Objetivo

Eliminar la ambigüedad arquitectónica antes de modificar reglas, datos o UI:
una fuente canónica por entidad, un límite verificable para Firestore, una
transición compatible de cuentos, una abstracción de Storage, una sola
experiencia configurable KIDS/TEENS y entornos aislados por diseño.

## Diagnóstico comprobado

- Firebase Auth ya es el proveedor de identidad y Laravel entrega la sesión de
  aplicación/Sanctum.
- PostgreSQL es autoridad de negocio, pero cuentos también conserva endpoints,
  modelo y consumidores activos en Laravel.
- Angular crea, lee, actualiza y elimina cuentos directamente en Firestore.
- El ownership Firestore mezcla Firebase UID con el ID numérico de Laravel.
- Comentarios y reacciones actuales no acreditan ownership por UID; las reglas
  del worktree aceptan escrituras demasiado amplias.
- La galería contiene una migración ejecutable desde el navegador contra URLs
  productivas.
- Storage tiene un adaptador concreto acoplado a Supabase/fetch y paths. Las
  policies versionadas permiten escritura server-role, no demuestran un flujo
  directo seguro con anon key/Firebase UID.
- Desarrollo y `cloud` reutilizan recursos productivos; staging no está
  demostrado como entorno provisionado y aislado.
- KIDS/TEENS ya existen como niveles y temas, pero aún no como un contrato de
  experiencia completo.

## Decisiones cerradas

| ADR                                                 | Decisión                                                                                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [ADR-001](../../20-architecture/adr/ADR-001-autoridad-de-datos.md)     | Firebase Auth identifica; Laravel/PostgreSQL gobierna negocio; Firestore gobierna cuentos; Supabase Storage conserva binarios.          |
| [ADR-002](../../20-architecture/adr/ADR-002-dominio-cuentos.md)        | Cuentos adopta Firestore como autoridad única mediante strangler sin eliminar endpoints ni hacer dual-write.                            |
| [ADR-003](../../20-architecture/adr/ADR-003-autorizacion-firestore.md) | UID, reglas deny-by-default y servidor para transiciones privilegiadas; App Check solo defensa adicional.                               |
| [ADR-004](../../20-architecture/adr/ADR-004-abstraccion-storage.md)    | `RepositorioActivosCuento` desacopla proveedor; Supabase se preserva, Firebase queda preparado y los writes se autorizan desde Laravel. |
| [ADR-005](../../20-architecture/adr/ADR-005-experiencia-kids-teens.md) | Una sola app con perfil tipado KIDS/TEENS y publicación conservadora para menores.                                                      |
| [ADR-006](../../20-architecture/adr/ADR-006-entornos.md)               | Local, test, staging y producción no comparten autoridades; cualquier mezcla falla cerrada.                                             |

## Criterios de aceptación del paquete

- [x] Existen ADR-001 a ADR-006.
- [x] ADR-001 asigna autoridad, lectores, escritores y tiempo real a todas las
      entidades requeridas.
- [x] ADR-002 resuelve autoridad, IDs, borradores, publicación, visibilidad,
      comentarios, reacciones, moderación, eliminación, auditoría y migración.
- [x] Se inventariaron endpoints y consumidores conocidos antes de plantear su
      retiro.
- [x] Se documentó la elección de subcolecciones frente a colecciones globales.
- [x] No se introduce dependencia de Cloud Functions/Blaze.
- [x] La anon key de Supabase no se trata como secreto; se evalúan RLS y vínculo
      de identidad real.
- [x] Las referencias técnicas importantes enlazan documentación oficial
      actual.
- [x] No se ejecutaron migraciones, deploys, E2E inseguros ni escrituras de
      datos.
- [x] Build/TypeScript, Jest, arquitectura, tokens, contrato visual y Laravel
      están verdes después de completar el refactor local que bloqueaba el gate.
- [ ] E2E crítico: se mantiene bloqueado hasta que el Paquete 2 sustituya las
      conexiones productivas por emuladores y fixtures sintéticos.

## Orden de implementación resultante

1. Paquete 2: aislar entornos y crear el guard de seguridad.
2. Paquete 3: versionar/probar reglas e índices en Emulator Suite.
3. Paquete 4: refactorizar cuentos por dominio/aplicación/acceso a datos/UI.
4. Implementar Storage, migración y moderación únicamente sobre entornos
   aislados, con dry-run y compatibilidad.

La puerta de build y pruebas locales quedó restablecida. El Paquete 2 es el
siguiente trabajo autorizado; sus E2E solo se ejecutarán después de demostrar
el aislamiento, nunca contra `start:cloud` ni servicios productivos.

## Verificación local

| Comando                                                    | Resultado                       | Evidencia                                                                                            |
| ---------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run build`                                            | Correcto con warnings conocidos | TypeScript/Angular compilan; initial 1.28 MB y SCSS de editor 34.72 kB exceden warnings, no errores. |
| `npm run test:ci`                                          | Correcto                        | 22 suites y 77 pruebas; arquitectura, style tokens y contrato visual aprobados.                      |
| `php artisan test` con `APP_ENV=testing`/SQLite `:memory:` | Correcto                        | 134 pruebas y 475 aserciones.                                                                        |
| `php vendor/bin/pint --test ...`                           | Correcto                        | Request y servicio Laravel modificados cumplen formato.                                              |
| `npx prettier --check ...`                                 | Correcto                        | ADR, informe y TypeScript modificados formateados.                                                   |
| E2E                                                        | No ejecutado                    | `start:cloud` alcanza producción; se bloquea hasta completar aislamiento/emuladores.                 |

## Riesgos pendientes

- Credencial de proveedor IA expuesta en código histórico: requiere revocación,
  rotación y eliminación coordinada sin registrar el valor.
- Entornos local/cloud conectados a producción.
- Reglas Firestore actuales sin tests y demasiado permisivas para contenido
  social.
- Adaptador Firestore confiable para Laravel todavía no existe.
- Datos de cuentos activos en PostgreSQL/Firestore necesitan inventario y
  reconciliación antes del corte.
- El build conserva advertencias de presupuesto: initial 1.28 MB frente al
  warning de 1 MB y `crear-cuento.scss` 34.72 kB frente a 32 kB. No se atribuye
  mejora de rendimiento y se debe investigar antes del cierre productivo.
- La cobertura global es 71.68 % statements/49.76 % branches. La nueva capa IA
  alcanza 74.19 % statements, pero el repositorio Firestore legado de cuentos
  continúa en 7.84 %, muy por debajo del objetivo del módulo.

## Referencias

- [Baseline](00-baseline.md)
- [Resultados de comandos](00-command-results.md)
- [Firebase: modelo de datos](https://firebase.google.com/docs/firestore/data-model)
- [Firestore: mejores prácticas](https://firebase.google.com/docs/firestore/best-practices)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
