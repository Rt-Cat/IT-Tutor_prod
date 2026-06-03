FROM php:8.2-apache

# Встановлюємо системні бібліотеки для SQLite та компіляції MongoDB
RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    libssl-dev \
    pkg-config \
    git \
    unzip

# Встановлюємо PDO для SQLite
RUN docker-php-ext-install pdo pdo_sqlite

# Встановлюємо та активуємо розширення MongoDB
RUN pecl install mongodb && docker-php-ext-enable mongodb

# Активуємо mod_rewrite для красивих URL (роутингу)
RUN a2enmod rewrite

# Встановлюємо Composer (потрібен для PHP-бібліотеки MongoDB)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Задаємо робочу директорію
WORKDIR /var/www/html