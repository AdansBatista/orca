# Webhooks & Provider Callbacks

Purpose
This document defines the webhook contracts and replay/testing guidance for external provider callbacks (SMS/Email delivery receipts) and internal event webhooks used by the Patient Communications area. Focus is on documenting payloads, security, replay testing, and acceptance criteria — implementation teams will use this as a reference.

Provider Webhooks (Outbound Providers)

1) Twilio (SMS) — Delivery Receipt Example
- Callback URL (configurable per tenant): `POST /internal/webhooks/twilio/delivery`
- Security: Validate `X-Twilio-Signature` header; use configured webhook secret
- Sample payload (application/x-www-form-urlencoded):

  MessageSid=SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&MessageStatus=delivered&To=%2B15550100&From=%2B15550011&Timestamp=2025-12-01T09%3A35%3A00Z

- Key mapping:
  - `MessageSid` -> providerMessageId
  - `MessageStatus` -> status (delivered, failed, undelivered)

2) SendGrid (Email) — Event Webhook Example
- Callback URL: `POST /internal/webhooks/sendgrid/events`
- Security: Validate signature via `X-Twilio-Email-Event-Webhook-Signature` or use API key verification; configure retry behavior for 5xx
- Sample payload (application/json):

  [
    {
      "email": "alex@example.com",
      "event": "delivered",
      "sg_message_id": "<abc123==>"
    }
  ]

- Key mapping:
  - `sg_message_id` -> providerMessageId
  - `event` -> status (delivered, bounce, drop)

Internal Webhook Contracts

- `POST /internal/events/appointment.scheduled`
  - Payload: { "eventType":"appointment.scheduled", "patientId":"uuid", "appointmentId":"uuid", "startAt":"ISO8601" }

- `POST /internal/events/lab.result.released`
  - Payload: { "eventType":"lab.result.released", "patientId":"uuid", "resultId":"uuid", "releasePolicy":"auto|provider_hold" }

Replay & Testing Guidance

- Keep a set of replay fixtures under `tests/doc-fixtures/patient-communications/` (already included). Use these fixtures to replay provider webhooks during integration tests.
- Replay instructions:
  1. Configure your local dev server to accept POSTs to the internal webhook endpoints.
  2. For Twilio-like form payloads, POST `application/x-www-form-urlencoded` body and set the `X-Twilio-Signature` header using your test secret.
  3. For SendGrid-like JSON events, POST application/json array payloads and verify signature header behavior if enabled.

Security & Operational Notes
- Always validate provider signatures and reject requests lacking correct signatures with 401.
- Implement idempotency on webhook processing: providers can resend events — dedupe by providerMessageId or event id.
- Log raw payloads to a secure store (with PHI redaction policy) for replay and debugging, respecting retention rules.

Acceptance Criteria for Webhook Handling
- Provider webhook received and validated (signature) within 2s.
- Delivery status mapped to internal Message record and persisted to history.
- Duplicates deduplicated using providerMessageId and idempotencyKey.
- Retryable errors cause 5xx to provider to trigger provider retry (avoid 2xx until processed).
