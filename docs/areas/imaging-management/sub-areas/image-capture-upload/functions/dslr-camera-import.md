# DSLR/Camera Import

> **Sub-Area**: [Image Capture & Upload](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

DSLR/Camera Import enables import of high-resolution photographs from professional DSLR cameras and mobile devices. The system supports USB tethered capture, memory card import, WiFi transfer from supported cameras, and mobile device uploads while preserving EXIF metadata for complete image provenance.

---

## Core Requirements

- [ ] Support USB tethered capture from Canon, Nikon, Sony DSLRs
- [ ] Implement memory card import workflow with file browser
- [ ] Enable WiFi import from supported camera models
- [ ] Provide mobile device upload via web interface
- [ ] Preserve and extract EXIF metadata from imported images
- [ ] Display camera settings recommendations for orthodontic photography
- [ ] Support batch import from memory card or folder

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/cameras/tethered` | `imaging:capture` | List tethered cameras |
| POST | `/api/imaging/cameras/:id/capture` | `imaging:capture` | Trigger tethered capture |
| POST | `/api/imaging/upload` | `imaging:capture` | Upload single image |
| POST | `/api/imaging/upload/mobile` | `imaging:capture` | Mobile device upload |
| GET | `/api/imaging/import/preview` | `imaging:capture` | Preview memory card contents |
| POST | `/api/imaging/import/card` | `imaging:capture` | Import from memory card |

---

## Data Model

```prisma
// Uses Image model with DSLR-specific metadata:
model Image {
  // ... base fields
  deviceType    String?  // "DSLR", "MOBILE"
  deviceName    String?  // "Canon EOS R5", "iPhone 15 Pro"

  // EXIF metadata extracted
  cameraModel   String?
  lensInfo      String?
  focalLength   Float?
  aperture      Float?
  shutterSpeed  String?
  iso           Int?
  metadata      Json?    // Full EXIF data
}
```

---

## Business Rules

- Tethered capture requires supported camera SDK or gPhoto2 integration
- Imported images must be associated with a patient before final save
- EXIF metadata preserved in original; key fields extracted to database
- Large imports (>10 images) processed via background job queue
- Duplicate detection warns on same EXIF timestamp + camera combination
- Mobile uploads limited to configured max file size (default: 25MB)

---

## Dependencies

**Depends On:**
- Auth & Authorization (user permissions)
- Batch Upload & Processing (for multi-file imports)

**Required By:**
- Photo Protocol Management (imports into protocol sessions)
- Patient Image Gallery (displays imported images)

---

## Notes

- Consider libgphoto2 bindings for tethered capture on server
- Mobile upload should support both web and progressive web app contexts
- WiFi import may require camera-specific APIs (Canon SDK, Sony Remote API)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
