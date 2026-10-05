#!/usr/bin/env bash
# Deploys the latest main: run on the server as the ubuntu user from /var/www/secret-santa.
set -euo pipefail
cd /var/www/secret-santa

# Bash keeps reading the copy of this script it started with, so after pulling, start over
# with the new copy: changes to this script then apply on the same deploy.
if [ "${1:-}" != "--pulled" ]; then
	git pull --ff-only
	exec bash deploy/update.sh --pulled
fi

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
# The same version goes into the build and the announcement below, so open pages can compare.
version="$(git rev-parse --short HEAD)"
APP_VERSION="$version" npm run build

# Keep Caddy's config in step with deploy/Caddyfile: fill in this server's hostname (from
# APP_URL), and only if the result differs from the live config, validate it first (a typo
# stops the deploy instead of taking the site down), install it and reload without
# dropping connections.
site_host="$(sed -n 's#^APP_URL="\{0,1\}https\{0,1\}://\([^/"]*\).*#\1#p' /var/www/secret-santa/api/.env)"
[ -n "$site_host" ] || { echo "Couldn't read the hostname from APP_URL in api/.env"; exit 1; }
new_caddyfile="$(mktemp)"
sed "s/YOUR_HOSTNAME/${site_host}/g" /var/www/secret-santa/deploy/Caddyfile > "$new_caddyfile"
if ! sudo cmp -s "$new_caddyfile" /etc/caddy/Caddyfile; then
	sudo caddy validate --config "$new_caddyfile" --adapter caddyfile
	sudo install -m 644 "$new_caddyfile" /etc/caddy/Caddyfile
	# validate runs as root and can leave the log file root-only; the caddy service needs it.
	sudo chown -R caddy:caddy /var/log/caddy
	sudo systemctl reload caddy
	echo "Caddy config updated for ${site_host}"
fi
rm -f "$new_caddyfile"

# The scheduler's cron line (exchange reminders). cron reads /etc/cron.d by itself.
if ! sudo cmp -s /var/www/secret-santa/deploy/secret-santa-scheduler /etc/cron.d/secret-santa-scheduler; then
	sudo install -m 644 /var/www/secret-santa/deploy/secret-santa-scheduler /etc/cron.d/secret-santa-scheduler
	echo "Scheduler cron installed"
fi

# Workers keep old code in memory until restarted.
sudo systemctl restart secret-santa-queue secret-santa-reverb
sudo systemctl reload php8.5-fpm

# Tell open pages to offer a refresh. Give the restarted Reverb a moment to come up; pages
# that reconnect after this check /version.json themselves, so a miss here is harmless.
sleep 3
(cd ../api && sudo -u www-data php artisan app:announce-deploy "$version") || echo "Couldn't announce the new version (pages will still notice when they reconnect)."

echo "Deployed $version"
