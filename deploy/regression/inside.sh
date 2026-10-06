#!/usr/bin/env bash
# Runs inside the container (see run.sh). Upgrade regression: install the production commit,
# fill it with data through its own API, upgrade to HEAD like deploy/update.sh, then check the
# data, smoke-test features and run the test suites. Section 4 checks specific features:
# add checks there for whatever a deploy introduces.
set -uo pipefail
step() { printf '\n== %s\n' "$*"; }
fails=0
check() { if [ "$2" = "$3" ]; then echo "PASS $1"; else echo "FAIL $1: expected [$2] got [$3]"; fails=$((fails+1)); fi; }

setup_env() {
	cp ../deploy/production.env.example .env
	sed -i -e 's#^APP_URL=.*#APP_URL=http://localhost:8000#' -e 's#^FRONTEND_URL=.*#FRONTEND_URL=http://localhost:8000#' \
		-e 's#^SANCTUM_STATEFUL_DOMAINS=.*#SANCTUM_STATEFUL_DOMAINS=localhost:8000#' -e 's#^SESSION_SECURE_COOKIE=.*#SESSION_SECURE_COOKIE=false#' \
		-e 's#^MAIL_MAILER=.*#MAIL_MAILER=log#' -e 's#^BROADCAST_CONNECTION=.*#BROADCAST_CONNECTION=log#' -e 's#^LOG_CHANNEL=.*#LOG_CHANNEL=single#' .env
	# Debug level so the log mailer's emails are kept (production logs warnings and up).
	sed -i -e 's#^ADMIN_EMAIL=.*#ADMIN_EMAIL=#' -e 's#^LOG_LEVEL=.*#LOG_LEVEL=debug#' .env
}
serve() { PHP_CLI_SERVER_WORKERS=4 php artisan serve --no-reload --host=127.0.0.1 --port=8000 >/tmp/serve.log 2>&1 & SERVE_PID=$!; for _ in $(seq 30); do curl -sf http://127.0.0.1:8000/up >/dev/null && return; sleep 1; done; }
stop_serve() { kill "$SERVE_PID" 2>/dev/null; wait "$SERVE_PID" 2>/dev/null; }

# One cookie jar per person; Sanctum needs the SPA origin and the XSRF header.
as() { # user method path [json]
	local jar=/tmp/jar-$1 xsrf; [ -f "$jar" ] || curl -s -c "$jar" -b "$jar" http://localhost:8000/sanctum/csrf-cookie -o /dev/null
	xsrf=$(awk '$6=="XSRF-TOKEN"{print $7}' "$jar" | sed 's/%3D/=/g')
	curl -s -c "$jar" -b "$jar" -X "$2" "http://localhost:8000/api$3" -H 'Accept: application/json' -H 'Content-Type: application/json' \
		-H 'Referer: http://localhost:8000/' -H 'Origin: http://localhost:8000' -H "X-XSRF-TOKEN: $xsrf" ${4:+-d "$4"} -w '\n%{http_code}'
}
body() { sed '$d'; }
code() { tail -n1; }
db() { sqlite3 /app/api/database/database.sqlite "$1"; }

step "1. Install the production commit ($(cat /src/prod.rev)) like production"
mkdir -p /app && tar -xf /src/prod.tar -C /app && cd /app/api
composer install --no-dev --optimize-autoloader --no-interaction -q && setup_env && php artisan key:generate --force -q
touch database/database.sqlite && php artisan migrate --force -q && php artisan config:cache -q && php artisan route:cache -q && echo "installed $(cat /src/prod.rev)"
serve

step "2. Fill it with data through the old version's API"
for who in holly nick ivy; do
	as $who POST /auth/register "{\"name\":\"${who^}\",\"email\":\"$who@example.test\",\"password\":\"Correct-Horse-9\",\"password_confirmation\":\"Correct-Horse-9\"}" >/dev/null
done
gid=$(as holly POST /groups '{"name":"Upgrade Crew"}' | body | jq -r .id)
code=$(as holly GET /groups/$gid | body | jq -r .join_code)
as nick POST /groups/join "{\"join_code\":\"$code\"}" >/dev/null
as ivy POST /groups/join "{\"join_code\":\"$code\"}" >/dev/null
as holly PATCH /groups/$gid '{"name":"Upgrade Crew","description":"Budget $40"}' >/dev/null
lamp=$(as ivy POST /wishlist/items '{"name":"Reading lamp","price":45,"rating":4}' | body | jq -r .id)
socks=$(as ivy POST /wishlist/items '{"name":"Wool socks","rating":3,"quantity":2}' | body | jq -r .id)
boots=$(as ivy POST /wishlist/items '{"name":"Hiking boots","rating":5,"url":"https://example.com/boots"}' | body | jq -r .id)
as nick POST /wishlist/items '{"name":"Grill set","rating":3}' >/dev/null
check "old: holly claims lamp" 200 "$(as holly POST /wishlist/items/$lamp/claim '{"quantity":1}' | code)"
check "old: nick claims 1 sock" 200 "$(as nick POST /wishlist/items/$socks/claim '{"quantity":1}' | code)"
before_items=$(db "select count(*) from wishlist_items"); before_claims=$(db "select count(*) from wishlist_claims"); before_users=$(db "select count(*) from users"); before_members=$(db "select count(*) from group_user")
echo "before upgrade: users=$before_users members=$before_members items=$before_items claims=$before_claims"
stop_serve

step "3. Upgrade to HEAD like deploy/update.sh"
mkdir -p /new && tar -xf /src/head.tar -C /new
cp /app/api/.env /new/api/.env && cp /app/api/database/database.sqlite /new/api/database/database.sqlite
rm -rf /app && mv /new /app && cd /app/api
composer install --no-dev --optimize-autoloader --no-interaction -q
echo "--- migrations:"; php artisan migrate --force 2>&1 | grep -E "DONE|FAIL|rror"
php artisan config:cache -q && php artisan route:cache -q && php artisan event:cache -q && echo "caches built for $(cat /src/head.rev)"
check "users kept" "$before_users" "$(db 'select count(*) from users')"
check "memberships kept" "$before_members" "$(db 'select count(*) from group_user')"
check "items kept" "$before_items" "$(db 'select count(*) from wishlist_items')"
check "claims kept" "$before_claims" "$(db 'select count(*) from wishlist_claims')"
check "claimed_at backfilled" 0 "$(db 'select count(*) from wishlist_claims where claimed_at is null')"
check "existing items not suggestions" 0 "$(db 'select count(*) from wishlist_items where is_suggestion = 1 or received_at is not null')"
check "item foreign keys after rebuild" "users,users" "$(db "select group_concat(\"table\") from pragma_foreign_key_list('wishlist_items')")"
check "claims still point at items" 0 "$(db 'select count(*) from wishlist_claims c left join wishlist_items i on i.id = c.wishlist_item_id where i.id is null')"
check "foreign key check clean" "" "$(db 'pragma foreign_key_check')"
serve

step "4. New features over HTTP on the upgraded data"
ivy_id=$(as ivy GET /user | body | jq -r .id)
idea=$(as holly POST /users/$ivy_id/wishlist/suggestions '{"name":"Bookshop gift card","price":25}' | body | jq -r .id)
check "suggestion created" true "$( [ "$idea" != null ] && echo true )"
check "owner's list hides suggestion" 0 "$(as ivy GET /wishlist/items | body | jq '[.[] | select(.name == "Bookshop gift card")] | length')"
check "owner's member view hides suggestions" 0 "$(as ivy GET /users/$ivy_id/wishlist | body | jq '.suggestions | length')"
check "owner can't edit a suggestion" 403 "$(as ivy PATCH /wishlist/items/$idea '{"name":"x"}' | code)"
check "nick sees holly's suggestion" "Holly" "$(as nick GET /users/$ivy_id/wishlist | body | jq -r '.suggestions[0].suggestion.by')"
check "nick claims the suggestion" 200 "$(as nick POST /wishlist/items/$idea/claim '{"quantity":1}' | code)"
check "nick marks it bought" 200 "$(as nick POST /wishlist/items/$idea/claim/purchased | code)"
check "holly sees it bought" true "$(as holly GET /users/$ivy_id/wishlist | body | jq -r '.suggestions[0].claim.others[0].purchased')"
claim_id=$(as nick GET /users/$ivy_id/wishlist | body | jq -r ".items[] | select(.id == $lamp) | .claim.others[0].id")
check "old claim shows its date" true "$(as nick GET /users/$ivy_id/wishlist | body | jq -r ".items[] | select(.id == $lamp) | .claim.others[0].claimed_at != null")"
check "nick nudges holly's old claim" 204 "$(as nick POST /wishlist/claims/$claim_id/nudge | code)"
check "second nudge within 3 days refused" 422 "$(as nick POST /wishlist/claims/$claim_id/nudge | code)"
check "ivy can't nudge (owner)" 403 "$(as ivy POST /wishlist/claims/$claim_id/nudge | code)"
check "ivy marks boots received" 200 "$(as ivy POST /wishlist/items/$boots/received | code)"
check "received hidden from others" 0 "$(as nick GET /users/$ivy_id/wishlist | body | jq "[.items[] | select(.id == $boots)] | length")"
check "received kept for owner" true "$(as ivy GET /wishlist/items | body | jq -r ".[] | select(.id == $boots) | .received_at != null")"
check "owner never gets claim data" 0 "$(as ivy GET /wishlist/items | body | jq '[.[] | select(has("claim"))] | length')"
check "holly draws names" 200 "$(as holly POST /groups/$gid/draw '{}' | code)"
ivys_santa=$(db "select lower(u.name) from secret_santa_assignments a join users u on u.id = a.giver_id where a.group_id = $gid and a.receiver_id = $ivy_id")
check "ivy's santa asks her a question" 204 "$(as "$ivys_santa" POST /groups/$gid/santa-chat/my-person '{"body":"Do you like blue?"}' | code)"
check "ivy's card counts it unread" 1 "$(as ivy GET /groups/$gid | body | jq -r '.my_santa.unread_messages')"
check "ivy reads the question" "Do you like blue?" "$(as ivy GET /groups/$gid/santa-chat/my-santa | body | jq -r '.messages[0].body')"
check "ivy never learns who asked" null "$(as ivy GET /groups/$gid/santa-chat/my-santa | body | jq -c '.with')"
check "ivy marks it read" 204 "$(as ivy POST /groups/$gid/santa-chat/my-santa/read | code)"
check "owner sets exchange date and budget" 200 "$(as holly PATCH /groups/$gid "{\"exchange_date\":\"$(date -d '+2 months' +%F)\",\"budget_min\":30,\"budget_max\":50}" | code)"
check "card shows the budget" '{"min":30,"max":50}' "$(as nick GET /groups/$gid | body | jq -c '.budget')"
check "reminders run" 0 "$(php artisan app:send-exchange-reminders >/dev/null 2>&1; echo $?)"
check "reminders are scheduled" yes "$(php artisan schedule:list 2>/dev/null | grep -q 'app:send-exchange-reminders' && echo yes)"
lily=$(as holly POST /account/profiles '{"name":"Lily","kind":"child"}' | body | jq -r .id)
check "holly adds a kid profile" true "$( [ "$lily" != null ] && echo true )"
check "holly adds to lily's list" 201 "$(as holly POST /wishlist/items "{\"name\":\"Kite\",\"rating\":4,\"owner_id\":$lily}" | code)"
check "lily's list shows" Kite "$(as holly GET "/wishlist/items?owner=$lily" | body | jq -r '.[0].name')"
check "others can't see lily's list as hers" 403 "$(as nick GET "/wishlist/items?owner=$lily" | code)"
check "deploy announcement runs" 0 "$(php artisan app:announce-deploy test-version >/dev/null 2>&1; echo $?)"
echo "--- queued mail jobs: $(db 'select count(*) from jobs')"
php artisan queue:work --once --queue=default --stop-when-empty -q >/dev/null 2>&1 || true
php artisan queue:work --queue=default --stop-when-empty -q >/dev/null 2>&1 || true
check "nudge email rendered" 1 "$(grep -c 'Still getting Reading lamp for Ivy' storage/logs/laravel.log)"
# Once in the plain-text part and once in the HTML part, so just check it's there.
check "santa message email rendered" yes "$(grep -q 'has a question for you' storage/logs/laravel.log && echo yes)"
check "no failed jobs" 0 "$(db 'select count(*) from failed_jobs')"
stop_serve

step "5. Logs"
if grep -q '\.ERROR' storage/logs/laravel.log; then grep '\.ERROR' storage/logs/laravel.log | head -5; fails=$((fails+1)); else echo "PASS no errors logged"; fi

step "6. Full checks on this stack (PHP $(php -r 'echo PHP_VERSION;'), Node $(node -v))"
mkdir -p /dev-app && tar -xf /src/head.tar -C /dev-app && cd /dev-app/api
composer install --no-interaction -q 2>/dev/null
cp .env.example .env && php artisan key:generate -q
php artisan test --compact --colors=never >/tmp/phpunit.txt 2>&1; grep -E "Tests:" /tmp/phpunit.txt
grep -qE "Tests: +[0-9]+ passed" /tmp/phpunit.txt && ! grep -qE "failed|error" /tmp/phpunit.txt && echo "PASS phpunit" || { echo "FAIL phpunit"; tail -20 /tmp/phpunit.txt; fails=$((fails+1)); }
vendor/bin/phpstan analyse --no-progress --memory-limit=1G >/tmp/stan.txt 2>&1 && echo "PASS phpstan" || { echo "FAIL phpstan"; tail -20 /tmp/stan.txt; fails=$((fails+1)); }
vendor/bin/pint --test >/tmp/pint.txt 2>&1 && echo "PASS pint" || { echo "FAIL pint"; tail -5 /tmp/pint.txt; fails=$((fails+1)); }
cd ../web && npm ci --no-audit --no-fund --silent
npm run lint --silent >/tmp/lint.txt 2>&1 && grep -q "Found 0 warnings and 0 errors" /tmp/lint.txt && echo "PASS web lint" || { echo "FAIL web lint"; tail -10 /tmp/lint.txt; fails=$((fails+1)); }
npm run typecheck --silent >/tmp/tsc.txt 2>&1 && echo "PASS web typecheck" || { echo "FAIL web typecheck"; tail -10 /tmp/tsc.txt; fails=$((fails+1)); }
APP_VERSION=rehearsal npm run build --silent >/tmp/build.txt 2>&1 && echo "PASS web build" || { echo "FAIL web build"; tail -10 /tmp/build.txt; fails=$((fails+1)); }

echo; [ $fails -eq 0 ] && echo "REGRESSION PASSED" || { echo "REGRESSION FAILED ($fails)"; exit 1; }
