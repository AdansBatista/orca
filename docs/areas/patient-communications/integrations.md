# Patient Communications — Integrations

Internal Integrations
- Booking & Scheduling: appointment reminders, confirmations, reschedules, cancellation notifications. Hook: `POST /internal/booking/notifications` events.
- Treatment Management: treatment milestones, care instructions. Hook: `treatment.update` events to trigger instructional sequences.
- Billing & Insurance: invoice notifications, payment reminders, receipts. Hook: `billing.account.updated` and `billing.invoice.generated` events.
- CRM & Onboarding: welcome campaigns, intake reminders, referral confirmations. Hook: `crm.lead.converted` events.
- Result Review & Reporting: results release notifications with configurable release policy. Hook: `lab.result.released` events.

External Integrations
- SMS Providers: Twilio, Vonage (Nexmo), Bandwidth — provider adapters with status webhooks.
- Email Providers: SendGrid, SES, SMTP — templates, DKIM/SPF setup, suppression lists.
- Patient Portal: SSO with Auth area; optional external portal vendors.
- Identity Providers: OAuth2 / OpenID Connect for third-party logins.

Integration Data Contracts
- Standard event shape for notifications:

  {
    "eventType": "appointment.reminder",
    "patientId": "string",
    "appointmentId": "string",
    "scheduledAt": "ISO8601"
  }

Notes
- Use an event bus (internal) to decouple producers and consumers; include idempotency keys and event versions.
- Provide webhooks to external providers for delivery receipts and update local message status.
