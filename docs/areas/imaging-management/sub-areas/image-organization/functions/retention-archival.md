# Retention & Archival

> **Sub-Area**: [Image Organization](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Retention & Archival manages image retention according to legal requirements and storage optimization. The system provides configurable retention policies by image type, automatic archival to cold storage, secure deletion with audit trail, legal hold capability, and compliance reporting for regulatory adherence.

---

## Core Requirements

- [ ] Configure retention policies by image type and category
- [ ] Track retention period for each image
- [ ] Archive images to cold storage after retention period
- [ ] Implement secure deletion with complete audit trail
- [ ] Support legal hold to prevent deletion
- [ ] Generate storage usage reporting
- [ ] Create compliance reports for retention status
- [ ] Extend retention for minor patients automatically
- [ ] Enable on-demand retrieval of archived images

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/retention/policies` | `imaging:admin` | List retention policies |
| POST | `/api/imaging/retention/policies` | `imaging:admin` | Create policy |
| PUT | `/api/imaging/retention/policies/:id` | `imaging:admin` | Update policy |
| DELETE | `/api/imaging/retention/policies/:id` | `imaging:admin` | Delete policy |
| GET | `/api/imaging/retention/report` | `imaging:admin` | Retention compliance report |
| GET | `/api/imaging/retention/storage` | `imaging:admin` | Storage usage report |
| POST | `/api/imaging/retention/archive` | `imaging:admin` | Run archival process |
| POST | `/api/imaging/images/:id/legal-hold` | `imaging:admin` | Set legal hold |
| DELETE | `/api/imaging/images/:id/legal-hold` | `imaging:admin` | Remove legal hold |
| POST | `/api/imaging/images/:id/restore` | `imaging:admin` | Restore archived image |

---

## Data Model

```prisma
model ImageRetentionPolicy {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  name            String
  description     String?
  isDefault       Boolean @default(false)
  imageTypes      ImageFileType[]  // Which image types this applies to
  categories      ImageCategory[]  // Which categories
  retentionYears  Int              // Years to retain
  retentionForMinors Int?          // Additional years for minors (until age 21 + X)
  archiveAfterYears Int?           // When to archive (null = never archive)
  legalHoldEnabled Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String   @db.ObjectId

  clinic          Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
}

model ImageArchiveRecord {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  imageId         String   @db.ObjectId
  action          ArchiveAction
  reason          String?
  policyId        String?  @db.ObjectId
  archiveStorageKey String?        // Cold storage location
  originalStorageKey String        // Original hot storage location
  archivedAt      DateTime @default(now())
  expiresAt       DateTime?        // When can be permanently deleted
  restoredAt      DateTime?
  deletedAt       DateTime?
  performedBy     String   @db.ObjectId

  clinic          Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
  @@index([imageId])
  @@index([expiresAt])
}

enum ArchiveAction {
  ARCHIVED
  RESTORED
  DELETED
  LEGAL_HOLD_SET
  LEGAL_HOLD_REMOVED
}

// Image model additions for retention:
model Image {
  // ... base fields
  retentionPolicyId String?  @db.ObjectId
  retentionExpiresAt DateTime?
  isArchived      Boolean @default(false)
  archivedAt      DateTime?
  legalHold       Boolean @default(false)
  legalHoldSetAt  DateTime?
  legalHoldSetBy  String?  @db.ObjectId
  legalHoldReason String?
}
```

---

## Business Rules

- Retention policies enforced based on image type and patient age
- Minor patients: retain until age 21 + configured years
- Archived images retrievable but with potential delay
- Legal hold overrides all retention policies and prevents deletion
- Deletion requires retention period expiry AND no legal hold
- All archive/delete actions logged with user and timestamp
- Storage reports calculate hot vs cold storage usage
- Compliance reports show images approaching or past retention

---

## Dependencies

**Depends On:**
- Auth & Authorization (admin permissions)
- Cloud Storage (hot and cold storage tiers)
- Patient records (age/minor status)

**Required By:**
- Compliance & Documentation (compliance reporting)
- Practice administration workflows

---

## Notes

- Typical retention: 7-10 years for clinical images, varies by state
- Cold storage options: AWS Glacier, Azure Archive, Google Coldline
- Restoration from cold storage may take minutes to hours
- HIPAA requires secure destruction with certification
- Consider notification before auto-archival

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
