# Plan de migración híbrida — DAEMON Aula (Firestore)

> Documento ejecutable para un agente. Si lo lee y no necesita preguntar, está bien escrito.
>
> **Objetivo:** agregar un módulo `aula/` dentro de DAEMON que cumpla los criterios del curso
> (Auth, Datos, Formularios, Navegación, UI) usando **Firestore como capa de datos**, sin
> romper la integración existente con Laravel/Supabase que alimenta gamificación, familias y demás.

---

## 1. Contexto

DAEMON es un proyecto Angular que ya tiene:
- Firebase Auth integrado y funcionando (login, Google, recuperación, verificación).
- Guards (`auth-guard`, `docente-guard`, `alumno-guard`, `tutor-guard`).
- 4 roles: alumno, docente, admin, tutor.
- Backend Laravel en Render consumiendo Supabase PostgreSQL.
- **NO usa Firestore en ningún archivo del frontend** (verificado: 0 imports).
- Interfaces TypeScript con `id: number` (típico de SQL), no `uid: string`.

El curso de Programación Web exige **Cloud Firestore** para las colecciones
`usuarios / cursos / misiones / entregas`. La estrategia es **híbrida**:
- Lo que el curso exige → **Firestore** dentro de un módulo nuevo `features/aula/`.
- El resto de DAEMON (gamificación, familia, tienda, cuentos, ranking) → **Laravel/Supabase** como está.

Esto da: curso cumplido + proyecto real presentado + cero daño a producción.

---

## 2. Estado actual confirmado

| Pieza | Estado | Archivo |
|---|---|---|
| Firebase Auth (SDK directo) | ✅ Listo | `core/servicios/firebase-auth.ts` |
| Guards | ✅ Listos | `core/guards/{auth,docente,alumno,tutor}-guard.ts` |
| Lazy loading / preloading selectivo | ✅ Listo | `core/servicios/selective-preloading.strategy.ts` |
| Formularios reactivos | ✅ En uso | `app/features/**/pages/*` |
| HttpClient hacia Laravel | ✅ Listo | `core/servicios/api.ts` |
| Sesión basada en `signal` | ✅ Lista | `core/servicios/sesion.ts` |
| Rutas existentes | `/alumno`, `/docente`, `/familias` | `app/app.routes.ts` |
| Firestore | ❌ No inicializado | — |
| `@angular/fire` | ❌ No instalado (intencional: SDK directo) | `package.json` |
| 4 colecciones del spec en Firestore | ❌ No existen | — |
| Interfaces con `uid: string` | ❌ Usan `id: number` | `features/misiones/services/mision.ts` |

**No se debe tocar nada de lo marcado con ✅.** El módulo Aula se construye al lado.

---

## 3. Decisiones de arquitectura

### D-1. Módulo nuevo `features/aula/`
No modificamos los servicios existentes (`Mision`, `Docente`, `Alumno`, etc.).
Creamos un módulo paralelo con sus propias interfaces, servicios y páginas.

### D-2. Firestore via SDK directo (no `@angular/fire`)
Ya está el patrón. Reusamos `firebase/app` y agregamos `firebase/firestore`.
Esto evita instalar una dependencia más y mantiene la coherencia.

### D-3. Auth compartida
El usuario se autentica con Firebase Auth (ya funciona). Firestore Rules usan
`request.auth.uid` y `request.auth.token` para autorizar. **No se inventa un login
nuevo para Aula** — se reusa el login existente y se redirige a `/aula/*` después.

### D-4. Roles desde Firestore
El documento `usuarios/{uid}` en Firestore tiene el campo `rol`. Las reglas validan
que `request.auth.token.rol` o el doc coincida. Para simplificar, **el `rol` se
lee del doc de Firestore en el cliente** y se cachea en memoria. (Los custom claims
de Firebase son ideales pero requieren Cloud Functions — fuera de alcance.)

### D-5. UI
- Reusar `core/layouts/layout-publico` y `core/layouts/layout-alumno` como base.
- Crear `core/layouts/layout-aula` simple (header + sidebar minimal + outlet).
- Estilos: tokens existentes (`src/styles/_tokens.scss`) + Tailwind utilities.
- NO inventar componentes nuevos del design system — usar lo que hay.

### D-6. Rutas
Prefijo `/aula/...` para no chocar con las rutas existentes de DAEMON.
- `/aula/login` — reutiliza el login existente (no crear uno nuevo, solo redirigir)
- `/aula/inicio` — dashboard del Aula
- `/aula/perfil`
- `/aula/admin` — gestión de usuarios (mínimo)
- `/aula/cursos` — lista (docente y estudiante)
- `/aula/cursos/nuevo` — crear (solo docente)
- `/aula/cursos/:cursoId` — detalle
- `/aula/cursos/:cursoId/editar` — solo docente dueño
- `/aula/cursos/:cursoId/misiones` — lista de misiones del curso
- `/aula/misiones` — todas las misiones visibles (filtradas por rol)
- `/aula/misiones/:misionId` — detalle
- `/aula/misiones/:misionId/entregar` — solo estudiante
- `/aula/misiones/:misionId/calificar` — solo docente dueño
- `/aula/entregas` — entregas del docente o del estudiante
- `/aula/progreso` — solo estudiante

### D-7. Proyecto Firebase
- **Reusar `daemon-a41f8`** para empezar (ya tiene Auth configurado).
- Si el docente lo va a ver en vivo, considerar crear un proyecto nuevo
  `daemon-aula-sustentacion` para no tocar el de producción. **Decisión del dueño.**

---

## 4. Modelo de datos de Firestore

### 4.1 `usuarios/{uid}`

```ts
interface UsuarioAula {
  uid: string;              // = request.auth.uid
  nombres: string;
  correo: string;
  rol: 'admin' | 'docente' | 'estudiante';
  activo: boolean;
  fechaCreacion: Timestamp;  // serverTimestamp()
  // Opcionales, no rompen el spec
  avatarUrl?: string;
}
```

### 4.2 `cursos/{cursoId}`

```ts
interface CursoAula {
  id: string;               // = doc.id
  titulo: string;
  descripcion: string;
  docenteId: string;        // uid del docente creador
  publicado: boolean;
  fechaCreacion: Timestamp;
  fechaActualizacion: Timestamp;
  // Auxiliar opcional para el demo
  imagenPortadaUrl?: string;
  estudiantesIds?: string[]; // para "asignar" estudiantes
}
```

### 4.3 `misiones/{misionId}`

```ts
interface MisionAula {
  id: string;
  cursoId: string;
  titulo: string;
  instrucciones: string;
  puntos: number;           // 0..100
  fechaLimite: Timestamp;
  estado: 'borrador' | 'publicada' | 'cerrada';
  fechaCreacion: Timestamp;
}
```

### 4.4 `entregas/{entregaId}`

```ts
interface EntregaAula {
  id: string;
  misionId: string;
  estudianteId: string;
  respuesta: string;        // texto, URL o JSON con archivos
  estado: 'entregada' | 'en_revision' | 'aprobada' | 'observada';
  calificacion: number | null;  // 0..puntos
  observacion: string;       // comentario del docente
  fechaEntrega: Timestamp;
  fechaRevision: Timestamp | null;
}
```

### 4.5 Sub-campo auxiliar (opcional, recomendado)

`cursos/{cursoId}/estudiantes/{estudianteId}` — para asignaciones. Si se prefiere,
se maneja con un array `estudiantesIds` en el doc del curso. **Más simple el array.**

---

## 5. Reglas de seguridad de Firestore (borrador inicial)

> El agente debe **revisar y endurecer** antes de cerrar la fase 4.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function autenticado() {
      return request.auth != null;
    }
    function miDoc(uid) {
      return get(/databases/$(database)/documents/usuarios/$(uid));
    }
    function soyYo(uid) {
      return autenticado() && request.auth.uid == uid;
    }
    function rolEs(rol) {
      return autenticado()
        && miDoc(request.auth.uid).data.rol == rol
        && miDoc(request.auth.uid).data.activo == true;
    }
    function soyAdmin() { return rolEs('admin'); }
    function soyDocente() { return rolEs('docente'); }
    function soyEstudiante() { return rolEs('estudiante'); }

    match /usuarios/{uid} {
      allow read: if autenticado() && (soyYo(uid) || soyAdmin() || soyDocente());
      // Solo el propio usuario o un admin pueden modificarlo.
      // Y NADIE se puede auto-asignar rol=admin.
      allow create: if soyYo(uid)
        && request.resource.data.rol in ['docente', 'estudiante'];
      allow update: if (soyYo(uid) || soyAdmin())
        && request.resource.data.rol == resource.data.rol;
      allow delete: if soyAdmin();
    }

    match /cursos/{cursoId} {
      allow read: if autenticado() && (
        resource.data.publicado == true
        || resource.data.docenteId == request.auth.uid
        || soyAdmin()
      );
      allow create: if soyDocente()
        && request.resource.data.docenteId == request.auth.uid
        && request.resource.data.titulo.size() >= 3
        && request.resource.data.titulo.size() <= 120;
      allow update, delete: if resource.data.docenteId == request.auth.uid || soyAdmin();
    }

    match /misiones/{misionId} {
      allow read: if autenticado() && (
        soyAdmin()
        || get(/databases/$(database)/documents/cursos/$(resource.data.cursoId)).data.docenteId == request.auth.uid
        || soyEstudiante()
      );
      allow create: if soyDocente()
        && get(/databases/$(database)/documents/cursos/$(request.resource.data.cursoId)).data.docenteId == request.auth.uid;
      allow update, delete: if get(/databases/$(database)/documents/cursos/$(resource.data.cursoId)).data.docenteId == request.auth.uid
        || soyAdmin();
    }

    match /entregas/{entregaId} {
      allow read: if autenticado() && (
        resource.data.estudianteId == request.auth.uid
        || soyAdmin()
        || soyDocente()
      );
      // El estudiante crea su propia entrega, no la puede modificar después
      // (solo el docente la modifica al calificar).
      allow create: if soyEstudiante()
        && request.resource.data.estudianteId == request.auth.uid
        && request.resource.data.estado == 'entregada'
        && request.resource.data.calificacion == null;
      allow update: if soyDocente()
        && get(/databases/$(database)/documents/misiones/$(resource.data.misionId)).data.cursoId in
            [/* cursos del docente */]
        && request.resource.data.calificacion == null
           || request.resource.data.calificacion >= 0;
      allow delete: if soyAdmin();
    }
  }
}
```

> **El agente debe simplificar la regla de `update` en `entregas`** y agregar la
> validación "estudiante no puede crear 2 entregas para la misma misión" usando
> una query previa o un campo derivado. La versión final se prueba manualmente.

---

## 6. Plan de ejecución por fases (para el agente)

Cada fase termina con `npm run build` verde.

### FASE 0 — Setup (30 min)

1. Crear rama: `git checkout -b sustentacion/firestore-aula`
2. Verificar que el build actual pasa: `npm run build` (registrar tiempo base).
3. Crear estructura de carpetas:
   ```
   src/app/features/aula/
   src/app/features/aula/models/
   src/app/features/aula/services/
   src/app/features/aula/pages/
   src/app/features/aula/guards/   (si hace falta un guard extra)
   src/app/core/layouts/layout-aula/
   src/app/core/servicios/firestore-app.ts   (proveedor global de Firestore)
   ```
4. **No instalar `@angular/fire`** — usar SDK directo.
5. Crear `core/servicios/firestore-app.ts`:
   ```ts
   import { Injectable } from '@angular/core';
   import { Firestore, getFirestore } from 'firebase/firestore';
   import { FirebaseApp } from 'firebase/app';

   @Injectable({ providedIn: 'root' })
   export class FirestoreApp {
     private _db: Firestore | null = null;
     init(app: FirebaseApp): Firestore {
       this._db = getFirestore(app);
       return this._db;
     }
     db(): Firestore {
       if (!this._db) throw new Error('Firestore no inicializado.');
       return this._db;
     }
   }
   ```
6. En `firebase-auth.ts`, exponer el `FirebaseApp` (o crear un nuevo `FirebaseAppProvider`).
7. En `app.config.ts`, agregar el provider que inicializa Firestore al arrancar.

**Aceptación:** `npm run build` verde, la app arranca sin errores.

---

### FASE 1 — Modelos TypeScript (30 min)

Crear los 4 archivos en `features/aula/models/`:
- `usuario-aula.model.ts`
- `curso.model.ts`
- `mision.model.ts`
- `entrega.model.ts`

Pegar las interfaces de la sección 4 tal cual. Agregar tipos auxiliares:
- `EstadoMision = 'borrador' | 'publicada' | 'cerrada'`
- `EstadoEntrega = 'entregada' | 'en_revision' | 'aprobada' | 'observada'`
- `RolAula = 'admin' | 'docente' | 'estudiante'`

**Aceptación:** `npm run build` verde.

---

### FASE 2 — Servicios Firestore (1.5 h)

Crear en `features/aula/services/`:

- `usuario-aula.service.ts`
  - `obtener(uid): Promise<UsuarioAula | null>`
  - `crear(uid, datos): Promise<void>` (al registrarse)
  - `actualizar(uid, datos): Promise<void>`
  - `listarTodos(): Observable<UsuarioAula[]>` (solo admin)
  - `toggleActivo(uid, activo): Promise<void>` (solo admin)

- `curso.service.ts`
  - `listar(filtro?): Observable<CursoAula[]>`
  - `obtener(cursoId): Observable<CursoAula | undefined>`
  - `crear(datos): Promise<string>` (devuelve el id)
  - `actualizar(cursoId, datos): Promise<void>`
  - `eliminar(cursoId): Promise<void>`
  - `togglePublicado(cursoId): Promise<void>`

- `mision.service.ts`
  - `listarPorCurso(cursoId): Observable<MisionAula[]>`
  - `listarPorDocente(docenteId): Observable<MisionAula[]>`
  - `obtener(misionId): Observable<MisionAula | undefined>`
  - `crear(datos): Promise<string>`
  - `actualizar(misionId, datos): Promise<void>`
  - `eliminar(misionId): Promise<void>`
  - `cambiarEstado(misionId, estado): Promise<void>`

- `entrega.service.ts`
  - `listarPorMision(misionId): Observable<EntregaAula[]>`
  - `listarPorEstudiante(estudianteId): Observable<EntregaAula[]>`
  - `listarPorDocente(docenteId): Observable<EntregaAula[]>` (consulta indirecta)
  - `obtener(entregaId): Observable<EntregaAula | undefined>`
  - `entregar(misionId, datos): Promise<string>` (validar no duplicado)
  - `calificar(entregaId, datos): Promise<void>` (solo docente)
  - `yaEntrego(misionId, estudianteId): Promise<boolean>` (validación cliente)

**Patrón recomendado para todos:**
- Usar `collectionData()` de `firebase/firestore` para observables.
- Conversión de Timestamp → Date con `firestore.Timestamp`.
- Try/catch con mensajes legibles.
- Inyectar `FirestoreApp` para obtener `db()`.

**Aceptación:** `npm run build` verde.

---

### FASE 3 — Reglas de Firestore (1.5 h)

1. Crear `firestore.rules` en la raíz de `frontend-angular/`.
2. Pegar el borrador de la sección 5.
3. **Validar manualmente** cada regla con `firebase emulators:start --only firestore`.
4. Probar estos casos:
   - Estudiante A lee su propia entrega ✅
   - Estudiante A lee la entrega de Estudiante B ❌ (debe fallar)
   - Docente X lee entregas de Docente Y ❌ (debe fallar, salvo admin)
   - Estudiante modifica su entrega ya calificada ❌
   - Nadie puede crearse `rol: 'admin'` ❌
5. Documentar la versión final en `firestore.rules` con comentarios por sección.

**Aceptación:** reglas desplegadas (o lista para deploy).

---

### FASE 4 — Páginas: cursos (2 h)

Crear en `features/aula/pages/cursos/`:

- `lista-cursos/` — tabla + filtros + botón "Nuevo" (solo docente)
- `detalle-curso/` — muestra info + lista de misiones del curso
- `crear-curso/` — reactive form (FormBuilder, Validators: required, minLength 3, maxLength 120, descripcion required)
- `editar-curso/` — mismo form, cargado con datos
- `mis-cursos/` (estudiante) — cursos publicados en los que está matriculado

Form de curso (TypeScript):
```ts
this.form = this.fb.group({
  titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
  descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  publicado: [false],
});
```

**Aceptación:** un docente puede crear/editar/eliminar un curso y verlo en la lista.

---

### FASE 5 — Páginas: misiones (2 h)

Crear en `features/aula/pages/misiones/`:

- `lista-misiones/` — todas las misiones visibles (filtradas por rol)
- `detalle-mision/` — muestra info + botón "Entregar" (estudiante) o "Ver entregas" (docente)
- `crear-mision/` — form reactivo
- `editar-mision/` — form con datos cargados
- `lista-misiones-curso/` — misiones de un curso (anidada en curso)

Form de misión:
```ts
this.form = this.fb.group({
  titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
  instrucciones: ['', [Validators.required, Validators.minLength(10)]],
  puntos: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
  fechaLimite: [null, [Validators.required, fechaFuturaValidator]],
  estado: ['borrador', Validators.required],
});
```

**Validador custom `fechaFuturaValidator`:**
```ts
fechaFuturaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const fecha = control.value instanceof Date ? control.value : new Date(control.value);
  if (isNaN(fecha.getTime())) return { fechaInvalida: true };
  return fecha.getTime() < Date.now() ? { fechaPasada: true } : null;
}
```

**Aceptación:** el docente puede crear una misión en un curso propio, el estudiante la ve.

---

### FASE 6 — Páginas: entregas (1.5 h)

Crear en `features/aula/pages/entregas/`:

- `entregar/` (estudiante) — form con `respuesta` (textarea), valida que no haya entregado antes
- `calificar/` (docente) — form con `calificacion` (0..puntos), `observacion`, cambia estado a 'aprobada' u 'observada'
- `lista-entregas/` (docente) — todas las entregas de sus cursos
- `mis-entregas/` (estudiante) — sus entregas con estado

Form de entrega (estudiante):
```ts
this.form = this.fb.group({
  respuesta: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
});
```

Form de calificación (docente):
```ts
this.form = this.fb.group({
  calificacion: [null, [Validators.required, Validators.min(0), Validators.max(this.mision.puntos)]],
  observacion: ['', [Validators.required, Validators.minLength(5)]],
  estado: ['aprobada', Validators.required], // 'aprobada' | 'observada'
});
```

**Aceptación:** el estudiante entrega, el docente califica, el estudiante ve el cambio.

---

### FASE 7 — Páginas restantes (1.5 h)

- `pages/inicio/` — dashboard del Aula (3 variantes por rol)
- `pages/perfil/` — ver/editar nombre y avatar
- `pages/admin/` (solo admin) — lista de usuarios + toggle activo
- `pages/progreso/` (estudiante) — tabla simple de sus misiones con estado

---

### FASE 8 — Routing + guards (1 h)

1. Crear `features/aula/aula.routes.ts` con todas las rutas de la sección 3-D-6.
2. Usar `loadChildren` para lazy loading.
3. Reusar `authGuard` y crear si hace falta:
   - `aulaDocenteGuard` — solo `rol === 'docente'`
   - `aulaEstudianteGuard` — solo `rol === 'estudiante'`
   - `aulaAdminGuard` — solo `rol === 'admin'`
4. En `app.routes.ts`, agregar:
   ```ts
   {
     path: 'aula',
     loadChildren: () => import('./features/aula/aula.routes').then(m => m.AULA_ROUTES),
   }
   ```
5. Actualizar `Sesion.rutaInicio()` o crear un redirect post-login a `/aula/inicio` cuando el usuario tiene el flag `enAula: true` (opcional, no crítico).

---

### FASE 9 — Seed de datos demo (1 h)

Opción A (recomendada): botón "Cargar datos demo" en `/aula/admin` (solo admin).
Opción B: script Node `scripts/seed-aula.mjs` que usa `firebase-admin`.

Datos a crear:
- 3 usuarios en Firebase Auth + docs `usuarios/{uid}`:
  - `admin-aula@demo.local` (rol: admin)
  - `docente-aula@demo.local` (rol: docente)
  - `estudiante-aula@demo.local` (rol: estudiante)
- 1 curso "Matemáticas 2026-I" del docente
- 2 misiones:
  - "Suma de fracciones" (publicada, puntos: 20, fechaLimite: +7 días)
  - "Geometría básica" (borrador)
- 1 entrega del estudiante en la primera misión (estado: entregada)

**Reglas de password:** no aplicar. En Auth SDK se puede crear el usuario con un password cualquiera y luego forzar cambio. Para el demo, dejar `Demo1234!` y documentarlo en el README.

**Aceptación:** las 3 cuentas existen, hacen login y ven los datos correctos.

---

### FASE 10 — Build, fix y tests (2 h)

1. `npm run build` — corregir errores TS hasta que pase.
2. `npm run test:ci` — agregar al menos 1 test unitario por servicio crítico.
3. Correr el script de architecture y style-tokens:
   - `npm run check:architecture`
   - `npm run check:style-tokens`
4. Pruebas manuales del flujo crítico (ver sección 8).
5. Capturas de pantalla de los flujos para el README.

---

### FASE 11 — Documentación (1 h)

1. `docs/sustentacion-2026/README-AULA.md`:
   - Instalación
   - `ng build` y deploy
   - Cuentas demo (email + password)
   - Diagrama simple de arquitectura (puede ser ASCII)
   - Mapa de rutas
   - Estructura de Firestore
   - Reglas (resumen + link a `firestore.rules`)

2. `docs/sustentacion-2026/GUION-SUSTENTACION.md`:
   - Story de 7 minutos con timestamps
   - 3 cuentas demo
   - Lo que el docente verá
   - Preguntas frecuentes + respuestas

3. `docs/sustentacion-2026/CHECKLIST-EVIDENCIAS.md`:
   - Cada criterio del curso (7.1 a 7.5) con su evidencia (archivo, ruta, línea).

---

## 7. Estructura de archivos objetivo

```
frontend-angular/
├── firestore.rules                                   ← nuevo
├── scripts/
│   └── seed-aula.mjs                                 ← nuevo (opcional)
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── layouts/
│   │   │   │   └── layout-aula/                      ← nuevo
│   │   │   │       ├── layout-aula.html
│   │   │   │       ├── layout-aula.scss
│   │   │   │       └── layout-aula.ts
│   │   │   └── servicios/
│   │   │       └── firestore-app.ts                  ← nuevo
│   │   └── features/
│   │       └── aula/
│   │           ├── aula.routes.ts                    ← nuevo
│   │           ├── models/
│   │           │   ├── usuario-aula.model.ts         ← nuevo
│   │           │   ├── curso.model.ts                ← nuevo
│   │           │   ├── mision.model.ts               ← nuevo
│   │           │   └── entrega.model.ts              ← nuevo
│   │           ├── services/
│   │           │   ├── usuario-aula.service.ts       ← nuevo
│   │           │   ├── curso.service.ts              ← nuevo
│   │           │   ├── mision.service.ts             ← nuevo
│   │           │   └── entrega.service.ts            ← nuevo
│   │           └── pages/
│   │               ├── inicio/                       ← nuevo
│   │               ├── perfil/                       ← nuevo
│   │               ├── admin/                        ← nuevo
│   │               ├── cursos/
│   │               │   ├── lista-cursos/
│   │               │   ├── detalle-curso/
│   │               │   ├── crear-curso/
│   │               │   ├── editar-curso/
│   │               │   └── mis-cursos/
│   │               ├── misiones/
│   │               │   ├── lista-misiones/
│   │               │   ├── detalle-mision/
│   │               │   ├── crear-mision/
│   │               │   ├── editar-mision/
│   │               │   └── lista-misiones-curso/
│   │               ├── entregas/
│   │               │   ├── entregar/
│   │               │   ├── calificar/
│   │               │   ├── lista-entregas/
│   │               │   └── mis-entregas/
│   │               └── progreso/
│   │                   └── progreso-estudiante/
│   └── environments/
│       └── environment.ts                            ← sin cambios
```

---

## 8. Verificación manual del flujo crítico

Antes de cerrar la fase 10, el agente debe ejecutar y registrar el resultado:

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Login como `estudiante-aula@demo.local` | Redirige a `/aula/inicio` |
| 2 | Navegar a `/aula/cursos` | Ve "Matemáticas 2026-I" |
| 3 | Entrar al curso, ver misiones | Ve "Suma de fracciones" |
| 4 | Intentar entrar a `/aula/admin` | Redirige a `/aula/inicio` (no es admin) |
| 5 | Login como `docente-aula@demo.local` | Redirige a `/aula/inicio` (versión docente) |
| 6 | Crear un curso nuevo "Historia" | Aparece en la lista |
| 7 | Crear una misión en "Historia" | Aparece en la lista de misiones del curso |
| 8 | Login como estudiante, ver "Historia" | No aparece (no está publicado) |
| 9 | Publicar el curso, ver de nuevo como estudiante | Aparece |
| 10 | Estudiante entrega "Suma de fracciones" | Aparece "entregada" en su panel |
| 11 | Docente entra a entregas, califica con 18/20 | Estado cambia a "aprobada" |
| 12 | Estudiante ve el resultado | Ve 18/20 y la observación |
| 13 | Estudiante intenta entregar 2 veces la misma misión | La segunda es bloqueada (form deshabilitado o error) |
| 14 | Estudiante intenta entrar a `/aula/cursos/nuevo` | Redirige (no es docente) |
| 15 | Login como `admin-aula@demo.local` | Ve `/aula/admin` con lista de usuarios |
| 16 | Desactivar un usuario | Su sesión siguiente debe fallar o redirigir |

Si cualquier paso falla, **NO cerrar la fase 10** hasta arreglarlo.

---

## 9. Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Las reglas de Firestore permiten demasiado o muy poco | Probar manualmente los 16 casos de la sección 8 antes de cerrar FASE 3 |
| `collectionData()` no actualiza en tiempo real | Usar `docData()` para detalle y `collectionData()` para listas — verificar con un cambio en Firestore desde la consola |
| El usuario no tiene doc `usuarios/{uid}` en Firestore | Verificar al iniciar sesión: si no existe y es un usuario nuevo, crearlo |
| El campo `rol` no se puede confiar del cliente | Las reglas validan contra el doc, no contra claims |
| Conflictos con rutas existentes (`/alumno`, etc.) | El prefijo `/aula/` aísla todo |
| Build excede el budget de 1 MB | Lazy loading agresivo en cada ruta de Aula |
| El docente pregunta por Laravel en la defensa | Tener lista la respuesta: "Firebase para la lógica académica, Laravel para features de negocio avanzadas" |
| La validación de "no doble entrega" en reglas es compleja | Hacerla en cliente Y en reglas (regla con `get()` o con un doc derivado `entregas_por_mision/{misionId}/estudiantes/{estudianteId}`) |

---

## 10. Fuera de alcance (no hacer)

- ❌ Migrar gamificación, familia, tienda, ranking, cuentos a Firestore.
- ❌ Tocar `core/servicios/api.ts`, `core/servicios/autenticacion.ts`, `core/servicios/sesion.ts`.
- ❌ Tocar `core/guards/{auth,docente,alumno,tutor}-guard.ts` (reusar tal cual).
- ❌ Instalar `@angular/fire` (usar SDK directo).
- ❌ Reescribir componentes del design system o cambiar tokens.
- ❌ Agregar tests E2E (los manuales de la sección 8 son suficientes para la defensa).
- ❌ Cloud Functions (no es parte del spec del curso y agrega complejidad).
- ❌ Borrar nada de `features/misiones/`, `features/docente/`, `features/alumno/`.
- ❌ Cambiar la base de datos de producción de Supabase.

---

## 11. Comando de deploy

```bash
# Frontend
cd C:\laragon\www\daemon\frontend-angular
npm run build
firebase deploy --only hosting:aula --project daemon-a41f8 \
  --token "1//..."   # ver docs/firebase-deploy.md si existe

# Reglas de Firestore
firebase deploy --only firestore:rules --project daemon-a41f8 \
  --token "1//..."
```

> Si se crea un proyecto Firebase nuevo `daemon-aula-sustentacion`, ajustar los
> `firebase deploy` con el `--project` correspondiente.

---

## 12. Orden de ejecución del agente (resumen)

```
FASE 0  → Setup (rama, init Firestore, layout)
FASE 1  → 4 interfaces TS
FASE 2  → 4 servicios Firestore
FASE 3  → Reglas de Firestore (con pruebas)
FASE 4  → Páginas de cursos
FASE 5  → Páginas de misiones
FASE 6  → Páginas de entregas
FASE 7  → Páginas restantes (inicio, perfil, admin, progreso)
FASE 8  → Routing + guards
FASE 9  → Seed de datos demo
FASE 10 → Build + fix + tests manuales
FASE 11 → Documentación
```

**Total estimado: 14-16 horas de agente.**

---

## 13. Criterios de aceptación globales

- [ ] `npm run build` pasa sin warnings nuevos.
- [ ] `npm run test:ci` pasa.
- [ ] `npm run check:architecture` pasa.
- [ ] `npm run check:style-tokens` pasa.
- [ ] El flujo crítico de la sección 8 funciona end-to-end.
- [ ] Las 16 verificaciones manuales pasan.
- [ ] Las 3 cuentas demo existen y hacen login.
- [ ] `firestore.rules` desplegadas y probadas.
- [ ] `README-AULA.md`, `GUION-SUSTENTACION.md` y `CHECKLIST-EVIDENCIAS.md` existen.
- [ ] El deploy en Firebase Hosting funciona y la URL carga.

---

**Fin del plan.** Si algo de aquí no se entiende o falta contexto, está mal
escrito. Volver a revisar antes de ejecutar.
