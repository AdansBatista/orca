# Lab Feedback System

> **Sub-Area**: [Quality & Remakes](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Lab Feedback System facilitates constructive communication with lab vendors about quality, performance, and suggestions. Feedback can be issue-based or positive recognition, and the system tracks lab responses. Aggregate feedback reports can be generated for periodic vendor reviews.

---

## Core Requirements

- [ ] Send feedback with documentation to labs
- [ ] Support feedback categories (issue, praise, suggestion)
- [ ] Link feedback to specific quality issues
- [ ] Track lab acknowledgment and response
- [ ] Maintain feedback history by vendor
- [ ] Generate aggregate feedback summaries
- [ ] Schedule periodic feedback reports
- [ ] Use template messages for consistency

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/feedback` | `lab:track` | List feedback |
| POST | `/api/lab/feedback` | `lab:create_order` | Send feedback |
| PUT | `/api/lab/feedback/:id` | `lab:create_order` | Update feedback |
| GET | `/api/lab/feedback/vendor/:vendorId` | `lab:track` | Vendor feedback history |
| POST | `/api/lab/feedback/summary` | `lab:manage_vendors` | Generate summary report |
| GET | `/api/lab/feedback/templates` | `lab:track` | Get feedback templates |

---

## Data Model

```prisma
model LabFeedback {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId
  labOrderId    String?  @db.ObjectId

  feedbackType  FeedbackType  // ISSUE_REPORT, POSITIVE_FEEDBACK, SUGGESTION, QUESTION
  subject       String
  message       String
  attachments   String[]

  qualityIssueIds String[] @db.ObjectId

  labResponse   String?
  respondedAt   DateTime?

  status        FeedbackStatus @default(SENT)

  createdAt     DateTime @default(now())
  sentAt        DateTime @default(now())
  sentBy        String   @db.ObjectId

  @@index([clinicId])
  @@index([vendorId])
  @@index([status])
}

enum FeedbackType {
  ISSUE_REPORT
  POSITIVE_FEEDBACK
  SUGGESTION
  QUESTION
}

enum FeedbackStatus {
  DRAFT
  SENT
  ACKNOWLEDGED
  RESPONDED
  CLOSED
}
```

---

## Business Rules

- Feedback should reference quality issues when applicable
- Positive feedback encouraged for excellent work
- Lab response tracked for follow-up
- Monthly summary reports recommended
- Feedback visible in vendor performance reviews

---

## Dependencies

**Depends On:**
- Quality Issue Logging (issue references)
- Communication Hub (delivery mechanism)
- Lab Vendor Management (vendor contacts)

**Required By:**
- Performance Metrics (relationship health)
- Contract Management (SLA discussions)

---

## Notes

- Constructive, professional tone encouraged
- Consider anonymous feedback aggregation
- Track response time as vendor metric

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
