# Patient Pickup Tracking

> **Sub-Area**: [Order Tracking](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Patient Pickup Tracking manages lab items that have arrived and are awaiting patient collection. The system maintains an inventory of pending items, sends pickup reminders, tracks storage locations, and handles unclaimed items after extended periods.

---

## Core Requirements

- [ ] Maintain inventory of items awaiting pickup
- [ ] Send patient notification when items arrive
- [ ] Track storage location for each item
- [ ] Generate aging reports (how long waiting)
- [ ] Send automated pickup reminders
- [ ] Confirm pickup with staff verification
- [ ] Handle unclaimed items (resend, discard)
- [ ] Support parent/guardian pickup authorization

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/pickup` | `lab:track` | List items awaiting pickup |
| GET | `/api/lab/pickup/patient/:patientId` | `lab:track` | Patient's pending items |
| POST | `/api/lab/pickup/:id/confirm` | `lab:track` | Confirm pickup |
| POST | `/api/lab/pickup/:id/remind` | `lab:track` | Send reminder |
| PUT | `/api/lab/pickup/:id/location` | `lab:track` | Update storage location |
| GET | `/api/lab/pickup/aging` | `lab:track` | Aging report |

---

## Data Model

```prisma
model PatientPickupItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  labOrderId    String   @db.ObjectId
  labOrderItemId String  @db.ObjectId

  itemDescription String
  productCategory LabProductCategory

  status        PickupStatus @default(AWAITING_PICKUP)

  storageLocation String?  // "Drawer 3", "Retainer Cabinet A"

  arrivedAt     DateTime
  notifiedAt    DateTime?
  pickedUpAt    DateTime?

  remindersSent Int      @default(0)
  lastReminderAt DateTime?
  nextReminderAt DateTime?

  pickedUpBy    String?
  verifiedBy    String?  @db.ObjectId

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}
```

---

## Business Rules

- Initial notification sent upon item arrival
- Reminder sent at 7, 14, and 30 days (configurable)
- Items over 90 days flagged for review
- Pickup requires staff verification
- Unclaimed retainers may require remake due to fit changes

---

## Dependencies

**Depends On:**
- Order Tracking (received items)
- Quality & Remakes (inspection complete)
- Patient Communications (notifications)

**Required By:**
- Practice Orchestration (pickup inventory view)
- Financial Management (unclaimed item tracking)

---

## Notes

- Consider patient portal self-scheduling for pickup
- Support batch reminders for efficiency
- Track pickup times for front desk scheduling

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
