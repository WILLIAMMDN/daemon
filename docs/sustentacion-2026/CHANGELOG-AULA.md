# Changelog — DAEMON Aula

## 2026-07-23 — Fase 0: setup

### Implementado

- Creada la estructura base de `features/aula/` para modelos, servicios y páginas.
- Agregado `FirestoreApp`, que comparte la app Firebase por defecto e inicializa
  Firestore durante el arranque.
- Configurado `provideAppInitializer` en `app.config.ts`.
- Creado `layout-aula` standalone y responsive con NG-ZORRO, navegación base,
  estado de Firestore, identidad de sesión y cierre de sesión.
- Creado el tema corporativo encapsulado de Aula con tokens grafito, bronce y
  marfil, sin alterar los estilos de los portales existentes.

### Decisiones técnicas

- El SDK de Firestore se carga con `import()` dinámico y el inicializador de
  Angular espera su resolución. Esto conserva el presupuesto del bundle inicial.
- `FirestoreApp` registra o recupera la misma app Firebase por defecto que luego
  reutiliza `FirebaseAuth`, sin modificar el servicio de autenticación intocable.
- No se agregó todavía la ruta `/aula`: el routing y los guards corresponden a
  la Fase 8.

### Verificación

- `npm run build`: verde, 970.20 kB de bundle inicial y sin warnings nuevos.
- `npm run check:architecture`: verde.
- `npm run check:style-tokens`: verde, cero violaciones nuevas.
- Arranque local en navegador: verde, sin errores de consola.
- `npm run test:ci`: rojo por un defecto previo; falta
  `scripts/check-student-visual.mjs`.
- Jest directo: 71 de 72 pruebas pasan. Falla una expectativa previa en
  `features/alumno/pages/recursos`, carpeta explícitamente fuera de alcance.
