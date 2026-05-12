# Testing Guide

PasswdMan2 currently uses stable local checks that do not require external services:

- Backend API/security tests: run `pytest` from `backend/`.
- Frontend unit/static UI/PWA checks: run `yarn test --run` from `frontend/`.
- Frontend production build/type check: run `yarn build` from `frontend/`.
- Diff hygiene: run `git diff --check` from the repo root.

Covered areas:

- X25519 + AES-GCM transport replay/tamper checks.
- Authentication, sessions, vault sync, password item API, audit logs, and cache headers.
- Client vault crypto, Vault Key rewrap, password generator, secondary password management, route map, detail icon rules, and PWA cache policy.

Planned expansion:

- Add Playwright mobile viewport tests once browser binaries are part of the development image.
- Add Lighthouse PWA checks in CI after a stable preview server workflow exists.
- Add frontend API integration tests when the real data layer replaces mock UI data.
