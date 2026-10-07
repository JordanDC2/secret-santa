#!/usr/bin/env bash
# Copies the newest nightly backup off the server, encrypted, to an Oracle Object Storage bucket.
# Run by deploy/backup-database.sh right after it makes the backup (so also nightly, as root).
#
# Needs /etc/secret-santa/offsite.env (root-only, never in git) with:
#   OFFSITE_URL=https://objectstorage.<region>.oraclecloud.com/p/<token>/n/<namespace>/b/<bucket>/o/
#     (a write-only "pre-authenticated request" for the bucket; it can add files, never read them)
#   AGE_RECIPIENT=age1...
#     (the PUBLIC half of an age key pair; the private half lives only in the owner's password
#     manager, so nothing on this server can decrypt the off-site copies)
#
# To restore: download the .age file from the bucket in the Oracle console, then
#   age -d -i private-key.txt database-YYYY-MM-DD.sqlite.gz.age | gunzip > database.sqlite
set -euo pipefail

CONFIG=/etc/secret-santa/offsite.env
BACKUP_DIR=/var/backups/secret-santa
STATUS_FILE=/var/www/secret-santa/api/storage/app/backup-status.json

if [ ! -f "$CONFIG" ]; then
	echo "No $CONFIG yet; skipping the off-site copy."
	exit 0
fi
# shellcheck source=/dev/null
. "$CONFIG"
: "${OFFSITE_URL:?missing in $CONFIG}" "${AGE_RECIPIENT:?missing in $CONFIG}"

latest="$(ls -1t "$BACKUP_DIR"/database-*.sqlite.gz | head -n 1)"
encrypted="$(mktemp)"
trap 'rm -f "$encrypted"' EXIT
age -r "$AGE_RECIPIENT" -o "$encrypted" "$latest"

# Content-MD5 makes Oracle reject the upload if it arrives damaged, so a 200 means a good copy.
md5="$(openssl dgst -md5 -binary "$encrypted" | base64)"
curl -fsS --retry 3 -X PUT -H "Content-MD5: $md5" --data-binary "@$encrypted" \
	"${OFFSITE_URL}$(basename "$latest").age" -o /dev/null

# Let the admin page show when the last off-site copy went out (the time only).
if [ -f "$STATUS_FILE" ]; then
	tmp="$(mktemp)"
	sed "s/,\"offsite_finished_at\":\"[^\"]*\"//; s/}\$/,\"offsite_finished_at\":\"$(date -u +%FT%TZ)\"}/" "$STATUS_FILE" > "$tmp"
	install -m 644 -o www-data -g www-data "$tmp" "$STATUS_FILE"
	rm -f "$tmp"
fi
echo "Off-site copy uploaded: $(basename "$latest").age"
