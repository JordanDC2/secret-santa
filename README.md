# Secret Santa

Monorepo containing:

- [`api/`](api) — Laravel 13 API (Sanctum SPA auth, Actions, Policies), mirroring the pattern used in `cecdyn-api`.
- [`web/`](web) — React + TypeScript SPA (Vite, Mantine, TanStack Query), linted with Oxlint and formatted with Oxfmt.

## Prerequisites

PHP and Composer come from the native Apple Silicon Homebrew at `/opt/homebrew`:

```bash
brew install php composer
```

## First-time setup

```bash
cd api && composer install && cp .env.example .env && php artisan key:generate && php artisan migrate
cd ../web && npm install
```

Email goes out through Gmail SMTP from `secretsantamailerclient@gmail.com`. Set `MAIL_PASSWORD` in
`api/.env` to a Google app password for that account (requires 2-Step Verification), not its login
password.

## Running locally

Run each in its own terminal:

```bash
cd api && php artisan serve --no-reload                       # API on :8000
cd api && php artisan queue:work --queue=broadcasts,default   # live updates, then emails
cd api && php artisan reverb:start                            # WebSockets on :8080
cd web && npm start                                           # app on :3001
```

Restart `serve` and `queue:work` after changing `api/.env`; both keep the values they started with.

Live updates: Reverb pushes "something changed" events (group joins/leaves/draws/deletes,
wishlist edits and claims) and the page re-fetches through the API. Vite proxies `/app` to
Reverb and reads the `VITE_REVERB_*` values from `api/.env`. A wishlist's owner can't
subscribe to their own list's channel, so claims never reach them.

Assignment emails are queued, so nothing is sent unless the queue worker is running.
When testing with fake addresses, run only `php artisan queue:work --queue=broadcasts`
so live updates work but no email goes out.
Failed sends retry automatically; ones that exhaust their retries land in `failed_jobs`
(`php artisan queue:failed`, `php artisan queue:retry all`).

## Checks

```bash
cd api && ./vendor/bin/pint --test && composer analyse && php artisan test
cd web && npm run format && npm run lint && npm run typecheck && npm run build
```
