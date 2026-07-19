# Handoff de Codex a Antigravity

Actualizado: 19 de julio de 2026.

## Base compartida

- Producción funcional: `2d76c4558149a48b6b4f91013dc00d6e1afe2ce4`.
- `origin/main` al iniciar la integración: `55cbd75fd64a2cc529bfacbdfafb97357511f656`.
- Rama de revisión Codex: `codex/antigravity-integration`.

## Revisión de entregas existentes

Codex incorporó para revisión los commits originales:

- `ace627c`: desafíos;
- `6928bcf`: recursos/cursos;
- `4c22d2a`: perfil.

Se conservaron sus objetivos visuales, pero se corrigieron radios fuera del
sistema, movimientos decorativos, controles menores de 40 px, pérdida de
semántica, falta de skeleton, privacidad de correo, imágenes rotas y la
presentación incompleta de la recompensa dual XP/DAEMONS. La QA real también
detectó y corrigió los iconos de perfil que no estaban registrados.

La eliminación de la ficha redundante de usuario del sidebar está aprobada. No
debe revertirse; el enlace de navegación `Mi perfil` permanece. Codex integró
la decisión migrando el paso del tour a `#topbar-perfil`.

## Cambio no aceptado

No entregar el cambio local de `token-interceptor.ts` que conserva una sesión
ante un `401` protegido. Un `401` significa que la autenticación dejó de ser
válida; la autorización insuficiente debe expresarse como `403`. Ese archivo
queda fuera del alcance visual.

## Lote en cuarentena

Los commits `047f6ce` a `4f7f29c` no están autorizados para integración. El
lote cambia 78 archivos y mezcla tienda, mascota, evaluaciones, competencia,
cuentos, ranking, comunidad, laboratorio, certificados, herramientas, misiones
y chatbot sin handoff por módulo.

La auditoría de adiciones encontró, como mínimo, 26 degradados Tailwind, 16
degradados radiales, 12 usos de `backdrop-blur`, 10 desplazamientos verticales
en hover y 106 radios arbitrarios de 20 px o más. Esto contradice el sistema
visual vigente y no puede corregirse con una aprobación global. Cada módulo
debe rehacerse y entregarse en un commit independiente con los gates y estados
documentados.

## Próxima tarea sugerida para Antigravity

Rehacer un único módulo —ranking o tienda, no ambos— desde la base común actual.
Preservar todas sus acciones y preparar los cinco estados de UI. No partir del
lote en cuarentena ni tocar panel, perfil, recursos, desafíos, sidebar, topbar,
interceptor, rutas o estilos globales hasta recibir un nuevo handoff.
