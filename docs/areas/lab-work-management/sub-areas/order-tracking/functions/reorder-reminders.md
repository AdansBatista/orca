# Reorder Reminders

> **Sub-Area**: [Order Tracking](../) | **Status**: 📋 Planned | **Priority**: Low

---

## Overview

Reorder Reminders automatically suggests when patients need replacement lab items, particularly retainers. The system schedules reminders based on time intervals, tracks patient responses, and facilitates quick reordering for retention program compliance.

---

## Core Requirements

- [ ] Schedule time-based reorder reminders
- [ ] Track quantity-based reminders (Vivera sets)
- [ ] Send proactive outreach for reorders
- [ ] Support patient-specific reminder schedules
- [ ] Integrate with treatment-based triggers
- [ ] Run bulk reorder campaigns
- [ ] Track reorder history by patient
- [ ] Report on reminder response rates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/reorder-reminders` | `lab:track` | List reminders |
| POST | `/api/lab/reorder-reminders` | `lab:create_order` | Create reminder |
| POST | `/api/lab/reorder-reminders/:id/send` | `lab:track` | Send reminder |
| PUT | `/api/lab/reorder-reminders/:id/respond` | `lab:track` | Record response |
| GET | `/api/lab/reorder-reminders/due` | `lab:track` | Get due reminders |
| POST | `/api/lab/reorder-reminders/campaign` | `lab:admin` | Bulk campaign |

---

## Data Model

```prisma
model ReorderReminder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  productCategory LabProductCategory
  productName   String
  originalOrderId String? @db.ObjectId

  reminderType  ReminderType  // TIME_BASED, QUANTITY_BASED, TREATMENT_MILESTONE
  scheduledFor  DateTime
  intervalMonths Int?

  status        ReminderStatus @default(PENDING)
  sentAt        DateTime?
  respondedAt   DateTime?
  response      String?  // ordered, declined, no_response

  resultingOrderId String? @db.ObjectId

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([patientId])
  @@index([scheduledFor])
  @@index([status])
}
```

---

## Business Rules

- Clear retainer reminders typically every 6-12 months
- Vivera reminders when 1 retainer remains in set
- Reminders only for patients with active retention
- Response tracking for program effectiveness
- Auto-generate next reminder when order placed

---

## Dependencies

**Depends On:**
- Lab Orders (original order reference)
- Patient Communications (reminder delivery)
- Treatment Management (retention status)

**Required By:**
- CRM & Onboarding (retention program management)
- Financial Management (recurring revenue tracking)

---

## Notes

- Consider patient preference for reminder frequency
- Support seasonal reminders (sports guards)
- Integrate with payment plans for retainer programs

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
