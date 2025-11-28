# Advanced Image Viewer

> **Sub-Area**: [Image Viewing & Tools](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Advanced Image Viewer provides a high-performance image viewing component capable of handling large medical images with smooth interaction. The viewer features GPU-accelerated rendering, smooth zoom and pan, image adjustments, and view state management for efficient clinical image review.

---

## Core Requirements

- [ ] Implement GPU-accelerated rendering for large images (50+ megapixels)
- [ ] Enable smooth zoom from 10% to 800% with quality preservation
- [ ] Support pan via mouse drag, touch gestures, and keyboard navigation
- [ ] Provide multiple zoom modes (fit to screen, actual size, fill)
- [ ] Include full-screen viewing mode
- [ ] Display minimap navigator for large images
- [ ] Enable image adjustments (brightness, contrast, saturation, sharpness)
- [ ] Support rotation, flip, and color inversion transformations
- [ ] Implement progressive loading for instant display
- [ ] Save and restore view states per image

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/images/:id` | `imaging:view` | Get image with metadata |
| GET | `/api/imaging/images/:id/url` | `imaging:view` | Get signed image URL |
| GET | `/api/imaging/images/:id/thumbnail` | `imaging:view` | Get thumbnail URL |
| GET | `/api/imaging/images/:id/preview` | `imaging:view` | Get preview resolution URL |
| GET | `/api/imaging/images/:id/view-states` | `imaging:view` | List saved view states |
| POST | `/api/imaging/images/:id/view-states` | `imaging:annotate` | Save view state |
| DELETE | `/api/imaging/view-states/:id` | `imaging:annotate` | Delete view state |

---

## Data Model

```prisma
model ImageViewState {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId
  name          String?          // Named preset (optional)
  isDefault     Boolean  @default(false)

  // Viewport state
  zoom          Float            // Zoom level (1.0 = 100%)
  panX          Float            // Pan offset X
  panY          Float            // Pan offset Y
  rotation      Float   @default(0)

  // Image adjustments
  brightness    Float   @default(0)    // -100 to +100
  contrast      Float   @default(0)    // -100 to +100
  saturation    Float   @default(0)    // -100 to +100
  sharpness     Float   @default(0)    // 0 to +100
  gamma         Float   @default(1)    // 0.5 to 2.0
  inverted      Boolean @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  image         Image    @relation(fields: [imageId], references: [id])
  @@index([clinicId])
  @@index([imageId])
}
```

---

## Business Rules

- View states are non-destructive; original image never modified
- Maximum 10 named view states per image
- Default view state auto-loads when opening image
- Adjustments applied client-side using Canvas/WebGL filters
- Progressive loading: thumbnail -> preview -> full resolution
- Keyboard shortcuts: +/- zoom, arrow keys pan, R rotate, I invert

---

## Dependencies

**Depends On:**
- Auth & Authorization (view permissions)
- Image Capture & Upload (image storage)

**Required By:**
- Measurement & Calibration Tools (measurement overlay)
- Annotation System (annotation layer)
- Comparison Views (multi-image viewing)

---

## Notes

- Consider using OpenSeadragon or custom WebGL renderer for performance
- Signed URLs should have short expiration for security
- Cache recently viewed images for quick navigation
- Support DICOM window/level for X-ray viewing via Cornerstone.js

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
