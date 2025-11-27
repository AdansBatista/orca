# Appointment Self-Service

Purpose & Summary
Allow patients to view, book, reschedule, and cancel appointments from the portal.

API Endpoints
- `GET /api/v1/portal/appointments` — list patient appointments
- `POST /api/v1/portal/appointments` — book appointment
  - Request: { "slotId":"uuid", "appointmentType":"new-patient" }
- `PATCH /api/v1/portal/appointments/{id}` — reschedule/cancel

DB / Data Fields
- Appointment (id, patientId, providerId, startAt, endAt, status)

Sample Payloads
- Book request: { "slotId":"s1" } -> Response: { "appointmentId":"a1", "status":"confirmed" }

UI Notes
- Calendar view with available slots, confirmation modal, ability to add to external calendar

Acceptance Criteria
- Booking respects provider availability and resource constraints
- Confirmation message (SMS/Email) sent after booking

Integration Hooks
- Booking area: availability check and slot reservation
- Messaging Hub: send confirmation and reminders
