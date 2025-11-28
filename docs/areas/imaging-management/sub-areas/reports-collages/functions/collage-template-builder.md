# Collage Template Builder

> **Sub-Area**: [Reports & Collages](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Collage Template Builder enables creation and management of reusable collage templates for consistent imaging documentation. The system provides a drag-and-drop layout designer with configurable image slots, clinic branding elements, text overlays, and template library management for standardized orthodontic documentation.

---

## Core Requirements

- [ ] Implement drag-and-drop layout designer interface
- [ ] Support grid-based positioning with snap-to-grid
- [ ] Create configurable image slots with labels and category filters
- [ ] Include clinic branding elements (logo, colors, contact info)
- [ ] Add text overlay areas for custom content
- [ ] Support X-ray slot integration for DICOM snapshots
- [ ] Enable template saving and version management
- [ ] Provide template library with search and categorization
- [ ] Allow template sharing across clinic locations
- [ ] Include mobile-responsive preview mode

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/templates` | `imaging:view` | List collage templates |
| GET | `/api/imaging/templates/:id` | `imaging:view` | Get template details |
| POST | `/api/imaging/templates` | `imaging:admin` | Create template |
| PUT | `/api/imaging/templates/:id` | `imaging:admin` | Update template |
| DELETE | `/api/imaging/templates/:id` | `imaging:admin` | Delete template |
| POST | `/api/imaging/templates/:id/duplicate` | `imaging:admin` | Duplicate template |
| GET | `/api/imaging/templates/library` | `imaging:view` | Browse template library |
| PUT | `/api/imaging/templates/:id/publish` | `imaging:admin` | Publish to shared library |

---

## Data Model

```prisma
model CollageTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  description   String?
  category      TemplateCategory @default(PROGRESS)
  isDefault     Boolean @default(false)
  isPublic      Boolean @default(false)  // Shared across clinics

  // Layout configuration
  layout        Json             // Grid layout specification
  elements      Json             // Array of template elements
  dimensions    Json             // { width, height, orientation }

  // Branding
  includeLogo   Boolean @default(true)
  includePatientInfo Boolean @default(true)
  headerText    String?
  footerText    String?
  primaryColor  String?          // Hex color
  secondaryColor String?

  // Preview
  previewUrl    String?

  // Usage tracking
  usageCount    Int     @default(0)
  lastUsedAt    DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  collages      Collage[]
  @@index([clinicId])
  @@index([category])
  @@index([isDefault])
}

enum TemplateCategory {
  PROGRESS
  BEFORE_AFTER
  RECORDS
  REFERRAL
  CASE_PRESENTATION
  CUSTOM
}

// Template element schema (JSON):
// {
//   "type": "IMAGE_SLOT" | "TEXT" | "LOGO" | "PATIENT_INFO" | "DATE" | "DIVIDER",
//   "id": "unique-id",
//   "position": { "x": 0, "y": 0, "width": 200, "height": 150 },
//   "config": {
//     // For IMAGE_SLOT:
//     "label": "Frontal Smile",
//     "categoryFilter": ["EXTRAORAL"],
//     "subcategoryFilter": "frontal_smile",
//     "required": true,
//     // For TEXT:
//     "content": "Progress Report",
//     "fontSize": 24,
//     "fontWeight": "bold",
//     "alignment": "center"
//   }
// }
```

---

## Business Rules

- Default templates cannot be deleted, only deactivated
- Template changes don't affect already-generated collages
- Clinic branding auto-populates from clinic settings
- Image slots can specify required vs optional
- Public templates require admin approval before sharing
- Template preview regenerates on save
- Maximum 20 elements per template

---

## Dependencies

**Depends On:**
- Auth & Authorization (admin for template management)
- Clinic settings (branding information)

**Required By:**
- Progress Collage Generation (uses templates)
- Before/After Presentations (uses templates)
- All collage creation functions

---

## Notes

- Pre-built templates: Progress Report 2x3, Full Records 4x3, Before/After 2-column
- Consider react-grid-layout or similar for drag-drop designer
- Template preview should show sample data for visualization
- Export template as JSON for backup/transfer

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
