# Email Delivery

Purpose & Summary
Send transactional and campaign emails with templating, personalization, and tracking.

API Endpoints
- `POST /api/v1/messaging/email` — enqueue email
  - Request: { "patientId":"uuid", "templateId":"uuid", "variables":{}, "idempotencyKey":"" }
  - Response: { "messageId":"uuid", "status":"queued" }

DB / Data Fields
- Message model for channel='email'; store subject, html/text body, attachments, providerMessageId

Sample Payloads
- Request: { "patientId":"p1","templateId":"t1","variables":{"portal.link":"https://"} }

UI Notes
- Template preview and spam-score indicator; digest view for sent messages

Acceptance Criteria
- Email queued and provider accepted request
- Bounce and complaint handling updates message status and suppression lists

Integration Hooks
- Booking for confirmations and reschedules
- External Email provider webhooks (SendGrid events)
