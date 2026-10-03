#!/usr/bin/env bash
# Deploys the latest main: run on the server as the ubuntu user from /var/www/secret-santa.
set -euo pipefail
cd /var/www/secret-santa

git pull --ff-only

cd api
composer install --no-dev --optimize-autoloader --no-interaction
# Run artisan as www-data (the user PHP-FPM and the workers run as) so any cache or
# log files it creates stay writable by the app.
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan event:cache

cd ../web
npm ci
npm run build

# Workers keep old code in memory until restarted.
sudo systemctl restart secret-santa-queue secret-santa-reverb
sudo systemctl reload php8.5-fpm
echo "Deployed $(git -C /var/www/secret-santa rev-parse --short HEAD)"
