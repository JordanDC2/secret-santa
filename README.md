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
cd api && php artisan serve --no-reload   # API on :8000
cd api && php artisan queue:work          # delivers assignment emails
cd web && npm start                       # app on :3000
```

Assignment emails are queued, so nothing is sent unless the queue worker is running.
Failed sends retry automatically; ones that exhaust their retries land in `failed_jobs`
(`php artisan queue:failed`, `php artisan queue:retry all`).

## Checks

```bash
cd api && ./vendor/bin/pint --test && php artisan test
cd web && npm run format && npm run lint && npm run typecheck && npm run build
```
