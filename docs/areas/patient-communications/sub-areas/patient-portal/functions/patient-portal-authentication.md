# Patient Portal Authentication

Purpose & Summary
Authenticate patients for portal access, support password login, passwordless (magic link), and OAuth2 SSO. Integrates with Auth area for centralized identity.

API Endpoints
- `POST /api/v1/portal/login` — email+password
  - Request: { "email":"", "password":"" }
  - Response: { "token":"jwt", "expiresIn":3600, "patientId":"uuid" }
- `POST /api/v1/portal/magic-link` — request magic link
  - Request: { "email":"" }
  - Response: { "status":"sent" }
- `POST /api/v1/portal/logout` — invalidate session

DB / Data Fields
- PatientPortalAccount (id, patientId, email, passwordHash, lastLogin, settings)
- Session (id, patientId, tokenHash, expiresAt, revoked)

Sample Payloads
- Login request/response shown above

UI Notes
- Login screen with email/password and 'Send me a link' option; account recovery flow

Acceptance Criteria
- Successful login returns JWT and patient profile
- Magic link expires within configured window (e.g., 15 minutes)
- Failed login does not leak whether email exists

Integration Hooks
- Auth area for centralized identity management and rate-limiting
- Audit logging for login events
