# Patient Communications — Functions Index

This index lists all function-level specifications created for the Patient Communications area (Booking-level detail). Each entry links to the detailed spec in the sub-area folder.

## Status Legend

| Icon | Meaning |
|------|---------|
| ✅ | Fully Implemented |
| 🔄 | Partially Implemented |
| ⚠️ | Blocked by Dependencies |
| 📋 | Planned (Not Started) |

---

## Messaging Hub (~80% Complete)

| Status | Function | Specification |
|--------|----------|---------------|
| ✅ | `sms-delivery` | [sms-delivery.md](sub-areas/messaging-hub/functions/sms-delivery.md) |
| ✅ | `email-delivery` | [email-delivery.md](sub-areas/messaging-hub/functions/email-delivery.md) |
| ✅ | `in-app-notifications` | [in-app-notifications.md](sub-areas/messaging-hub/functions/in-app-notifications.md) |
| ✅ | `message-routing-and-delivery` | [message-routing-and-delivery.md](sub-areas/messaging-hub/functions/message-routing-and-delivery.md) |
| ✅ | `message-history-and-logging` | [message-history-and-logging.md](sub-areas/messaging-hub/functions/message-history-and-logging.md) |
| ✅ | `template-management` | [template-management.md](sub-areas/messaging-hub/functions/template-management.md) |

**Known Gaps:**
- Two-way SMS conversation threading not implemented
- Unified inbox UI not built
- Real-time message updates (WebSocket) not implemented

---

## Patient Portal & Self-Service (~75% Complete)

| Status | Function | Specification |
|--------|----------|---------------|
| ✅ | `patient-portal-authentication` | [patient-portal-authentication.md](sub-areas/patient-portal/functions/patient-portal-authentication.md) |
| ✅ | `patient-profile-management` | [patient-profile-management.md](sub-areas/patient-portal/functions/patient-profile-management.md) |
| ✅ | `appointment-self-service` | [appointment-self-service.md](sub-areas/patient-portal/functions/appointment-self-service.md) |
| 🔄 | `result-access-and-download` | [result-access-and-download.md](sub-areas/patient-portal/functions/result-access-and-download.md) |
| ⚠️ | `payment-and-billing-self-service` | [payment-and-billing-self-service.md](sub-areas/patient-portal/functions/payment-and-billing-self-service.md) |

**Blocked Features:**
- `payment-and-billing-self-service` — Blocked by **Billing & Insurance** area (not yet implemented)
- `result-access-and-download` — Partially blocked by **Imaging Management** area for treatment photos

---

## Automated Campaigns & Workflows (~85% Complete)

| Status | Function | Specification |
|--------|----------|---------------|
| ✅ | `campaign-creation-and-scheduling` | [campaign-creation-and-scheduling.md](sub-areas/automated-campaigns/functions/campaign-creation-and-scheduling.md) |
| ✅ | `event-triggered-workflows` | [event-triggered-workflows.md](sub-areas/automated-campaigns/functions/event-triggered-workflows.md) |
| ✅ | `appointment-reminders` | [appointment-reminders.md](sub-areas/automated-campaigns/functions/appointment-reminders.md) |
| ✅ | `follow-up-sequences` | [follow-up-sequences.md](sub-areas/automated-campaigns/functions/follow-up-sequences.md) |
| 🔄 | `feedback-and-survey-campaigns` | [feedback-and-survey-campaigns.md](sub-areas/automated-campaigns/functions/feedback-and-survey-campaigns.md) |

**Known Gaps:**
- `feedback-and-survey-campaigns` — Survey form builder UI not implemented; backend ready
- A/B testing for campaigns not implemented
- Campaign template gallery not built

---

## Educational Content Library (~70% Complete)

| Status | Function | Specification |
|--------|----------|---------------|
| 🔄 | `content-management-and-curation` | [content-management-and-curation.md](sub-areas/educational-content-library/functions/content-management-and-curation.md) |
| ✅ | `patient-education-delivery` | [patient-education-delivery.md](sub-areas/educational-content-library/functions/patient-education-delivery.md) |
| ✅ | `content-personalization` | [content-personalization.md](sub-areas/educational-content-library/functions/content-personalization.md) |
| 🔄 | `faq-and-knowledge-base` | [faq-and-knowledge-base.md](sub-areas/educational-content-library/functions/faq-and-knowledge-base.md) |

**Known Gaps:**
- `content-management-and-curation` — Rich text editor and media upload UI not built; API and models complete
- `faq-and-knowledge-base` — FAQ management staff UI not built; patient-facing display works

---

## Notes

- Each function includes: Purpose & Summary, API endpoints, DB/data fields, sample payloads, UI notes, acceptance criteria, and integration hooks.
- If you want additional fields (sequence diagrams, wireframes, OpenAPI fragments per function), tell me which functions to expand.
- **Last Updated:** 2024-12-09
