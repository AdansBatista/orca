# Image Categorization

> **Sub-Area**: [Image Organization](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Image Categorization classifies images into standard categories for efficient organization and search. The system provides AI-powered automatic category detection on upload, manual category assignment, subcategory classification, and clinic-configurable custom categories for practice-specific workflows.

---

## Core Requirements

- [ ] Implement automatic category detection using AI/ML
- [ ] Support manual category assignment and correction
- [ ] Provide subcategory classification within main categories
- [ ] Enable bulk re-categorization for multiple images
- [ ] Generate category statistics and reporting
- [ ] Allow custom category creation at clinic level
- [ ] Display confidence scores for AI classification
- [ ] Queue low-confidence results for human review

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/categories` | `imaging:view` | List all categories |
| POST | `/api/imaging/categories` | `imaging:admin` | Create custom category |
| PUT | `/api/imaging/categories/:id` | `imaging:admin` | Update category |
| DELETE | `/api/imaging/categories/:id` | `imaging:admin` | Deactivate category |
| PUT | `/api/imaging/images/:id/category` | `imaging:annotate` | Update image category |
| POST | `/api/imaging/images/batch/category` | `imaging:annotate` | Bulk categorize |
| GET | `/api/imaging/categories/stats` | `imaging:view` | Category statistics |
| POST | `/api/imaging/images/:id/classify` | `imaging:capture` | Trigger AI classification |

---

## Data Model

```prisma
// Standard categories defined in ImageCategory enum
enum ImageCategory {
  EXTRAORAL
  INTRAORAL
  PANORAMIC
  CEPHALOMETRIC
  PERIAPICAL
  BITEWING
  CBCT
  SCAN_UPPER
  SCAN_LOWER
  SCAN_BITE
  OTHER
}

// Custom clinic-specific categories:
model CustomImageCategory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  description   String?
  parentCategory ImageCategory?  // Maps to standard category
  subcategories String[]         // Custom subcategory names
  color         String?          // Display color
  icon          String?          // Icon identifier
  isActive      Boolean @default(true)
  sortOrder     Int     @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@unique([clinicId, name])
  @@index([clinicId])
}

// AI classification result (stored with image):
model Image {
  // ... base fields
  category        ImageCategory
  subcategory     String?
  customCategoryId String?  @db.ObjectId

  // AI classification metadata
  aiClassified    Boolean @default(false)
  aiConfidence    Float?           // 0-1 confidence score
  aiNeedsReview   Boolean @default(false)
}
```

---

## Business Rules

- Every image must have a primary category
- AI classification runs automatically on upload
- Low confidence (<80%) flags image for human review
- Manual categorization overrides AI and clears review flag
- Custom categories must map to a standard parent category
- Category changes logged in image audit history
- Subcategories must be unique within their parent category

---

## Dependencies

**Depends On:**
- Auth & Authorization (admin for category management)
- Batch Upload & Processing (triggers auto-classification)

**Required By:**
- Patient Image Gallery (category filtering)
- Search & Filtering (category-based search)
- Photo Protocol Management (category assignment in protocols)

---

## Notes

- AI model could be trained on orthodontic image dataset
- Consider cloud AI service (AWS Rekognition, Google Vision) for initial implementation
- Display confidence indicator in UI for AI-classified images
- Standard subcategories: frontal_smile, frontal_relaxed, profile_right, etc.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
