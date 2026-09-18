# Secret Santa

Monorepo containing:

- [`api/`](api) — Laravel API (Sanctum SPA auth, Actions, Policies), mirroring the pattern used in `cecdyn-api`.
- [`web/`](web) — React + TypeScript SPA (Vite), following the same conventions as `nvd-ui` / `nvr-ui`
  (path aliases, ESLint rules) but built with Vite instead of webpack.

## Status

`api/` is not yet scaffolded — this machine is missing PHP/Composer, and installing them via Homebrew is
currently blocked by outdated Command Line Tools. See setup below.

## Setup

### Command Line Tools (required once, before `api/` can be scaffolded)

```bash
sudo rm -rf /Library/Developer/CommandLineTools && sudo xcode-select --install
```

Then:

```bash
brew install php composer podman
```

### Frontend (`web/`)

```bash
cd web
npm install
npm start
```
