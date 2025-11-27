# Patient Profile Management

Purpose & Summary
Manage patient profiles, contact info, preferences, and linked family members.

API Endpoints
- `GET /api/v1/portal/profile` — fetch profile (auth)
- `PATCH /api/v1/portal/profile` — update profile
  - Request: { "contact": { "phone":"", "address":"" }, "preferences": {} }

DB / Data Fields
- Patient (id, firstName, lastName, dob, contact, primaryPhone)
- NotificationPreference linked to Patient

Sample Payloads
- Response example: { "id":"p1","firstName":"Jane","contact":{...} }

UI Notes
- Profile screen with editable contact, emergency contact, and preferences

Acceptance Criteria
- Changes saved with optimistic UI and conflict handling
- Contact updates validated and normalized (E.164 phone)

Integration Hooks
- CRM: updates on contact change
- Messaging Hub: refresh notification preferences
