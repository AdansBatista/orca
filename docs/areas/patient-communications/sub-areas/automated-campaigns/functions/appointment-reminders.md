# Appointment Reminders

Purpose & Summary
Schedule and send appointment reminders with configurable sequences and channel preferences.

API Endpoints
- `POST /api/v1/campaigns/appointment-reminders` — create reminder rule
  - Request: { "appointmentType":"string","offsetMinutes":1440, "channels":["sms","email"] }

DB / Data Fields
- ReminderRule (id, appointmentType, offsetMinutes, channels, enabled)
- ScheduledSend (id, messageId, sendAt, status)

Sample Payloads
- Create reminder rule example above

UI Notes
- UI for configuring rules per appointment type with preview of generated messages

Acceptance Criteria
- Reminders created for upcoming appointments according to rule
- Respect patient notification preferences and allowed time windows

Integration Hooks
- Booking area for scheduled appointments to create ScheduledSend
- Messaging Hub for send execution
