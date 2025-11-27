# SME Review Checklist — Patient Communications

Purpose
Checklist for subject-matter experts (clinical, security/compliance, product) to validate the Patient Communications documentation before engineering handoff.

Checklist Items
- Area Overview: Does the README correctly describe scope, owner, and integration points?
- Functional Specs: For each function, confirm Purpose, API endpoints, DB fields, sample payloads, UI notes, and acceptance criteria.
- Data Models: Check Message, Campaign, Template, NotificationPreference, PatientPortalAccount models for completeness and PK/FK relationships.
- Consent & Compliance: Confirm consent flows, opt-out handling, retention and audit requirements.
- Webhooks: Validate provider webhook payload mappings (Twilio, SendGrid) and internal event contracts.
- Security: Confirm signature validation, secrets storage, and PHI redaction guidance.
- Testing: Verify CI fixtures and replay instructions cover common and edge cases.
- Operational: Confirm monitoring/alerting suggestions and provider failover strategy.

Review Process
- SME to add comments inline in repo (or via PR) and mark items `Reviewed`/`Needs changes`.
- Engagement lead to address items and re-submit for final sign-off.
