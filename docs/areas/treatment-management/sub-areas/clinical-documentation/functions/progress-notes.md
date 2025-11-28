# Progress Notes

> **Sub-Area**: [Clinical Documentation](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Progress Notes provides comprehensive clinical documentation for each patient visit using the standard SOAP format (Subjective, Objective, Assessment, Plan). Notes support different visit types (bonding, adjustment, emergency, debond) with appropriate templates, provider signature workflows, co-signature requirements for delegated documentation, and compliant amendment processes for signed records.

---

## Core Requirements

- [ ] Create progress notes with SOAP format structure
- [ ] Support multiple note types (adjustment, bonding, emergency, debond)
- [ ] Link notes to appointments and treatment plans
- [ ] Attach clinical images to notes
- [ ] Manage provider signature workflow
- [ ] Require co-signature for clinical staff notes
- [ ] Support compliant amendment process for signed notes
- [ ] Enable voice-to-text note entry
- [ ] Track unsigned notes for provider review

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/progress-notes` | `documentation:read` | List progress notes |
| GET | `/api/progress-notes/:id` | `documentation:read` | Get progress note |
| POST | `/api/progress-notes` | `documentation:create` | Create progress note |
| PUT | `/api/progress-notes/:id` | `documentation:update` | Update progress note |
| DELETE | `/api/progress-notes/:id` | `documentation:delete` | Delete draft note |
| POST | `/api/progress-notes/:id/sign` | `documentation:sign` | Sign progress note |
| POST | `/api/progress-notes/:id/cosign` | `documentation:sign` | Co-sign note |
| POST | `/api/progress-notes/:id/amend` | `documentation:amend` | Amend signed note |
| GET | `/api/progress-notes/unsigned` | `documentation:read` | Get unsigned notes |
| GET | `/api/patients/:patientId/progress-notes` | `documentation:read` | Patient's notes |

---

## Data Model

```prisma
model ProgressNote {
  id                    String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId              String   @db.ObjectId
  patientId             String   @db.ObjectId
  treatmentPlanId       String?  @db.ObjectId
  appointmentId         String?  @db.ObjectId

  // Note Details
  noteDate              DateTime @default(now())
  noteType              ProgressNoteType
  chiefComplaint        String?

  // SOAP Content
  subjective            String?  // Patient-reported
  objective             String?  // Clinical findings
  assessment            String?  // Provider assessment
  plan                  String?  // Next steps

  // Provider
  providerId            String   @db.ObjectId
  supervisingProviderId String?  @db.ObjectId

  // Signature Status
  status                NoteStatus @default(DRAFT)
  signedAt              DateTime?
  signedBy              String?  @db.ObjectId
  coSignedAt            DateTime?
  coSignedBy            String?  @db.ObjectId

  // Amendments
  isAmended             Boolean  @default(false)
  amendmentReason       String?
  amendedAt             DateTime?

  // Attachments
  imageIds              String[] @db.ObjectId

  // Timestamps & Audit
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  @@index([clinicId])
  @@index([patientId])
  @@index([noteDate])
  @@index([status])
}

enum ProgressNoteType {
  INITIAL_EXAM
  CONSULTATION
  RECORDS_APPOINTMENT
  BONDING
  ADJUSTMENT
  EMERGENCY
  DEBOND
  RETENTION_CHECK
  OBSERVATION
  GENERAL
}

enum NoteStatus {
  DRAFT
  PENDING_SIGNATURE
  SIGNED
  PENDING_COSIGN
  COSIGNED
  AMENDED
}
```

---

## Business Rules

- Progress notes should be completed within 24 hours of visit
- All clinical notes require provider signature
- Notes created by clinical staff require doctor co-signature
- Signed notes cannot be edited; use amendment workflow
- Amendments preserve original note with addendum
- Draft notes can be freely edited
- Only draft notes can be deleted

---

## Dependencies

**Depends On:**
- Patient Management (patient records)
- Staff Management (provider credentials)
- Treatment Planning (treatment plan linkage)
- Scheduling (appointment linkage)
- Imaging Management (image attachment)

**Required By:**
- Procedure Documentation (linked procedures)
- Clinical Findings (linked findings)
- Clinical Measurements (linked measurements)
- Billing & Insurance (claim support)

---

## Notes

- SOAP format standard in healthcare documentation
- Voice-to-text integration accelerates note entry
- Consider auto-population from previous visit data
- Unsigned note alerts help ensure timely documentation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
