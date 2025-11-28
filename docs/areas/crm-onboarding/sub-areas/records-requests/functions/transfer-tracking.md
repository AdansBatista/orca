# Transfer Status Tracking

> **Sub-Area**: [Records Requests](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Transfer Status Tracking provides visibility into the complete lifecycle of records requests from initiation to completion. It enables staff to monitor all active requests, track status changes with timestamps, schedule follow-ups, and report on turnaround times for operational improvement.

---

## Core Requirements

- [ ] Visual dashboard of all active records requests
- [ ] Track status progression with timestamps
- [ ] Support automatic status updates from delivery confirmations
- [ ] Schedule and track follow-up reminders
- [ ] Maintain complete request history per patient
- [ ] Generate turnaround time reports
- [ ] Alert on stalled or overdue requests

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/records-requests` | `records:read` | List all requests with filters |
| GET | `/api/records-requests/dashboard` | `records:read` | Dashboard summary data |
| POST | `/api/records-requests/:id/status` | `records:update` | Update request status |
| GET | `/api/records-requests/:id/history` | `records:read` | Get status history |
| GET | `/api/records-requests/:id/follow-ups` | `records:read` | Get follow-up schedule |
| POST | `/api/records-requests/:id/follow-ups` | `records:update` | Log follow-up attempt |
| GET | `/api/records-requests/metrics` | `records:compliance` | Get turnaround metrics |

---

## Data Model

```prisma
// Status history embedded in RecordsRequest as StatusChange[]
type StatusChange {
  status        RecordsRequestStatus
  changedAt     DateTime
  changedBy     String
  notes         String?
}

model RecordsFollowUp {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  requestId     String   @db.ObjectId

  // Follow-up details
  followUpType  FollowUpType
  scheduledDate DateTime
  completedDate DateTime?

  // Communication
  method        CommunicationMethod?
  outcome       FollowUpOutcome?
  notes         String?

  // Audit
  createdBy     String   @db.ObjectId
  completedBy   String?  @db.ObjectId

  // Relations
  request       RecordsRequest @relation(fields: [requestId], references: [id])

  @@index([requestId])
  @@index([scheduledDate])
}

enum RecordsRequestStatus {
  CREATED
  AUTHORIZATION_PENDING
  READY_TO_SEND
  SENT
  ACKNOWLEDGED
  IN_PROGRESS
  FEE_PENDING
  PREPARING
  QUALITY_REVIEW
  READY_TO_DELIVER
  DELIVERED
  RECEIVED
  FILED
  COMPLETED
  CANCELLED
  FAILED
}

enum FollowUpType {
  INITIAL_CHECK
  STATUS_CHECK
  REMINDER
  ESCALATION
  FINAL_NOTICE
}

enum FollowUpOutcome {
  NO_ANSWER
  LEFT_MESSAGE
  SPOKE_WITH_STAFF
  CONFIRMED_IN_PROGRESS
  CONFIRMED_SENT
  ISSUE_IDENTIFIED
  REQUEST_CANCELLED
}
```

---

## Business Rules

- Status progression logged automatically with user and timestamp
- Incoming requests: follow-up at 7, 14, 21 days after send
- Outgoing requests: due date based on state requirements
- Stalled requests (no status change in 7 days) flagged
- Dashboard shows requests by status for workflow management
- Turnaround time calculated from request to completion
- Cancelled requests require reason documentation
- Failed requests logged with issue details for process improvement

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)
- Incoming Records Management (incoming request status)
- Outgoing Records Preparation (outgoing request status)

**Required By:**
- Compliance Monitoring (timing compliance)
- Practice Orchestration (operations dashboard)

---

## Notes

- Consider Kanban-style board for visual request management
- Bulk status updates for batch operations
- Email notifications for status changes to assigned staff
- Historical reporting for process improvement analysis

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
