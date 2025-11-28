# Annotation System

> **Sub-Area**: [Image Viewing & Tools](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Annotation System enables visual annotations and notes on images for clinical documentation and patient communication. The system provides drawing tools, text annotations, color-coded categories, annotation layers, and non-destructive editing with complete undo/redo support while preserving original images.

---

## Core Requirements

- [ ] Implement drawing tools (freehand, line, arrow, circle, rectangle, polygon)
- [ ] Support text annotations with formatting options
- [ ] Enable color-coded annotations by category (clinical, treatment, communication)
- [ ] Provide annotation layers with show/hide capability
- [ ] Create reusable annotation templates for common markups
- [ ] Support collaborative annotations from multiple users
- [ ] Export annotations separately from image
- [ ] Maintain non-destructive editing (original preserved)
- [ ] Implement full undo/redo for all annotation actions

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/images/:id/annotations` | `imaging:view` | List image annotations |
| POST | `/api/imaging/images/:id/annotations` | `imaging:annotate` | Create annotation |
| PUT | `/api/imaging/annotations/:id` | `imaging:annotate` | Update annotation |
| DELETE | `/api/imaging/annotations/:id` | `imaging:annotate` | Delete annotation |
| PUT | `/api/imaging/annotations/:id/visibility` | `imaging:annotate` | Toggle visibility |
| GET | `/api/imaging/images/:id/annotations/export` | `imaging:export` | Export annotations |

---

## Data Model

```prisma
model Annotation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId
  type          AnnotationType  // FREEHAND, LINE, ARROW, etc.
  category      AnnotationCategory @default(CLINICAL)
  layerId       String?          // For grouping annotations

  // Geometry (stored as JSON for flexibility)
  geometry      Json             // Points, dimensions, path data

  // Styling
  color         String           // Hex color
  strokeWidth   Float   @default(2)
  opacity       Float   @default(1)
  fontSize      Int?             // For text annotations
  fontFamily    String?

  // Content
  text          String?          // Text content or label

  // Visibility
  isVisible     Boolean @default(true)
  isLocked      Boolean @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  image         Image    @relation(fields: [imageId], references: [id])
  @@index([clinicId])
  @@index([imageId])
  @@index([category])
}

enum AnnotationType {
  FREEHAND
  LINE
  ARROW
  CIRCLE
  RECTANGLE
  POLYGON
  TEXT
  HIGHLIGHT
  CALLOUT
}

enum AnnotationCategory {
  CLINICAL      // Red - Clinical findings
  TREATMENT     // Blue - Treatment notes
  COMMUNICATION // Green - Patient communication
  INTERNAL      // Yellow - Internal notes
  FOLLOWUP      // Orange - Questions/follow-up
}

model AnnotationTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  description   String?
  type          AnnotationType
  category      AnnotationCategory
  defaultGeometry Json?          // Pre-set shape/size
  defaultStyle  Json             // Color, stroke, etc.
  isActive      Boolean @default(true)
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
}
```

---

## Business Rules

- Annotations can only be edited by creator or admin users
- Locked annotations require admin permission to modify
- Category colors are configurable at clinic level
- Patient-facing views hide INTERNAL category annotations
- Annotation history maintained for audit purposes
- Maximum 100 annotations per image

---

## Dependencies

**Depends On:**
- Auth & Authorization (annotate permissions)
- Advanced Image Viewer (annotation layer rendering)

**Required By:**
- Clinical Documentation (findings markup)
- Patient Communication (visual explanations)
- Case Presentations (annotated images)

---

## Notes

- Use Fabric.js or Konva.js for canvas-based annotation rendering
- Consider SVG export for vector-quality annotation overlay
- Keyboard shortcuts: F freehand, L line, A arrow, T text, etc.
- Support touch/stylus input for tablet annotation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
