# Post-MVP Backlog

This backlog is explicitly outside the current MVP acceptance scope. MVP delivery remains limited to a normal-user mobile-first PWA with encrypted vault sync, password item management, secondary passwords, audit logging, PWA basics, and import/export entry points.

## P1 After MVP

### CSV Import / Export Templates

- Define CSV/JSON templates and field mapping.
- Validate imported records before encryption.
- Keep export warnings and audit logging.
- Acceptance direction: import/export templates are documented, validated, and covered by tests.

### Tags

- Tags are not created or managed in MVP.
- Add tag creation, editing, filtering, and assignment after the core item workflow is stable.
- Acceptance direction: users can manage tags without exposing sensitive item data.

### MFA

- Add a second factor for account login.
- Candidate methods: TOTP first, then recovery flow hardening.
- Acceptance direction: login requires the configured second factor and recovery is auditable.

## P2 Security Enhancements

### WebAuthn

- Add passkey-based authentication as an optional login hardening feature.
- Acceptance direction: users can register and revoke passkeys per device.

### Password Health Score

- Analyze password strength locally after decrypting vault data.
- Do not send plaintext passwords to the server.
- Acceptance direction: weak/reused/old passwords are flagged locally.

### Breach Detection

- Add privacy-preserving breach lookup.
- Candidate approach: k-anonymity API or locally cached prefix checks.
- Acceptance direction: no full plaintext password or full hash leaves the client.

## P3 Platform Expansion

### Browser Extension

- Build after the web vault data model and API are stable.
- Scope includes autofill, current-site matching, and secure unlock state sharing.
- Acceptance direction: extension never stores plaintext vault data outside the approved client crypto model.

### Native Apps

- Defer until PWA usability and sync semantics are proven.
- Acceptance direction: native clients reuse the same E2EE and audit model.
