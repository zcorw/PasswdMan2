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
npm install
npm run dev
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
npm --version
python --version
docker --version
docker compose version

cd frontend
npm install
npm run build

cd ..\backend
python -m compileall app
python -c "from app.main import app; print(app.title)"

cd ..
docker compose config
```

## Dependency Policy

Use mature, actively maintained third-party libraries when they fit the requirement, license, security posture, and stack. This is especially important for cryptography, password hashing, validation, PWA tooling, and test frameworks. Project-specific business rules and data models remain local implementation work.
