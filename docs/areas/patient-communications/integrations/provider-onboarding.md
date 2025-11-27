# Provider Onboarding & Sandbox Guide

Purpose
Guidance for onboarding external messaging providers (SMS and Email) into Orca's Patient Communications area. This document is for technical leads and operations teams performing provider setup in dev/test/staging and production.

Provider Types
- SMS Providers: Twilio, Vonage (Nexmo), Bandwidth
- Email Providers: SendGrid, Amazon SES, SMTP-based providers

Onboarding Checklist

1) Account & Credentials
- Create sandbox/test account for provider; gather API keys, webhook secrets, and phone numbers/sending domains.

2) DNS & Deliverability (Email)
- Configure DKIM, SPF, and DMARC records for sending domains.
- Provide steps for domain verification in SendGrid/SES.

3) Webhook Endpoint Registration
- Configure provider to send delivery events and bounces to internal webhook endpoints (see `integrations/webhooks.md`).

4) Test Numbers & Suppression Lists
- For SMS, allocate test numbers and register opt-in numbers for sandbox flows.
- For email, ensure test addresses are removed from suppression lists before production testing.

5) Rate Limits & Backoff Strategy
- Document provider rate limits and recommended backoff settings in the provider adapter config.

6) Monitoring & Alerts
- Establish provider-specific monitoring (delivery rate, bounce rate, error rate) and set alert thresholds.

7) Security & Access
- Store credentials in secrets manager; rotate keys per organizational policy.
- Limit operational access to production provider consoles.

Example Provider Config (JSON)

  {
    "provider": "twilio",
    "accountSid": "ACxxxx",
    "authToken": "xxxx",
    "webhookSecret": "whsec_xxx",
    "priority": 1
  }

Acceptance Criteria
- Provider test send succeeds (sandbox) and delivery event is received and mapped to message.
- Bounce and complaint events update message or suppression lists.
- Monitoring metrics emit to observability stack and alerts configured.
