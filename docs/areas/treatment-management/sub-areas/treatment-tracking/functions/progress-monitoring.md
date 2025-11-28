# Progress Monitoring

> **Sub-Area**: [Treatment Tracking](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Progress Monitoring calculates and tracks overall treatment progress against goals and estimates. Progress indicators include timeline completion, visit count, phase advancement, and milestone achievement. The system identifies cases running behind schedule, generates progress alerts, and supports trend analysis across the patient population for practice management insights.

---

## Core Requirements

- [ ] Calculate treatment progress percentage
- [ ] Compare expected vs. actual progress
- [ ] Track visits completed vs. estimated
- [ ] Monitor treatment duration vs. estimate
- [ ] Identify cases behind schedule
- [ ] Generate progress alerts and reports
- [ ] Support clinical decision making
- [ ] Enable trend analysis across patients

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/progress` | `treatment:read` | Get progress summary |
| POST | `/api/treatment-plans/:id/progress/snapshot` | `treatment:read` | Create progress snapshot |
| GET | `/api/treatment-plans/:id/progress/history` | `treatment:read` | Progress history |
| GET | `/api/treatments/behind-schedule` | `treatment:read` | Cases behind schedule |
| GET | `/api/treatments/progress-report` | `treatment:read` | Progress analytics |

---

## Data Model

```prisma
model TreatmentProgress {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  treatmentPlanId     String   @db.ObjectId

  // Progress Snapshot
  snapshotDate        DateTime @default(now())

  // Timeline Progress
  treatmentDay        Int      // Days since start
  estimatedTotalDays  Int
  progressPercent     Int

  // Visit Progress
  completedVisits     Int
  estimatedVisits     Int

  // Phase Progress
  currentPhase        String?
  phaseProgress       Int      @default(0)

  // Milestone Progress
  milestonesAchieved  Int
  totalMilestones     Int

  // Status
  progressStatus      ProgressStatus @default(ON_TRACK)

  // Notes
  notes               String?

  // Timestamps
  createdAt           DateTime @default(now())

  @@index([clinicId])
  @@index([treatmentPlanId])
  @@index([snapshotDate])
}

enum ProgressStatus {
  AHEAD              // >10% ahead of schedule
  ON_TRACK           // Within ±10%
  BEHIND             // 10-25% behind
  SIGNIFICANTLY_BEHIND // >25% behind
}
```

---

## Business Rules

- Progress recalculated at each appointment
- Behind schedule defined as >10% behind expected timeline
- Significantly behind triggers provider notification
- Progress snapshots created for trend tracking
- Visit progress = completed / estimated visits
- Milestone progress = achieved / total milestones

---

## Dependencies

**Depends On:**
- Treatment Planning (plan data, estimates)
- Milestone Tracking (milestone status)
- Clinical Documentation (visit counts)

**Required By:**
- Timeline Visualization (progress display)
- Practice Orchestration (dashboard alerts)
- Reporting & Analytics (progress reports)

---

## Notes

- Consider weighting different progress indicators
- Progress alerts configurable by threshold
- Historical snapshots enable trend visualization

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
