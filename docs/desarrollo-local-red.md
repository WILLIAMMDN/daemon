# Desarrollo local y pruebas en red privada

DAEMON usa un proxy del servidor de desarrollo de Angular para que el navegador
consuma Laravel mediante rutas relativas. De esta forma `localhost`, la IP del
equipo y un telefono conectado a la misma red usan el mismo origen visible:

```text
Navegador -> http://IP_DEL_PC:4200/api/v1 -> proxy Angular -> localhost:8000
```

Laravel permanece enlazado a loopback. No se expone directamente el puerto 8000
ni se agregan comodines CORS para redes privadas. Esto conserva las cookies de
sesion como first-party y evita que `localhost` apunte al telefono cuando la SPA
se abre desde otro dispositivo.

## Uso normal en el mismo equipo

```powershell
cd C:\laragon\www\daemon
.\scripts\iniciar.ps1
```

Abrir `http://localhost:4200`.

## Worktrees y configuracion Firebase

Git no copia archivos ignorados como `backend-laravel/.env` al crear un
worktree. Arrancar Laravel desde uno sin ese archivo deja al backend sin
`FIREBASE_PROJECT_ID`, sin la conexion real de Supabase y produce mensajes como
`Firebase no esta configurado en el backend` aunque el frontend tenga su
configuracion web.

El script ahora detiene el arranque con un mensaje explicito. Para inicializar
un worktree desde la configuracion local principal, se debe indicar el origen de
forma consciente:

```powershell
cd C:\RUTA\DEL\WORKTREE
.\scripts\iniciar.ps1 -EnvSource 'C:\laragon\www\daemon\backend-laravel\.env'
```

Para probar tambien desde la red privada:

```powershell
.\scripts\iniciar.ps1 -Lan -EnvSource 'C:\laragon\www\daemon\backend-laravel\.env'
```

La copia queda dentro de `backend-laravel/.env`, permanece ignorada por Git y
nunca debe adjuntarse a un commit, incidencia o captura. El script limpia la
cache de configuracion antes de iniciar Laravel para que no sobrevivan valores
de otro entorno.

## Uso desde telefono o tablet

Ambos dispositivos deben estar en una red privada de confianza:

```powershell
cd C:\laragon\www\daemon
.\scripts\iniciar.ps1 -Lan
```

El script imprime una URL como `http://10.0.0.9:4200`. Si Windows solicita
permiso de firewall para Node, permitir solo redes privadas. No publicar el
puerto 4200 en el router ni usar esta modalidad en una red publica.

El acceso con usuario local funciona por el proxy. Google/Firebase puede exigir
un dominio autorizado y HTTPS; esa restriccion del proveedor no debe relajarse
para una IP temporal.

## Diagnostico rapido

En el equipo servidor:

```powershell
curl.exe http://localhost:8000/api/v1/salud
curl.exe http://localhost:4200/api/v1/salud
```

En modo LAN, la segunda comprobacion tambien debe responder usando la IP:

```powershell
curl.exe http://IP_DEL_PC:4200/api/v1/salud
```

Un `200` en `/salud` comprueba conectividad y base de datos. El campo
`authentication.firebase_project_configured` permite confirmar, sin revelar
credenciales, si el backend puede validar identidades Firebase. Una pantalla
vacia despues de eso puede ser un estado real: los cursos necesitan unidades y
lecciones publicadas, y cada usuario debe tener una matricula activa. No se
deben inventar estudiantes ni contenido en Angular para ocultar ese estado.

## Separacion respecto de produccion

- `npm start` y `npm run start:cloud` siguen usando el API de Render.
- `npm run start:local` usa Laravel local solo en el mismo equipo.
- `npm run start:lan` habilita la escucha privada del frontend.
- La configuracion de produccion y Firebase Hosting no se modifica.

## Evidencia de la correccion

El diagnostico del 18 de julio de 2026 comprobo que el backend canonico si
tenia `FIREBASE_PROJECT_ID` y datos en Supabase: 49 alumnos, 44 matriculas
activas, un aula y un curso. El worktree usado para la prueba no tenia `.env` y
el frontend apuntaba a `localhost:8000`, que desde un telefono significa el
propio telefono. Ademas, CORS no autorizaba la IP privada. No se habian borrado
los estudiantes.

La solucion evita abrir CORS o Laravel a toda la red: la SPA usa el proxy del
mismo origen y solo Angular escucha en la LAN. Se valido lo siguiente:

```text
http://localhost:4201/api/v1/salud -> 200
http://10.0.0.9:4201/api/v1/salud -> 200
Laravel: 134 pruebas / 477 aserciones, OK
Angular Jest: 11 suites / 39 pruebas, OK
Arquitectura Angular: OK
Build Angular: 919.89 kB iniciales, bajo el presupuesto de 1 MB
```

El unico curso existente tenia cero unidades y cero lecciones en ese momento.
Una vez recuperada la conexion, ese estado vacio es correcto hasta que el curso
publique contenido; no debe transformarse en un falso error de red.
