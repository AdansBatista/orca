# Overtime Tracking

> **Sub-Area**: [Scheduling & Time Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Monitor and manage overtime hours to ensure labor law compliance and budget management. Provides real-time overtime calculations, approaching overtime alerts, and approval workflows for overtime work. Generates reports for payroll processing and budget analysis.

---

## Core Requirements

- [ ] Real-time weekly hour calculations
- [ ] Approaching overtime alerts (at 38 hours)
- [ ] Overtime approval workflow
- [ ] Overtime reports by employee and department
- [ ] Budget impact analysis
- [ ] Labor law compliance monitoring
- [ ] Pre-approval for planned overtime

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/overtime` | `schedule:read` | Get overtime report |
| GET | `/api/staff/:id/overtime` | `schedule:read` | Get staff overtime |
| GET | `/api/staff/overtime/approaching` | `schedule:read` | Get approaching overtime |
| POST | `/api/staff/overtime/:id/approve` | `schedule:approve_overtime` | Approve overtime |
| GET | `/api/staff/overtime/report` | `schedule:read` | Generate overtime report |

---

## Data Model

```prisma
model OvertimeLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  weekStartDate DateTime @db.Date
  weekEndDate   DateTime @db.Date

  regularHours  Decimal
  overtimeHours Decimal
  totalHours    Decimal

  status        OvertimeStatus @default(PENDING)
  preApproved   Boolean  @default(false)

  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?
  reason        String?
  notes         String?

  @@unique([staffProfileId, weekStartDate])
  @@index([weekStartDate])
  @@index([status])
}

enum OvertimeStatus {
  PENDING
  APPROVED
  REJECTED
  PAID
}
```

---

## Business Rules

- Standard work week: 40 hours
- Approaching threshold: 38 hours triggers alert
- Overtime: 40+ hours at 1.5x rate
- Excessive overtime: 50+ hours requires management review
- Some states have daily overtime rules (8+ hours)
- Pre-approved overtime skips approval workflow
- Overtime must be approved before payroll processing

### Overtime Thresholds

| Threshold | Hours | Action |
|-----------|-------|--------|
| Standard Week | 40 hours | Normal tracking |
| Approaching | 38 hours | Warning alert |
| Overtime | 40+ hours | OT rate applies |
| Excessive | 50+ hours | Management review |

### Compliance Considerations

- FLSA federal overtime requirements
- State-specific overtime rules
- Healthcare worker regulations
- Meal and break requirements

---

## Dependencies

**Depends On:**
- Shift Scheduling
- Time Tracking (actual hours)

**Required By:**
- Payroll processing
- Budget management
- Compliance reporting

---

## Notes

- Salaried exempt employees may not be subject to overtime
- Consider: comp time as alternative to paid overtime
- State laws vary significantly for overtime calculation
- Integration with payroll for automatic rate calculation
