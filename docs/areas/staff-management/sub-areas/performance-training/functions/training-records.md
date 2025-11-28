# Training Records

> **Sub-Area**: [Performance & Training](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Track and manage all staff training activities including onboarding, compliance training, clinical skills, and professional development. Monitors training completion, expiration, and compliance status. Essential for regulatory compliance and workforce development.

---

## Core Requirements

- [ ] Record training completion details
- [ ] Track required training by role
- [ ] Monitor training expiration dates
- [ ] Generate training compliance reports
- [ ] Implement expiration alerts
- [ ] Store training certificates
- [ ] Manage learning paths by role
- [ ] Track assessment scores and pass/fail status

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/training` | `training:read` | Get training records |
| GET | `/api/staff/training/:recordId` | `training:read` | Get training details |
| POST | `/api/staff/:id/training` | `training:manage` | Add training record |
| PUT | `/api/staff/training/:recordId` | `training:manage` | Update training |
| DELETE | `/api/staff/training/:recordId` | `training:manage` | Delete training |
| POST | `/api/staff/training/:recordId/complete` | `training:manage` | Mark complete |
| GET | `/api/staff/training/required` | `training:read` | Get required training |
| GET | `/api/staff/training/overdue` | `training:read` | Get overdue training |
| GET | `/api/staff/training/expiring` | `training:read` | Get expiring training |
| GET | `/api/staff/training/compliance` | `training:read` | Compliance report |

---

## Data Model

```prisma
model TrainingRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  trainingType  TrainingType
  trainingName  String
  description   String?
  provider      String?
  courseCode    String?

  assignedDate  DateTime?
  startDate     DateTime?
  completionDate DateTime?
  expirationDate DateTime?
  dueDate       DateTime?

  status        TrainingStatus @default(NOT_STARTED)
  isRequired    Boolean  @default(false)

  score         Decimal?
  passingScore  Decimal?
  passed        Boolean?
  attempts      Int      @default(0)

  ceCredits     Decimal?
  ceCategory    String?
  durationHours Decimal?

  certificateUrl String?

  @@index([staffProfileId])
  @@index([trainingType])
  @@index([status])
  @@index([dueDate])
  @@index([expirationDate])
}

enum TrainingType {
  ONBOARDING
  COMPLIANCE
  CLINICAL
  SYSTEM
  EQUIPMENT
  CUSTOMER_SERVICE
  LEADERSHIP
  CONTINUING_EDUCATION
  CERTIFICATION
  SAFETY
}

enum TrainingStatus {
  NOT_STARTED
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  EXPIRED
  WAIVED
  FAILED
}
```

---

## Business Rules

- Required training must be completed by due dates
- Expired training generates compliance alerts
- Training with assessments require passing score
- Completed training with expiration auto-expires
- Waived training requires manager approval
- Failed training may require reattempt
- Training compliance affects role capabilities

### Required Training by Role

| Role | Required Training |
|------|-------------------|
| All Staff | HIPAA, OSHA, Emergency Procedures |
| Clinical Staff | Infection Control, CPR/BLS, X-Ray Safety |
| Providers | State-specific CE requirements |
| Front Desk | HIPAA, Patient Communication |
| Billing | HIPAA, Coding Updates |

### Training Categories

| Category | Examples | Frequency |
|----------|----------|-----------|
| Onboarding | System training, policies | One-time |
| Compliance | HIPAA, OSHA, infection control | Annual |
| Clinical | Procedure training | As needed |
| Equipment | New equipment operation | As acquired |

---

## Dependencies

**Depends On:**
- Employee Profiles
- Document Storage (certificates)
- Notification Service

**Required By:**
- Compliance reporting
- Role capability verification
- CE Credit Management

---

## Notes

- Consider: LMS integration for online training
- Bulk training assignment for compliance updates
- Training history retained for audit purposes
- Certificate verification may be required
