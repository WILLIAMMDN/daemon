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

## 🧪 Pruebas (Testing)
El proyecto usa **Jest** para las pruebas unitarias. Para correr las pruebas:
```bash
npm test
```
*(Para ver los cambios en tiempo real usa `npm run test:watch`)*

## 🛠️ Estilos (SCSS)
La aplicación utiliza un sistema híbrido de estilos que reside en `src/styles.scss` (y archivos parciales por componente). Al agregar componentes, prioriza los de **NG-ZORRO** (basados en Ant Design).

## 🚀 Despliegue
Este frontend se despliega automáticamente en **Firebase Hosting** mediante GitHub Actions en cada push a la rama `main` o al crear un Pull Request. Revisa la configuración de Firebase en la raíz del repositorio (`firebase.json`).
