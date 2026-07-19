# Interoperabilidad OneRoster 1.2 y LTI Advantage

## Estado honesto

DAEMON implementa un perfil inicial interoperable y seguro. No se declara
certificado por 1EdTech. La certificación y las pruebas con LMS/SIS reales son
actividades externas posteriores.

## OneRoster 1.2

Base oficial: `/ims/oneroster/rostering/v1p2`.

Recursos de lectura implementados:

- `academicSessions`, `courses`, `classes`, `orgs`, `schools`;
- `users`, `students`, `teachers`, `enrollments`;
- estudiantes/docentes por clase y consulta individual por `sourcedId`;
- `limit`, `offset`, `sort`, `orderBy`, filtro seguro y `fields`.

Todos los recursos usan UUID `sourced_id` sin PII. Cada cliente queda ligado a
una institución y ninguna consulta cruza ese límite.

### OAuth2 client credentials

```text
POST /ims/oneroster/oauth2/token
grant_type=client_credentials
```

Se acepta HTTP Basic o credenciales en el cuerpo. El secreto se guarda con
hash y se devuelve una sola vez. El token opaco se guarda como SHA-256, dura
una hora y usa el scope oficial de lectura de roster core.

Alta administrativa:

```text
POST   /api/v1/interoperabilidad/admin/oneroster/clientes
DELETE /api/v1/interoperabilidad/admin/oneroster/clientes/{id}
```

El secreto debe copiarse inmediatamente al gestor de secretos del SIS. Para
rotarlo se revoca el cliente y se crea otro.

## LTI 1.3 / Advantage

DAEMON implementa el rol de herramienta para lanzamiento OIDC:

```text
GET  /lti/login
POST /lti/launch
```

Controles:

- coincidencia exacta de `iss`;
- validación de `aud`, `nonce`, expiración, firma RS256 y `deployment_id`;
- JWKS remoto cacheado cinco minutos para rotación por `kid`;
- `state` de un uso y vencimiento de diez minutos;
- versión LTI `1.3.0` y mensajes Resource Link o Deep Linking;
- ningún usuario se aprovisiona silenciosamente: el `sub` debe vincularse;
- cookie DAEMON `HttpOnly`, sin token en URL.

### Alta de un LMS

1. Crear el registro en
   `POST /api/v1/interoperabilidad/admin/lti/registros`.
2. Proporcionar issuer, client ID, deployment ID, login OIDC y JWKS HTTPS.
3. Verificar con `POST .../lti/registros/{id}/verificar`.
4. Vincular el `subject` externo mediante `POST .../{id}/vinculos`.
5. Probar un lanzamiento completo en staging aislado.

El registro nace inactivo. La verificación exige que el JWKS remoto responda y
contenga claves.

### AGS, NRPS y Deep Linking

El lanzamiento admite la declaración Deep Linking y el registro reserva los
servicios anunciados. Consumir NRPS o enviar notas por AGS requiere endpoints y
scopes reales que el LMS socio entrega en sus claims. No se habilitan llamadas
simuladas ni credenciales ficticias.

El perfil actual mantiene `X-Frame-Options: DENY` y `frame-ancestors 'none'`.
Los lanzamientos deben abrirse en ventana completa hasta configurar de forma
explícita los orígenes del LMS en Render y Firebase.
