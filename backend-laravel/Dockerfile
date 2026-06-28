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

# Cachea la configuracion y rutas de Laravel (acelera el arranque)
RUN php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# Permisos correctos para que Apache pueda escribir en storage y cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expone el puerto 80 (Render lo mapea automaticamente a su $PORT)
EXPOSE 80