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
ENV_HASH_INPUT="${APP_ENV:-}|${APP_KEY:-}|${APP_URL:-}|${DB_HOST:-}|${DB_PORT:-}|${DB_DATABASE:-}|${DB_USERNAME:-}|${DB_PASSWORD:-}|${FRONTEND_URL:-}|${AUTH_COOKIE_SAME_SITE:-}|${AUTH_COOKIE_SECURE:-}|${MAIL_MAILER:-}|${RESEND_API_KEY:-}|${MAIL_FROM_ADDRESS:-}|${FIREBASE_PROJECT_ID:-}|${FIREBASE_SERVICE_ACCOUNT_BASE64:-}|${SUPABASE_STORAGE_BUCKET:-}|${SUPABASE_PRIVATE_STORAGE_BUCKET:-}|${SUPABASE_STORAGE_ACCESS_KEY_ID:-}|${SUPABASE_STORAGE_SECRET_ACCESS_KEY:-}|${QUEUE_CONNECTION:-}|${CACHE_STORE:-}|${PUSHER_APP_ID:-}|${PUSHER_APP_KEY:-}|${PUSHER_APP_SECRET:-}"
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
    echo "${RENDER_GIT_COMMIT:-unknown}" > bootstrap/cache/.config-cached
    echo "${CURRENT_ENV_HASH}" > "$ENV_HASH_FILE"
    echo "[entrypoint] Cache listo."
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "[entrypoint] Ejecutando migraciones controladas..."
    php artisan migrate --force --no-interaction
fi

# Apache, la cola y el scheduler quedan bajo un unico PID 1 que propaga
# correctamente señales y reinicia procesos fallidos.
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/daemon.conf
