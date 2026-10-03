#!/usr/bin/env bash
# Nightly SQLite backup. Uses sqlite3's online .backup so it's safe while the app is running.
# Keeps the 14 newest copies. Install: see deploy/update.sh comments or the cron line below.
#   0 3 * * * /var/www/secret-santa/deploy/backup-database.sh
set -euo pipefail

DATABASE=/var/www/secret-santa/api/database/database.sqlite
BACKUP_DIR=/var/backups/secret-santa
KEEP=14

mkdir -p "$BACKUP_DIR"
sqlite3 "$DATABASE" ".backup '$BACKUP_DIR/database-$(date +%F).sqlite'"
gzip -f "$BACKUP_DIR/database-$(date +%F).sqlite"
ls -1t "$BACKUP_DIR"/database-*.sqlite.gz | tail -n +$((KEEP + 1)) | xargs -r rm --
