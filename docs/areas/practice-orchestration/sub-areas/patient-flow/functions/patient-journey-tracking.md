# Patient Journey Tracking

> **Sub-Area**: [Patient Flow Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Patient Journey Tracking monitors each patient's progression through all clinic stages from arrival to departure. It logs stage transitions with timestamps, tracks time spent in each stage, manages provider handoffs, and provides journey visualization for both current visits and historical patterns.

---

## Core Requirements

- [ ] Track all stage transitions with timestamps
- [ ] Calculate time spent in each stage
- [ ] Log who triggered each transition
- [ ] Handle provider handoffs between stages
- [ ] Support notes and alerts at each stage
- [ ] Visualize current journey progress
- [ ] Store complete journey history
- [ ] Analyze historical patterns per patient
- [ ] Detect anomalies (stuck in stage too long)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/flow/:appointmentId/journey` | `ops:view_dashboard` | Get current journey |
| GET | `/api/v1/ops/flow/:appointmentId/history` | `ops:view_dashboard` | Get stage history |
| POST | `/api/v1/ops/flow/:appointmentId/note` | `ops:manage_flow` | Add journey note |
| GET | `/api/v1/ops/flow/patient/:patientId/patterns` | `ops:view_analytics` | Get patient visit patterns |

---

## Data Model

```prisma
model FlowStageHistory {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  flowStateId     String    @db.ObjectId

  stage           FlowStage
  enteredAt       DateTime  @default(now())
  exitedAt        DateTime?
  duration        Int?      // Minutes in this stage

  // Context
  triggeredBy     String?   @db.ObjectId
  providerId      String?   @db.ObjectId
  chairId         String?   @db.ObjectId

  // Notes
  notes           String?
  alerts          String[]

  flowState       PatientFlowState @relation(fields: [flowStateId], references: [id])

  @@index([flowStateId, stage])
}

// Journey summary for visualization
type JourneySummary {
  appointmentId   String
  patientId       String
  date            DateTime
  stages: {
    stage         FlowStage
    enteredAt     DateTime
    duration      Int?
    status        'completed' | 'current' | 'pending'
  }[]
  totalDuration   Int
  waitDuration    Int
  treatmentDuration Int
}
```

---

## Business Rules

- Every stage transition creates history record
- Duration calculated when exiting stage
- Current stage has null exitedAt and duration
- Provider handoffs logged with both provider IDs
- Stuck alerts triggered at stage-specific thresholds
- Historical patterns limited to last 12 months
- Journey data retained per compliance policy

---

## Dependencies

**Depends On:**
- [Patient Check-In](./patient-check-in.md) - Journey start
- [Call-to-Chair](./call-to-chair.md) - Stage transitions
- [Check-Out Processing](./check-out-processing.md) - Journey end

**Required By:**
- [Wait Time Monitoring](./wait-time-monitoring.md) - Stage durations
- [AI Manager](../../ai-manager/) - Pattern analysis

---

## Notes

- Visual timeline component showing stage progression
- Color-code stages by duration vs. target
- Patient-facing journey display (simplified, no PHI)
- Export journey data for quality improvement analysis

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
