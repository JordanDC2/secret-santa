#!/usr/bin/env bash
# Keeps the DuckDNS hostname pointed at this server's public IP. Run every 5 minutes:
#   */5 * * * * /var/www/secret-santa/deploy/duckdns-update.sh
# Reads DUCKDNS_DOMAIN (e.g. jordan-santa) and DUCKDNS_TOKEN from /etc/duckdns.env,
# which only root can read, so the token never lands in git.
set -euo pipefail
source /etc/duckdns.env
curl -fsS "https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=" -o /var/log/duckdns.log
