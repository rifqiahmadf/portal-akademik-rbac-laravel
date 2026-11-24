# syntax=docker/dockerfile:1.7
ARG PHP_VERSION=8.4

# ---------- Dependensi PHP (produksi, autoloader dioptimalkan) ----------
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/tmp/cache \
    composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction
COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev --no-scripts

# ---------- Dependensi PHP (pengujian, termasuk dev) ----------
FROM composer:2 AS vendor-dev
WORKDIR /app
COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/tmp/cache \
    composer install --no-scripts --no-autoloader --prefer-dist --no-interaction
COPY . .
RUN composer dump-autoload --no-scripts

# ---------- Aset front-end (Vite + Tailwind CSS 4) ----------
FROM node:24-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY vite.config.js ./
COPY resources ./resources
RUN npm run build

# ---------- Basis PHP-FPM ----------
FROM php:${PHP_VERSION}-fpm-alpine AS base
COPY --from=ghcr.io/mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_pgsql opcache
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
WORKDIR /var/www/html

# ---------- Image aplikasi ----------
FROM base AS app
COPY --from=vendor /app ./
COPY --from=assets /app/public/build ./public/build
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN touch .env && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache
ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]

# ---------- Image uji ----------
FROM base AS test
COPY --from=vendor-dev /app ./
RUN touch .env && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
ENV APP_ENV=testing
CMD ["php", "artisan", "test"]

# ---------- Web server (nginx tanpa hak root) ----------
FROM nginxinc/nginx-unprivileged:1.28-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=app /var/www/html/public /var/www/html/public
