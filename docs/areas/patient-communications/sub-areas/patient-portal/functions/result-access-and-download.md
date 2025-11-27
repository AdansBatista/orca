# Result Access & Download

Purpose & Summary
Allow patients to view and download lab and imaging results according to release policy.

API Endpoints
- `GET /api/v1/portal/results` — list available results
- `GET /api/v1/portal/results/{id}` — fetch result details and attachments

DB / Data Fields
- ResultRecord (id, patientId, reportId, releasePolicy, releasedAt, accessLog)

Sample Payloads
- GET /results -> [ { "id":"r1", "testName":"CBC", "releasedAt":"..." } ]

UI Notes
- Results list with sensitive result warning, download PDF, and clinician comment thread

Acceptance Criteria
- Respect lab result release policy (e.g., delayed release if provider holds)
- Track downloads in audit log

Integration Hooks
- Lab Work Management: `lab.result.released` event
- Messaging Hub: notify patient when results are available
