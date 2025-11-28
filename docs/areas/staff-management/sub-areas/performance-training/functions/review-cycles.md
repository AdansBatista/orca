# Review Cycles

> **Sub-Area**: [Performance & Training](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Manage formal performance review processes including scheduling, self-assessments, manager assessments, review meetings, and documentation. Supports configurable review cycles (annual, semi-annual, quarterly) and probationary reviews for new hires.

---

## Core Requirements

- [ ] Configure review schedules by role/department
- [ ] Self-assessment form completion
- [ ] Manager assessment form completion
- [ ] Review meeting scheduling
- [ ] Electronic signature capture
- [ ] Review history tracking
- [ ] Improvement plan management
- [ ] Review templates by role

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/reviews` | `performance:read` | List reviews |
| GET | `/api/staff/:id/reviews` | `performance:read` | Get staff reviews |
| GET | `/api/staff/reviews/:reviewId` | `performance:read` | Get review details |
| POST | `/api/staff/:id/reviews` | `performance:review` | Create review |
| PUT | `/api/staff/reviews/:reviewId` | `performance:review` | Update review |
| POST | `/api/staff/reviews/:reviewId/self-assessment` | `performance:self_assess` | Submit self-assessment |
| POST | `/api/staff/reviews/:reviewId/manager-assessment` | `performance:review` | Submit manager assessment |
| POST | `/api/staff/reviews/:reviewId/complete` | `performance:review` | Complete review |
| POST | `/api/staff/reviews/:reviewId/sign` | `performance:sign` | Sign review |
| GET | `/api/staff/reviews/pending` | `performance:review` | Get pending reviews |
| GET | `/api/staff/review-templates` | `performance:read` | List templates |

---

## Data Model

```prisma
model PerformanceReview {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  reviewPeriodStart DateTime
  reviewPeriodEnd DateTime
  reviewType    ReviewType
  templateId    String?  @db.ObjectId

  status        ReviewStatus @default(SCHEDULED)
  scheduledDate DateTime
  dueDate       DateTime?
  completedDate DateTime?
  meetingDate   DateTime?

  reviewerId    String   @db.ObjectId

  selfAssessment ReviewAssessment?
  managerAssessment ReviewAssessment?

  overallScore  Decimal?
  categoryScores Json?

  strengths     String?
  areasForImprovement String?
  developmentPlan String?

  employeeSignedAt DateTime?
  reviewerSignedAt DateTime?

  @@index([staffProfileId])
  @@index([status])
  @@index([reviewType])
}

enum ReviewType {
  ANNUAL
  SEMI_ANNUAL
  QUARTERLY
  PROBATIONARY_30
  PROBATIONARY_60
  PROBATIONARY_90
  IMPROVEMENT_PLAN
  AD_HOC
}

enum ReviewStatus {
  SCHEDULED
  SELF_REVIEW_PENDING
  SELF_REVIEW_COMPLETE
  MANAGER_REVIEW_PENDING
  MANAGER_REVIEW_COMPLETE
  MEETING_SCHEDULED
  PENDING_SIGNATURES
  COMPLETED
  CANCELLED
}
```

---

## Business Rules

- Reviews scheduled based on practice policy
- Self-assessments due before manager assessment begins
- Both parties must sign to complete review
- Review status transitions follow workflow
- Completed reviews are immutable
- Improvement plans required for below-standard ratings
- Probationary reviews at 30/60/90 days for new hires

### Review Workflow

1. Review scheduled → notification sent
2. Employee completes self-assessment
3. Manager completes assessment
4. Meeting scheduled and conducted
5. Feedback documented
6. Both parties sign
7. Review finalized and stored

### Evaluation Categories

- Job Knowledge & Skills
- Quality of Work
- Productivity & Efficiency
- Communication
- Teamwork & Collaboration
- Patient Care (clinical roles)
- Professionalism
- Initiative & Problem Solving

---

## Dependencies

**Depends On:**
- Employee Profiles
- Goal Tracking (goals reviewed)
- Performance Metrics (data for review)

**Required By:**
- HR compliance
- Promotion/compensation decisions
- Training needs identification

---

## Notes

- Consider: 360-degree feedback option
- Rating scale: 1-5 with clear descriptors
- Templates should be customizable per role
- Confidential feedback sections for sensitive topics
