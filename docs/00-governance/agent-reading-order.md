---
title: Orden de Lectura para Agentes
status: canonical
owner: governance
last_reviewed: 2026-08-06
applies_to: all
---
# Orden Obligatorio para Agentes

1. `/AGENTS.md`
2. `/docs/README.md`
3. `/docs/00-governance/project-constitution.md`
4. `/docs/00-governance/source-of-truth.md`
5. `/docs/00-governance/agent-reading-order.md`
6. Documento canónico del dominio asignado
7. ADR aplicables
8. Documentación activa de la iniciativa

**Para trabajo de producto:**
1. `/docs/10-product/product-overview.md` (canonical v1.0 — autoridad raíz del dominio)
2. `/docs/10-product/business-rules.md` (canonical v1.0 — catálogo de reglas)
3. Referencias específicas del portal o módulo (portal-alumno, portal-familias, gamificacion-xp-daemons, sistema-mascotas-cosmeticos)
4. ADR aplicables
5. Código y configuración para verificación

**Para trabajo visual:**
1. `/docs/30-design-system/visual-constitution.md`
2. `/docs/30-design-system/token-map.md`
3. `/docs/30-design-system/color-accessibility.md`
4. Documentación de la iniciativa concreta

## Reglas de autoridad

- **La Constitución General tiene autoridad global.** Todos los documentos
  de dominio deben respetarla; ningún documento puede contradecirla.
- **El sistema visual tiene autoridad únicamente visual.**
  `visual-constitution.md` es autoridad máxima solo dentro del dominio
  visual.
- **Los documentos históricos no son normativa.** Auditorías, handoffs y
  planes antiguos no se usan como especificación.
- **Los documentos futuros no se leen hasta que existan y sean aprobados.**
  Un documento anunciado en fases posteriores (`security-baseline.md`, etc.)
  no se considera autoridad antes de su publicación y aprobación.
  `product-overview.md` y `business-rules.md` ya son canónicos desde FND-3B.
- **Los documentos de portal no son autoridad superior.** Para tareas de
  producto, la jerarquía comienza con product-overview.md y
  business-rules.md; los documentos de portales y módulos son referencias
  técnicas activas.
- **Los agentes se detienen ante contradicción de autoridad.** Si dos
  fuentes del mismo nivel se contradicen o una contradice la Constitución,
  el agente se detiene y eleva el conflicto en lugar de resolverlo por
  cuenta propia.

**PROHIBICIÓN ESTRICTA:**
Prohibido usar como especificación:
- historial Git;
- `90-audits-history`;
- documentos eliminados;
- borradores no aprobados;
- conversaciones o memorias locales de otros agentes.
