#!/usr/bin/env bash
# Dispara un deploy manual en Render usando el Deploy Hook del servicio `daemon`.
#
# La URL del hook es una CREDENCIAL. Nunca debe committearse.
# Fuentes, en orden de precedencia:
#   1. Variable de entorno:          RENDER_DEPLOY_HOOK_URL
#   2. Archivo local gitignored:     scripts/render-deploy-hook.url
#   3. (CI) Secret de GitHub:        RENDER_DEPLOY_HOOK_URL
#
# Uso:
#   bash scripts/render-deploy-hook.sh             # dispara deploy del ultimo commit de main
#   bash scripts/render-deploy-hook.sh --verify    # ademas monitorea /salud hasta que cambie el commit

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_URL="${RENDER_DEPLOY_HOOK_URL:-}"

if [ -z "$HOOK_URL" ] && [ -f "$SCRIPT_DIR/render-deploy-hook.url" ]; then
  HOOK_URL="$(tr -d '[:space:]' < "$SCRIPT_DIR/render-deploy-hook.url")"
fi

if [ -z "$HOOK_URL" ]; then
  echo "ERROR: No hay URL de deploy hook." >&2
  echo "Crea scripts/render-deploy-hook.url (gitignored) o exporta RENDER_DEPLOY_HOOK_URL." >&2
  exit 1
fi

VERIFY=0
for arg in "$@"; do
  case "$arg" in
    --verify) VERIFY=1 ;;
  esac
done

echo "==> Disparando deploy en Render..."
RESPONSE="$(curl -s -w '\n%{http_code}' -X POST "$HOOK_URL")"
HTTP_CODE="$(echo "$RESPONSE" | tail -1)"
BODY="$(echo "$RESPONSE" | head -n -1)"

echo "HTTP $HTTP_CODE"
echo "$BODY"

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "ERROR: el deploy hook respondio $HTTP_CODE" >&2
  exit 1
fi

if [ "$VERIFY" = "1" ]; then
  echo "==> Monitoreando /salud hasta que cambie el commit..."
  BEFORE="$(curl -s https://daemon-5vo1.onrender.com/api/v1/salud | grep -oE '"commit":"[0-9a-f]+"' || true)"
  echo "Antes: ${BEFORE:-sin commit}"
  for i in $(seq 1 36); do
    sleep 20
    NOW="$(curl -s https://daemon-5vo1.onrender.com/api/v1/salud | grep -oE '"commit":"[0-9a-f]+"' || true)"
    echo "  [$i] ${NOW:-sin respuesta}"
    if [ -n "$NOW" ] && [ "$NOW" != "$BEFORE" ]; then
      echo "==> Commit actualizado: $NOW"
      exit 0
    fi
  done
  echo "WARN: el commit no cambio en ~12 min; revisar el build en el dashboard de Render." >&2
  exit 1
fi
