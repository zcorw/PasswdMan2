# Deployment Guide

## Overview

PasswdMan2 is deployed as a Docker Compose stack:

- PostgreSQL stores account metadata, encrypted vault metadata, encrypted password items, and audit records.
- FastAPI serves the `/api` backend.
- The frontend is a React/Vite PWA served by Nginx.
- The root Nginx reverse proxy serves the frontend and forwards `/api/` to the backend.

The GitHub Actions workflow at `.github/workflows/deploy.yml` builds and tests the project, creates a controlled deployment artifact, uploads it to a configured server directory over SSH with `rsync`, and optionally runs a server reload command.

The workflow does not store or print server credentials. All server-specific values must be provided through GitHub Secrets.

## Deployment Architecture

Repository source:

```text
frontend/  React + Vite + Yarn 4
backend/   FastAPI + Alembic
nginx/     reverse proxy config
```

GitHub Actions release artifact:

```text
deploy-artifact/
  docker-compose.yml
  DEPLOYMENT_ARTIFACT.txt
  backend/
    app/
    alembic/
    alembic.ini
    Dockerfile
    requirements.txt
  frontend/
    dist/
    nginx.conf
    Dockerfile
  nginx/
    conf.d/
```

The artifact intentionally uses the prebuilt `frontend/dist` directory. The generated runtime frontend Dockerfile only copies `dist` into the Nginx image, so the server does not need to rebuild the frontend from Yarn dependencies.

## GitHub Actions Workflow Behavior

The workflow is named `Deploy`.

Triggers:

- `push` to `main`
- manual `workflow_dispatch`

Build job:

1. Checks out the repository.
2. Sets up Python `3.11`.
3. Installs backend dependencies from `backend/requirements.txt`.
4. Runs backend tests with `pytest`.
5. Sets up Node `22`.
6. Enables Corepack and installs frontend dependencies with `yarn install --immutable`.
7. Runs frontend tests with `yarn test --run`.
8. Builds the frontend with `yarn build`.
9. Validates Docker Compose with `docker compose config`.
10. Verifies `frontend/dist/index.html` exists.
11. Creates and uploads the `passwdman2-deploy-artifact` workflow artifact.

Deploy job:

1. Downloads the workflow artifact.
2. Validates deployment secrets and rejects unsafe target directories such as `/`, `/opt`, `/var`, `/usr`, `/etc`, `/tmp`, and non-absolute paths.
3. Configures SSH using `DEPLOY_SSH_KEY`.
4. Uses `DEPLOY_KNOWN_HOSTS` when provided; otherwise it calls `ssh-keyscan`.
5. Creates `DEPLOY_TARGET_DIR` on the remote server.
6. Uploads the artifact to `DEPLOY_TARGET_DIR` with `rsync`.
7. Runs `SERVER_RELOAD_COMMAND` only when that optional secret is configured.

The workflow does not use `sudo` and does not run destructive cleanup on the server. It also does not use `rsync --delete`, so old files may remain until the server directory is cleaned manually.

## Required GitHub Secrets

Create these secrets in GitHub:

| Secret | Required | Purpose |
| --- | --- | --- |
| `DEPLOY_HOST` | Yes | Remote server hostname or IP address. |
| `DEPLOY_USER` | Yes | SSH user used for deployment. |
| `DEPLOY_PORT` | Yes | SSH port. Use `22` unless the server uses another port. |
| `DEPLOY_SSH_KEY` | Yes | Private key for the deployment SSH key pair. |
| `DEPLOY_TARGET_DIR` | Yes | Absolute dedicated deployment directory, for example `/opt/passwdman2`. |
| `DEPLOY_KNOWN_HOSTS` | No | Pinned SSH known_hosts entry. Recommended for production. |
| `SERVER_RELOAD_COMMAND` | No | Remote command to run after upload, for example a Docker Compose restart command. |

Never commit private keys, passwords, server IP addresses, tokens, or production `.env` files into the repository.

## Generate an SSH Deploy Key

Generate a dedicated key pair on your local machine:

```bash
ssh-keygen -t ed25519 -C "passwdman2-github-actions" -f ./passwdman2_deploy_key
```

Add the public key to the server deployment user:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat passwdman2_deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Add the private key contents to the GitHub secret `DEPLOY_SSH_KEY`.

Recommended: pin the server host key instead of relying on `ssh-keyscan` during deployment:

```bash
ssh-keyscan -p 22 your-server.example.com
```

Store the output as `DEPLOY_KNOWN_HOSTS`.

## Configure the Server User

The deployment user should:

- Have SSH access using the deploy key.
- Own the configured `DEPLOY_TARGET_DIR`.
- Be able to run Docker commands if `SERVER_RELOAD_COMMAND` uses Docker Compose.
- Not require `sudo` for normal deployment.

Example:

```bash
sudo useradd --create-home --shell /bin/bash deploy
sudo mkdir -p /opt/passwdman2
sudo chown -R deploy:deploy /opt/passwdman2
```

If Docker Compose is run by the deploy user, configure Docker permissions according to your server policy. Avoid granting broader privileges than required.

## Prepare the Target Directory

Use a dedicated directory for this project only:

```bash
mkdir -p /opt/passwdman2
```

Set GitHub secret:

```text
DEPLOY_TARGET_DIR=/opt/passwdman2
```

Do not point `DEPLOY_TARGET_DIR` to a shared system directory such as `/`, `/var`, `/usr`, `/etc`, or `/tmp`.

Production environment variables should live on the server in `/opt/passwdman2/.env` and should not be committed.

Example production `.env`:

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

## Configure Nginx

The repository includes `nginx/conf.d/default.conf` for the Docker Compose reverse proxy. It:

- Proxies `/api/` to the backend container.
- Serves frontend routes through the frontend Nginx container.
- Uses no-store caching for API responses.
- Uses no-cache behavior for HTML and service worker files.
- Uses immutable caching for built frontend assets.
- Sets baseline security headers.

For a production domain, terminate TLS at Nginx or an upstream load balancer. When TLS is enabled, set:

```env
SESSION_COOKIE_SECURE=true
```

If you use an external host-level Nginx, point it to the Compose Nginx service or expose the Compose Nginx port behind the host proxy.

## Optional Server Reload Command

The workflow only uploads files by default. To automatically restart the stack after upload, configure `SERVER_RELOAD_COMMAND`.

Example:

```bash
docker compose up -d --build && docker compose exec -T backend alembic upgrade head && docker compose ps
```

This command runs from `DEPLOY_TARGET_DIR`.

Do not configure a reload command until the server directory contains a valid production `.env` file and you have verified the command manually on the server.

## Trigger Deployment

Automatic deployment:

- Push to the `main` branch.

Manual deployment:

1. Open GitHub repository Actions.
2. Select `Deploy`.
3. Click `Run workflow`.
4. Choose the target branch.
5. Run the workflow.

The deploy job targets the GitHub Environment named `production`. Configure environment protection rules in GitHub if manual approval is required.

## Verify Deployment Success

In GitHub Actions:

- Confirm backend tests passed.
- Confirm frontend tests passed.
- Confirm `yarn build` passed.
- Confirm `docker compose config` passed.
- Confirm the `Upload artifact with rsync` step completed.
- If configured, confirm `SERVER_RELOAD_COMMAND` completed.

On the server:

```bash
cd /opt/passwdman2
ls -la
docker compose ps
curl -fsS http://localhost:8080/api/health
```

From a browser:

- Open the production domain.
- Verify the app shell loads.
- Verify login/register API calls reach `/api`.
- Verify service worker updates after a hard refresh.

## Manual Rollback

Before enabling automatic reload, keep a server-side backup of the previous deployment directory:

```bash
cp -a /opt/passwdman2 /opt/passwdman2.backup.$(date -u +"%Y%m%d%H%M%S")
```

Manual rollback example:

```bash
cd /opt
mv passwdman2 passwdman2.failed
mv passwdman2.backup.<timestamp> passwdman2
cd passwdman2
docker compose up -d --build
docker compose ps
```

Database rollback is separate and should only be done from a verified backup. Do not restore production database files casually, because rollback can discard new user data.

## Troubleshooting

`DEPLOY_TARGET_DIR must be an absolute path`

- Set `DEPLOY_TARGET_DIR` to a full path such as `/opt/passwdman2`.

`DEPLOY_TARGET_DIR must be a dedicated project directory`

- The workflow rejects broad system directories. Create a project-specific directory.

SSH host key errors

- Add `DEPLOY_KNOWN_HOSTS` with the server host key from `ssh-keyscan`.
- Confirm `DEPLOY_PORT` matches the SSH server port.

Permission denied during rsync

- Confirm the deploy public key exists in `~/.ssh/authorized_keys`.
- Confirm the deploy user owns `DEPLOY_TARGET_DIR`.

Docker command fails after upload

- Run the `SERVER_RELOAD_COMMAND` manually on the server first.
- Confirm `.env` exists in `DEPLOY_TARGET_DIR`.
- Confirm the deploy user can run Docker Compose.

Frontend loads but API fails

- Confirm Nginx proxies `/api/` to the backend.
- Confirm backend container is healthy.
- Confirm production uses the same origin for frontend and API.

Service worker shows stale content

- Hard refresh the browser.
- Confirm `/sw.js` is served with no-cache headers.
- Confirm the new artifact uploaded `frontend/dist`.

## Security Notes

- Use a dedicated deploy key for GitHub Actions.
- Use a dedicated server user with limited permissions.
- Keep production `.env` files only on the server or in a secure secret manager.
- Do not print secret values in scripts or logs.
- Avoid `sudo` in deployment automation.
- Avoid `rsync --delete` unless `DEPLOY_TARGET_DIR` is dedicated to this project and backups exist.
- Review `SERVER_RELOAD_COMMAND` carefully; it can run arbitrary shell commands on the server.
- Keep database backups encrypted and access-controlled.
