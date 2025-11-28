# Collection Workflows

> **Sub-Area**: [Collections Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Collection Workflows automates collection sequences based on account status and aging. This function defines workflow stages with escalating actions (reminders, calls, letters), automatically progresses accounts through stages based on days overdue, supports manual override and escalation, and tracks workflow effectiveness to optimize collection strategies.

---

## Core Requirements

- [ ] Define configurable collection workflow stages
- [ ] Automatic progression based on days overdue
- [ ] Action triggers at each stage (email, SMS, call task, letter)
- [ ] Manual override and early escalation
- [ ] Pause workflows (payment plan, dispute, hardship)
- [ ] Track workflow effectiveness by stage
- [ ] Support multiple workflows (patient vs. insurance)
- [ ] Workflow assignment rules

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/collections/workflows` | `collections:read` | List workflows |
| GET | `/api/collections/workflows/:id` | `collections:read` | Get workflow details |
| POST | `/api/collections/workflows` | `collections:manage` | Create workflow |
| PUT | `/api/collections/workflows/:id` | `collections:manage` | Update workflow |
| DELETE | `/api/collections/workflows/:id` | `collections:manage` | Delete workflow |
| POST | `/api/collections/workflows/:id/activate` | `collections:manage` | Activate workflow |
| GET | `/api/collections/workflows/:id/effectiveness` | `collections:read` | Get effectiveness metrics |

---

## Data Model

```prisma
model CollectionWorkflow {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Workflow definition
  name          String
  description   String?
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // Trigger criteria
  triggerDays   Int      // Days overdue to start workflow
  minBalance    Decimal  @default(0)
  maxBalance    Decimal?
  arType        ARType   @default(PATIENT)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  stages    CollectionStage[]

  @@index([clinicId])
  @@index([isActive])
}

model CollectionStage {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  workflowId    String   @db.ObjectId

  // Stage definition
  stageNumber   Int
  name          String
  description   String?

  // Timing
  daysFromTrigger  Int   // Days from workflow start
  daysToEscalate   Int?  // Days before auto-escalate

  // Actions
  actions       CollectionAction[]

  // Relations
  workflow    CollectionWorkflow @relation(fields: [workflowId], references: [id])

  @@index([workflowId])
  @@index([stageNumber])
}

type CollectionAction {
  type          CollectionActionType
  templateId    String?
  assignTo      String?  // Role or specific user
  priority      String?  // Task priority
  notes         String?
}

enum CollectionActionType {
  EMAIL
  SMS
  LETTER
  PHONE_CALL
  CREATE_TASK
  FLAG_ACCOUNT
  APPLY_LATE_FEE
  SEND_TO_AGENCY
  SUSPEND_TREATMENT
  NOTIFY_MANAGER
}
```

---

## Business Rules

- Only one workflow active per account at a time
- Default workflow applies if no specific workflow assigned
- Workflow pauses when payment plan established
- Resume workflow if payment plan defaults
- Manual escalation requires permission
- Stage actions execute in order
- Failed actions logged but don't block progression
- Complete workflow when balance paid in full

---

## Dependencies

**Depends On:**
- Patient Account Management (account status)
- Aging Reports (days overdue)
- Patient Communications (action delivery)

**Required By:**
- Payment Reminders (reminder timing)
- Late Payment Tracking (workflow status)
- Collection Agency Integration (agency stage)

---

## Notes

- Start with simple 4-stage default workflow
- Track which stage has highest payment recovery
- Consider time-of-day for communication actions
- Implement A/B testing for workflow optimization
- Support seasonal workflow adjustments

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
