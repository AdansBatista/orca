# Comparison Views

> **Sub-Area**: [Image Viewing & Tools](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Comparison Views enables multi-image comparison to visualize treatment progress and evaluate different views. The system provides side-by-side comparison, grid layouts, before/after sliders, overlay comparison with opacity control, and synchronized pan/zoom across images for comprehensive visual analysis.

---

## Core Requirements

- [ ] Implement side-by-side comparison (2 images)
- [ ] Support grid comparison layout (up to 4 images)
- [ ] Create before/after slider with swipe interaction
- [ ] Enable overlay comparison with opacity control
- [ ] Synchronize pan and zoom across all compared images
- [ ] Provide automated difference highlighting
- [ ] Display progress timeline view for chronological comparison
- [ ] Support date-range filtering for image selection
- [ ] Enable AI-assisted matching of comparable images

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/comparisons/:patientId` | `imaging:view` | List patient comparisons |
| GET | `/api/imaging/comparisons/:id` | `imaging:view` | Get comparison details |
| POST | `/api/imaging/comparisons` | `imaging:view` | Create comparison |
| PUT | `/api/imaging/comparisons/:id` | `imaging:view` | Update comparison |
| DELETE | `/api/imaging/comparisons/:id` | `imaging:view` | Delete comparison |
| POST | `/api/imaging/comparisons/:id/share` | `imaging:export` | Generate share link |
| GET | `/api/imaging/comparisons/suggest/:patientId` | `imaging:view` | Get AI-suggested pairs |

---

## Data Model

```prisma
model ImageComparison {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  name          String?
  type          ComparisonType  // SIDE_BY_SIDE, SLIDER, OVERLAY, GRID
  imageIds      String[] @db.ObjectId  // Array of image IDs

  // View settings
  settings      Json?            // Mode-specific settings
  syncEnabled   Boolean @default(true)

  // Sharing
  isShared      Boolean @default(false)
  shareToken    String? @unique
  shareExpiresAt DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  @@index([clinicId])
  @@index([patientId])
}

enum ComparisonType {
  SIDE_BY_SIDE  // Two images next to each other
  SLIDER        // Swipe to reveal before/after
  OVERLAY       // Stack with opacity control
  GRID          // 2x2 grid of images
  TIMELINE      // Chronological progression
}
```

---

## Business Rules

- Grid comparison limited to 4 images maximum
- Slider mode requires exactly 2 images
- Smart matching suggests images of same category across dates
- Synchronized zoom maintains relative position across images
- Share links expire after configurable period (default: 30 days)
- Comparisons saved per patient for easy re-access

---

## Dependencies

**Depends On:**
- Auth & Authorization (view permissions)
- Advanced Image Viewer (base viewing functionality)
- Image Organization (image selection and filtering)

**Required By:**
- Before/After Presentations (uses comparison views)
- Progress Collage Generation (visual progress tracking)
- Patient Communication (showing treatment progress)

---

## Notes

- Use CSS Grid or Flexbox for responsive multi-image layouts
- Slider interaction should be smooth on touch devices
- Consider WebGL for performant synchronized rendering
- Timeline view could integrate with treatment milestones

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
