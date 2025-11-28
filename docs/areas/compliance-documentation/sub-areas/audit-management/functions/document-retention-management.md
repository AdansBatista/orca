# Document Retention Management

> **Sub-Area**: [Audit Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Document Retention Management enforces record retention policies across all system data, managing the lifecycle from active use through archival and eventual destruction. It tracks retention periods by record type, manages legal holds that suspend destruction, schedules and documents compliant record destruction with certification, and ensures the practice meets all regulatory retention requirements.

---

## Core Requirements

- [ ] Define retention policies by record type with legal basis
- [ ] Track retention periods automatically based on record dates
- [ ] Manage document archival when retention minimum met
- [ ] Schedule secure document destruction with approval workflow
- [ ] Support legal holds that suspend retention timelines
- [ ] Generate destruction certificates with witness documentation
- [ ] Report on retention compliance and upcoming actions
- [ ] Handle exception cases (litigation, audit holds)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/retention/policies` | `audit:view_full` | List retention policies |
| POST | `/api/compliance/retention/policies` | `audit:manage` | Create policy |
| PUT | `/api/compliance/retention/policies/:id` | `audit:manage` | Update policy |
| GET | `/api/compliance/retention/status` | `audit:view_full` | Get retention status summary |
| GET | `/api/compliance/retention/actions` | `audit:view_full` | List pending/completed actions |
| POST | `/api/compliance/retention/actions` | `audit:manage` | Schedule retention action |
| POST | `/api/compliance/retention/actions/:id/execute` | `audit:manage` | Execute retention action |
| GET | `/api/compliance/retention/legal-holds` | `audit:view_full` | List legal holds |
| POST | `/api/compliance/retention/legal-holds` | `audit:manage` | Create legal hold |
| POST | `/api/compliance/retention/legal-holds/:id/release` | `audit:manage` | Release legal hold |

---

## Data Model

```prisma
model RetentionPolicy {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Policy definition
  name          String
  code          String   @unique
  recordType    String   // "Patient Records", "Financial Records", etc.
  description   String?

  // Retention rules
  retentionPeriodYears Int
  retentionBasis String   // "Last Activity", "Creation Date", etc.
  specialRules  String?  // e.g., "Minor: Age 21 + 7 years"

  // Actions
  archiveAfterYears Int?  // When to move to archive (before destruction)
  destructionMethod String  // "Secure shred", "Digital wipe", etc.

  // Status
  isActive      Boolean  @default(true)

  // Legal basis
  legalRequirement String?
  regulatorySource String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([recordType])
}

model RetentionAction {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Action details
  actionType    RetentionActionType
  recordType    String
  recordCount   Int
  description   String?

  // Scheduling
  scheduledDate DateTime
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // Execution
  executedAt    DateTime?
  executedBy    String?  @db.ObjectId
  status        RetentionActionStatus @default(PENDING)

  // For destruction
  destructionMethod String?
  destructionCertUrl String?
  witnessName   String?
  witnessSignature String?

  // Affected records
  affectedRecordIds String[]
  notes         String?

  // Legal hold verification
  legalHoldCleared Boolean @default(false)
  legalHoldClearedBy String? @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([actionType])
  @@index([status])
  @@index([scheduledDate])
}

model LegalHold {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Hold details
  holdName      String
  holdReason    String   // "Litigation", "Regulatory investigation"
  matterReference String?

  // Scope
  recordTypes   String[]
  patientIds    String[] @db.ObjectId
  dateRangeStart DateTime?
  dateRangeEnd  DateTime?

  // Status
  status        LegalHoldStatus @default(ACTIVE)
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId
  releasedAt    DateTime?
  releasedBy    String?  @db.ObjectId
  releaseReason String?

  // Notifications
  custodians    String[] // Staff notified of hold
  notifiedAt    DateTime?

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([status])
}

enum RetentionActionType {
  ARCHIVE
  DESTRUCTION
  LEGAL_HOLD
  RELEASE_HOLD
}

enum RetentionActionStatus {
  PENDING
  APPROVED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum LegalHoldStatus {
  ACTIVE
  RELEASED
  EXPIRED
}
```

---

## Business Rules

- Standard retention periods:
  - Adult patient records: 7 years from last treatment
  - Minor patient records: Age 21 + 7 years
  - Financial records: 7 years (IRS)
  - Employment records: 7 years post-termination
  - OSHA exposure records: 30 years
  - X-ray/imaging: Same as patient records
  - Audit logs: 7 years minimum (HIPAA)
- Retention workflow states:
  - Active: Records in active use
  - Archived: Past retention minimum, in archive storage
  - Pending Destruction: Scheduled for secure destruction
  - Destroyed: Destruction completed and certified
  - Legal Hold: Exempt from destruction
- Legal holds supersede all retention policies
- Destruction requires approval and witness documentation
- Destruction certificates must be retained permanently

---

## Dependencies

**Depends On:**
- All data areas (applies retention policies)
- Auth & User Management (approval workflows)

**Required By:**
- Compliance Self-Audit Tools (retention compliance verification)
- Regulatory Reporting (retention status reports)

---

## Notes

- State laws vary; configurable retention periods by jurisdiction
- Minor patient retention calculation must track patient DOB
- Consider automated alerts 90 days before records eligible for destruction
- Secure destruction methods: cross-cut shred, degaussing, certified data wipe
- Destruction certificates should include: record description, destruction date, method, witness

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
