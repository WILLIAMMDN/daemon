#!/bin/sh
# Entry point para el contenedor Laravel.
# Corre DESPUES de que Render inyecta las ENV vars, asi la config cacheada
# tiene los valores reales (DB_PASSWORD, FIREBASE_*, etc.) en vez de vacios.
set -e

# Si existe la marca de "config ya cacheada", saltar el paso para no pagar
# el costo de cache en cada reinicio (el plan free de Render reinicia tras
# 15 min de inactividad).
NEED_CACHE=1
if [ -f bootstrap/cache/.config-cached ]; then
    NEED_CACHE=0
fi

# Si el codigo cambio (commit nuevo), invalidar el cache
if [ -f bootstrap/cache/.config-cached ]; then
    CACHED_COMMIT=$(cat bootstrap/cache/.config-cached)
    if [ "$CACHED_COMMIT" != "${RENDER_GIT_COMMIT:-unknown}" ]; then
        NEED_CACHE=1
    fi
fi

# Tambien invalidar si cambiaron ENV vars relevantes (mailer + providers).
# Sin esto, un cambio SOLO de env vars (sin commit nuevo) deja la cache
# apuntando a valores viejos (p.ej. MAIL_MAILER=smtp viejo).
ENV_HASH_FILE=bootstrap/cache/.env-hash
ENV_HASH_INPUT="${APP_ENV:-}|${DAEMON_ENVIRONMENT:-}|${DAEMON_ALLOW_PRODUCTION_DESTRUCTIVE:-}|${APP_KEY:-}|${APP_URL:-}|${DB_HOST:-}|${DB_PORT:-}|${DB_DATABASE:-}|${DB_USERNAME:-}|${DB_PASSWORD:-}|${FRONTEND_URL:-}|${AUTH_COOKIE_SAME_SITE:-}|${AUTH_COOKIE_SECURE:-}|${MAIL_MAILER:-}|${RESEND_API_KEY:-}|${MAIL_FROM_ADDRESS:-}|${FIREBASE_PROJECT_ID:-}|${FIREBASE_SERVICE_ACCOUNT_BASE64:-}|${SUPABASE_STORAGE_BUCKET:-}|${SUPABASE_PRIVATE_STORAGE_BUCKET:-}|${SUPABASE_STORAGE_ACCESS_KEY_ID:-}|${SUPABASE_STORAGE_SECRET_ACCESS_KEY:-}|${QUEUE_CONNECTION:-}|${CACHE_STORE:-}|${PUSHER_APP_ID:-}|${PUSHER_APP_KEY:-}|${PUSHER_APP_SECRET:-}"
CURRENT_ENV_HASH=$(printf '%s' "$ENV_HASH_INPUT" | md5sum | cut -d' ' -f1)
if [ -f "$ENV_HASH_FILE" ]; then
    CACHED_ENV_HASH=$(cat "$ENV_HASH_FILE")
    if [ "$CURRENT_ENV_HASH" != "$CACHED_ENV_HASH" ]; then
        echo "[entrypoint] ENV vars cambiaron, invalidando cache."
        NEED_CACHE=1
    fi
fi

if [ "$NEED_CACHE" = "1" ]; then
    echo "[entrypoint] Regenerando config:cache y route:cache con ENV vars actuales..."
    # Borrar caches anteriores (pueden tener env vars del build time)
    rm -f bootstrap/cache/config.php bootstrap/cache/routes-v7.php 2>/dev/null || true
    php artisan config:cache
    php artisan route:cache
    # El Dockerfile construye con --no-scripts (ver Dockerfile), asi que el
    # package manifest no existe en la imagen: lo generamos aqui con las env
    # vars reales ya inyectadas, para que package:discover no bootee Laravel
    # en build sin .env.
    php artisan package:discover --ansi
    echo "${RENDER_GIT_COMMIT:-unknown}" > bootstrap/cache/.config-cached
    echo "${CURRENT_ENV_HASH}" > "$ENV_HASH_FILE"
    echo "[entrypoint] Cache listo."
fi

php artisan daemon:check-environment-safety --operation=deploy --no-interaction

# Autoridad de migracion: una vez por RELEASE, no una vez por arranque.
#
# El despliegue productivo es automatico (merge a main protegida -> Render),
# asi que un release nuevo tiene que poder aplicar sus migraciones pendientes
# sin intervencion. Lo que no debe ocurrir es que *cualquier* arranque del
# contenedor migre: en el plan free de Render el servicio se duerme tras 15
# min de inactividad y cada despertar reejecutaria `migrate --force` sin que
# exista ningun release nuevo detras.
#
# La marca guarda el commit cuyas migraciones ya se aplicaron con exito:
#   - sin marca, o marca de otro commit -> release nuevo -> se migra;
#   - marca del mismo commit            -> es un despertar -> no se migra;
#   - fallo                             -> la marca NO se escribe, el
#     entrypoint termina en error, el contenedor no arranca y el health check
#     de Render deja el deploy en rojo. Un fallo de migracion nunca se ignora
#     en silencio, y el siguiente arranque lo reintenta.
#
# RUN_MIGRATIONS=false sigue siendo la valvula para congelar el esquema (por
# ejemplo durante una restauracion) sin tocar el codigo.
RELEASE_COMMIT="${RENDER_GIT_COMMIT:-unknown}"
MIGRATED_MARKER=bootstrap/cache/.migrated

if [ "${RUN_MIGRATIONS:-true}" != "true" ]; then
    echo "[entrypoint] RUN_MIGRATIONS=${RUN_MIGRATIONS:-} : migraciones congeladas explicitamente."
elif [ -f "$MIGRATED_MARKER" ] && [ "$(cat "$MIGRATED_MARKER")" = "$RELEASE_COMMIT" ]; then
    echo "[entrypoint] Release ${RELEASE_COMMIT} ya migrado: reinicio sin cambios de esquema."
else
    echo "[entrypoint] Release ${RELEASE_COMMIT}: aplicando migraciones pendientes..."
    if ! php artisan migrate --force --no-interaction; then
        echo "[entrypoint] ERROR: fallo la migracion del release ${RELEASE_COMMIT}." >&2
        echo "[entrypoint] El contenedor no arranca; el despliegue de Render queda en rojo." >&2
        exit 1
    fi
    echo "$RELEASE_COMMIT" > "$MIGRATED_MARKER"
    echo "[entrypoint] Migraciones aplicadas para ${RELEASE_COMMIT}."
fi

# Apache, la cola y el scheduler quedan bajo un unico PID 1 que propaga
# correctamente señales y reinicia procesos fallidos.
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/daemon.conf
