# Clinical Findings

> **Sub-Area**: [Clinical Documentation](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Clinical Findings documents observations and issues identified during patient examinations that require attention or monitoring. Findings include decalcification, bracket/wire issues, compliance concerns, and oral hygiene observations. Each finding has a severity level and tracks whether action was taken or follow-up is required.

---

## Core Requirements

- [ ] Record clinical findings by type
- [ ] Specify finding location (tooth numbers)
- [ ] Assign severity level (mild, moderate, severe)
- [ ] Track whether action is required
- [ ] Document action taken
- [ ] Flag findings requiring follow-up
- [ ] Link findings to progress notes
- [ ] Generate alerts for severe findings

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/progress-notes/:noteId/findings` | `documentation:read` | List findings for note |
| POST | `/api/progress-notes/:noteId/findings` | `documentation:create` | Add clinical finding |
| PUT | `/api/findings/:findingId` | `documentation:update` | Update finding |
| DELETE | `/api/findings/:findingId` | `documentation:update` | Remove finding |
| GET | `/api/patients/:patientId/findings` | `documentation:read` | Patient's findings history |
| GET | `/api/findings/action-required` | `documentation:read` | Findings requiring action |

---

## Data Model

```prisma
model ClinicalFinding {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId         String   @db.ObjectId
  progressNoteId   String   @db.ObjectId

  // Finding Details
  findingType      ClinicalFindingType
  description      String
  severity         Severity?

  // Location
  toothNumbers     Int[]
  location         String?

  // Clinical Action
  actionRequired   Boolean  @default(false)
  actionTaken      String?
  followUpRequired Boolean  @default(false)

  // Timestamps
  createdAt        DateTime @default(now())

  @@index([clinicId])
  @@index([progressNoteId])
  @@index([findingType])
}

enum ClinicalFindingType {
  DECALCIFICATION
  CARIES
  GINGIVITIS
  BRACKET_ISSUE
  WIRE_ISSUE
  ELASTIC_COMPLIANCE
  ORAL_HYGIENE
  ROOT_RESORPTION
  IMPACTION
  ECTOPIC_ERUPTION
  ANKYLOSIS
  OTHER
}

enum Severity {
  MILD
  MODERATE
  SEVERE
}
```

---

## Business Rules

- Severe findings automatically flagged for follow-up
- Caries findings should trigger referral to general dentist
- Decalcification findings prompt hygiene reinforcement
- Root resorption requires X-ray documentation
- Compliance findings documented for patient education
- Finding history visible across all patient visits

---

## Dependencies

**Depends On:**
- Progress Notes (parent note)
- Patient Management (patient records)

**Required By:**
- Treatment Tracking (progress monitoring)
- Patient Communications (follow-up notifications)

---

## Notes

- Finding trends help identify systemic issues (e.g., poor hygiene patterns)
- Consider automated alerts for recurring findings
- Integration with imaging for visual documentation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
