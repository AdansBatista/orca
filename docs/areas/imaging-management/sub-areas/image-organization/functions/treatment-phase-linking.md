# Treatment Phase Linking

> **Sub-Area**: [Image Organization](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Treatment Phase Linking associates images with treatment plans and milestones for clinical context. The system supports manual and automatic linking based on capture date, milestone-based image requirements, progress visualization on treatment timeline, and alerts for missing images at key milestones.

---

## Core Requirements

- [ ] Enable manual linking of images to treatment plans
- [ ] Associate images with specific treatment milestones
- [ ] Implement automatic linking based on capture date proximity
- [ ] Define image requirements per milestone type
- [ ] Visualize images on treatment progress timeline
- [ ] Alert for missing required images at milestones
- [ ] Support treatment phase filtering in gallery
- [ ] Enable bulk linking of multiple images to treatment

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/imaging/images/:id/link-treatment` | `imaging:annotate` | Link image to treatment |
| DELETE | `/api/imaging/images/:id/link-treatment` | `imaging:annotate` | Unlink from treatment |
| GET | `/api/imaging/treatments/:id/images` | `imaging:view` | Get treatment images |
| GET | `/api/imaging/treatments/:id/timeline` | `imaging:view` | Get treatment image timeline |
| GET | `/api/imaging/treatments/:id/missing` | `imaging:view` | Get missing milestone images |
| POST | `/api/imaging/images/batch/link-treatment` | `imaging:annotate` | Bulk link images |
| GET | `/api/imaging/milestones/:id/requirements` | `imaging:view` | Get milestone image requirements |

---

## Data Model

```prisma
model TreatmentImageLink {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId
  treatmentId   String   @db.ObjectId
  milestoneId   String?  @db.ObjectId
  milestoneName String?          // Denormalized for display
  linkType      TreatmentLinkType @default(PROGRESS)
  notes         String?
  autoLinked    Boolean @default(false)
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  image         Image    @relation(fields: [imageId], references: [id])

  @@unique([imageId, treatmentId, milestoneId])
  @@index([clinicId])
  @@index([treatmentId])
  @@index([milestoneId])
}

enum TreatmentLinkType {
  INITIAL_RECORDS
  PROGRESS
  MILESTONE
  FINAL_RECORDS
  REFERENCE
}

// Milestone image requirements (from Treatment Management):
model MilestoneImageRequirement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  milestoneType String           // BONDING, WIRE_CHANGE, DEBOND, etc.
  photoProtocolId String? @db.ObjectId
  requiredCategories ImageCategory[]
  isRequired    Boolean @default(true)
  description   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
  @@index([milestoneType])
}
```

---

## Business Rules

- Image can be linked to multiple treatments if patient has multiple
- Auto-linking uses capture date within 7 days of milestone
- Auto-linked images flagged for confirmation by user
- Missing image alerts shown in treatment dashboard
- Unlinking from treatment doesn't delete the image
- Initial and final records have stricter requirements than progress
- Treatment timeline shows all linked images chronologically

---

## Dependencies

**Depends On:**
- Auth & Authorization (annotate permissions)
- Treatment Management (treatment plans and milestones)
- Photo Protocol Management (milestone image requirements)

**Required By:**
- Progress Collage Generation (milestone-based image selection)
- Treatment Tracking (visual progress documentation)
- Case Presentation Builder (treatment context)

---

## Notes

- Auto-linking threshold (days) should be configurable
- Timeline view integrates with Treatment Management timeline
- Consider notification when approaching milestone without required images
- Link history maintained for audit trail

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
