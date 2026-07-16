# DAEMON — Roadmap CRUD por módulo

Última actualización: 2026-07-06

Este documento describe el estado del CRUD en cada módulo del backend Laravel
y del frontend Angular, y qué commits/work está planeado para cerrar las
brechas detectadas.

## 1. Estado actual por módulo

| Módulo            | Backend C | Backend R | Backend U | Backend D | Frontend C | Frontend R | Frontend U | Frontend D |
| ----------------- | --------- | --------- | --------- | --------- | ---------- | ---------- | ---------- | ---------- |
| Misiones          | ✅        | ✅        | ✅        | ✅        | ✅         | ✅         | ❌         | ❌         |
| Tienda premios    | ✅        | ✅        | ✅        | ✅        | ✅         | ✅         | ❌         | ❌         |
| Evaluaciones      | ✅        | ✅        | ✅        | ✅        | ✅         | ✅         | ❌         | ❌         |
| Insignias         | ✅        | ✅        | ✅        | ✅        | ✅         | ✅         | ❌         | ❌         |
| Aulas             | ✅        | ✅        | ❌        | ❌        | ❌         | parcial    | ❌         | ❌         |
| Cuentos (admin)   | ❌        | ❌        | ❌        | ❌        | ❌         | ❌         | ❌         | ❌         |
| Cuentos (alumno)  | ✅        | ✅        | parcial   | ❌        | ✅         | ✅         | parcial    | ❌         |
| Chatbot bot       | ✅        | ✅        | parcial   | ❌        | ✅         | ✅         | parcial    | ❌         |
| Certificados      | ❌        | ✅        | ❌        | ❌        | ❌         | ✅         | ❌         | ❌         |
| Comunidad         | ❌        | parcial   | ❌        | ❌        | ❌         | ✅         | ❌         | ❌         |
| Ranking           | ❌        | ✅        | ❌        | ❌        | ❌         | ✅         | ❌         | ❌         |

Leyenda: ✅ listo · ❌ falta · parcial hay parte pero incompleto.

## 2. Decisiones de diseño

- **No inventar la rueda**: si un módulo docente ya tiene `gestionar-*` con
  patrón crear + listar, se reutiliza el mismo estilo y los componentes
  compartidos `Cargando`, `EstadoVacio`, `MediaUploader`. No se hacen
  componentes CRUD genéricos nuevos.
- **Backend es la autoridad**: cualquier endpoint nuevo del frontend debe
  pasar primero por Laravel, con FormRequest, validación, alcance académico y
  tests feature.
- **Alcance académico**: los endpoints de docente siguen limitados por
  `AcademicScopeService` (aulas asignadas al docente logueado). Ningún
  endpoint nuevo puede saltarse esa restricción.
- **Imágenes**: cualquier upload pasa por `ArchivoService` que valida MIME,
  tamaño y resuelve URL pública vía `ArchivoUrlService`. La UI reutiliza
  `MediaUploader`.

## 3. Plan de cierre (orden de commits)

1. docs: este roadmap.
2. docs: API CRUD documentada por módulo.
3. feat(docente service): agregar `actualizarAula`, `eliminarAula`,
   `actualizarInsignia`, `eliminarInsignia` para no exponer HTTP directo en
   componentes.
4. feat(backend aulas): CRUD completo (PUT/DELETE) con validación y alcance.
5. feat(backend cuentos admin): CRUD protegido `role:docente,admin`.
6. feat(backend tienda): filtros por `q`, `categoria`, `tipo_entrega`,
   `stock` en premios y canjes.
7. feat(backend evaluaciones): endpoint `POST /evaluaciones/{id}/publicar`
   con cambio de estado `borrador → activa → cerrada`.
8. feat(backend misiones): bulk delete con validación de alcance.
9. test(backend misiones): feature tests CRUD.
10. test(backend tienda): feature tests CRUD premios.
11. test(backend aulas): feature tests CRUD.
12. fix(api.ts frontend): interceptor que limpia sesión y redirige a login
    cuando recibe 401.
13. fix(activos service): fallback seguro a medallón DAEMON cuando la URL
    resuelta viene vacía o rota.
14. feat(cuentos service admin): métodos para CRUD protegido.
15. feat(gestionar-misiones UI): edición inline + borrar con confirmación.
16. feat(gestionar-tienda UI): edición de premios + búsqueda.
17. feat(gestionar-insignias UI): edición + reemplazo de imagen.
18. feat(gestionar-evaluacion UI): edición + alternar publicación.
19. feat(gestionar-aulas UI): nueva página CRUD completa.
20. feat(gestionar-cuentos UI): nueva página admin CRUD.
21. fix(uploads backend): validación mime más estricta (rechaza webp animado
    sospechoso y pdfs sin magic bytes).
22. fix(auth frontend): logout automático cuando Sanctum responde 419.
23. docs(setup): quickstart para nuevos devs.
24. docs(changelog): changelog con todos los cambios de esta tanda.
25. chore(.env.example): documentar nuevas variables opcionales.

## 4. Reglas para commits siguientes

- Cada commit que toque backend incluye al menos un test o verificación
  manual documentada en el mensaje del commit.
- Cada commit que toque frontend no rompe `npm run build` (los warnings de
  bundle >700kB y `@rive-app/canvas` CommonJS siguen siendo conocidos y no
  son bloqueantes).
- Si un commit depende de uno anterior, se hace un commit de "wip" chico
  antes para mantener el historial legible.

## 5. Componentes compartidos que se reutilizan

```text
frontend-angular/src/app/shared/componentes/cargando/
frontend-angular/src/app/shared/componentes/estado-vacio/
frontend-angular/src/app/shared/componentes/media-uploader/
frontend-angular/src/app/core/layouts/sidebar-portal/
```

Estos componentes ya están probados en producción; cualquier CRUD nuevo los
importa y los usa. No se duplica lógica visual ni se crea un `<crud-generico>`
que luego termine siendo más rígido que copiar el patrón `gestionar-X`.
