# Milestone Tracking

> **Sub-Area**: [Treatment Tracking](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Milestone Tracking defines and monitors key treatment milestones from start through completion. Standard milestones are auto-created based on treatment type, with target dates and completion criteria. The system tracks milestone achievement, generates alerts for overdue items, and reports on milestone achievement rates. Custom milestones can be added for unique case requirements.

---

## Core Requirements

- [ ] Create standard milestones based on treatment type
- [ ] Set target dates for milestones
- [ ] Track milestone achievement with dates
- [ ] Document milestone completion details
- [ ] Generate alerts for overdue milestones
- [ ] Support custom milestone creation
- [ ] Link milestones to clinical documentation
- [ ] Report on milestone achievement rates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/milestones` | `treatment:read` | List milestones |
| POST | `/api/treatment-plans/:id/milestones` | `milestone:create` | Create milestone |
| PUT | `/api/milestones/:id` | `milestone:update` | Update milestone |
| DELETE | `/api/milestones/:id` | `milestone:update` | Delete milestone |
| POST | `/api/milestones/:id/achieve` | `milestone:update` | Mark achieved |
| GET | `/api/milestones/overdue` | `treatment:read` | Get overdue milestones |
| GET | `/api/milestones/upcoming` | `treatment:read` | Get upcoming milestones |

---

## Data Model

```prisma
model TreatmentMilestone {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  treatmentPlanId     String   @db.ObjectId

  // Milestone Details
  milestoneName       String
  milestoneType       MilestoneType
  description         String?

  // Dates
  targetDate          DateTime?
  achievedDate        DateTime?

  // Status
  status              MilestoneStatus @default(PENDING)

  // Criteria
  completionCriteria  String?

  // Notes
  notes               String?

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([clinicId])
  @@index([treatmentPlanId])
  @@index([status])
  @@index([targetDate])
}

enum MilestoneType {
  TREATMENT_START
  BONDING_COMPLETE
  INITIAL_ALIGNMENT
  SPACE_CLOSURE_START
  SPACE_CLOSURE_COMPLETE
  SURGICAL_READY
  SURGERY_COMPLETE
  FINISHING_START
  DEBOND_READY
  DEBOND_COMPLETE
  RETENTION_START
  RETENTION_CHECK
  TREATMENT_COMPLETE
  CUSTOM
}

enum MilestoneStatus {
  PENDING
  IN_PROGRESS
  ACHIEVED
  MISSED
  DEFERRED
  CANCELLED
}
```

---

## Business Rules

- Standard milestones auto-created at treatment plan activation
- Milestone types vary by treatment type (comprehensive vs. Phase I)
- Overdue milestones (past target, not achieved) trigger alerts
- ACHIEVED status requires achievedDate
- MISSED status for past-due milestones that won't be met
- DEFERRED for intentionally delayed milestones

---

## Dependencies

**Depends On:**
- Treatment Planning (treatment plan, phases)

**Required By:**
- Timeline Visualization (milestone display)
- Progress Monitoring (milestone-based progress)
- Practice Orchestration (alerts and dashboards)

---

## Notes

- Standard milestone sets by treatment type reduce setup time
- Milestone achievement rates useful for practice analytics
- Consider milestone notification preferences per patient

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
