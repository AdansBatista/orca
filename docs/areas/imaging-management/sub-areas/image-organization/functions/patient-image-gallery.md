# Patient Image Gallery

> **Sub-Area**: [Image Organization](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Patient Image Gallery provides an intuitive interface for browsing all images associated with a patient. The gallery supports multiple viewing modes including chronological timeline, thumbnail grid, category-based grouping, and treatment phase organization with efficient virtual scrolling for large image collections.

---

## Core Requirements

- [ ] Display chronological timeline view of patient images
- [ ] Implement thumbnail grid view with lazy loading
- [ ] Support category-based filtering (photos, X-rays, 3D scans)
- [ ] Enable treatment phase grouping and filtering
- [ ] Provide full-screen image preview with navigation
- [ ] Support quick comparison selection (select multiple)
- [ ] Enable batch operations (tag, export, delete)
- [ ] Implement virtual scrolling for large collections
- [ ] Allow starring/favoriting key images

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/patients/:id/gallery` | `imaging:view` | Get patient gallery |
| GET | `/api/imaging/patients/:id/gallery/timeline` | `imaging:view` | Get timeline view data |
| GET | `/api/imaging/patients/:id/gallery/stats` | `imaging:view` | Get gallery statistics |
| POST | `/api/imaging/images/:id/star` | `imaging:view` | Star/unstar image |
| POST | `/api/imaging/images/batch` | `imaging:view` | Batch operations |
| GET | `/api/imaging/patients/:id/images/count` | `imaging:view` | Get image count by category |

---

## Data Model

```prisma
// Uses Image model with gallery-specific queries
// Star/favorite stored on Image model:
model Image {
  // ... base fields
  isStarred     Boolean @default(false)
  starredAt     DateTime?
  starredBy     String?  @db.ObjectId
}

// Gallery view preferences stored per user:
model UserGalleryPreference {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  userId        String   @db.ObjectId
  patientId     String?  @db.ObjectId  // null = global preference
  defaultView   GalleryView @default(GRID)
  sortOrder     SortOrder @default(DATE_DESC)
  thumbnailSize ThumbnailSize @default(MEDIUM)
  showMetadata  Boolean @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, patientId])
  @@index([userId])
}

enum GalleryView {
  TIMELINE
  GRID
  CATEGORY
  TREATMENT
  DATE_RANGE
}

enum SortOrder {
  DATE_DESC
  DATE_ASC
  CATEGORY
  QUALITY_DESC
}

enum ThumbnailSize {
  SMALL   // 100px
  MEDIUM  // 150px
  LARGE   // 200px
}
```

---

## Business Rules

- Gallery only shows images user has permission to view
- Deleted images hidden from gallery (soft delete)
- Virtual scrolling loads images in pages of 50
- Starred images appear in dedicated "Favorites" filter
- Batch delete requires admin permission
- Gallery statistics cached and refreshed on image changes

---

## Dependencies

**Depends On:**
- Auth & Authorization (view permissions)
- Image Capture & Upload (image source)

**Required By:**
- All viewing and analysis functions (image selection)
- Comparison Views (image selection interface)
- Reports & Collages (image selection for collages)

---

## Notes

- Use intersection observer for lazy loading thumbnails
- Consider skeleton loading states for smooth UX
- Support keyboard navigation (arrow keys, enter to open)
- Enable drag selection for batch operations

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
