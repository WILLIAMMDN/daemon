# Privacidad KIDS y TEENS

Estado tecnico al 15 de julio de 2026. Este documento describe controles de producto; no sustituye una revision legal para el pais y las instituciones donde opere DAEMON.

## Controles implementados

- Solo existen los niveles `KIDS` y `TEENS`.
- Completar el perfil exige aceptar la version vigente de la politica.
- KIDS exige correo de madre, padre o tutor y declaracion de conocimiento.
- El correo del tutor se cifra con `APP_KEY`.
- IP y user-agent no se guardan en claro: solo se registra un HMAC para auditoria.
- Cada consentimiento queda ligado al usuario, audiencia, version y fecha.
- Las evidencias de misiones usan el bucket privado `daemon-private` y enlaces temporales.
- El usuario autenticado puede exportar sus datos con `GET /api/v1/privacidad/exportar`.
- El usuario puede abrir una solicitud de eliminacion con `POST /api/v1/privacidad/eliminacion` confirmando exactamente su correo o usuario.
- Solo un administrador puede revisar o resolver solicitudes en `/api/v1/privacidad/admin/solicitudes`.
- La retencion automatica elimina solo datos efimeros; no elimina historial academico.

## Estados de consentimiento

- `aceptado`: consentimiento directo de una cuenta TEENS.
- `tutor_declarado`: cuenta KIDS que declara conocimiento de un tutor. No significa que el correo haya sido verificado.

Antes de una apertura publica masiva de KIDS debe definirse con asesoria legal si se requiere autorizacion verificable del tutor. Si se exige, se debe agregar un canal transaccional con dominio propio antes de cambiar el estado a `verificado`.

## Retencion

El comando `php artisan daemon:aplicar-retencion` es una simulacion. `--confirm` aplica:

- notificaciones leidas: 180 dias;
- jobs fallidos: 168 horas;
- solicitudes de privacidad resueltas: 730 dias.

Laravel lo programa cada lunes a las 04:00. Los valores son configurables con variables `PRIVACY_*`.

## Solicitud de eliminacion

La solicitud no borra inmediatamente la cuenta. Esto evita fraude y permite revisar obligaciones de conservacion academica. La resolucion administrativa debe documentar si se anonimizo, elimino o retuvo cada categoria y por que. Firebase Auth, Supabase Storage y PostgreSQL deben procesarse como una sola operacion cuando se apruebe una eliminacion.
