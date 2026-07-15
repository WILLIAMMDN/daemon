# Imagen base oficial de PHP 8.3 con Apache (Render usa esto para servir Laravel)
FROM php:8.3-apache

# Instala las extensiones PHP que Laravel necesita
# pdo_pgsql: para conectar a Supabase (PostgreSQL)
# gd, intl, zip, bcmath: extensiones comunes de Laravel
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    supervisor \
    unzip \
    git \
    && docker-php-ext-install pdo_pgsql pgsql intl zip bcmath \
    && rm -rf /var/lib/apt/lists/*

# Habilita el módulo de rewrite de Apache (Laravel lo necesita para las rutas)
RUN a2enmod rewrite

# Copia la configuracion personalizada de Apache (apunta a /public)
COPY docker/apache-config.conf /etc/apache2/sites-available/000-default.conf

# Instala Composer (gestor de dependencias de PHP)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Cambia el directorio de trabajo al proyecto Laravel
WORKDIR /var/www/html

# Copia solo los archivos de dependencias primero (mejor cache de Docker)
COPY composer.json composer.lock ./

# Instala las dependencias PHP sin las de desarrollo
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Ahora copia el resto del codigo del proyecto
COPY . .

# Optimiza el autoloader de Composer para produccion
RUN composer dump-autoload --optimize --no-dev

# NO corremos config:cache / route:cache aqui:
#   - En build time no existen las ENV vars reales de Render
#   - php artisan config:cache congela los valores de .env en ese momento
#   - Eso dejaria DB_PASSWORD, FIREBASE_*, etc. vacios en la config cacheada
#   - Al arrancar el contenedor, Laravel usa la config cacheada e IGNORA las env vars reales
#   - Resultado: 500 Internal Server Error por no conectar a Postgres
# Solucion: cachear la config al primer arranque, en un entrypoint que ya tiene las env vars.
# Como mejora minima, solo limpiamos cualquier cache que pudiera haberse colado.

# Crea los directorios que Laravel necesita para escribir (logs, cache, sesiones, vistas compiladas)
RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/testing \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

# Crea un entrypoint que cachea config/rutas con las ENV vars reales ya presentes
# antes de arrancar Apache. Asi Laravel ve los valores correctos en cada deploy.
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/supervisord.conf /etc/supervisor/conf.d/daemon.conf
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expone el puerto 80 (Render lo mapea automaticamente a su $PORT)
EXPOSE 80

# Entry point que cachea config con las ENV vars reales antes de arrancar Apache
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
