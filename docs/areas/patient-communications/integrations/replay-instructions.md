# Webhook Replay Instructions

Purpose
This document describes how to replay webhook fixtures for testing and CI validation of the Patient Communications webhook handlers. All replay is documentation-only: use these fixtures with your local or staging webhook endpoints.

Files (fixtures)
- `tests/doc-fixtures/patient-communications/webhook-twilio-delivery.form` — Twilio delivered (x-www-form-urlencoded)
- `tests/doc-fixtures/patient-communications/webhook-twilio-failed.form` — Twilio failed delivery
- `tests/doc-fixtures/patient-communications/webhook-sendgrid-delivered.json` — SendGrid delivered event
- `tests/doc-fixtures/patient-communications/webhook-sendgrid-bounce.json` — SendGrid bounce event

Replay Examples (curl)

1) Replay Twilio form (delivery)

```powershell
# POST application/x-www-form-urlencoded to your internal webhook endpoint
curl -X POST "http://localhost:8000/internal/webhooks/twilio/delivery" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-binary @tests/doc-fixtures/patient-communications/webhook-twilio-delivery.form
```

2) Replay Twilio failed delivery

```powershell
curl -X POST "http://localhost:8000/internal/webhooks/twilio/delivery" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-binary @tests/doc-fixtures/patient-communications/webhook-twilio-failed.form
```

3) Replay SendGrid delivered event

```powershell
curl -X POST "http://localhost:8000/internal/webhooks/sendgrid/events" \
  -H "Content-Type: application/json" \
  --data-binary @tests/doc-fixtures/patient-communications/webhook-sendgrid-delivered.json
```

4) Replay SendGrid bounce event

```powershell
curl -X POST "http://localhost:8000/internal/webhooks/sendgrid/events" \
  -H "Content-Type: application/json" \
  --data-binary @tests/doc-fixtures/patient-communications/webhook-sendgrid-bounce.json
```

Notes on Signatures & Headers
- If your webhook handlers validate provider signatures, add the appropriate headers when replaying (e.g., `X-Twilio-Signature` for Twilio). For CI, either disable signature checks in a test mode or derive the header using the provider's test secret.
- Example (add header):

```powershell
curl -X POST "http://localhost:8000/internal/webhooks/twilio/delivery" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: sha1=abcdef1234567890" \
  --data-binary @tests/doc-fixtures/patient-communications/webhook-twilio-delivery.form
```

Idempotency & Replay
- Handlers should be idempotent: use `MessageSid` / `sg_message_id` for dedupe.
- Store raw webhook payloads in a secure debug store for analysis; redact PHI when necessary.

CI Integration Suggestion
- Add a CI job that POSTs each fixture to the staging webhook endpoints and asserts that the internal Message record moves to the expected status (e.g., `delivered`, `failed`, `bounced`).
