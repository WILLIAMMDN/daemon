# Portal de familias

Estado tecnico al 15 de julio de 2026.

## Objetivo

El portal `/familias` permite que una madre, padre o tutor acompañe a un
estudiante KIDS sin recibir acceso a chats, evidencias, archivos privados,
credenciales ni saldo de DAEMONS.

## Identidad y vinculo verificable

1. El estudiante KIDS declara el correo del adulto al completar su perfil.
2. DAEMON cifra ese correo y conserva ademas un HMAC normalizado para encontrar
   coincidencias sin consultar texto en claro.
3. El adulto crea una cuenta `tutor` en `/familias/acceso` con Firebase email o
   Google y acepta la politica vigente.
4. El correo debe estar verificado por Firebase antes de listar invitaciones.
5. El adulto confirma parentesco y responsabilidad desde su propia sesion.
6. Laravel crea `tutores_alumnos` y cambia el consentimiento a `verificado`.

Una declaracion del menor no concede acceso por si sola. La cuenta adulta debe
controlar el mismo correo y aceptar expresamente el vinculo. Este control es
tecnico, no sustituye la revision legal ni una validacion presencial si una
institucion o jurisdiccion la exige.

## Reporte semanal

El resumen familiar muestra solo señales de aprendizaje:

- XP permanente, nivel y progreso;
- posicion en el ranking contextual, que sigue visible para el alumno;
- misiones aprobadas durante los ultimos siete dias;
- XP academico obtenido en esas misiones;
- evaluaciones enviadas y promedio registrado;
- actividad diaria agregada, sin contenido de las evidencias.

## Bienestar digital

El tutor puede activar un maximo diario entre 30 y 480 minutos y un horario de
silencio. El layout del alumno consulta el estado y envia un latido de hasta 60
segundos solo cuando la pestaña esta visible. Al agotar el limite se muestra
una pausa amigable y el progreso permanece guardado.

No se registran paginas visitadas, teclas, texto, capturas ni contenido. La
tabla `uso_pantalla_diario` conserva un total agregado por alumno y fecha. La
retencion predeterminada es 45 dias mediante `daemon:aplicar-retencion`.

El control falla abierto si la API no responde para no cortar una clase por un
problema de red.

## Membresia y pagos

`membresias_familiares` guarda plan, estado, importe y fechas administrativas.
DAEMON no almacena PAN, CVV ni datos de tarjeta. Si
`FAMILY_PAYMENTS_PORTAL_URL` contiene una URL HTTPS, el portal muestra un
enlace al checkout alojado por el proveedor; si no, ofrece el correo de soporte.

La integracion con cobros reales queda desactivada hasta elegir proveedor,
crear sesiones de checkout autenticadas y validar webhooks en backend. Nunca
se debe convertir `FAMILY_PAYMENTS_PORTAL_URL` en un formulario de tarjeta
propio.

## API

```text
POST /api/v1/auth/tutor/firebase
GET  /api/v1/tutor/invitaciones
POST /api/v1/tutor/invitaciones/{consentimiento}/aceptar
GET  /api/v1/tutor/panel?alumno_id={id}
PUT  /api/v1/tutor/alumnos/{alumno}/limite-pantalla
GET  /api/v1/alumno/bienestar-digital
POST /api/v1/alumno/bienestar-digital/latido
```

Las rutas familiares requieren `role:tutor`. Las rutas academicas compartidas
requieren explicitamente `alumno`, `docente` o `admin`, por lo que agregar el
nuevo rol no amplia permisos de forma accidental.

## Configuracion

```text
FAMILY_DEFAULT_TIMEZONE=America/Lima
FAMILY_PAYMENTS_PORTAL_URL=
FAMILY_SUPPORT_EMAIL=soporte@daemon.local
PRIVACY_SCREEN_USAGE_DAYS=45
```
