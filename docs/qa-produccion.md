# DAEMON QA de produccion

Usar este checklist antes y despues de cambios relevantes en produccion.
No guardar contrasenas reales en este archivo.

## Verificacion automatica

```powershell
cd C:\laragon\www\daemon
.\scripts\smoke-produccion.ps1

cd C:\laragon\www\daemon\frontend-angular
npm test -- --runInBand
npm run build

cd C:\laragon\www\daemon\backend-laravel
php artisan test

cd C:\laragon\www\daemon
```

Resultado esperado:

- `smoke-produccion.ps1` termina con `Production smoke test finished successfully`.
- El build Angular termina sin errores.
- Las pruebas Jest y Laravel pasan.
- `/api/v1/salud` responde `ok: true`, base de datos OK y `uploads_disk: supabase`.
- `ngsw-worker.js` responde JavaScript y `ngsw.json` responde JSON.
- Los bundles desplegados contienen `verificacion=firebase` y `reset=firebase`.
- Los bundles desplegados no llaman `/auth/recuperar` ni `/auth/enviar-verificacion`.

## Flujo alumno

- Abrir `https://daemonestudiante.web.app/login`.
- Iniciar sesion con una cuenta de alumno de prueba.
- Confirmar que redirige a `/alumno` o `/bienvenida` si el perfil esta incompleto.
- Revisar que carguen panel, perfil, misiones, tienda, evaluaciones, chatbot, cuentos, ranking, comunidad y certificado.
- Si el alumno tiene correo no verificado, confirmar que aparece el banner de verificacion.
- No ejecutar canjes, entregas o cambios permanentes salvo que la cuenta sea de prueba.

## Flujo docente

- Abrir `https://daemonestudiante.web.app/login-docente`.
- Iniciar sesion con una cuenta docente o admin de prueba.
- Confirmar acceso a `/docente`.
- Revisar panel, alumnos, aulas, misiones, entregas, insignias, tienda, evaluaciones, competencia, rondas y tokens.
- Confirmar que un usuario alumno no pueda entrar al portal docente.
- No borrar alumnos, misiones, premios o archivos reales durante QA.

## Auth y correos

- Registro con email debe crear cuenta en Firebase y DAEMON.
- Verificacion de correo debe volver a `/alumno?verificacion=firebase`.
- Recuperacion de clave debe usar Firebase y volver a `/login?reset=firebase`.
- El frontend no debe llamar `/auth/recuperar` ni `/auth/enviar-verificacion` en los flujos activos.
- Google login debe validar rol: alumno hacia `/alumno`, docente/admin hacia `/docente`.

## Archivos y assets

- Assets estaticos (`img`, `galeria`, `audio`, `rive`, `legacy`) deben cargar desde Firebase Hosting.
- Uploads de negocio (`uploads/...`) deben resolver desde Supabase Storage.
- Confirmar visualmente avatar, fondos, insignias, premios y evidencias en una cuenta de prueba.

## Seguridad rapida

- Confirmar `Access-Control-Allow-Origin: https://daemonestudiante.web.app`.
- Confirmar `Access-Control-Allow-Credentials: true`.
- Confirmar cabeceras `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY`.
- Revisar que no haya `.env`, service accounts, tokens privados ni dumps sensibles en Git.
