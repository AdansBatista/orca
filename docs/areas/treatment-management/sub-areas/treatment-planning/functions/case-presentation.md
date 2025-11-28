# Case Presentation

> **Sub-Area**: [Treatment Planning](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Case Presentation enables treatment coordinators and doctors to build and deliver professional presentations of treatment options to patients and families. The function supports scheduling presentations, recording attendees, documenting outcomes, and tracking follow-up requirements. Presentations can be conducted in-person, virtually, or via phone with appropriate documentation.

---

## Core Requirements

- [ ] Schedule case presentation appointments
- [ ] Build presentation with treatment options and visuals
- [ ] Record presentation date, type, and presenter
- [ ] Document attendees (patient, responsible party, others)
- [ ] Capture presentation outcome (accepted, declined, thinking)
- [ ] Track follow-up requirements and dates
- [ ] Support virtual and in-person presentation modes
- [ ] Link to diagnostic images and treatment simulations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/presentations` | `treatment:read` | List case presentations |
| POST | `/api/treatment-plans/:id/presentations` | `treatment:create` | Create case presentation |
| PUT | `/api/case-presentations/:id` | `treatment:update` | Update presentation |
| POST | `/api/case-presentations/:id/outcome` | `treatment:update` | Record presentation outcome |
| GET | `/api/case-presentations/pending` | `treatment:read` | Get pending follow-ups |

---

## Data Model

```prisma
model CasePresentation {
  id                        String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId                  String   @db.ObjectId
  treatmentPlanId           String   @db.ObjectId

  // Presentation Details
  presentationDate          DateTime
  presentationType          PresentationType @default(IN_PERSON)
  presentedBy               String   @db.ObjectId

  // Attendees
  attendees                 String[]
  patientPresent            Boolean  @default(true)
  responsiblePartyPresent   Boolean  @default(false)

  // Content
  slidesUrl                 String?
  notesUrl                  String?
  recordingUrl              String?

  // Outcome
  outcome                   PresentationOutcome?
  followUpDate              DateTime?
  followUpNotes             String?

  // Timestamps
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  @@index([clinicId])
  @@index([treatmentPlanId])
}

enum PresentationType {
  IN_PERSON
  VIRTUAL
  PHONE
  EMAIL
}

enum PresentationOutcome {
  ACCEPTED
  DECLINED
  THINKING
  FOLLOW_UP_NEEDED
  SECOND_OPINION
}
```

---

## Business Rules

- Presentation should occur before case acceptance
- At least one treatment option required before presentation
- Responsible party must be present for minor patients
- Follow-up required for THINKING or FOLLOW_UP_NEEDED outcomes
- Presentation history preserved for conversion analytics
- ACCEPTED outcome triggers case acceptance workflow

---

## Dependencies

**Depends On:**
- Treatment Plan Creation (parent plan)
- Treatment Options (options to present)
- Imaging Management (diagnostic images)
- Scheduling (presentation appointments)

**Required By:**
- Case Acceptance (triggers acceptance workflow)

---

## Notes

- Consider integration with video conferencing for virtual presentations
- Presentation slides can be auto-generated from treatment options
- Track conversion rates by presenter for training opportunities

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
