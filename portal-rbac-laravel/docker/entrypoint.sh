#!/bin/sh
set -eu
cd /var/www/html

# Kunci aplikasi dibuat sekali lalu disimpan di volume agar sesi tidak batal saat restart.
if [ -z "${APP_KEY:-}" ]; then
  keyfile=storage/app/.app_key
  [ -s "$keyfile" ] || php -r 'echo "base64:".base64_encode(random_bytes(32));' > "$keyfile"
  APP_KEY="$(cat "$keyfile")"
  export APP_KEY
fi

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force --no-interaction
  if [ "${RUN_SEED:-true}" = "true" ]; then php artisan db:seed --force --no-interaction; fi
fi
if [ "${APP_ENV:-production}" = "production" ]; then
  php artisan config:cache && php artisan route:cache && php artisan view:cache
fi
exec "$@"
