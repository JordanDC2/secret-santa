#!/usr/bin/env bash
# Rehearses a deploy in Podman before running deploy/update.sh on the server: installs the
# commit production is on, fills it with data through its own API, upgrades to HEAD the way
# update.sh does (migrations included), then checks the data survived, smoke-tests features
# over HTTP and runs PHPUnit, PHPStan, Pint and the web lint/typecheck/build. Mail and
# broadcasts are only logged inside the container; nothing is sent.
#
# Usage, from the repo root: bash deploy/regression/run.sh <production-commit>
#   e.g. bash deploy/regression/run.sh "$(ssh <server> git -C /var/www/secret-santa rev-parse HEAD)"
set -euo pipefail

prod="${1:?Pass the commit production is running}"
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

podman build -q -t secret-santa-regression -f "$here/Containerfile" "$here" >/dev/null
git archive --format=tar "$prod" -o "$work/prod.tar"
git archive --format=tar HEAD -o "$work/head.tar"
git rev-parse --short "$prod" >"$work/prod.rev"
git rev-parse --short HEAD >"$work/head.rev"
cp "$here/inside.sh" "$work/inside.sh"

podman run --rm -v "$work:/src:ro" secret-santa-regression bash /src/inside.sh
