#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 server (Oracle Cloud Ampere or AMD) for Secret Santa.
# Run as root on the server:
#
#   curl -fsSL https://raw.githubusercontent.com/JordanDC2/secret-santa/main/deploy/bootstrap.sh -o bootstrap.sh
#   sudo SITE_HOST=secretsantaapp.duckdns.org bash bootstrap.sh
#
# Safe to re-run: every step checks before it changes anything. Later deploys use deploy/update.sh.
# Afterwards, put the Gmail app password in /var/www/secret-santa/api/.env (MAIL_PASSWORD) and
# run: sudo systemctl restart secret-santa-queue
set -euo pipefail

SITE_HOST="${SITE_HOST:?Set SITE_HOST, e.g. SITE_HOST=secretsantaapp.duckdns.org}"
REPO_URL="${REPO_URL:-https://github.com/JordanDC2/secret-santa.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
APP_DIR=/var/www/secret-santa
PHP_VERSION=8.5
NODE_MAJOR=22

# Containers (used to test this script) have no systemd, swap or host firewall.
HAS_SYSTEMD=false
[ -d /run/systemd/system ] && HAS_SYSTEMD=true

step() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
as_user() { runuser -u "$DEPLOY_USER" -- "$@"; }
as_app() { runuser -u www-data -- "$@"; }

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)." >&2; exit 1; }
id "$DEPLOY_USER" >/dev/null 2>&1 || { echo "User $DEPLOY_USER does not exist." >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive

step "Base packages"
apt-get update -q
apt-get install -yq --no-install-recommends \
	ca-certificates curl git gnupg unzip sqlite3 cron sudo software-properties-common \
	debian-keyring debian-archive-keyring apt-transport-https

step "Swap (only on small machines, e.g. the 1 GB AMD micro)"
if $HAS_SYSTEMD && [ "$(awk '/MemTotal/ {print $2}' /proc/meminfo)" -lt 3000000 ] && ! swapon --show | grep -q .; then
	fallocate -l 2G /swapfile
	chmod 600 /swapfile
	mkswap /swapfile
	swapon /swapfile
	grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
	echo "Skipped (enough memory, swap already on, or running in a container)."
fi

step "PHP ${PHP_VERSION} (Ondřej Surý's PPA; Ubuntu 24.04 only ships 8.3)"
if ! grep -rq "ondrej/php" /etc/apt/sources.list.d/ 2>/dev/null; then
	add-apt-repository -y ppa:ondrej/php
	apt-get update -q
fi
apt-get install -yq --no-install-recommends \
	"php${PHP_VERSION}-fpm" "php${PHP_VERSION}-cli" "php${PHP_VERSION}-sqlite3" "php${PHP_VERSION}-mbstring" \
	"php${PHP_VERSION}-xml" "php${PHP_VERSION}-curl" "php${PHP_VERSION}-zip" "php${PHP_VERSION}-bcmath" \
	"php${PHP_VERSION}-intl"
update-alternatives --set php "/usr/bin/php${PHP_VERSION}"

step "Composer (official installer, checksum verified)"
if ! command -v composer >/dev/null; then
	expected="$(curl -fsSL https://composer.github.io/installer.sig)"
	curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
	actual="$(php -r "echo hash_file('sha384', '/tmp/composer-setup.php');")"
	[ "$expected" = "$actual" ] || { echo "Composer installer checksum mismatch" >&2; exit 1; }
	php /tmp/composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
	rm /tmp/composer-setup.php
fi

step "Node.js ${NODE_MAJOR} (NodeSource)"
if ! node --version 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
	curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
	apt-get install -yq nodejs
fi

step "Caddy (official repository)"
if ! command -v caddy >/dev/null; then
	curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
	curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' -o /etc/apt/sources.list.d/caddy-stable.list
	apt-get update -q
	apt-get install -yq caddy
fi

step "Firewall: open 80 and 443 (Oracle's Ubuntu images block them in iptables)"
if $HAS_SYSTEMD && command -v iptables >/dev/null && iptables -S INPUT 2>/dev/null | grep -q -- '-j REJECT'; then
	for port in 80 443; do
		if ! iptables -C INPUT -p tcp --dport "$port" -m state --state NEW -j ACCEPT 2>/dev/null; then
			# Insert directly above Oracle's catch-all REJECT rule; its position varies between
			# image versions (5 on current Ubuntu 24.04 images), and anything after it is unreachable.
			reject_line="$(iptables -L INPUT --line-numbers -n | awk '$2 == "REJECT" {print $1; exit}')"
			iptables -I INPUT "$reject_line" -p tcp --dport "$port" -m state --state NEW -j ACCEPT
		fi
	done
	command -v netfilter-persistent >/dev/null || apt-get install -yq iptables-persistent
	netfilter-persistent save
	echo "Remember: ports 80/443 must ALSO be open in the Oracle VCN security list."
else
	echo "Skipped (no REJECT rule found, or running in a container)."
fi

step "Hardening: SSH, fail2ban, unused services"
# Key-only SSH is Oracle's default; also refuse root and X11 forwarding outright.
cat > /etc/ssh/sshd_config.d/60-secret-santa.conf <<'SSHD'
PermitRootLogin no
X11Forwarding no
PasswordAuthentication no
KbdInteractiveAuthentication no
SSHD
chmod 644 /etc/ssh/sshd_config.d/60-secret-santa.conf
# fail2ban bans addresses that keep failing SSH logins (bots try hundreds a day). Ubuntu 24.04
# runs SSH as ssh.service, but the stock jail watches sshd.service, so point it at the right one.
apt-get install -yq fail2ban
cat > /etc/fail2ban/jail.d/secret-santa.local <<'JAIL'
[sshd]
enabled = true
journalmatch = _SYSTEMD_UNIT=ssh.service + _COMM=sshd
maxretry = 5
findtime = 10m
bantime = 1h
JAIL
if $HAS_SYSTEMD; then
	sshd -t && systemctl reload ssh
	systemctl enable fail2ban && systemctl restart fail2ban
	# rpcbind (NFS) comes with Oracle's image; nothing here uses it.
	systemctl disable --now rpcbind.service rpcbind.socket 2>/dev/null || true
fi

step "App code in ${APP_DIR}"
mkdir -p "$(dirname "$APP_DIR")"
if [ ! -d "$APP_DIR/.git" ]; then
	mkdir -p "$APP_DIR"
	chown "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"
	as_user git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
chown -R "$DEPLOY_USER":www-data "$APP_DIR"

step "Production .env (only created if missing; never overwritten)"
ENV_FILE="$APP_DIR/api/.env"
if [ ! -f "$ENV_FILE" ]; then
	random_hex() { php -r "echo bin2hex(random_bytes($1));"; }
	sed \
		-e "s/YOUR_HOSTNAME/${SITE_HOST}/g" \
		-e "s/^REVERB_APP_ID=.*/REVERB_APP_ID=$(php -r 'echo random_int(100000, 999999);')/" \
		-e "s/^REVERB_APP_KEY=.*/REVERB_APP_KEY=$(random_hex 10)/" \
		-e "s/^REVERB_APP_SECRET=.*/REVERB_APP_SECRET=$(random_hex 20)/" \
		"$APP_DIR/deploy/production.env.example" > "$ENV_FILE"
	chown "$DEPLOY_USER":www-data "$ENV_FILE"
	chmod 640 "$ENV_FILE"
	ENV_CREATED=true
else
	ENV_CREATED=false
fi

step "Writable folders for the app (storage, cache, SQLite database)"
touch "$APP_DIR/api/database/database.sqlite"
chown "$DEPLOY_USER":www-data "$APP_DIR/api/database/database.sqlite"
for dir in storage bootstrap/cache database; do
	chgrp -R www-data "$APP_DIR/api/$dir"
	chmod -R g+rwX "$APP_DIR/api/$dir"
	# setgid: new files created inside stay group www-data.
	find "$APP_DIR/api/$dir" -type d -exec chmod g+s {} +
done
# The database and storage (logs, uploads) are for the app only: no access for other accounts.
chmod -R o-rwx "$APP_DIR/api/database" "$APP_DIR/api/storage"

step "PHP dependencies, app key, migrations, caches"
cd "$APP_DIR/api"
as_user composer install --no-dev --optimize-autoloader --no-interaction
if $ENV_CREATED || ! grep -q '^APP_KEY=base64:' "$ENV_FILE"; then
	as_user php artisan key:generate --force
fi
as_app php artisan migrate --force
as_app php artisan config:cache
as_app php artisan route:cache
as_app php artisan event:cache

step "Build the React app"
cd "$APP_DIR/web"
as_user npm ci --no-audit --no-fund
as_user npm run build

step "Caddy config"
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy 2>/dev/null || true
sed "s/YOUR_HOSTNAME/${SITE_HOST}/g" "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
# validate runs as root and creates the log file root-only; the caddy service needs it.
chown -R caddy:caddy /var/log/caddy 2>/dev/null || true

step "Background services, backups and DuckDNS"
mkdir -p /etc/systemd/system /etc/sudoers.d /etc/cron.d
cp "$APP_DIR/deploy/secret-santa-queue.service" "$APP_DIR/deploy/secret-santa-reverb.service" /etc/systemd/system/
# The deploy user may restart these without a password (used by deploy/update.sh).
cat > /etc/sudoers.d/secret-santa <<SUDOERS
${DEPLOY_USER} ALL=(root) NOPASSWD: /usr/bin/systemctl restart secret-santa-queue secret-santa-reverb, /usr/bin/systemctl reload php${PHP_VERSION}-fpm
${DEPLOY_USER} ALL=(www-data) NOPASSWD: /usr/bin/php
SUDOERS
chmod 440 /etc/sudoers.d/secret-santa
visudo -cf /etc/sudoers.d/secret-santa

CRON_FILE=/etc/cron.d/secret-santa
{
	echo "# Managed by deploy/bootstrap.sh"
	echo "0 3 * * * root $APP_DIR/deploy/backup-database.sh"
	[ -f /etc/duckdns.env ] && echo "*/5 * * * * root $APP_DIR/deploy/duckdns-update.sh"
} > "$CRON_FILE"
chmod 644 "$CRON_FILE"
# Laravel's scheduler (exchange reminders); deploy/update.sh keeps it up to date.
install -m 644 "$APP_DIR/deploy/secret-santa-scheduler" /etc/cron.d/secret-santa-scheduler

if $HAS_SYSTEMD; then
	systemctl daemon-reload
	systemctl enable --now "php${PHP_VERSION}-fpm" caddy cron secret-santa-queue secret-santa-reverb
	systemctl reload caddy
	systemctl restart secret-santa-queue secret-santa-reverb
else
	echo "No systemd (container): start services by hand to test."
fi

step "Done"
cat <<DONE
Secret Santa is installed in ${APP_DIR} for https://${SITE_HOST}

Still to do by hand:
  1. Open ports 80 and 443 in the Oracle VCN security list (if not already).
  2. Put the Gmail app password (no spaces) in ${ENV_FILE} as MAIL_PASSWORD, then:
       sudo -u www-data php ${APP_DIR}/api/artisan config:cache
       sudo systemctl restart secret-santa-queue
  3. DuckDNS: create /etc/duckdns.env (root-only) with DUCKDNS_DOMAIN and DUCKDNS_TOKEN,
     then re-run this script to add the updater cron job.
DONE
$ENV_CREATED && echo "  (A fresh .env was created with new Reverb secrets and app key.)"
true
