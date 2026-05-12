# PasswdMan2

PasswdMan2 is a personal password manager PWA. The MVP is scoped to normal users only and excludes teams, admins, sharing, browser extensions, native apps, full import/export, and full offline vault support.

## Project Layout

- `frontend/`: React + TypeScript + Vite + MUI PWA shell.
- `backend/`: Python + FastAPI API service skeleton.
- `nginx/`: reverse proxy and static frontend serving baseline.
- `docs/`: product, security, API, UI, and implementation planning documents.

## Local Development

Frontend:

```powershell
cd frontend
corepack enable
yarn install
yarn dev
```

Backend:

```powershell
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Docker Compose:

```powershell
docker compose up --build
```

Default local URLs:

- Frontend through Nginx: `http://localhost:8080`
- Backend through Nginx: `http://localhost:8080/api/health`
- Backend direct: `http://localhost:8000/api/health`
- Vite dev server: `http://localhost:5173`

## Validation

```powershell
node --version
corepack --version
yarn --version
python --version
docker --version
docker compose version

cd frontend
yarn install
yarn build

cd ..\backend
python -m pip install -r requirements.txt
python -m compileall app
python -c "from app.main import app; print(app.title)"
pytest
$env:DATABASE_URL='sqlite:///./.alembic-check.db'; alembic current

cd ..
docker compose config
```

## Test Gates

See `docs/testing.md` for the current test matrix. The core local gates are:

```powershell
cd backend
pytest

cd ..\frontend
yarn test --run
yarn build

cd ..
git diff --check
```

## MVP Boundary

Post-MVP features are tracked in `docs/backlog.md`. Tags, full import/export templates, MFA, WebAuthn, password health scoring, breach detection, browser extensions, and native apps are outside the current MVP acceptance scope.

## Dependency Policy

Use mature, actively maintained third-party libraries when they fit the requirement, license, security posture, and stack. This is especially important for cryptography, password hashing, validation, PWA tooling, and test frameworks. Project-specific business rules and data models remain local implementation work.

## Frontend Rules

- The frontend package manager is Yarn 4. Use `corepack enable` and run frontend commands with `yarn`; do not add npm or pnpm lockfiles.
- Future frontend UI implementation must align with the current Figma design baseline for layout, component behavior, icon-only detail actions, mobile-first breakpoints, and MUI component mapping.
- Before reviewing frontend UI tasks, compare the implemented screen against the relevant Figma view and note any intentional differences.
