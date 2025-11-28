# Case Presentation Builder

> **Sub-Area**: [Reports & Collages](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Case Presentation Builder creates comprehensive case presentations combining images, analysis, and treatment information. The system provides multi-page presentation building with image integration, cephalometric analysis embedding, treatment plan summaries, timeline visualization, and multiple export formats including PDF, PowerPoint, and interactive web presentations.

---

## Core Requirements

- [ ] Build multi-page presentations with slide editor
- [ ] Integrate images from patient gallery
- [ ] Embed cephalometric analysis and measurements
- [ ] Include treatment plan summaries and options
- [ ] Display treatment timeline visualization
- [ ] Add outcome prediction visuals
- [ ] Support custom slide creation and ordering
- [ ] Include presenter notes per slide
- [ ] Export to PDF format
- [ ] Export to PowerPoint (PPTX) format
- [ ] Generate interactive web presentations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/presentations/:patientId` | `imaging:view` | List patient presentations |
| GET | `/api/imaging/presentations/:id` | `imaging:view` | Get presentation details |
| POST | `/api/imaging/presentations` | `imaging:export` | Create presentation |
| PUT | `/api/imaging/presentations/:id` | `imaging:export` | Update presentation |
| DELETE | `/api/imaging/presentations/:id` | `imaging:export` | Delete presentation |
| POST | `/api/imaging/presentations/:id/slides` | `imaging:export` | Add slide |
| PUT | `/api/imaging/presentations/:id/slides/:slideId` | `imaging:export` | Update slide |
| DELETE | `/api/imaging/presentations/:id/slides/:slideId` | `imaging:export` | Delete slide |
| POST | `/api/imaging/presentations/:id/export/pdf` | `imaging:export` | Export PDF |
| POST | `/api/imaging/presentations/:id/export/pptx` | `imaging:export` | Export PowerPoint |
| POST | `/api/imaging/presentations/:id/share` | `imaging:export` | Generate share link |
| POST | `/api/imaging/presentations/:id/ai-generate` | `imaging:export` | AI-assisted generation |

---

## Data Model

```prisma
model CasePresentation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  title         String
  description   String?
  status        PresentationStatus @default(DRAFT)

  // Content
  slides        Json             // Array of slide definitions
  notes         String?          // Presenter notes

  // Linked treatment
  treatmentId   String?  @db.ObjectId

  // Generated exports
  pdfUrl        String?
  pptxUrl       String?
  webUrl        String?          // Interactive web version

  // Sharing
  isPublic      Boolean @default(false)
  shareToken    String?  @unique
  shareExpiresAt DateTime?

  // For case studies/portfolio
  isAnonymized  Boolean @default(false)
  isPortfolio   Boolean @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  presentedAt   DateTime?
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}

enum PresentationStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  ARCHIVED
}

// Slide schema (JSON):
// {
//   "id": "unique-id",
//   "type": "TITLE" | "IMAGE_GRID" | "COMPARISON" | "ANALYSIS" | "TREATMENT" | "TIMELINE" | "TEXT" | "CUSTOM",
//   "title": "Slide Title",
//   "content": {
//     // Type-specific content
//     "images": ["image-id-1", "image-id-2"],
//     "cephAnalysisId": "...",
//     "treatmentPlanId": "...",
//     "text": "Markdown content",
//     "layout": "2x2" | "1x3" | "custom"
//   },
//   "notes": "Presenter notes for this slide",
//   "transition": "fade" | "slide" | "none"
// }

// Slide types with default sections:
// CHIEF_COMPLAINT - Patient concerns, initial photos
// CLINICAL_EXAM - Examination findings, photos
// RADIOGRAPHIC - X-rays, ceph analysis
// DIAGNOSIS - Summary, classification
// TREATMENT_PLAN - Options, recommendations
// PROGRESS - Timeline, milestone photos
// OUTCOME - Before/after, results
```

---

## Business Rules

- Presentations can only be edited by creator or admin
- Portfolio presentations must be anonymized
- Share links expire after configurable period
- AI generation creates suggested structure, user refines
- Maximum 50 slides per presentation
- Large presentations exported as background job
- Archived presentations are read-only

---

## Dependencies

**Depends On:**
- Auth & Authorization (export permissions)
- Patient Image Gallery (image selection)
- Cephalometric Analysis (analysis embedding)
- Treatment Management (treatment plan data)

**Required By:**
- Patient consultations
- Conference case presentations
- Training and education
- Marketing case studies

---

## Notes

- Use reveal.js or similar for web presentations
- PDF generation via Puppeteer from HTML templates
- PPTX via PptxGenJS or officegen library
- AI generation suggests slides based on available data
- Consider real-time collaboration for multi-user editing

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
