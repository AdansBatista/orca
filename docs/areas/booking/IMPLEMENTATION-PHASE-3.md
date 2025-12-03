# Booking & Scheduling - Phase 3 Implementation

> **Phase**: 3 - Advanced Scheduling & Automation
> **Status**: 📋 Planned
> **Dependencies**: Phase 1 + Phase 2 Complete
> **Last Updated**: 2024-12-03

## Overview

This phase adds advanced scheduling features and automation to complete the Booking & Scheduling area:
- Schedule templates for standardized day/week patterns
- Provider schedule and availability management
- Recurring appointments
- Automated waitlist notifications
- Two-way confirmation system
- Configurable reminder sequences
- Re-engagement campaigns for inactive patients

---

## Planned Features

### 1. Schedule Templates & Calendars

#### 1.1 Schedule Template Builder
- [ ] `ScheduleTemplate` model for day/week templates
- [ ] `TemplateSlot` model for individual time slots
- [ ] Drag-and-drop template design UI
- [ ] Color-coded slots by appointment type
- [ ] Copy/clone templates
- [ ] Template versioning

#### 1.2 Template Application Engine
- [ ] Apply template to specific dates
- [ ] Apply template to date ranges
- [ ] Override handling (don't overwrite existing appointments)
- [ ] Bulk template application
- [ ] Template analytics (usage, effectiveness)

#### 1.3 Provider Schedule Management
- [ ] `ProviderSchedule` model for working hours
- [ ] Default weekly schedule per provider
- [ ] Schedule exceptions (holidays, time off)
- [ ] Block time for breaks/meetings
- [ ] Vacation/PTO integration with Staff Management
- [ ] Provider availability API

#### 1.4 Recurring Appointments
- [ ] `RecurringAppointment` model for series
- [ ] Recurrence patterns (daily, weekly, monthly, custom)
- [ ] Series end conditions (count, date, indefinite)
- [ ] Series modification (this occurrence, all, future)
- [ ] Series cancellation
- [ ] Conflict detection for series

#### 1.5 Calendar Enhancements
- [ ] Calendar printing (day/week views)
- [ ] Multi-location calendar sync
- [ ] Advanced filtering (by room, chair, procedure)
- [ ] Calendar export (iCal)

---

### 2. Waitlist Automation (Deferred from Phase 2)

#### 2.1 Opening Notifications
- [ ] Detect cancellations that create openings
- [ ] Match openings to waitlist preferences
- [ ] Send multi-channel notifications (SMS, email)
- [ ] Hold period for patient response (configurable)
- [ ] Escalate to next in line if no response
- [ ] Notification effectiveness tracking

#### 2.2 Failed Appointment Recovery
- [ ] Automatic outreach after no-show/cancellation
- [ ] Multi-touch follow-up sequences
- [ ] Recovery status tracking
- [ ] Recovery success metrics
- [ ] Integration with At-Risk scoring

#### 2.3 Re-engagement Campaigns
- [ ] Campaign creation UI
- [ ] Target inactive patients (configurable criteria)
- [ ] Multi-channel outreach (email, SMS)
- [ ] Campaign templates
- [ ] Performance tracking (responses, re-bookings)
- [ ] A/B testing for messages

---

### 3. Reminder Automation (Deferred from Phase 2)

#### 3.1 Confirmation System
- [ ] Two-way SMS confirmation (reply YES/NO)
- [ ] Email confirmation with links
- [ ] Confirmation status tracking per appointment
- [ ] Auto-mark confirmed appointments
- [ ] Trigger reschedule workflow on decline
- [ ] Escalation for unconfirmed appointments

#### 3.2 Reminder Sequences
- [ ] `ReminderSequence` model for multi-step sequences
- [ ] Configurable timing (X days/hours before)
- [ ] Different sequences per appointment type
- [ ] Skip remaining reminders once confirmed
- [ ] Sequence analytics (which step gets responses)
- [ ] Default sequences for new clinics

---

## Database Models (Planned)

```prisma
model ScheduleTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  description   String?
  templateType  TemplateType  // DAY, WEEK
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)
  slots         TemplateSlot[]
  // ... timestamps, audit
}

model TemplateSlot {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  templateId        String   @db.ObjectId
  dayOfWeek         Int?     // 0-6 for week templates
  startTime         String   // "09:00"
  endTime           String   // "09:30"
  appointmentTypeId String?  @db.ObjectId
  isBlocked         Boolean  @default(false)
  blockReason       String?
  // ... relations
}

model ProviderSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  providerId    String   @db.ObjectId
  dayOfWeek     Int      // 0-6
  startTime     String   // "08:00"
  endTime       String   // "17:00"
  isWorkingDay  Boolean  @default(true)
  breaks        ScheduleBreak[]
  effectiveFrom DateTime?
  effectiveTo   DateTime?
  // ... timestamps
}

model RecurringAppointment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  providerId    String   @db.ObjectId
  appointmentTypeId String @db.ObjectId
  pattern       RecurrencePattern
  interval      Int      @default(1)
  daysOfWeek    Int[]    // For weekly
  dayOfMonth    Int?     // For monthly
  startDate     DateTime
  endDate       DateTime?
  occurrenceCount Int?
  status        RecurringStatus
  // ... relations to generated appointments
}

model ReminderSequence {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  appointmentTypes String[] @db.ObjectId
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)
  steps         ReminderSequenceStep[]
  // ... timestamps
}

model ReEngagementCampaign {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  status        CampaignStatus
  inactiveDays  Int      // Target patients not seen in X days
  channels      String[] // SMS, EMAIL
  messages      CampaignMessage[]
  stats         CampaignStats
  // ... timestamps
}
```

---

## API Endpoints (Planned)

### Schedule Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/booking/templates` | List templates |
| POST | `/api/booking/templates` | Create template |
| GET | `/api/booking/templates/:id` | Get template |
| PUT | `/api/booking/templates/:id` | Update template |
| DELETE | `/api/booking/templates/:id` | Delete template |
| POST | `/api/booking/templates/:id/apply` | Apply to dates |

### Provider Schedules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/booking/provider-schedules` | List schedules |
| GET | `/api/booking/provider-schedules/:providerId` | Get provider schedule |
| PUT | `/api/booking/provider-schedules/:providerId` | Update schedule |
| POST | `/api/booking/provider-schedules/:providerId/block` | Block time |

### Recurring Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/booking/recurring` | Create series |
| GET | `/api/booking/recurring/:id` | Get series |
| PUT | `/api/booking/recurring/:id` | Update series |
| DELETE | `/api/booking/recurring/:id` | Cancel series |

### Reminder Sequences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/booking/reminder-sequences` | List sequences |
| POST | `/api/booking/reminder-sequences` | Create sequence |
| PUT | `/api/booking/reminder-sequences/:id` | Update sequence |
| DELETE | `/api/booking/reminder-sequences/:id` | Delete sequence |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/booking/campaigns` | List campaigns |
| POST | `/api/booking/campaigns` | Create campaign |
| POST | `/api/booking/campaigns/:id/launch` | Launch campaign |
| GET | `/api/booking/campaigns/:id/stats` | Get stats |

---

## Implementation Order (Suggested)

1. **Provider Schedules** - Foundation for template application
2. **Schedule Templates** - Template builder and application
3. **Recurring Appointments** - Series management
4. **Reminder Sequences** - Configurable reminder chains
5. **Confirmation System** - Two-way confirmations
6. **Opening Notifications** - Waitlist automation
7. **Failed Appointment Recovery** - Recovery workflows
8. **Re-engagement Campaigns** - Campaign system
9. **Calendar Enhancements** - Printing, export, etc.

---

## Session Start Prompt

To start Phase 3 in a new session, use this prompt:

```
I'm continuing development of the Orca orthodontic practice management system.

**Current Status:**
- Phase 1 (Foundation): Complete - Auth, Staff, Resources
- Phase 2 (Booking): Complete - Basic booking, calendar, appointments, waitlist, cancellations, at-risk, emergencies, reminders

**Phase 3 Scope (Booking - Advanced Scheduling & Automation):**
1. Schedule Templates (template builder, application engine)
2. Provider Schedule Management (working hours, blocks, breaks)
3. Recurring Appointments (series creation, modification)
4. Opening Notifications (auto-notify waitlist on cancellation)
5. Confirmation System (two-way SMS/email confirmation)
6. Reminder Sequences (configurable multi-step sequences)
7. Failed Appointment Recovery workflows
8. Re-engagement Campaigns

**Key Files to Read:**
- docs/areas/booking/IMPLEMENTATION-PHASE-3.md (this planning doc)
- docs/areas/booking/IMPLEMENTATION-PHASE-2.md (patterns used)
- docs/areas/booking/sub-areas/calendar-management/README.md
- docs/areas/booking/sub-areas/waitlist-recovery/README.md
- docs/areas/booking/sub-areas/emergency-reminders/README.md

**Start with:** Provider Schedules (foundation for templates)

Please read the Phase 3 planning doc and let's begin implementation.
```

---

**Status**: 📋 Planned
**Last Updated**: 2024-12-03
**Owner**: Development Team
