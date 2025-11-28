# Call-to-Chair

> **Sub-Area**: [Patient Flow Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Call-to-Chair manages the process of calling patients from the waiting room to treatment chairs. It provides one-click calling, chair/room assignment, provider assignment, optional SMS/pager notification, and tracks call history for flow analytics.

---

## Core Requirements

- [ ] One-click call patient action from queue
- [ ] Assign chair/room during call
- [ ] Assign provider if not already assigned
- [ ] Send SMS notification to patient (optional)
- [ ] Support pager/buzzer integration (optional)
- [ ] Track call time for wait time calculation
- [ ] Handle no-response scenarios
- [ ] Support re-calling if patient doesn't respond
- [ ] Log call history with timestamps

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/v1/ops/flow/:appointmentId/call` | `ops:manage_flow` | Call patient to chair |
| POST | `/api/v1/ops/flow/:appointmentId/seat` | `ops:manage_flow` | Confirm patient seated |
| POST | `/api/v1/ops/flow/:appointmentId/recall` | `ops:manage_flow` | Re-call patient |
| GET | `/api/v1/ops/flow/:appointmentId/call-history` | `ops:view_dashboard` | Get call history |

---

## Data Model

```prisma
model PatientFlowState {
  // ... existing fields ...

  // Call tracking
  calledAt          DateTime?
  calledBy          String?     @db.ObjectId
  assignedChairId   String?     @db.ObjectId
  assignedProviderId String?    @db.ObjectId

  // Seating
  seatedAt          DateTime?
  callToSeatMinutes Int?        // Time from call to seated
}

model CallHistory {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  flowStateId     String   @db.ObjectId
  clinicId        String   @db.ObjectId

  calledAt        DateTime @default(now())
  calledBy        String   @db.ObjectId
  callMethod      CallMethod

  responded       Boolean  @default(false)
  respondedAt     DateTime?

  chairId         String?  @db.ObjectId
  notes           String?

  @@index([flowStateId])
}

enum CallMethod {
  VERBAL      // Called by name
  SMS         // Text message sent
  PAGER       // Pager/buzzer activated
  DISPLAY     // Waiting room display
}
```

---

## Business Rules

- Chair must be available before calling patient
- Provider must be assigned before or during call
- SMS call requires patient mobile on file with opt-in
- Auto-recall after 5 minutes if not seated (configurable)
- Mark as no-response after 3 call attempts
- Call time starts wait time countdown for "call to seat" metric
- Cannot call patient already in another stage

---

## Dependencies

**Depends On:**
- [Queue Management](./queue-management.md) - Patient to call
- [Chair/Room Assignment](../../resource-coordination/functions/chair-room-assignment.md) - Chair availability

**Required By:**
- [Patient Journey Tracking](./patient-journey-tracking.md) - Stage transition
- [Check-Out Processing](./check-out-processing.md) - Flow continuation

---

## Notes

- Big, easy-to-tap button for clinical staff
- Show estimated treatment time for called patient
- Consider audio announcement integration
- Track average call-to-seat time for operations metrics

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
