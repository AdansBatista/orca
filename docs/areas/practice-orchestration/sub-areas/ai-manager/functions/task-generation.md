# Task Generation

> **Sub-Area**: [AI Manager](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Task Generation automatically creates operational tasks based on clinic data and AI analysis. It generates morning briefing tasks, prioritizes daily activities, provides context-aware task suggestions, recommends assignees, and tracks task completion for continuous improvement.

---

## Core Requirements

- [ ] Auto-generate daily operational tasks
- [ ] Prioritize tasks by impact and urgency
- [ ] Provide context for each generated task
- [ ] Suggest appropriate assignees based on role/workload
- [ ] Support task acceptance, modification, or dismissal
- [ ] Track task completion and outcomes
- [ ] Learn from task patterns and outcomes
- [ ] Generate tasks from anomalies and recommendations
- [ ] Provide morning briefing summary

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/ai/tasks` | `ops:ai_manager` | Get AI-generated tasks |
| GET | `/api/v1/ops/ai/tasks/:id` | `ops:ai_manager` | Get task details |
| POST | `/api/v1/ops/ai/tasks/generate` | `ops:ai_manager` | Trigger task generation |
| PUT | `/api/v1/ops/ai/tasks/:id/accept` | `ops:ai_manager` | Accept generated task |
| PUT | `/api/v1/ops/ai/tasks/:id/dismiss` | `ops:ai_manager` | Dismiss task |
| PUT | `/api/v1/ops/ai/tasks/:id/complete` | `ops:ai_manager` | Mark task complete |
| GET | `/api/v1/ops/ai/briefing` | `ops:ai_manager` | Get morning briefing |

---

## Data Model

```prisma
model AIGeneratedTask {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String        @db.ObjectId

  title           String
  description     String?
  category        TaskCategory

  generationReason String       // Why task was generated
  sourceType      String?       // anomaly, recommendation, pattern
  sourceId        String?       @db.ObjectId

  suggestedAssignee String?     @db.ObjectId
  assignedTo      String?       @db.ObjectId

  priority        TaskPriority
  confidenceScore Float?

  suggestedDueAt  DateTime?
  dueAt           DateTime?

  status          AITaskStatus  @default(PENDING)
  completedAt     DateTime?
  completedBy     String?       @db.ObjectId
  outcome         String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([clinicId, status])
  @@index([clinicId, createdAt])
}

enum TaskCategory {
  PATIENT_OUTREACH   // Call no-shows, follow-ups
  SCHEDULE_ACTION    // Fill gaps, reschedule
  EQUIPMENT          // Maintenance, calibration
  STAFF_COORDINATION // Coverage, assignments
  ADMINISTRATIVE     // Reports, compliance
  QUALITY            // Patient satisfaction, reviews
}

enum TaskPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum AITaskStatus {
  PENDING     // Generated, awaiting review
  ACCEPTED    // User accepted task
  IN_PROGRESS // Being worked on
  COMPLETED   // Task done
  DISMISSED   // User dismissed task
}
```

---

## Example Generated Tasks

| Task | Category | Trigger |
|------|----------|---------|
| "Call 3 patients who no-showed yesterday" | PATIENT_OUTREACH | No-show pattern |
| "Chair 2 calibration due tomorrow" | EQUIPMENT | Maintenance schedule |
| "Fill 2pm gap - Patient Jones needs adjustment" | SCHEDULE_ACTION | Schedule optimization |
| "Review patients with 90+ day balances" | ADMINISTRATIVE | Billing aging |
| "Confirm 5 unconfirmed appointments for tomorrow" | PATIENT_OUTREACH | Confirmation status |

---

## Business Rules

- Daily tasks generated at 6 AM (configurable)
- Maximum 10 AI tasks per day (prevent overwhelm)
- Task priority based on impact and urgency scores
- Assignee suggestions based on role and current workload
- Dismissed tasks inform future generation (don't repeat)
- High-confidence tasks (>0.8) may auto-create
- Morning briefing summarizes top 5 priorities

---

## Dependencies

**Depends On:**
- [Anomaly Detection](./anomaly-detection.md) - Anomaly-triggered tasks
- [Schedule Optimization](./schedule-optimization.md) - Schedule-based tasks
- [Equipment Status](../../resource-coordination/functions/equipment-status.md) - Maintenance tasks
- [Failed Appointment Recovery](../../../../booking/sub-areas/waitlist-recovery/functions/failed-appointment-recovery.md) - Outreach tasks

**Required By:**
- [Day View Dashboard](../../operations-dashboard/functions/day-view-dashboard.md) - Task widget
- Operations workflow

---

## Notes

- Morning briefing email option for managers
- Track task completion time for workload analysis
- A/B test task suggestions for optimization
- Consider Slack/Teams integration for notifications

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
