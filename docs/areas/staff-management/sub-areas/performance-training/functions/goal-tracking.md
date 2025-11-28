# Goal Tracking

> **Sub-Area**: [Performance & Training](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Set, track, and achieve performance goals aligned with practice objectives. Supports individual and team goals, milestone tracking, progress monitoring, and goal cascading from practice-level to individual-level. Enables structured performance improvement.

---

## Core Requirements

- [ ] Create individual performance goals
- [ ] Support team and department goals
- [ ] Track goal progress automatically
- [ ] Manage goal milestones
- [ ] Link goals to metrics for auto-progress
- [ ] Support goal cascading (practice → team → individual)
- [ ] Recognition for goal achievement

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/goals` | `performance:read` | Get staff goals |
| GET | `/api/staff/goals/:goalId` | `performance:read` | Get goal details |
| POST | `/api/staff/:id/goals` | `performance:create` | Create goal |
| PUT | `/api/staff/goals/:goalId` | `performance:update` | Update goal |
| DELETE | `/api/staff/goals/:goalId` | `performance:delete` | Delete goal |
| POST | `/api/staff/goals/:goalId/progress` | `performance:update` | Log progress |
| PUT | `/api/staff/goals/:goalId/status` | `performance:update` | Update status |
| GET | `/api/staff/goals/team` | `performance:view_all` | Get team goals |

---

## Data Model

```prisma
model PerformanceGoal {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  title         String
  description   String?
  category      GoalCategory
  priority      GoalPriority @default(MEDIUM)

  metricType    MetricType?
  metricCode    String?
  targetValue   Decimal?
  targetUnit    String?
  baselineValue Decimal?

  startDate     DateTime
  targetDate    DateTime
  completedDate DateTime?

  currentValue  Decimal?
  progressPercent Int     @default(0)
  status        GoalStatus @default(NOT_STARTED)

  milestones    GoalMilestone[]
  parentGoalId  String?  @db.ObjectId
  isPrivate     Boolean  @default(false)

  @@index([staffProfileId])
  @@index([status])
  @@index([category])
}

type GoalMilestone {
  title         String
  targetValue   Decimal?
  targetDate    DateTime
  completed     Boolean   @default(false)
  completedDate DateTime?
}

enum GoalCategory {
  PRODUCTION
  CONVERSION
  PATIENT_SATISFACTION
  EFFICIENCY
  TRAINING
  PROFESSIONAL_DEVELOPMENT
  TEAM_COLLABORATION
}

enum GoalStatus {
  NOT_STARTED
  IN_PROGRESS
  AT_RISK
  ON_TRACK
  COMPLETED
  EXCEEDED
  NOT_MET
  CANCELLED
}
```

---

## Business Rules

- Goals should align with practice/team objectives
- Metric-linked goals update progress automatically
- Manual goals require progress logging
- Status transitions: NOT_STARTED → IN_PROGRESS → COMPLETED/NOT_MET
- AT_RISK status for goals behind schedule
- Completed goals trigger recognition notifications
- Goal history retained for performance reviews

### Goal Categories by Role

| Category | Examples | Typical Roles |
|----------|----------|---------------|
| Production | $X monthly production | Providers |
| Conversion | X% conversion rate | Treatment Coordinators |
| Patient Satisfaction | X rating average | All clinical |
| Efficiency | X patients per day | Clinical staff |
| Training | Complete X courses | All staff |
| Professional | Certification attainment | Individual growth |

### Goal Templates

- Provider Production Goals
- TC Conversion Goals
- Patient Satisfaction Goals
- Training Completion Goals
- New Skill Development Goals

---

## Dependencies

**Depends On:**
- Employee Profiles
- Performance Metrics (for auto-progress)

**Required By:**
- Performance Reviews (goals achieved count)
- Recognition (goal completion)

---

## Notes

- Consider: goal suggestions based on role and experience
- Team goals may aggregate individual contributions
- Private goals visible only to self and direct manager
- Goal cascading helps align individual and practice objectives
