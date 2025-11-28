# Completion Tracking

> **Sub-Area**: [Intake Forms](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Completion Tracking monitors the status of patient intake forms, ensuring all required paperwork is complete before appointments. It provides dashboards for staff to view pending and incomplete forms, automated reminder systems, and integration with appointment workflows to prevent check-in delays.

---

## Core Requirements

- [ ] Dashboard showing all pending and incomplete form submissions
- [ ] Track completion status by patient and form type
- [ ] Send automated reminders at configurable intervals before appointments
- [ ] Flag overdue forms approaching appointment date
- [ ] Support manual reminder sending by staff
- [ ] Integrate with appointment check-in workflow
- [ ] Generate completion reports for practice management

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/intake/submissions` | `intake:read` | List submissions with filters |
| GET | `/api/intake/submissions/:id` | `intake:read` | Get submission details |
| GET | `/api/intake/submissions/incomplete` | `intake:read` | Get incomplete submissions |
| POST | `/api/intake/submissions/:id/remind` | `intake:create` | Send manual reminder |
| POST | `/api/intake/submissions/:id/approve` | `intake:approve` | Approve submission |
| POST | `/api/intake/submissions/:id/request-changes` | `intake:approve` | Request changes |
| GET | `/api/intake/reminders` | `intake:read` | List pending reminders |
| POST | `/api/intake/reminders/batch` | `intake:admin` | Send batch reminders |

---

## Data Model

```prisma
model FormReminder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  submissionId  String   @db.ObjectId

  // Reminder details
  reminderType  ReminderType
  scheduledFor  DateTime
  sentAt        DateTime?
  deliveryMethod DeliveryMethod
  deliveryAddress String

  // Status
  status        ReminderStatus @default(PENDING)
  errorMessage  String?

  // Timestamps
  createdAt     DateTime @default(now())

  @@index([submissionId])
  @@index([status])
  @@index([scheduledFor])
}

enum ReminderType {
  INITIAL
  FIRST_REMINDER
  SECOND_REMINDER
  FINAL_REMINDER
  EXPIRED_NOTICE
  RENEWAL_NOTICE
}

enum DeliveryMethod {
  EMAIL
  SMS
  BOTH
}

enum ReminderStatus {
  PENDING
  SENT
  FAILED
  CANCELLED
}
```

---

## Business Rules

- Forms sent when appointment scheduled (initial)
- Reminder #1: 7 days before appointment
- Reminder #2: 3 days before appointment
- Reminder #3: 1 day before appointment
- Final: Morning of appointment (marked urgent)
- Incomplete forms flagged on day-of appointment dashboard
- Staff can override and check-in with incomplete forms (with documentation)
- Completion percentage calculated for patient readiness score
- Expired forms require fresh submission, not just renewal

---

## Dependencies

**Depends On:**
- Patient Form Portal (submission data)
- Form Template Builder (required form definitions)
- Patient Communications (reminder delivery)
- Booking & Scheduling (appointment dates)

**Required By:**
- Patient Flow (check-in readiness)
- Practice Orchestration (daily operations dashboard)

---

## Notes

- Consider SMS for final day-before and day-of reminders
- Escalation path for chronically incomplete forms
- Support for batch operations on multiple patients
- Integration with appointment confirmation workflow

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
