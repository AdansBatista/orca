# Time-Off Management

> **Sub-Area**: [Scheduling & Time Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Handle time-off requests with approval workflows and coverage impact assessment. Provides self-service request submission, PTO balance tracking, and manager approval routing. Supports various time-off types including vacation, sick, FMLA, and continuing education.

---

## Core Requirements

- [ ] Self-service time-off request submission
- [ ] Approval workflow with manager routing
- [ ] PTO balance tracking by type
- [ ] Coverage impact assessment before approval
- [ ] Calendar integration showing approved time-off
- [ ] Support partial day requests
- [ ] Time-off blackout date management
- [ ] Bulk time-off for practice closures/holidays

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/time-off` | `schedule:read` | List time-off requests |
| GET | `/api/staff/:id/time-off` | `schedule:read` | Get staff time-off |
| POST | `/api/staff/:id/time-off` | `schedule:request` | Request time-off |
| PUT | `/api/staff/time-off/:requestId` | `schedule:update` | Update request |
| POST | `/api/staff/time-off/:requestId/approve` | `schedule:approve_timeoff` | Approve request |
| POST | `/api/staff/time-off/:requestId/reject` | `schedule:approve_timeoff` | Reject request |
| DELETE | `/api/staff/time-off/:requestId` | `schedule:request` | Cancel/withdraw request |
| GET | `/api/staff/:id/time-off/balance` | `schedule:read` | Get PTO balance |

---

## Data Model

```prisma
model TimeOffRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  requestType   TimeOffType
  startDate     DateTime @db.Date
  endDate       DateTime @db.Date
  totalDays     Decimal
  totalHours    Decimal?

  isPartialDay  Boolean  @default(false)
  partialStartTime DateTime?
  partialEndTime DateTime?

  status        TimeOffStatus @default(PENDING)
  reason        String?

  // Approval
  reviewedBy    String?  @db.ObjectId
  reviewedAt    DateTime?
  rejectionReason String?

  // Coverage
  coverageRequired Boolean @default(true)
  coverageStaffId String?  @db.ObjectId

  @@index([staffProfileId])
  @@index([startDate])
  @@index([status])
}

enum TimeOffType {
  VACATION
  SICK
  PERSONAL
  BEREAVEMENT
  JURY_DUTY
  FMLA
  CONTINUING_EDUCATION
  UNPAID
  HOLIDAY
}

enum TimeOffStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  WITHDRAWN
}
```

---

## Business Rules

- Advance notice required: configurable (default 2 weeks for vacation)
- Sick leave may be reported same-day (notification only)
- FMLA requests route to HR for compliance review
- Blackout dates prevent requests during critical periods
- Coverage assessment shows impact on staffing levels
- Approved time-off automatically blocks scheduling
- Managers cannot approve their own requests
- PTO balances track accrual and usage by type

### Time-Off Type Rules

| Type | Approval | Accrues | Advance Notice |
|------|----------|---------|----------------|
| Vacation | Required | Yes | 2 weeks |
| Sick | Notification | Yes | Same day OK |
| Personal | Required | No | 1 week |
| FMLA | HR Review | No | ASAP |
| CE | Required | No | 2 weeks |

---

## Dependencies

**Depends On:**
- Employee Profiles
- Shift Scheduling
- Coverage Management

**Required By:**
- Schedule views
- Coverage gap detection
- Payroll (unpaid leave tracking)

---

## Notes

- Consider: PTO accrual calculations based on tenure
- Bereavement and jury duty may have documentation requirements
- FMLA has specific federal compliance requirements
- Holiday time-off often applied in bulk
