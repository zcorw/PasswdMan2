# PasswdMan2

PasswdMan2 is a personal password manager PWA.

## Project Lineage

PasswdMan2 is the second-generation implementation of the PasswdMan
password manager.

The original version used a separated frontend/backend architecture:

| Version | Repository                                                    | Role                   | Stack                     |
| ------- | ------------------------------------------------------------- | ---------------------- | ------------------------- |
| v1      | [PasswdMan-ui](https://github.com/zcorw/PasswdMan-ui)         | Frontend               | Vue 3, TypeScript, Vite   |
| v1      | [PasswdMan-server](https://github.com/zcorw/PasswdMan-server) | Backend                | NestJS, TypeScript, MySQL |
| v2      | **PasswdMan2**                                                | Full-stack application | React, FastAPI, PWA       |

PasswdMan2 is a redesign rather than an in-place upgrade. It consolidates
the frontend and backend into a single repository and revisits the
application architecture, UI, security model, and product scope.

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

- Frontend through Nginx: `http://localhost:6084`
- Backend through Nginx: `http://localhost:6084/api/health`
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

## Dependency Policy

Use mature, actively maintained third-party libraries when they fit the requirement, license, security posture, and stack. This is especially important for cryptography, password hashing, validation, PWA tooling, and test frameworks. Project-specific business rules and data models remain local implementation work.

## Frontend Rules

- The frontend package manager is Yarn 4. Use `corepack enable` and run frontend commands with `yarn`; do not add npm or pnpm lockfiles.
- Future frontend UI implementation must align with the current Figma design baseline for layout, component behavior, icon-only detail actions, mobile-first breakpoints, and MUI component mapping.
- Before reviewing frontend UI tasks, compare the implemented screen against the relevant Figma view and note any intentional differences.
