# Employment Records

> **Sub-Area**: [Staff Profiles & HR](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Track employment history including position changes, promotions, compensation adjustments, and leave periods. Maintains a complete audit trail of employment events for each staff member, supporting compliance requirements and employment verification requests.

---

## Core Requirements

- [ ] Record employment events (hire, promotion, transfer, termination)
- [ ] Track position and title changes with effective dates
- [ ] Document compensation changes (restricted access)
- [ ] Record leave periods (FMLA, maternity/paternity, etc.)
- [ ] Maintain employment history timeline
- [ ] Generate employment verification reports/letters
- [ ] Support document attachments for each record

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/employment-records` | `staff:view_hr` | Get employment history |
| POST | `/api/staff/:id/employment-records` | `staff:update` | Add employment record |
| PUT | `/api/staff/employment-records/:recordId` | `staff:update` | Update record |
| GET | `/api/staff/:id/employment-verification` | `staff:view_hr` | Generate verification letter |

---

## Data Model

```prisma
model EmploymentRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  recordType    EmploymentRecordType
  effectiveDate DateTime
  endDate       DateTime?

  // Position changes
  jobTitle      String?
  department    String?
  supervisor    String?

  // Compensation (restricted)
  previousSalary Decimal?
  newSalary     Decimal?

  reason        String?
  notes         String?
  documentUrl   String?

  createdAt DateTime @default(now())
  createdBy String?  @db.ObjectId

  @@index([staffProfileId])
  @@index([recordType])
}

enum EmploymentRecordType {
  HIRE
  PROMOTION
  TRANSFER
  TITLE_CHANGE
  COMPENSATION_CHANGE
  LEAVE_START
  LEAVE_END
  TERMINATION
  REHIRE
  STATUS_CHANGE
}
```

---

## Business Rules

- HIRE record created automatically with new staff profile
- Compensation changes require `staff:view_salary` permission to view
- TERMINATION records trigger user account deactivation
- Leave periods require start and end records
- Employment verification only includes non-sensitive data
- All records are immutable once created (audit requirement)

---

## Dependencies

**Depends On:**
- Employee Profiles

**Required By:**
- Employment verification reports
- Payroll integration
- Compliance audits

---

## Notes

- FMLA tracking may have additional compliance requirements
- Consider: automated reminders for leave end dates
- Consider: integration with HR systems for record sync
