# Deployment Baseline

PasswdMan2 is deployed with Docker Compose, PostgreSQL, the FastAPI backend, the static frontend image, and an Nginx reverse proxy.

## Environment

Copy `.env.example` to `.env` and change at least `POSTGRES_PASSWORD` before using a persistent environment.

Important variables:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
- `APP_ENV`, set to `production` for production deployments
- `BACKEND_CORS_ORIGINS`, used only outside production. When `APP_ENV=production`, cross-origin browser access is disabled and this value is ignored.
- `SESSION_COOKIE_SECURE`, set to `true` when TLS terminates before the application
- `SESSION_COOKIE_SAMESITE`

Production should serve the PWA and API from the same origin through Nginx, for example `https://pass.example.com` and `https://pass.example.com/api`. Do not expose the API for cross-origin frontend access in production.

## Nginx

The reverse proxy serves the frontend and forwards `/api/` to the backend. It sets:

- `Cache-Control: no-store` for `/api/`
- `Cache-Control: no-cache` for `/sw.js` and HTML route fallback
- short cache for `/manifest.webmanifest`
- immutable long cache for `/assets/`
- baseline security headers including `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`

TLS should terminate at Nginx or an upstream load balancer. When TLS is enabled, use secure cookies.

## Manual Deployment

Use this flow when deploying from a checked-out repository on the target server.

Prerequisites:

- Docker Engine and Docker Compose plugin are installed on the server.
- The deployment user can run Docker commands.
- DNS points the production domain to the server or upstream load balancer.
- TLS is terminated by Nginx or by an upstream load balancer.

Prepare the server:

```powershell
git clone <repository-url> PasswdMan2
cd PasswdMan2
Copy-Item .env.example .env
```

Edit `.env` before starting the stack:

```env
APP_ENV=production
POSTGRES_DB=passwdman2
POSTGRES_USER=passwdman2
POSTGRES_PASSWORD=<strong-production-password>
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
BACKEND_CORS_ORIGINS=
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=lax
```

Build and start:

```powershell
docker compose build
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose ps
```

Verify the deployment:

```powershell
docker compose exec backend python -c "from app.main import app; print(app.title)"
Invoke-WebRequest http://localhost:8080/api/health
```

Upgrade an existing manual deployment:

```powershell
git fetch --all --prune
git checkout <release-branch-or-tag>
git pull --ff-only
docker compose build
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose ps
```

Rollback uses the same flow with the previous release tag or commit. Restore the database from backup only when the rollback requires reverting migrated data.

## Automated Deployment

The recommended automated flow is:

1. CI runs backend tests, frontend tests, frontend build, and `docker compose config`.
2. CI builds the backend and frontend images.
3. CI deploys to the production server over SSH.
4. The server pulls the selected release, rebuilds images or pulls published images, starts the stack, runs Alembic migrations, and verifies `/api/health`.

Required CI secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`, for example `/opt/passwdman2`
- Production `.env` values stored on the server or supplied by the CI secret store

Example GitHub Actions workflow:

```yaml
name: deploy

on:
  workflow_dispatch:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Backend tests
        working-directory: backend
        run: |
          pip install -r requirements.txt
          pytest

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: yarn
          cache-dependency-path: frontend/yarn.lock

      - name: Frontend tests and build
        working-directory: frontend
        run: |
          corepack enable
          yarn install --immutable
          yarn test --run
          yarn build

      - name: Compose validation
        run: docker compose config

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            set -e
            cd "${{ secrets.DEPLOY_PATH }}"
            git fetch --all --prune
            git checkout main
            git pull --ff-only
            docker compose build
            docker compose up -d
            docker compose exec -T backend alembic upgrade head
            docker compose exec -T backend python -c "from app.main import app; print(app.title)"
            docker compose ps
```

For production, keep the `.env` file outside source control on the server. Ensure it sets `APP_ENV=production`, `SESSION_COOKIE_SECURE=true`, and does not enable cross-origin frontend access.

## Database Backup

Create a backup:

```powershell
docker compose exec postgres pg_dump -U $env:POSTGRES_USER -d $env:POSTGRES_DB -Fc -f /tmp/passwdman2.dump
docker compose cp postgres:/tmp/passwdman2.dump ./backups/passwdman2.dump
```

Restore a backup into an empty database:

```powershell
docker compose cp ./backups/passwdman2.dump postgres:/tmp/passwdman2.dump
docker compose exec postgres pg_restore -U $env:POSTGRES_USER -d $env:POSTGRES_DB --clean --if-exists /tmp/passwdman2.dump
```

Backups contain encrypted vault data and account metadata. Store them with the same care as production database files.
