# Patient Communications

> **Area**: Patient Communications
>
> **Phase**: 2 - Core Operations
>
> **Purpose**: Centralize multi-channel messaging, patient portal, automated campaigns, and educational content delivery to increase patient engagement and treatment compliance

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete (~95%) |
| **Priority** | High |
| **Phase** | 2 - Core Operations |
| **Dependencies** | Phase 1 (Auth, Staff) ✅, CRM & Onboarding ✅ |
| **Last Updated** | 2024-12-11 |

---

## Implementation Status Summary

| Sub-Area | Status | Completion | Notes |
|----------|--------|------------|-------|
| Messaging Hub | ✅ Complete | ~95% | Multi-channel messaging fully functional |
| Patient Portal | 🔄 In Development | ~80% | Auth complete, billing blocked |
| Automated Campaigns | ✅ Complete | ~95% | Workflow engine and builder complete |
| Educational Content Library | 🔄 In Development | ~75% | Backend complete, staff UI partial |

### What's Implemented

**Prisma Models:**
- `Message` - Individual messages with channel, direction, status, threading, scheduling
- `MessageDelivery` - Delivery tracking per channel with provider, status, timestamps
- `MessageTemplate` - Reusable templates with SMS, email, push, in-app content and variables
- `NotificationPreference` - Per-patient preferences by channel and category, quiet hours
- `Campaign` - Automated campaign definitions with audience, triggers, status
- `CampaignStep` - Workflow steps (SEND, WAIT, CONDITION) with templates
- `CampaignPatient` - Campaign execution tracking per patient
- `CampaignSend` - Individual campaign message logs
- `ContentArticle` - Educational content with categories, tags, publish status
- `ContentDelivery` - Content delivery tracking
- `ContentCategory` - Content categorization
- `FAQItem` - FAQ entries with categories
- `Survey` - Patient surveys with questions
- `SurveyResponse` - Survey responses

**Components:**
- `ComposeMessageDialog.tsx` - Send individual messages via SMS/Email with templates
- `ConversationSheet.tsx` - View full message history with patient, reply functionality
- `CreateTemplateDialog.tsx` - Create message templates (SMS, EMAIL, PUSH, IN_APP)
- `EditTemplateDialog.tsx` - Edit templates with versioning and preview

**Pages:**
- `/communications` - Main inbox with conversations, filtering, stats
- `/communications/templates` - Template management with CRUD, search
- `/communications/campaigns` - Campaign listing with status filters
- `/communications/campaigns/[id]` - Campaign detail view
- `/communications/campaigns/new` - Create campaign workflow
- `/communications/content` - Educational content library
- `/communications/settings` - Communication settings (SMS, Email, quiet hours)
- `/communications/faqs` - FAQ management
- `/communications/surveys` - Survey management

**API Endpoints:**
- `GET/POST /api/communications/messages` - Message listing and sending
- `GET /api/communications/messages/[id]` - Full message details with deliveries
- `POST /api/communications/messages/[id]/read` - Mark message as read
- `GET/POST /api/communications/messages/patient/[patientId]` - Conversation history and replies
- `POST /api/communications/messages/patient/[patientId]/read-all` - Mark all read
- `POST /api/communications/messages/bulk` - Bulk message sending
- `GET/POST /api/communications/templates` - Template CRUD with filtering
- `GET/PUT/DELETE /api/communications/templates/[id]` - Individual template operations
- `POST /api/communications/templates/preview` - Template preview with variable substitution
- `GET /api/communications/inbox` - Inbox conversations grouped by patient
- `GET/PUT /api/communications/preferences/[patientId]` - Patient notification preferences
- `GET /api/communications/status` - Provider status and delivery stats

**Validation Schemas (`src/lib/validations/communications.ts`):**
- Message enums: channel, direction, status, delivery status
- Template schemas: create, update, preview with multi-channel content
- Message schemas: send, bulk, query, reply
- Preference schemas: update with channel/category controls

**Features:**
- Multi-channel messaging (SMS, EMAIL, PUSH, IN_APP)
- Template variable substitution with preview
- SMS character counter with segment detection
- Delivery tracking with webhooks
- Unified inbox with conversation grouping
- Unread message counting
- Message scheduling
- Patient notification preferences by channel and category
- Quiet hours configuration
- Opt-out tracking (SMS, email)
- Marketing consent tracking
- PHI protection in UI

### What's Not Yet Implemented
- 🚫 **Payment & Billing Self-Service** - Blocked by Billing & Insurance area
- ⚠️ Two-way SMS/messaging handlers (webhooks exist)
- ⚠️ A/B testing for campaigns (schema supports it)
- ⚠️ FAQ staff management UI (partial)
- ⚠️ Content article editor UI (partial)
- ⚠️ Survey builder and response UI (partial)
- ⚠️ Communication settings save endpoint

---

## Overview

Patient Communications manages all patient-facing communication for orthodontic practices—from appointment reminders and treatment updates to self-service portals and educational content. The system supports multiple channels (SMS, email, in-app) with unified inbox, delivery tracking, and patient preference management.

Effective patient communication is critical in orthodontics where treatment spans 18-36 months with frequent visits, compliance requirements (elastics, aligners), and significant financial commitments. This area ensures patients stay informed, engaged, and compliant throughout their treatment journey.

### Key Capabilities

- **Messaging Hub**: Multi-channel messaging (SMS, email, in-app) with templates, delivery tracking, and unified inbox
- **Patient Portal**: Self-service portal for appointments, forms, payments, and treatment progress
- **Automated Campaigns**: Event-triggered workflows for reminders, follow-ups, and engagement sequences
- **Educational Content**: Curated patient education library with personalized delivery

### Business Value

- Reduce no-shows with automated appointment reminders
- Improve treatment compliance through education and engagement
- Decrease staff workload with self-service capabilities
- Increase patient satisfaction through timely communication
- Enable personalized communication based on treatment phase
- Maintain HIPAA-compliant communication audit trails

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 1 | [Messaging Hub](./sub-areas/messaging-hub/) | Multi-channel messaging and delivery | 🔄 ~80% | Critical |
| 2 | [Patient Portal](./sub-areas/patient-portal/) | Self-service portal and account management | 🔄 ~75% | High |
| 3 | [Automated Campaigns](./sub-areas/automated-campaigns/) | Workflows, reminders, and sequences | ✅ ~85% | High |
| 4 | [Educational Content Library](./sub-areas/educational-content-library/) | Patient education materials | 🔄 ~70% | Medium |

---

## Sub-Area Details

### 1. Messaging Hub

Unified multi-channel messaging center for SMS, email, and in-app notifications.

**Functions:**
- SMS Delivery
- Email Delivery
- In-App Notifications
- Message Routing & Delivery
- Message History & Logging
- Template Management

**Key Features:**
- Provider adapters for SMS (Twilio), email (SendGrid), and push notifications
- Message template library with variable substitution
- Delivery receipts and webhook handling
- Unified inbox for all patient communications
- Two-way messaging support
- Message scheduling and queuing

---

### 2. Patient Portal

Self-service portal for patients to manage appointments, view treatment progress, and handle billing.

**Functions:**
- Patient Portal Authentication
- Patient Profile Management
- Appointment Self-Service
- Treatment Progress Access
- Payment & Billing Self-Service
- Form Completion

**Key Features:**
- Secure login with magic links or password
- View upcoming and past appointments
- Request appointments and reschedules
- Access treatment photos and progress
- View and pay bills online
- Complete intake and consent forms
- Download receipts and statements

---

### 3. Automated Campaigns

Campaign engine for automated communication workflows and event-triggered sequences.

**Functions:**
- Campaign Creation & Scheduling
- Event-Triggered Workflows
- Appointment Reminders
- Follow-Up Sequences
- Feedback & Survey Campaigns
- Birthday/Holiday Campaigns

**Key Features:**
- Visual workflow builder
- Event triggers (appointment booked, treatment milestone, payment due)
- Time-based triggers (X days before/after)
- A/B testing for message variants
- Campaign analytics and performance tracking
- Unsubscribe and preference management

---

### 4. Educational Content Library

Repository of patient education materials for orthodontic care.

**Functions:**
- Content Management & Curation
- Patient Education Delivery
- Content Personalization
- FAQ & Knowledge Base
- Tagging & Metadata

**Key Features:**
- Curated orthodontic education content
- Content by treatment phase (braces care, elastics, retainer wear)
- Multimedia support (videos, PDFs, interactive guides)
- Automated delivery based on treatment milestones
- Multi-language support
- Patient-facing FAQ and help center

---

## Orthodontic Communication Types

### Appointment Communications

| Type | Timing | Channel | Purpose |
|------|--------|---------|---------|
| **Confirmation** | At booking | Email + SMS | Confirm appointment details |
| **Reminder** | 48h before | SMS | Reduce no-shows |
| **Day-of Reminder** | Morning of | SMS | Final reminder |
| **Running Late** | Real-time | SMS | Notify patient of delays |
| **Post-Visit Summary** | After visit | Email | Visit summary and instructions |

### Treatment Communications

| Type | Trigger | Channel | Purpose |
|------|---------|---------|---------|
| **Treatment Started** | First bonding | Email | Welcome to treatment |
| **Elastics Reminder** | Weekly | SMS | Compliance encouragement |
| **Aligner Change** | Every 1-2 weeks | SMS | Reminder to change aligners |
| **Treatment Milestone** | Phase completion | Email | Progress celebration |
| **Retainer Reminder** | Post-treatment | SMS | Retainer wear compliance |

### Financial Communications

| Type | Trigger | Channel | Purpose |
|------|---------|---------|---------|
| **Payment Due** | 7 days before | Email | Upcoming payment reminder |
| **Payment Overdue** | 1/7/14 days after | Email + SMS | Collection sequence |
| **Payment Received** | At payment | Email | Receipt confirmation |
| **Insurance Update** | Status change | Email | Insurance claim status |

---

## Integration Points

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Booking & Scheduling | Appointment events | Trigger reminders and confirmations |
| Treatment Management | Treatment milestones | Trigger phase-specific communications |
| Billing & Insurance | Payment events | Send invoices, receipts, reminders |
| CRM & Onboarding | Patient intake | Welcome sequences and form reminders |
| Lab Work Management | Lab arrivals | Notify patient when items ready |
| Practice Orchestration | Check-in/checkout | Real-time status notifications |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| Twilio | SMS API | SMS delivery and two-way messaging |
| SendGrid | Email API | Email delivery and tracking |
| Firebase/APNS | Push API | Mobile push notifications |
| Typeform | Form API | External form integration |
| Demandforce/Weave | Platform Integration | Alternative communication platforms |

---

## User Roles & Permissions

| Role | Messaging | Portal Admin | Campaigns | Content |
|------|-----------|--------------|-----------|---------|
| Super Admin | Full | Full | Full | Full |
| Clinic Admin | Full | Full | Full | Full |
| Doctor | Send | View | View | Edit |
| Clinical Staff | Send | View | View | View |
| Front Desk | Full | View | View | View |
| Billing | Send | View | View | None |
| Read Only | View | View | View | View |

### Special Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `comms:send_message` | Send individual messages | all staff |
| `comms:send_bulk` | Send bulk messages | clinic_admin |
| `comms:view_inbox` | View message inbox | all staff |
| `comms:manage_templates` | Edit message templates | clinic_admin |
| `comms:manage_campaigns` | Create/edit campaigns | clinic_admin |
| `portal:admin` | Portal configuration | clinic_admin |
| `portal:impersonate` | View portal as patient | clinic_admin |
| `content:manage` | Manage educational content | clinic_admin, doctor |

---

## Data Models

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Patient     │────▶│    Message      │────▶│ MessageDelivery │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ MessageTemplate │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Campaign     │────▶│ CampaignStep    │────▶│ CampaignSend    │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│     Patient     │────▶│ PortalAccount   │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ ContentArticle  │────▶│ ContentDelivery │
└─────────────────┘     └─────────────────┘
```

### Key Models

| Model | Description |
|-------|-------------|
| `Message` | Individual message sent to patient |
| `MessageDelivery` | Delivery status and tracking per channel |
| `MessageTemplate` | Reusable message templates with variables |
| `NotificationPreference` | Patient communication preferences |
| `Campaign` | Automated campaign definition |
| `CampaignStep` | Step in campaign workflow |
| `CampaignSend` | Individual send within campaign |
| `PortalAccount` | Patient portal authentication |
| `PortalSession` | Portal login sessions |
| `ContentArticle` | Educational content item |
| `ContentDelivery` | Content sent to patient |
| `ContentCategory` | Content organization |

---

## Workflow: Appointment Reminder Campaign

```
┌──────────────────┐
│ Appointment      │
│ Booked           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Send Confirmation│────▶│ Wait 48h Before  │
│ (Email + SMS)    │     │ Appointment      │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Send Reminder    │
                         │ (SMS)            │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Wait Until       │
                         │ Morning Of       │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Send Day-Of      │
                         │ Reminder (SMS)   │
                         └──────────────────┘
```

---

## AI Features

| Feature | Sub-Area | Description |
|---------|----------|-------------|
| Send-Time Optimization | Messaging Hub | Optimize delivery time for engagement |
| Content Personalization | Educational Content | Personalize content based on treatment |
| Sentiment Analysis | Messaging Hub | Analyze patient responses for concerns |
| Response Suggestions | Messaging Hub | AI-suggested replies to patient messages |
| Campaign Optimization | Automated Campaigns | A/B test winner selection |
| Engagement Scoring | Patient Portal | Score patient engagement level |

---

## Compliance Requirements

### HIPAA Compliance
- PHI in messages requires encryption in transit and at rest
- Patient consent required for SMS and email communications
- Opt-out processing and preference management
- Audit logging for all message access
- Secure portal authentication

### CAN-SPAM / TCPA Compliance
- Opt-in consent for marketing communications
- Easy opt-out mechanism
- Sender identification
- Message frequency limits
- Time-of-day restrictions for SMS

### Data Retention
- Message history retained per policy
- Portal session logs retained 90 days
- Campaign analytics retained indefinitely
- Educational content delivery tracked

---

## Implementation Notes

### Phase 2 Dependencies
- **Authentication**: For portal login integration
- **CRM & Onboarding**: For patient contact information
- **Booking & Scheduling**: For appointment-based communications

### Implementation Order
1. Messaging Hub (foundation for all communications)
2. Automated Campaigns (appointment reminders first)
3. Patient Portal (self-service capabilities)
4. Educational Content Library (treatment support)

### Key Technical Decisions
- Use Twilio for SMS with webhooks for delivery status
- Use SendGrid for email with event tracking
- Implement message queuing for reliable delivery
- Store templates with Handlebars-style variables
- Use SSE/WebSockets for real-time inbox updates

---

## File Structure

```
docs/areas/patient-communications/
├── README.md                      # This file (area overview)
└── sub-areas/
    ├── messaging-hub/
    │   ├── README.md
    │   └── functions/
    │       ├── sms-delivery.md
    │       ├── email-delivery.md
    │       ├── in-app-notifications.md
    │       ├── message-routing-delivery.md
    │       ├── message-history-logging.md
    │       └── template-management.md
    │
    ├── patient-portal/
    │   ├── README.md
    │   └── functions/
    │       ├── portal-authentication.md
    │       ├── patient-profile-management.md
    │       ├── appointment-self-service.md
    │       ├── treatment-progress-access.md
    │       └── payment-billing-self-service.md
    │
    ├── automated-campaigns/
    │   ├── README.md
    │   └── functions/
    │       ├── campaign-creation-scheduling.md
    │       ├── event-triggered-workflows.md
    │       ├── appointment-reminders.md
    │       ├── follow-up-sequences.md
    │       └── feedback-survey-campaigns.md
    │
    └── educational-content-library/
        ├── README.md
        └── functions/
            ├── content-management-curation.md
            ├── patient-education-delivery.md
            ├── content-personalization.md
            └── faq-knowledge-base.md
```

---

## Related Documentation

- [Booking & Scheduling](../booking-scheduling/) - Appointment integration
- [CRM & Onboarding](../crm-onboarding/) - Patient data source
- [Treatment Management](../treatment-management/) - Treatment milestone triggers

---

## Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Planned | 📋 | Documented, not started |
| In Progress | 🔄 | Currently being implemented |
| Review | 👀 | Under review |
| Testing | 🧪 | In testing |
| Completed | ✅ | Fully implemented |
| Blocked | 🚫 | Blocked by dependency |

---

**Status**: ✅ Complete (~95%)
**Last Updated**: 2024-12-11
**Owner**: Development Team
