---
title: Política de Documentación
status: canonical
owner: governance
last_reviewed: 2026-08-06
applies_to: all
---
# Documentation Policy

## 1. Propósito y alcance

Define cómo se crea, modifica, revisa y retira la documentación del
proyecto DAEMON. Obliga a personas y agentes que trabajen en el
repositorio. La jerarquía documental se apoya en la Constitución General
(`project-constitution.md`, Sección 17) y en `source-of-truth.md`.

## 2. Jerarquía documental

1. Constitución General (`status: canonical`, autoridad global).
2. Documento canónico del dominio.
3. ADR aceptado y vigente.
4. Referencia técnica verificada.
5. Iniciativa activa.
6. Auditoría o informe (no normativo).
7. Historial y archivo (no normativo).

Una fuente inferior no puede contradecir una superior. Ante conflicto del
mismo nivel, se detiene el trabajo y se eleva el conflicto.

## 3. Cuándo crear un documento

Crear un documento nuevo solo cuando:

- no exista ningún documento canónico para el dominio;
- el contenido no quepa como sección de un documento existente;
- exista una decisión de gobernanza que lo requiera.

Regla: **una fuente canónica por dominio.** No crear un archivo si una
sección de un documento existente es suficiente.

## 4. Cuándo ampliar un documento existente

Ampliar el documento existente cuando:

- el contenido pertenezca al mismo dominio;
- sea una sección natural del documento;
- no duplique autoridad.

Preferir ampliar antes que fragmentar.

## 5. Frontmatter obligatorio

Todo documento de `docs/` debe declarar:

- `title`;
- `status` (canonical, active, draft, superseded, archived, obsolete);
- `owner`;
- `last_reviewed`;
- `applies_to`;
- cuando corresponda: `normative`, `version`, `phase`,
  `approved_on`, `approvals`, `supersedes`.

El frontmatter es un contrato documental: describe la autoridad real del
documento.

## 6. Propiedad y revisión

- Todo canónico debe tener `owner`.
- Todo cambio normativo requiere revisión.
- Solo el propietario del dominio o el `project-owner` puede aprobar
  estados normativos.
- Ningún agente se autoaprueba cambios normativos.

## 7. Estados y transiciones

Ver `document-statuses.md` para la definición completa y las transiciones
permitidas. Reglas básicas:

- `draft` no autoriza implementación;
- `active` no significa autoridad única;
- `superseded` debe indicar el reemplazo;
- `archived` y `obsolete` no son normativa.

## 8. Sustitución, deprecación y archivo

- Un documento sustituido se marca `superseded` y apunta al reemplazo.
- Un documento retirado se archiva (`archived`) o se marca `obsolete`.
- Ningún documento histórico recupera autoridad por ser reciente.
- La deprecación se registra en el changelog del documento afectado y, si
  aplica, en el Gap Register.

## 9. Ramas y commits documentales

- Las tareas documentales usan ramas `docs/...` (p. ej.
  `docs/governance-topic-v1`).
- Se usa Conventional Commits con convención recomendada:
  `docs(scope): descripción imperativa`.

Ejemplos:

```text
docs(governance): activate project constitution v1
docs(product): draft global product definition v1
docs(architecture): document backend architecture
```

## 10. Enlaces y validaciones

Antes de cerrar una tarea documental:

- ejecutar `npm run check:docs`;
- ejecutar `git diff --check`;
- comprobar que los enlaces apuntan a rutas existentes y vigentes;
- no dejar referencias a documentos futuros como si existieran.

## 11. Documentación de iniciativas

- Las iniciativas (`80-initiatives/`) son temporales.
- Al cerrar una iniciativa, sus decisiones se consolidan en el canónico
  del dominio y el registro se archiva.
- La documentación de iniciativa no es normativa.

## 12. Prohibiciones

- No usar historial Git como documentación sustitutiva.
- No usar auditorías como especificación.
- No autoaprobar cambios normativos.
- No mezclar código y gobernanza en la misma tarea salvo autorización
  expresa.
- No crear documentos redundantes con autoridad duplicada.
- No declarar como existente un documento futuro.
