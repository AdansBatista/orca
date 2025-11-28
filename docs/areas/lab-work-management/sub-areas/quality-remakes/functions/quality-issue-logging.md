# Quality Issue Logging

> **Sub-Area**: [Quality & Remakes](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Quality Issue Logging provides structured documentation of all quality problems with lab items. Issues are categorized, severity-rated, and linked to orders and vendors for trend analysis. This data drives vendor performance metrics and quality improvement initiatives.

---

## Core Requirements

- [ ] Structured issue reporting with categories
- [ ] Severity level classification
- [ ] Photo documentation support
- [ ] Link issues to orders and products
- [ ] Track resolution status and actions
- [ ] Maintain issue history by vendor
- [ ] Export reports for lab discussions
- [ ] Trigger alerts for critical issues

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/quality-issues` | `lab:track` | List issues |
| POST | `/api/lab/quality-issues` | `lab:track` | Log new issue |
| PUT | `/api/lab/quality-issues/:id` | `lab:track` | Update issue |
| PUT | `/api/lab/quality-issues/:id/resolve` | `lab:track` | Resolve issue |
| GET | `/api/lab/quality-issues/vendor/:vendorId` | `lab:track` | Issues by vendor |
| GET | `/api/lab/quality-issues/categories` | `lab:track` | Category breakdown |

---

## Data Model

```prisma
model QualityIssue {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId
  labOrderItemId String  @db.ObjectId
  vendorId      String   @db.ObjectId

  category      QualityCategory  // FIT, APPEARANCE, FUNCTION, MATERIAL, etc.
  subcategory   String?
  severity      IssueSeverity  // CRITICAL, MAJOR, MINOR, COSMETIC
  description   String

  photos        String[]

  status        IssueStatus @default(OPEN)
  resolution    String?
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  remakeRequestId String? @db.ObjectId

  feedbackSent  Boolean  @default(false)
  feedbackSentAt DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  reportedBy    String   @db.ObjectId

  @@index([clinicId])
  @@index([vendorId])
  @@index([category])
  @@index([severity])
  @@index([status])
}
```

---

## Business Rules

- All inspection failures should create quality issue
- Critical issues require immediate notification
- Issues must be categorized for analytics
- Resolution required before closing issue
- Feedback to lab encouraged for all issues
- Issue patterns trigger vendor alerts

---

## Dependencies

**Depends On:**
- Receiving Inspection (issue source)
- Lab Vendor Management (vendor context)

**Required By:**
- Quality Analytics (trend analysis)
- Lab Feedback System (feedback content)
- Performance Metrics (quality scores)

---

## Notes

- Categories: Fit, Appearance, Function, Material, Design, Labeling, Shipping
- Severity guides response time and escalation
- Consider issue templates for common problems

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
