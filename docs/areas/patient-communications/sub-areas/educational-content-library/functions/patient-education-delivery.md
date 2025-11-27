# Patient Education Delivery

Purpose & Summary
Deliver educational content to patients via portal, email, or in-app messages with schedule and preference controls.

API Endpoints
- `POST /api/v1/content/deliver` — schedule delivery
  - Request: { "contentId":"uuid","patientId":"uuid","channel":"email|in-app", "sendAt":"ISO8601" }

DB / Data Fields
- ContentDelivery (id, contentId, patientId, channel, sendAt, status)

Sample Payloads
- { "contentId":"c1","patientId":"p1","channel":"email","sendAt":"2025-12-01T10:00:00Z" }

UI Notes
- Delivery scheduling UI with audience selection and preview

Acceptance Criteria
- Delivery respects notification preferences and allowed windows
- Delivery success/failure logged to message history

Integration Hooks
- Messaging Hub for sending messages
- Campaign engine for scheduled content drips
