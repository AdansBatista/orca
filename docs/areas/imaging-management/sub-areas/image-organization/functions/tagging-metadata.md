# Tagging & Metadata

> **Sub-Area**: [Image Organization](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Tagging & Metadata enriches images with custom tags and metadata for enhanced discoverability. The system supports custom tag creation, AI-powered tag suggestions, multi-tag assignment, metadata display and editing, and preservation of EXIF and DICOM data for comprehensive image information management.

---

## Core Requirements

- [ ] Enable custom tag creation with color coding
- [ ] Provide AI-powered tag suggestions based on image content
- [ ] Support multi-tag assignment per image
- [ ] Implement tag search and autocomplete
- [ ] Display tag usage analytics (frequency, trending)
- [ ] Show and allow editing of image metadata
- [ ] Preserve and display EXIF data for photos
- [ ] Extract and display DICOM metadata for X-rays
- [ ] Support bulk tagging operations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/tags` | `imaging:view` | List all tags |
| POST | `/api/imaging/tags` | `imaging:admin` | Create new tag |
| PUT | `/api/imaging/tags/:id` | `imaging:admin` | Update tag |
| DELETE | `/api/imaging/tags/:id` | `imaging:admin` | Deactivate tag |
| POST | `/api/imaging/images/:id/tags` | `imaging:annotate` | Add tags to image |
| DELETE | `/api/imaging/images/:id/tags/:tagId` | `imaging:annotate` | Remove tag from image |
| GET | `/api/imaging/images/:id/metadata` | `imaging:view` | Get image metadata |
| PUT | `/api/imaging/images/:id/metadata` | `imaging:annotate` | Update editable metadata |
| GET | `/api/imaging/tags/suggest/:imageId` | `imaging:view` | Get AI tag suggestions |
| GET | `/api/imaging/tags/stats` | `imaging:view` | Tag usage statistics |

---

## Data Model

```prisma
model ImageTag {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  category      TagCategory @default(CUSTOM)
  color         String?          // Hex color for display
  description   String?
  isActive      Boolean @default(true)
  usageCount    Int     @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  assignments   ImageTagAssignment[]

  @@unique([clinicId, name])
  @@index([clinicId])
  @@index([category])
}

enum TagCategory {
  CLINICAL      // Crowding, Overjet, Class II
  TREATMENT     // Initial records, Mid-treatment, Debond
  QUALITY       // Best shot, Needs retake, Reference
  MARKETING     // Approved for marketing
  CUSTOM        // Practice-specific
}

model ImageTagAssignment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  imageId       String   @db.ObjectId
  tagId         String   @db.ObjectId
  assignedBy    String   @db.ObjectId
  assignedAt    DateTime @default(now())

  image         Image    @relation(fields: [imageId], references: [id])
  tag           ImageTag @relation(fields: [tagId], references: [id])

  @@unique([imageId, tagId])
  @@index([imageId])
  @@index([tagId])
}

// Editable metadata stored separately from system metadata:
model ImageUserMetadata {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  imageId       String   @db.ObjectId @unique
  title         String?
  description   String?
  notes         String?
  customFields  Json?            // Clinic-defined custom fields
  updatedAt     DateTime @updatedAt
  updatedBy     String   @db.ObjectId

  @@index([imageId])
}
```

---

## Business Rules

- Maximum 20 tags per image
- Tag names must be unique within clinic (case-insensitive)
- Usage count updated on tag assignment/removal
- EXIF and DICOM metadata are read-only (system-managed)
- User-editable metadata stored separately from system metadata
- AI tag suggestions require minimum confidence threshold (70%)
- Deactivated tags remain on existing images but cannot be newly assigned

---

## Dependencies

**Depends On:**
- Auth & Authorization (admin for tag management)
- Image Capture & Upload (metadata extraction)

**Required By:**
- Search & Filtering (tag-based search)
- Patient Image Gallery (tag display)
- Reports & Collages (tag-based image selection)

---

## Notes

- Common clinical tags: Crowding, Spacing, Deep Bite, Open Bite, Crossbite
- Consider tag hierarchies for complex taxonomies
- AI tagging could identify clinical conditions in photos
- Metadata display should be contextual (EXIF for photos, DICOM for X-rays)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
