# Message History & Logging

Purpose & Summary
Persist message history, store delivery receipts, and provide search and export capabilities for audits.

API Endpoints
- `GET /api/v1/messaging/history?patientId={}` — list messages
  - Response: [ { message } ]

DB / Data Fields
- MessageHistory (id, messageId, patientId, channel, content, status, sentAt, deliveredAt, providerData, rawRequest)

Sample Payloads
- GET response example: [ { "messageId":"m1", "channel":"sms", "status":"delivered" } ]

UI Notes
- Audit UI with export CSV and filters (date, patient, provider, status)

Acceptance Criteria
- Historical messages searchable within 1s for a 1M-row dataset (pagination)
- Export respects PHI access controls

Integration Hooks
- Audit service; retention/purge scheduler
