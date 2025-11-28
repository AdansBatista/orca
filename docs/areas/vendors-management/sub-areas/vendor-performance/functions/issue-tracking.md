# Issue Tracking

> **Sub-Area**: [Vendor Performance](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Issue Tracking manages vendor-related problems, disputes, and complaints from identification through resolution. This function documents issue details, assigns ownership, tracks status through resolution, records financial impact and credits, and enables escalation when needed. Provides accountability and systematic resolution of vendor problems.

---

## Core Requirements

- [ ] Create and document vendor issues with details
- [ ] Classify issues by type and severity
- [ ] Assign issues to staff for ownership
- [ ] Track issue status through resolution lifecycle
- [ ] Document vendor communications and responses
- [ ] Record financial impact and credits claimed/received
- [ ] Implement escalation workflow for unresolved issues
- [ ] Capture root cause and preventive actions
- [ ] Track resolution time against SLA
- [ ] Generate issue reports and analytics

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/issues` | `performance:read` | List all issues |
| GET | `/api/vendors/:id/issues` | `performance:read` | Get vendor issues |
| GET | `/api/vendors/issues/:id` | `performance:read` | Get issue details |
| POST | `/api/vendors/:id/issues` | `performance:create` | Create issue |
| PUT | `/api/vendors/issues/:id` | `performance:update` | Update issue |
| PUT | `/api/vendors/issues/:id/status` | `performance:update` | Update status |
| POST | `/api/vendors/issues/:id/assign` | `performance:update` | Assign issue |
| POST | `/api/vendors/issues/:id/escalate` | `performance:escalate` | Escalate issue |
| POST | `/api/vendors/issues/:id/resolve` | `performance:update` | Resolve issue |
| POST | `/api/vendors/issues/:id/comments` | `performance:update` | Add comment |
| GET | `/api/vendors/issues/open` | `performance:read` | List open issues |
| GET | `/api/vendors/issues/my` | `performance:read` | My assigned issues |

---

## Data Model

```prisma
model VendorIssue {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Issue Details
  issueNumber   String   @unique
  issueType     VendorIssueType
  severity      IssueSeverity @default(MEDIUM)
  title         String
  description   String

  // References
  purchaseOrderId String? @db.ObjectId
  orderReceiptId String? @db.ObjectId
  productCode   String?

  // Assignment
  assignedTo    String?  @db.ObjectId
  escalatedTo   String?  @db.ObjectId

  // Status
  status        IssueStatus @default(OPEN)
  resolution    String?
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  // Financial Impact
  financialImpact Decimal?
  creditRequested Decimal?
  creditReceived Decimal?
  creditDate    DateTime?

  // Vendor Communication
  vendorContactedAt DateTime?
  vendorResponse String?
  vendorResponseAt DateTime?

  // Root Cause
  rootCause     String?
  preventiveAction String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  vendor        Vendor   @relation(fields: [vendorId], references: [id])
  comments      IssueComment[]

  @@index([clinicId])
  @@index([vendorId])
  @@index([issueNumber])
  @@index([status])
  @@index([severity])
  @@index([assignedTo])
}

model IssueComment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  issueId       String   @db.ObjectId

  // Comment
  comment       String
  isInternal    Boolean  @default(true)
  commentType   CommentType @default(NOTE)

  // Attachments
  attachmentUrl String?

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId

  @@index([issueId])
}

enum VendorIssueType {
  LATE_DELIVERY
  WRONG_ITEM
  DAMAGED_GOODS
  QUALITY_DEFECT
  QUANTITY_DISCREPANCY
  PRICING_ERROR
  BILLING_ISSUE
  COMMUNICATION
  SERVICE_FAILURE
  CONTRACT_VIOLATION
  OTHER
}

enum IssueSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum IssueStatus {
  OPEN
  IN_PROGRESS
  PENDING_VENDOR
  RESOLVED
  CLOSED
  ESCALATED
}

enum CommentType {
  NOTE
  STATUS_CHANGE
  VENDOR_COMMUNICATION
  ESCALATION
  RESOLUTION
}
```

---

## Business Rules

- Issue numbers: ISS-{YEAR}-{SEQUENCE}
- Response time SLA by severity: Critical 4hr, High 24hr, Medium 48hr, Low 72hr
- Auto-escalate if not resolved within threshold days
- Issues require resolution notes before closing
- Financial impact documented for cost tracking
- Credits tracked until received and reconciled
- Root cause required for recurring issues
- Vendor notified of issue creation (optional)
- Issue history visible on vendor profile
- Issues feed into vendor rating calculations

---

## Dependencies

**Depends On:**
- Vendor Profile Management (vendor reference)
- Order Management (PO/receipt reference)
- Authentication & Authorization (assignment, escalation)
- Email Service (notifications)

**Required By:**
- Performance Metrics (issue counts)
- Vendor Ratings (issue impact on ratings)
- Financial Management (credit tracking)

---

## Notes

- Attachment support for photos, documents
- Issue templates for common issue types
- Email notifications for status changes
- Escalation path configuration
- SLA dashboard for response times
- Vendor communication log for audit trail
- Integration with returns for defect issues

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
