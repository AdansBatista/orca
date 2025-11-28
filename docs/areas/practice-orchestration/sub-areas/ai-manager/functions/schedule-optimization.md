# Schedule Optimization

> **Sub-Area**: [AI Manager](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Schedule Optimization provides AI-powered recommendations to optimize clinic schedules. It identifies gaps and fill opportunities, detects overbooking situations, suggests provider load balancing, analyzes peak vs. off-peak patterns, and supports what-if modeling for schedule changes.

---

## Core Requirements

- [ ] Identify schedule gaps and recommend fills
- [ ] Detect overbooking risks and suggest redistribution
- [ ] Balance provider workloads across the day/week
- [ ] Analyze peak and off-peak patterns
- [ ] Support what-if scenario modeling
- [ ] Match waitlist patients to available gaps
- [ ] Prioritize recommendations by impact
- [ ] Track recommendation acceptance and outcomes
- [ ] Learn from accepted vs. rejected recommendations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/ai/recommendations` | `ops:ai_manager` | Get recommendations |
| GET | `/api/v1/ops/ai/recommendations/:id` | `ops:ai_manager` | Get recommendation details |
| PUT | `/api/v1/ops/ai/recommendations/:id/accept` | `ops:ai_manager` | Accept recommendation |
| PUT | `/api/v1/ops/ai/recommendations/:id/dismiss` | `ops:ai_manager` | Dismiss recommendation |
| POST | `/api/v1/ops/ai/whatif` | `ops:ai_manager` | Run what-if scenario |
| GET | `/api/v1/ops/ai/gaps` | `ops:ai_manager` | Get schedule gaps analysis |

---

## Data Model

```prisma
model AIRecommendation {
  id              String                  @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String                  @db.ObjectId

  type            RecommendationType
  priority        RecommendationPriority

  title           String
  description     String
  actionItems     Json?                   // Structured actions

  relatedEntity   String?                 // appointment, gap, provider
  relatedId       String?                 @db.ObjectId
  validUntil      DateTime?

  expectedImpact  String?                 // "Fill 30-min gap, increase utilization 5%"
  confidenceScore Float?

  status          RecommendationStatus    @default(PENDING)
  acceptedAt      DateTime?
  acceptedBy      String?                 @db.ObjectId
  outcome         String?

  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt

  @@index([clinicId, status])
  @@index([clinicId, type])
}

enum RecommendationType {
  FILL_GAP
  REDISTRIBUTE_LOAD
  MOVE_APPOINTMENT
  ADD_CAPACITY
  REDUCE_OVERBOOKING
  WAITLIST_MATCH
  STAFFING_ADJUSTMENT
}

enum RecommendationPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum RecommendationStatus {
  PENDING
  ACCEPTED
  DISMISSED
  EXPIRED
  IMPLEMENTED
}
```

---

## Business Rules

- Recommendations expire when gap/slot passes
- Waitlist matching prioritizes by waitlist priority
- Provider load balancing considers provider preferences
- What-if modeling shows impact on utilization and wait times
- Accepted recommendations auto-create tasks if applicable
- Learning: track acceptance rate by recommendation type
- Recommendations regenerated daily or on schedule change

---

## Dependencies

**Depends On:**
- [Booking & Scheduling](../../../../booking/) - Schedule data
- [Waitlist Management](../../../../booking/sub-areas/waitlist-recovery/functions/waitlist-management.md) - Waitlist data
- [Utilization Tracking](../../resource-coordination/functions/utilization-tracking.md) - Utilization data

**Required By:**
- [Natural Language Queries](./natural-language-queries.md) - Query responses
- [Task Generation](./task-generation.md) - Auto-generated tasks

---

## Notes

- Show before/after comparison for recommendations
- Consider patient appointment history in recommendations
- What-if should be fast (<2 sec response)
- Provider can set "do not reschedule" patients

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
