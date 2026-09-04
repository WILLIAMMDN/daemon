---
title: DAEMON Course MCP Foundation V1
status: active
normative: true
owner: Academic Core / MCP Foundation
last_reviewed: 2026-09-04
applies_to: DAEMON Authoring API / MCP Server
---

# DAEMON Course MCP Foundation V1

El servidor **DAEMON Course MCP** (`@daemon/course-mcp`) expone capacidades de autoría curricular estructurada mediante el protocolo Model Context Protocol (MCP). Opera como un adaptador liviano sobre la API canónica de autoría (`/api/v1/academico/studio`), permitiendo que asistentes de IA lean cursos, creen versiones en borrador, configuren hitos, experiencias, rúbricas y evidencias, y validen su preparación para publicación.

## Arquitectura

```text
MCP Client (Claude Desktop / Cursor / IDE)
    ↓ (stdio transport)
DAEMON Course MCP Server (`@daemon/course-mcp`)
    ↓ (HTTP Bearer Token - Sanctum)
Laravel Authoring API (`/api/v1/academico/studio`)
    ↓
Learning Core Domain (PostgreSQL / SQLite)
```

- **Transporte**: `stdio` local en V1. No expone puertos de red remotos.
- **Autoridad**: El backend Laravel sigue siendo la única autoridad de dominio, reglas pedagógicas y validación.
- **Sin modelo paralelo**: Los borradores creados vía MCP utilizan las mismas tablas y entidades que Course Studio (`versiones_curso`, `rutas_aprendizaje`, `hitos_aprendizaje`, `experiencias_aprendizaje`, `objetivos_aprendizaje`).

## Configuración

El servidor se configura exclusivamente mediante variables de entorno:

| Variable | Descripción | Ejemplo / Valor |
|---|---|---|
| `DAEMON_API_BASE_URL` | URL base de la API DAEMON (incluye `/api/v1`) | `http://127.0.0.1:8000/api/v1` o `https://daemon-5vo1.onrender.com/api/v1` |
| `DAEMON_MCP_TOKEN` | Token de servicio emitido por Sanctum | `<DAEMON_MCP_TOKEN>` |
| `DAEMON_MCP_TIMEOUT_MS` | Timeout opcional para peticiones HTTP (ms) | `30000` (por defecto) |
| `DAEMON_MCP_LOG` | Nivel de logging en stderr (`info` o `silent`) | `info` |

## Modelo de Tokens de Servicio

Para operar de forma headless sin requerir login interactivo de Firebase, DAEMON implementa tokens de servicio respaldados por Laravel Sanctum:

1. **Emisión**:
   ```bash
   php artisan autoria:token emitir --actor=ana-autora@daemon.test
   ```
2. **Seguridad**:
   - Se persisten únicamente como hashes SHA-256 en `personal_access_tokens`.
   - Cuentan con caducidad explícita (`expires_at`) independiente de la ventana de sesión de navegador.
   - Declaran los alcances mínimos `course:read` y `course:write`.
   - Se auditan a nivel de actor (docente o administrador institucional).
3. **Revocación**:
   ```bash
   php artisan autoria:token listar
   php artisan autoria:token revocar --id=1
   ```

## Herramientas Expuestas (V1 Tools)

### Lectura e Integración
- `get_authoring_catalog`: Devuelve catálogo canónico, tipos de experiencias, modalidades de evidencia, límites y actor autenticado.
- `list_courses`: Lista los cursos operables por el actor.
- `get_course`: Detalle de un curso con todas sus versiones.
- `get_course_version`: Árbol completo de la versión (rutas, hitos, experiencias, rúbricas, objetivos) y reporte de validación.

### Gestión de Borradores
- `create_draft_version`: Clona una versión existente (incluso publicada) a un nuevo borrador editable (`DRAFT`). La versión origen queda intacta.
- `update_draft_metadata`: Actualiza título, descripción, audiencia o dificultad del borrador.

### Estructura Curricular y Objetivos
- `create_objective`: Crea un objetivo de aprendizaje institucional.
- `update_objective`: Actualiza un objetivo de aprendizaje existente.
- `create_milestone`: Añade un hito a la ruta de aprendizaje del borrador.
- `update_milestone`: Actualiza metadatos u orden de un hito.
- `delete_milestone`: Elimina un hito y sus dependencias en un borrador.
- `set_milestone_prerequisites`: Define las dependencias secuenciales entre hitos (previene ciclos).
- `create_experience`: Crea una experiencia de aprendizaje con configuración multimodal de evidencias y rúbrica.
- `update_experience`: Modifica una experiencia existente en el borrador.
- `delete_experience`: Elimina una experiencia del borrador.
- `link_experience_objectives`: Asocia objetivos de aprendizaje a una experiencia.

### Creación de Cursos desde Cero
- `create_course`: Crea el contenedor institucional del curso.
- `create_course_version`: Crea la primera versión en borrador.
- `create_unit`: Añade una unidad curricular.
- `create_lesson`: Añade una lección dentro de una unidad.
- `create_learning_path`: Define la ruta pedagógica base.

### Validación
- `validate_course_version`: Ejecuta las reglas de validación en el servidor y devuelve `{ ready: boolean, errors: string[], warnings: string[] }`.

## Prohibición Estricta: Sin Publicación en V1

Por diseño y mandato pedagógico:
- **NO existe ninguna herramienta `publish_course_version`** en el servidor MCP.
- **El alcance `course:publish` está bloqueado en el backend** para tokens de servicio headless (`autoria:token` rechaza emitirlo, y los endpoints de publicación devuelven `403 Forbidden`).
- La publicación de un curso es un acto estrictamente humano realizado a través de **Course Studio** (`/docente/cursos/:id/version/:versionId`).

## Limitaciones de V1

- Solo soporta transporte `stdio` local.
- No reemplaza la interfaz docente para revisión de evidencias ni publicación.
- Los tokens no pueden modificar versiones en estado `published` (inmutabilidad estricta 409).

## Ejemplo de Configuración de Cliente stdio

Para clientes como Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "daemon-course-authoring": {
      "command": "node",
      "args": [
        "C:/laragon/www/daemon/mcp/course-server/dist/index.js"
      ],
      "env": {
        "DAEMON_API_BASE_URL": "http://127.0.0.1:8000/api/v1",
        "DAEMON_MCP_TOKEN": "<DAEMON_MCP_TOKEN>",
        "DAEMON_MCP_LOG": "info"
      }
    }
  }
}
```
