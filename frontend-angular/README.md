# DAEMON Frontend (Angular)

Aplicación de página única (SPA) para el ecosistema educativo gamificado DAEMON.

## 🚀 Tecnologías Principales

- **Angular 21** (Standalone Components)
- **TailwindCSS + DaisyUI** (Estilos base y utilidades)
- **NG-ZORRO** (Componentes UI principales)
- **Jest** (Testing)
- **Rive** (Animaciones interactivas)

## 📦 Arquitectura de la Aplicación

El proyecto sigue una estructura limpia recomendada para Angular:

- **`src/app/core/`**: Servicios singleton (API, Autenticación), Guards, Interceptores HTTP, y layouts de la aplicación.
- **`src/app/features/`**: Módulos funcionales (Alumno, Docente, Tienda, Evaluaciones, etc.), cargados de forma diferida (lazy loading).
- **`src/app/shared/`**: Componentes reutilizables, directivas, validadores, pipes.

Los límites entre capas se validan con `npm run check:architecture` y están
documentados en `../docs/frontend-architecture.md`. No se crean carpetas vacías
como marcadores de trabajo futuro.

## ⚙️ Instalación Local

1. Instala las dependencias de NPM:
   ```bash
   npm ci
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```
3. Abre tu navegador en `http://localhost:4200/`. La aplicación recargará automáticamente si haces cambios en el código fuente.

`npm start` usa API/Storage locales y Firebase Emulator Suite. Consulta
`../docs/ENVIRONMENTS.md` antes del primer arranque.

## 🧪 Pruebas (Testing)

El proyecto usa **Jest** para las pruebas unitarias. Para correr las pruebas:

```bash
npm test
```

_(Para ver los cambios en tiempo real usa `npm run test:watch`)_

Las reglas Firestore se prueban únicamente contra el proyecto demo del
emulador. Requieren Java 21 o superior y nunca usan credenciales reales:

```powershell
npm run test:firestore-rules
```

El comando genera cobertura en `reports/firestore-rules/`, directorio local no
versionado. Las reglas v2 todavía no deben desplegarse: consulta
`../docs/transformacion-estudiante/03-firestore-security.md`.

## 🛠️ Estilos (SCSS)

La aplicación utiliza un sistema híbrido de estilos que reside en `src/styles.scss` (y archivos parciales por componente). Al agregar componentes, prioriza los de **NG-ZORRO** (basados en Ant Design).

## 🚀 Despliegue

Este frontend se despliega en **Firebase Hosting** mediante GitHub Actions solo
al integrar en `main`. Los Pull Requests prueban y compilan, pero no despliegan
previews sobre el proyecto productivo. Revisa `../docs/ENVIRONMENTS.md` y la
configuración Firebase de la raíz.
