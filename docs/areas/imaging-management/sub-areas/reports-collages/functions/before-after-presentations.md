# Before/After Presentations

> **Sub-Area**: [Reports & Collages](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Before/After Presentations creates compelling treatment outcome comparisons for patients and marketing. The system supports multiple presentation formats including side-by-side, interactive slider, overlay transitions, with consent verification, watermarking for marketing use, and privacy-compliant anonymization options.

---

## Core Requirements

- [ ] Create side-by-side comparison layouts
- [ ] Implement interactive slider (swipe to compare)
- [ ] Support overlay transition view with opacity control
- [ ] Display treatment duration and date information
- [ ] Apply watermarking for marketing use
- [ ] Verify patient marketing consent before export
- [ ] Build portfolio gallery collections
- [ ] Enable sharing to patient portal
- [ ] Export formats for social media (with consent)
- [ ] Provide privacy-compliant anonymization options

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/before-after` | `imaging:view` | List before/after galleries |
| GET | `/api/imaging/before-after/:id` | `imaging:view` | Get gallery details |
| POST | `/api/imaging/before-after` | `imaging:admin` | Create gallery |
| PUT | `/api/imaging/before-after/:id` | `imaging:admin` | Update gallery |
| POST | `/api/imaging/before-after/:id/entries` | `imaging:export` | Add entry to gallery |
| DELETE | `/api/imaging/before-after/:galleryId/entries/:id` | `imaging:admin` | Remove entry |
| POST | `/api/imaging/before-after/presentation` | `imaging:export` | Create presentation |
| GET | `/api/imaging/before-after/presentation/:id/export` | `imaging:export` | Export presentation |
| POST | `/api/imaging/before-after/:id/consent-check` | `imaging:export` | Verify marketing consent |

---

## Data Model

```prisma
model BeforeAfterGallery {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  description   String?
  isPublic      Boolean @default(false)  // For website/marketing
  sortOrder     Int     @default(0)
  coverImageId  String?  @db.ObjectId
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  entries       BeforeAfterEntry[]
  @@index([clinicId])
  @@index([isPublic])
}

model BeforeAfterEntry {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  galleryId     String   @db.ObjectId
  patientId     String   @db.ObjectId
  title         String?
  description   String?
  treatmentType String?          // Invisalign, Braces, etc.
  treatmentDuration String?      // 18 months
  beforeImageId String   @db.ObjectId
  afterImageId  String   @db.ObjectId

  // Consent tracking
  marketingConsentId String?  @db.ObjectId
  consentVerifiedAt DateTime?
  isAnonymized  Boolean @default(false)

  // Display
  sortOrder     Int     @default(0)
  isActive      Boolean @default(true)
  isFeatured    Boolean @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  gallery       BeforeAfterGallery @relation(fields: [galleryId], references: [id])
  @@index([clinicId])
  @@index([galleryId])
  @@index([patientId])
}

model BeforeAfterPresentation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  format        PresentationFormat
  beforeImageId String   @db.ObjectId
  afterImageId  String   @db.ObjectId
  title         String?
  description   String?

  // Generated outputs
  imageUrl      String?          // Static comparison image
  sliderUrl     String?          // Interactive slider (HTML)
  videoUrl      String?          // Animated transition
  gifUrl        String?          // GIF animation

  // Settings
  showDates     Boolean @default(true)
  showDuration  Boolean @default(true)
  watermark     Boolean @default(false)
  watermarkText String?

  // Sharing
  isShared      Boolean @default(false)
  shareToken    String?  @unique

  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
  @@index([patientId])
}

enum PresentationFormat {
  SIDE_BY_SIDE
  SLIDER
  GIF
  VIDEO
  PRINT
}
```

---

## Business Rules

- Marketing use requires verified patient consent on file
- Consent status checked at creation and before each export
- Anonymization blurs face and removes patient identifiers
- Watermark includes clinic name and copyright by default
- Public galleries visible on clinic website/marketing materials
- Featured entries shown prominently in galleries
- Export for social media includes platform-optimized dimensions

---

## Dependencies

**Depends On:**
- Auth & Authorization (export permissions)
- Comparison Views (visual comparison infrastructure)
- Compliance & Documentation (consent management)
- Patient records (consent status)

**Required By:**
- Marketing materials
- Patient portal (personal before/after)
- Case Presentation Builder

---

## Notes

- Instagram square: 1080x1080, Stories: 1080x1920
- Facebook: 1200x630 recommended
- Video transitions use CSS animations or canvas-based rendering
- Anonymization should be reversible (store mapping, not modify original)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
