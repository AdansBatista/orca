# patient-notification-delivery

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Deliver lab result notifications to patients and providers across configured channels (patient portal, email, SMS) while respecting release policies, consent, and handling sensitive findings.

## Summary

Notification service reads release policy for each `LabResult` (automatic release delay, clinician hold) and sends messages using provider templates. Support channel preferences and opt-outs. For critical flags, provide escalated delivery (SMS + email + in-portal banner).

## API

- POST `/api/lab/notifications/send`
	- Request:
		{ "resultId":"string", "channels":["portal","email"], "overridePolicy": false }
	- Response: `{ "notificationId":"notif_1", "status":"queued" }`

- GET `/api/lab/notifications/{notificationId}` — status and delivery receipts.

## Templates & Personalization

- Template variables: patient name, test name, result date, clinician name, secure link to report.

## DB / Data Fields

- Notification: `id`, `resultId`, `channels`, `status`, `sentAt`, `deliveredAt`, `failureReason`, `createdBy`.

## Sample Payload

{
	"resultId": "res_1",
	"channels": ["portal","email"],
	"overridePolicy": false
}

## UI Notes

- Notification history on result page with delivery receipts; allow manual resend. Provide preview template editor for admins.

## Acceptance Criteria

- Notifications obey release policy and consent settings; delivery receipts recorded.
- Critical flags trigger configured escalation paths.
