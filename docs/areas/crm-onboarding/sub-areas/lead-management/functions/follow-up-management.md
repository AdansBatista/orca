# Follow-up Management

> **Sub-Area**: [Lead Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Follow-up Management ensures timely and consistent lead nurturing through task creation, reminders, and activity logging. It provides automated follow-up scheduling based on pipeline stage, tracks all lead interactions, and alerts coordinators to overdue tasks to prevent leads from falling through the cracks.

---

## Core Requirements

- [ ] Create follow-up tasks with due dates and reminders
- [ ] Auto-create tasks based on pipeline stage transitions
- [ ] Log all activities (calls, emails, SMS) with outcomes
- [ ] Send in-app and email notifications for upcoming/overdue tasks
- [ ] Provide task templates for common follow-up scenarios
- [ ] Track call outcomes (spoke, voicemail, no answer, wrong number)
- [ ] Escalate overdue tasks to clinic admin after threshold

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/leads/:id/tasks` | `lead:read` | Get lead's tasks |
| POST | `/api/leads/:id/tasks` | `lead:update` | Create task for lead |
| PUT | `/api/leads/tasks/:taskId` | `lead:update` | Update task |
| POST | `/api/leads/tasks/:taskId/complete` | `lead:update` | Mark task complete |
| GET | `/api/leads/:id/activities` | `lead:read` | Get lead's activity history |
| POST | `/api/leads/:id/activities` | `lead:update` | Log activity |
| GET | `/api/leads/tasks/my-tasks` | `lead:read` | Get current user's tasks |
| GET | `/api/leads/tasks/overdue` | `lead:read` | Get overdue tasks |

---

## Data Model

```prisma
model LeadTask {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  leadId        String   @db.ObjectId

  // Task details
  title         String
  description   String?
  type          LeadTaskType
  priority      TaskPriority @default(NORMAL)

  // Assignment
  assignedToId  String   @db.ObjectId

  // Scheduling
  dueAt         DateTime
  reminderAt    DateTime?

  // Status
  status        TaskStatus @default(PENDING)
  completedAt   DateTime?
  completedBy   String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  lead          Lead     @relation(fields: [leadId], references: [id])

  @@index([leadId])
  @@index([assignedToId])
  @@index([dueAt])
  @@index([status])
}

model LeadActivity {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  leadId        String   @db.ObjectId

  // Activity details
  type          LeadActivityType
  direction     ActivityDirection?
  outcome       String?
  notes         String?
  durationMinutes Int?

  // Stage change tracking
  previousStage String?
  newStage      String?

  // Timestamps
  occurredAt    DateTime @default(now())
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  // Relations
  lead          Lead     @relation(fields: [leadId], references: [id])

  @@index([leadId])
  @@index([occurredAt])
}
```

---

## Business Rules

- New leads auto-receive "Initial Contact" task due in 5 minutes (speed-to-lead)
- Tasks assigned to lead's coordinator by default
- Overdue tasks escalate after 24 hours with no contact
- Stage changes auto-trigger stage-specific task templates
- All contact attempts must be logged, including unsuccessful calls
- Three failed contact attempts in a row suggest moving to Lost
- Task reminders sent 15 minutes before due time
- Activity timeline shows all interactions in chronological order

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)
- Lead Capture (leads to follow up)
- Conversion Pipeline (stage-based triggers)
- Patient Communications (notification delivery)

**Required By:**
- Lead Analytics (follow-up metrics)
- Coordinator Assignment (workload calculation)

---

## Notes

- Consider integration with phone system for automatic call logging
- Task snooze functionality for temporarily deferring follow-up
- Batch task creation for multiple leads (e.g., post-event follow-up)
- Activity logging should capture communication channel used

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
