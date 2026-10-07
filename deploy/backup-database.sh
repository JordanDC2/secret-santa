#!/usr/bin/env bash
# Nightly SQLite backup. Uses sqlite3's online .backup so it's safe while the app is running.
# Keeps the 14 newest copies. Install: see deploy/update.sh comments or the cron line below.
#   0 3 * * * /var/www/secret-santa/deploy/backup-database.sh
set -euo pipefail

DATABASE=/var/www/secret-santa/api/database/database.sqlite
BACKUP_DIR=/var/backups/secret-santa
KEEP=14

# Backups hold everyone's data: root-only folder and files.
umask 077
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
sqlite3 "$DATABASE" ".backup '$BACKUP_DIR/database-$(date +%F).sqlite'"
gzip -f "$BACKUP_DIR/database-$(date +%F).sqlite"
ls -1t "$BACKUP_DIR"/database-*.sqlite.gz | tail -n +$((KEEP + 1)) | xargs -r rm --

# Tell the admin page when this last ran. It can't see the root-only backups, so leave a small
# note it can read: just the time and the size, nothing from the database.
STATUS_FILE=/var/www/secret-santa/api/storage/app/backup-status.json
printf '{"finished_at":"%s","bytes":%s}\n' "$(date -u +%FT%TZ)" "$(stat -c %s "$BACKUP_DIR/database-$(date +%F).sqlite.gz")" > "$STATUS_FILE"
chown www-data:www-data "$STATUS_FILE"
chmod 644 "$STATUS_FILE"

