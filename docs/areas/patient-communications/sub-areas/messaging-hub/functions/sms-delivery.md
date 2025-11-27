# SMS Delivery

Purpose & Summary
Send SMS messages for appointment reminders, confirmations, campaign messages, and transactional alerts.

API Endpoints
- `POST /api/v1/messaging/sms` — enqueue SMS
  - Request:
    {
      "patientId": "uuid",
      "templateId": "uuid",
      "variables": {"appointment.date":"2025-12-01"},
      "idempotencyKey": "string"
    }
  - Response:
    { "messageId": "uuid", "status": "queued" }

DB / Data Fields
- Message (id, patientId, channel='sms', content, status, providerMessageId, sentAt, deliveredAt)

Sample Payloads
- Request example shown above
- Response: { "messageId": "3f2b...", "status": "queued" }

UI Notes
- Admin queue view with filter by status/provider; retry button and failure reason.

Acceptance Criteria
- API returns 202 with messageId
- Provider adapter receives send request and returns providerMessageId
- Delivery receipts update message status to delivered or failed

Integration Hooks
- Booking: `appointment.scheduled` can trigger SMS via campaign engine
- Providers: Twilio webhook for delivery receipts
