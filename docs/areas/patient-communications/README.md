# Patient Communications

Quick Info
- **Area:** Patient Communications
- **Phase:** Phase 2 (High Priority)
- **Owner:** Patient-Engagement-Team / engagement-lead@orca.example

Overview
Patient Communications centralizes multi-channel messaging, the patient portal, automated campaigns, and the educational content library. It supports reliable delivery, patient preferences, auditing, and personalization to increase engagement and compliance.

Key Capabilities
- Unified Messaging Hub (SMS, Email, In-App) with provider adapters
- Patient Portal for authentication, appointment self-service, result access, and billing
- Campaign and workflow engine for automated sequences and triggers
- Educational Content Library for curated patient-facing materials
- Notification preferences and consent management

Sub-Areas
- Messaging Hub
- Patient Portal & Self-Service
- Automated Campaigns & Workflows
- Educational Content Library

Integration Points
- Booking & Scheduling: appointment reminders, confirmations, reschedules
- Treatment Management: treatment updates, care instructions
- Billing & Insurance: invoices, payment reminders, receipts
- CRM & Onboarding: welcome sequences and intake reminders
- Lab Work Management: result release notifications

Data Models & APIs
- See `data-models.md` for Message, Campaign, Template, NotificationPreference, PatientPortalAccount models
- Expose REST APIs under `/api/v1/messaging` and `/api/v1/portal` and internal event hooks for integrations

AI Features
- Send-time optimization, content personalization, sentiment analysis for feedback, automated response suggestions

Compliance & Security
- HIPAA controls for PHI in messages and portal
- Per-channel consent and opt-out processing
- Audit logs and configurable retention

Implementation Notes
- Implement provider adapters for SMS and Email with webhook handling
- Store templates with schema validation and versioning
- Use an internal event bus to decouple producers and consumers

See the `sub-areas/` folder for function-level specifications and implementation details.
