# Automated Campaigns & Workflows

> **Sub-Area**: Automated Campaigns & Workflows
>
> **Area**: Patient Communications (2.4)
>
> **Purpose**: Campaign engine for automated communication workflows, event-triggered sequences, and scheduled messaging to improve patient engagement and reduce staff workload

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | High |
| **Functions** | 5 |

---

## Overview

Automated Campaigns provides a workflow engine for creating and managing automated communication sequences. This includes appointment reminders, treatment milestone messages, payment reminders, and marketing campaigns—all triggered by events or schedules with full tracking and analytics.

### Key Capabilities

- Visual workflow builder
- Event-triggered automation
- Time-based scheduling
- Multi-channel delivery
- Campaign analytics
- A/B testing support

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Campaign Creation & Scheduling](./functions/campaign-creation-scheduling.md) | Create and schedule campaigns | High |
| 2 | [Event-Triggered Workflows](./functions/event-triggered-workflows.md) | Automate based on system events | Critical |
| 3 | [Appointment Reminders](./functions/appointment-reminders.md) | Automated appointment reminder sequences | Critical |
| 4 | [Follow-Up Sequences](./functions/follow-up-sequences.md) | Post-visit and treatment follow-ups | High |
| 5 | [Feedback & Survey Campaigns](./functions/feedback-survey-campaigns.md) | Collect patient feedback | Medium |

---

## Function Details

### Campaign Creation & Scheduling

Create marketing and engagement campaigns with scheduling.

**Key Features:**
- Campaign builder with targeting
- Schedule for specific dates/times
- Recurring campaign support
- Audience segmentation
- Campaign templates
- Preview before sending

---

### Event-Triggered Workflows

Automate communications based on system events.

**Key Features:**
- Event trigger configuration
- Workflow step builder
- Conditional branching
- Wait/delay steps
- Multi-channel steps
- Workflow templates

**Common Triggers:**
- Appointment booked
- Appointment completed
- Treatment milestone reached
- Payment received/due
- Birthday
- Retainer reorder due

---

### Appointment Reminders

Automated reminder sequences for appointments.

**Key Features:**
- Configurable reminder timing (48h, 24h, day-of)
- Multi-channel reminders
- Confirmation requests
- Easy reschedule links
- No-show follow-up
- Reminder customization by appointment type

---

### Follow-Up Sequences

Post-visit and treatment phase follow-ups.

**Key Features:**
- Post-appointment care instructions
- Treatment phase transitions
- Compliance check-ins (elastics, aligners)
- Retainer wear reminders
- Recall/recare sequences
- Re-engagement campaigns

---

### Feedback & Survey Campaigns

Collect patient satisfaction and feedback.

**Key Features:**
- NPS surveys
- Post-visit satisfaction
- Google review requests
- Survey timing optimization
- Response tracking
- Feedback analytics

---

## Data Model

### Prisma Schema

```prisma
model Campaign {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId

  name            String
  description     String?
  type            CampaignType      // MARKETING, REMINDER, FOLLOW_UP, SURVEY

  // Targeting
  audience        Json              // Audience criteria
  excludeCriteria Json?             // Exclusion criteria

  // Trigger
  triggerType     TriggerType       // EVENT, SCHEDULED, RECURRING
  triggerEvent    String?           // For EVENT type
  triggerSchedule DateTime?         // For SCHEDULED type
  triggerRecurrence Json?           // For RECURRING type

  // Status
  status          CampaignStatus    // DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED

  // Stats
  totalRecipients Int               @default(0)
  totalSent       Int               @default(0)
  totalDelivered  Int               @default(0)
  totalOpened     Int               @default(0)
  totalClicked    Int               @default(0)

  // Audit
  createdBy       String            @db.ObjectId
  activatedAt     DateTime?
  completedAt     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  steps           CampaignStep[]
  sends           CampaignSend[]

  @@index([clinicId, status])
  @@index([clinicId, type])
}

model CampaignStep {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  campaignId      String            @db.ObjectId

  order           Int
  name            String
  type            StepType          // SEND, WAIT, CONDITION, BRANCH

  // For SEND steps
  channel         MessageChannel?
  templateId      String?           @db.ObjectId

  // For WAIT steps
  waitDuration    Int?              // Minutes
  waitUntil       String?           // Time expression (e.g., "2 days before appointment")

  // For CONDITION steps
  condition       Json?

  // For BRANCH steps
  branches        Json?             // Array of branch conditions

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  campaign        Campaign          @relation(fields: [campaignId], references: [id])
  template        MessageTemplate?  @relation(fields: [templateId], references: [id])

  @@index([campaignId, order])
}

model CampaignSend {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  campaignId      String            @db.ObjectId
  stepId          String            @db.ObjectId
  patientId       String            @db.ObjectId

  // Status
  status          SendStatus        // PENDING, SENT, DELIVERED, FAILED, SKIPPED

  // Scheduling
  scheduledAt     DateTime
  sentAt          DateTime?

  // Tracking
  messageId       String?           @db.ObjectId

  // Skip reason
  skipReason      String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  campaign        Campaign          @relation(fields: [campaignId], references: [id])
  patient         Patient           @relation(fields: [patientId], references: [id])
  message         Message?          @relation(fields: [messageId], references: [id])

  @@index([campaignId, status])
  @@index([patientId])
  @@index([scheduledAt])
}

enum CampaignType {
  MARKETING
  REMINDER
  FOLLOW_UP
  SURVEY
  REACTIVATION
}

enum TriggerType {
  EVENT
  SCHEDULED
  RECURRING
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

enum StepType {
  SEND
  WAIT
  CONDITION
  BRANCH
}

enum SendStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  SKIPPED
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/campaigns` | List campaigns |
| POST | `/api/v1/campaigns` | Create campaign |
| GET | `/api/v1/campaigns/:id` | Get campaign details |
| PUT | `/api/v1/campaigns/:id` | Update campaign |
| DELETE | `/api/v1/campaigns/:id` | Delete campaign |
| POST | `/api/v1/campaigns/:id/activate` | Activate campaign |
| POST | `/api/v1/campaigns/:id/pause` | Pause campaign |
| GET | `/api/v1/campaigns/:id/stats` | Get campaign statistics |
| GET | `/api/v1/campaigns/:id/sends` | Get campaign sends |
| POST | `/api/v1/campaigns/:id/preview` | Preview campaign with test patient |
| GET | `/api/v1/workflows/templates` | Get workflow templates |

---

## UI Components

| Component | Description |
|-----------|-------------|
| `CampaignList` | List all campaigns with status |
| `CampaignBuilder` | Create/edit campaign |
| `WorkflowEditor` | Visual workflow step editor |
| `AudienceSelector` | Define campaign audience |
| `TriggerConfig` | Configure campaign triggers |
| `CampaignStats` | Campaign analytics dashboard |
| `SendsList` | View individual sends |
| `WorkflowTemplateGallery` | Pre-built workflow templates |

---

## Pre-Built Workflow Templates

### Appointment Reminders
```
[Appointment Booked]
    ↓
[Send Confirmation Email + SMS]
    ↓
[Wait until 48h before appointment]
    ↓
[Send Reminder SMS]
    ↓
[Wait until morning of appointment]
    ↓
[Send Day-Of Reminder SMS]
```

### New Patient Welcome
```
[Patient Created]
    ↓
[Send Welcome Email]
    ↓
[Wait 1 day]
    ↓
[Send Intake Form Reminder if incomplete]
    ↓
[Wait until 3 days before first appointment]
    ↓
[Send What to Expect Email]
```

### Post-Bonding Care
```
[Treatment Started (Braces)]
    ↓
[Send Welcome to Treatment Email]
    ↓
[Wait 3 days]
    ↓
[Send Care Tips SMS]
    ↓
[Wait 7 days]
    ↓
[Send Check-In SMS]
```

---

## Business Rules

1. **Consent Required**: Marketing campaigns require patient consent
2. **Frequency Limits**: Max 1 marketing message per week per patient
3. **Unsubscribe Processing**: Immediate unsubscribe from marketing campaigns
4. **Reminder Opt-Out**: Patients can opt out of reminders (rare)
5. **Time Window**: Marketing messages only during business hours
6. **A/B Testing**: Minimum 100 recipients for statistical significance
7. **Active Limit**: Max 10 active campaigns per clinic

---

## Dependencies

- **Messaging Hub**: For message delivery
- **Booking & Scheduling**: For appointment triggers
- **Treatment Management**: For treatment milestone triggers
- **Billing & Insurance**: For payment triggers

---

## Related Documentation

- [Patient Communications Overview](../../README.md)
- [Messaging Hub](../messaging-hub/)
- [Educational Content Library](../educational-content-library/)
