# Check-Out Processing

> **Sub-Area**: [Patient Flow Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Check-Out Processing completes the patient visit by handling treatment completion confirmation, next appointment scheduling, payment processing, instruction delivery, satisfaction survey triggers, and flow state completion. It ensures all necessary end-of-visit tasks are completed.

---

## Core Requirements

- [ ] Confirm treatment completion from provider
- [ ] Schedule next appointment(s) as needed
- [ ] Process payment or set up payment plan
- [ ] Deliver post-visit instructions
- [ ] Trigger satisfaction survey (optional)
- [ ] Complete patient flow state
- [ ] Generate visit summary
- [ ] Update treatment plan progress
- [ ] Handle any outstanding forms

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/v1/ops/flow/:appointmentId/complete` | `ops:manage_flow` | Mark treatment complete |
| POST | `/api/v1/ops/flow/:appointmentId/check-out` | `ops:manage_flow` | Check out patient |
| GET | `/api/v1/ops/flow/:appointmentId/checkout-tasks` | `ops:view_dashboard` | Get checkout task list |
| POST | `/api/v1/ops/flow/:appointmentId/checkout-tasks/:taskId/complete` | `ops:manage_flow` | Complete checkout task |

---

## Data Model

```prisma
model PatientFlowState {
  // ... existing fields ...

  // Checkout tracking
  treatmentCompletedAt  DateTime?
  completedBy           String?     @db.ObjectId
  checkedOutAt          DateTime?
  checkedOutBy          String?     @db.ObjectId

  // Checkout tasks
  checkoutTasks         CheckoutTask[]
}

type CheckoutTask {
  taskId        String
  taskType      CheckoutTaskType
  description   String
  isRequired    Boolean
  completedAt   DateTime?
  completedBy   String?
  notes         String?
}

enum CheckoutTaskType {
  SCHEDULE_NEXT
  COLLECT_PAYMENT
  DELIVER_INSTRUCTIONS
  COLLECT_FORMS
  SURVEY_TRIGGER
  CUSTOM
}
```

---

## Business Rules

- Treatment must be marked complete before checkout
- Payment processing uses billing integration
- Next appointment required if treatment plan indicates
- Instructions delivered based on procedure performed
- Survey triggered 24 hours post-visit (configurable)
- All required checkout tasks must complete before flow ends
- Checkout completes the daily metrics calculation

---

## Dependencies

**Depends On:**
- [Call-to-Chair](./call-to-chair.md) - Patient in treatment
- [Billing & Insurance](../../../../billing-insurance/) - Payment processing
- [Booking & Scheduling](../../../../booking/) - Next appointment

**Required By:**
- [Daily Metrics](../../operations-dashboard/) - Flow completion
- [Patient Communications](../../../../patient-communications/) - Post-visit comms

---

## Notes

- Checkout kiosk option for self-service payment
- Print or email visit summary
- Track checkout duration for staffing optimization
- Handle walk-out scenarios (left without checkout)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
