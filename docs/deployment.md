# Deployment Baseline

PasswdMan2 is deployed with Docker Compose, PostgreSQL, the FastAPI backend, the static frontend image, and an Nginx reverse proxy.

## Environment

Copy `.env.example` to `.env` and change at least `POSTGRES_PASSWORD` before using a persistent environment.

Important variables:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
- `BACKEND_CORS_ORIGINS`
- `SESSION_COOKIE_SECURE`, set to `true` when TLS terminates before the application
- `SESSION_COOKIE_SAMESITE`

## Nginx

The reverse proxy serves the frontend and forwards `/api/` to the backend. It sets:

- `Cache-Control: no-store` for `/api/`
- `Cache-Control: no-cache` for `/sw.js` and HTML route fallback
- short cache for `/manifest.webmanifest`
- immutable long cache for `/assets/`
- baseline security headers including `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`

TLS should terminate at Nginx or an upstream load balancer. When TLS is enabled, use secure cookies.

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
