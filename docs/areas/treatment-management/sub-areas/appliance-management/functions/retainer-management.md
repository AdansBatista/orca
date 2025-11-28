# Retainer Management

> **Sub-Area**: [Appliance Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Retainer Management handles retention appliances from order through delivery and long-term tracking. This includes ordering retainers from labs, tracking fabrication status, documenting delivery with wear instructions, managing replacements for lost/broken retainers, and setting retention protocol schedules. The function integrates with lab work management for fabrication workflow.

---

## Core Requirements

- [ ] Order retainers from lab
- [ ] Track fabrication status
- [ ] Record delivery to patient
- [ ] Document wear instructions and schedule
- [ ] Track retainer replacements
- [ ] Support multiple retainer types (Hawley, Essix, Vivera, fixed)
- [ ] Record lost/broken retainers
- [ ] Set retention protocol reminders

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/retainers` | `appliance:read` | List retainer records |
| GET | `/api/retainers/:id` | `appliance:read` | Get retainer record |
| POST | `/api/retainers` | `appliance:create` | Create retainer record |
| PUT | `/api/retainers/:id` | `appliance:update` | Update retainer |
| POST | `/api/retainers/:id/order` | `appliance:create` | Order from lab |
| POST | `/api/retainers/:id/receive` | `appliance:update` | Mark received |
| POST | `/api/retainers/:id/deliver` | `appliance:update` | Mark delivered |
| GET | `/api/patients/:patientId/retainers` | `appliance:read` | Patient's retainers |
| GET | `/api/retainers/pending` | `appliance:read` | Pending retainers |

---

## Data Model

```prisma
model RetainerRecord {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  patientId           String   @db.ObjectId
  treatmentPlanId     String?  @db.ObjectId

  // Retainer Details
  retainerType        RetainerType
  arch                Arch
  material            String?

  // Lab Order
  labOrderId          String?  @db.ObjectId

  // Dates
  orderedDate         DateTime?
  receivedDate        DateTime?
  deliveredDate       DateTime?

  // Status
  status              RetainerStatus @default(ORDERED)

  // Delivery
  deliveredBy         String?  @db.ObjectId

  // Retention Protocol
  wearSchedule        RetentionWearSchedule?
  wearInstructions    String?

  // Replacement
  isReplacement       Boolean  @default(false)
  replacementReason   String?
  previousRetainerId  String?  @db.ObjectId

  // Notes
  notes               String?

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}

enum RetainerType {
  HAWLEY
  ESSIX
  VIVERA
  FIXED_BONDED
  SPRING_RETAINER
  WRAP_AROUND
}

enum RetainerStatus {
  ORDERED
  IN_FABRICATION
  RECEIVED
  DELIVERED
  ACTIVE
  REPLACED
  LOST
  BROKEN
}

enum RetentionWearSchedule {
  FULL_TIME
  NIGHTS_ONLY
  EVERY_OTHER_NIGHT
  FEW_NIGHTS_WEEK
  AS_NEEDED
}
```

---

## Business Rules

- Retainers ordered before debond appointment
- Upper and lower retainers tracked separately
- Wear schedule assigned at delivery
- Replacements linked to original retainer
- Lost/broken retainers trigger replacement workflow
- Vivera retainers ordered in sets of 3-4
- Fixed retainers documented with tooth numbers

---

## Dependencies

**Depends On:**
- Patient Management (patient records)
- Treatment Planning (treatment plan linkage)
- Lab Work Management (lab orders)

**Required By:**
- Treatment Tracking (retention protocol)
- Debond Scheduling (retainer readiness)

---

## Notes

- Consider fee tracking for replacement retainers
- Integration with lab management for order workflow
- Retention wear schedule transitions over time (full-time → nights → as needed)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
