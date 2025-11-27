# Image Organization

> **Area**: [Imaging Management](../../)
>
> **Sub-Area**: 3.3.3 Image Organization
>
> **Purpose**: Organize, categorize, and manage patient imaging with intelligent search, treatment phase linking, and HIPAA-compliant retention policies

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Imaging Management](../../) |
| **Dependencies** | Auth, Image Capture & Upload, Treatment Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

Image Organization manages the growing library of patient imaging, providing tools to categorize, tag, and search images efficiently. As orthodontic practices accumulate thousands of images per year, effective organization becomes critical for clinical efficiency and regulatory compliance.

This sub-area ensures that images are easily discoverable, properly linked to treatment milestones, and retained according to legal requirements. It leverages AI for automatic categorization and quality assessment while providing manual tools for custom organization.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.3.3.1 | [Patient Image Gallery](./functions/patient-image-gallery.md) | Patient-centric image browsing | 📋 Planned | Critical |
| 3.3.3.2 | [Image Categorization](./functions/image-categorization.md) | Automatic and manual classification | 📋 Planned | High |
| 3.3.3.3 | [Tagging & Metadata](./functions/tagging-metadata.md) | Custom tags and metadata management | 📋 Planned | High |
| 3.3.3.4 | [Search & Filtering](./functions/search-filtering.md) | Find images across the practice | 📋 Planned | High |
| 3.3.3.5 | [Treatment Phase Linking](./functions/treatment-phase-linking.md) | Link images to treatment milestones | 📋 Planned | High |
| 3.3.3.6 | [Retention & Archival](./functions/retention-archival.md) | Compliance-driven retention policies | 📋 Planned | Medium |

---

## Function Details

### 3.3.3.1 Patient Image Gallery

**Purpose**: Provide an intuitive gallery interface for browsing all images associated with a patient.

**Key Capabilities**:
- Chronological timeline view
- Category-based filtering (photos, X-rays, scans)
- Treatment phase grouping
- Thumbnail grid with lazy loading
- Full-screen image preview
- Quick comparison selection
- Batch operations (tag, delete, export)
- Virtual scrolling for large collections
- Favorites/starred images

**Gallery Views**:
| View | Description | Best For |
|------|-------------|----------|
| **Timeline** | Chronological stream | Progress review |
| **Grid** | Thumbnail grid | Quick browsing |
| **Category** | Grouped by type | Finding specific images |
| **Treatment** | By treatment phase | Clinical review |
| **Date Range** | Filtered by period | Historical lookup |

**User Stories**:
- As a **doctor**, I want to browse all patient images chronologically so that I can review treatment history
- As a **clinical staff**, I want to filter to only X-rays so that I can quickly find diagnostic images
- As a **treatment coordinator**, I want to star key images for the case presentation

---

### 3.3.3.2 Image Categorization

**Purpose**: Classify images into standard categories for organization and search.

**Key Capabilities**:
- Automatic category detection (AI-powered)
- Manual category assignment
- Subcategory classification
- Bulk re-categorization
- Category statistics and reporting
- Custom category creation (clinic-specific)

**Standard Categories**:

| Category | Subcategories |
|----------|---------------|
| **Extraoral Photos** | Frontal smile, Frontal relaxed, Profile right, Profile left, 3/4 view |
| **Intraoral Photos** | Frontal occlusion, Right buccal, Left buccal, Upper occlusal, Lower occlusal, Overjet |
| **Panoramic X-ray** | Standard panoramic, Segmented |
| **Cephalometric X-ray** | Lateral ceph, PA ceph |
| **Periapical X-ray** | By tooth region |
| **CBCT** | Full volume, Regional |
| **3D Scan** | Upper arch, Lower arch, Bite registration |
| **Other** | Consent forms, External records |

**AI Auto-Classification**:
- Analyze image content to detect category
- Confidence score for classification
- Human review for low-confidence results
- Continuous learning from corrections

**User Stories**:
- As a **clinical staff**, I want images auto-categorized on upload so that I don't have to classify manually
- As a **doctor**, I want to correct misclassified images so that organization stays accurate
- As a **clinic admin**, I want to create custom categories for our workflow

---

### 3.3.3.3 Tagging & Metadata

**Purpose**: Enrich images with custom tags and metadata for enhanced discoverability.

**Key Capabilities**:
- Custom tag creation
- Tag suggestions based on content
- Multi-tag assignment
- Tag search and filtering
- Tag analytics (usage, frequency)
- Metadata display and editing
- EXIF data preservation
- DICOM metadata for X-rays

**Tag Types**:
| Type | Description | Examples |
|------|-------------|----------|
| **Clinical** | Clinical findings | Crowding, Overjet, Class II |
| **Treatment** | Treatment phase | Initial records, Mid-treatment, Debond |
| **Quality** | Image quality | Best shot, Needs retake, Reference |
| **Custom** | Practice-specific | VIP patient, Case study, Marketing |

**Metadata Fields**:
- Capture date/time
- Camera/device information
- Operator who captured
- Appointment association
- Treatment phase
- Protocol slot (if applicable)
- Quality score
- EXIF data (photos)
- DICOM tags (X-rays)

**User Stories**:
- As a **doctor**, I want to tag images with clinical findings so that I can find similar cases
- As a **marketing**, I want to tag before/after images suitable for marketing use
- As a **clinical staff**, I want to see when and who captured an image

---

### 3.3.3.4 Search & Filtering

**Purpose**: Find images quickly across all patients using powerful search capabilities.

**Key Capabilities**:
- Full-text search across tags and metadata
- Filter by category, date range, treatment phase
- Filter by image quality score
- Advanced search with multiple criteria
- Search within patient or across practice
- Saved searches for common queries
- Recent search history
- Search analytics

**Search Filters**:
| Filter | Options |
|--------|---------|
| **Date Range** | Captured between dates |
| **Category** | Photo, X-ray, 3D, etc. |
| **Subcategory** | Specific view type |
| **Tags** | Any custom tag |
| **Quality** | Score range |
| **Treatment** | Linked treatment plan |
| **Provider** | Captured by staff |
| **Protocol** | Photo protocol used |

**Advanced Search**:
```
category:xray date:last-30-days tag:crowding quality:>80
```

**User Stories**:
- As a **doctor**, I want to find all cephalometric X-rays from the past month
- As a **clinical staff**, I want to search for images tagged "needs review"
- As a **treatment coordinator**, I want to find before/after images for case presentations

---

### 3.3.3.5 Treatment Phase Linking

**Purpose**: Associate images with treatment plans and milestones for clinical context.

**Key Capabilities**:
- Link images to treatment plan
- Associate with treatment milestones
- Automatic linking based on capture date
- Milestone-based image requirements
- Progress visualization on timeline
- Missing image alerts for milestones
- Treatment phase filtering

**Treatment Milestones**:
| Milestone | Image Requirements |
|-----------|-------------------|
| **Initial Records** | Full photo series, Panoramic, Ceph |
| **Bonding** | Post-bonding photos |
| **Wire Changes** | Optional progress photos |
| **Mid-Treatment** | Progress photo series |
| **Pre-Debond** | Pre-debond photos |
| **Debond** | Full debond series |
| **Retainer Check** | Retention photos |

**User Stories**:
- As a **doctor**, I want to see all images linked to this treatment plan so that I can review progress
- As a **clinical staff**, I want a reminder for required photos at each milestone
- As a **system**, I want to auto-link images to treatment based on capture date

---

### 3.3.3.6 Retention & Archival

**Purpose**: Manage image retention according to legal requirements and storage optimization.

**Key Capabilities**:
- Configurable retention policies by image type
- Retention period tracking
- Archive to cold storage after period
- Secure deletion with audit trail
- Legal hold for litigation
- Storage usage reporting
- Compliance reporting
- Minor patient extended retention

**Retention Policies**:
| Image Type | Minimum Retention | Notes |
|------------|-------------------|-------|
| Clinical Photos | 7-10 years | State-dependent |
| X-rays | 7-10 years | State-dependent |
| 3D Scans | 7 years | Storage-intensive |
| Minor Patients | Until age 21 + 7 years | Extended retention |
| Consent Forms | Permanent | Critical documentation |

**Archival Process**:
1. Images flagged for archival review
2. Low-resolution version retained locally
3. Full resolution moved to cold storage
4. Retrieval on-demand if needed
5. Deletion after retention period with audit log

**User Stories**:
- As a **clinic admin**, I want to configure retention policies per our state requirements
- As a **system**, I want to automatically archive old images to reduce active storage costs
- As a **compliance officer**, I want a report of image retention compliance

---

## Data Model

```prisma
model ImageTag {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Tag info
  name          String
  category      TagCategory @default(CUSTOM)
  color         String?         // Display color
  description   String?
  isActive      Boolean  @default(true)

  // Usage tracking
  usageCount    Int      @default(0)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  assignments   ImageTagAssignment[]

  @@unique([clinicId, name])
  @@index([clinicId])
  @@index([category])
}

enum TagCategory {
  CLINICAL
  TREATMENT
  QUALITY
  MARKETING
  CUSTOM
}

model ImageTagAssignment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  imageId       String   @db.ObjectId
  tagId         String   @db.ObjectId

  // Metadata
  assignedBy    String   @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  image         Image    @relation(fields: [imageId], references: [id])
  tag           ImageTag @relation(fields: [tagId], references: [id])

  @@unique([imageId, tagId])
  @@index([imageId])
  @@index([tagId])
}

model ImageAlbum {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String?  @db.ObjectId  // Optional for practice-wide albums

  // Album info
  name          String
  description   String?
  coverImageId  String?  @db.ObjectId
  isPublic      Boolean  @default(false)  // For patient portal

  // Ordering
  sortOrder     Int      @default(0)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient? @relation(fields: [patientId], references: [id])
  images        ImageAlbumMember[]

  @@index([clinicId])
  @@index([patientId])
}

model ImageAlbumMember {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  albumId       String   @db.ObjectId
  imageId       String   @db.ObjectId

  // Ordering
  sortOrder     Int      @default(0)

  // Caption override
  caption       String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  album         ImageAlbum @relation(fields: [albumId], references: [id])
  image         Image      @relation(fields: [imageId], references: [id])

  @@unique([albumId, imageId])
  @@index([albumId])
  @@index([imageId])
}

model TreatmentImageLink {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId
  treatmentId   String   @db.ObjectId

  // Milestone link
  milestoneId   String?  @db.ObjectId
  milestoneName String?            // Denormalized for display

  // Link type
  linkType      TreatmentLinkType @default(PROGRESS)

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  image         Image    @relation(fields: [imageId], references: [id])

  @@unique([imageId, treatmentId, milestoneId])
  @@index([clinicId])
  @@index([treatmentId])
  @@index([milestoneId])
}

enum TreatmentLinkType {
  INITIAL_RECORDS
  PROGRESS
  MILESTONE
  FINAL_RECORDS
  REFERENCE
}

model ImageRetentionPolicy {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Policy info
  name          String
  description   String?
  isDefault     Boolean  @default(false)

  // Scope
  imageTypes    ImageFileType[]  // Which image types this applies to
  categories    ImageCategory[]  // Which categories

  // Retention rules
  retentionYears Int             // Years to retain
  retentionForMinors Int?        // Additional years for minors
  archiveAfterYears Int?         // When to archive (optional)

  // Legal hold
  legalHoldEnabled Boolean @default(false)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
}

model ImageArchiveRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId

  // Archive info
  action        ArchiveAction
  reason        String?
  policyId      String?  @db.ObjectId

  // Storage reference
  archiveStorageKey String?
  originalStorageKey String

  // Timestamps
  archivedAt    DateTime @default(now())
  expiresAt     DateTime?        // When can be deleted
  deletedAt     DateTime?

  // Audit
  performedBy   String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([imageId])
  @@index([expiresAt])
}

enum ArchiveAction {
  ARCHIVED
  RESTORED
  DELETED
  LEGAL_HOLD
}

model SavedSearch {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  // Search info
  name          String
  description   String?
  query         String           // Search query string
  filters       Json             // Filter criteria

  // Scope
  scope         SearchScope @default(PATIENT)

  // Usage
  lastUsedAt    DateTime?
  useCount      Int      @default(0)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([userId])
}

enum SearchScope {
  PATIENT
  PRACTICE
}
```

---

## API Endpoints

### Patient Gallery

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/patients/:id/gallery` | Get patient gallery | `imaging:view` |
| GET | `/api/imaging/patients/:id/gallery/timeline` | Get timeline view | `imaging:view` |
| GET | `/api/imaging/patients/:id/gallery/stats` | Get gallery statistics | `imaging:view` |

### Tags

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/tags` | List all tags | `imaging:view` |
| POST | `/api/imaging/tags` | Create tag | `imaging:admin` |
| PUT | `/api/imaging/tags/:id` | Update tag | `imaging:admin` |
| DELETE | `/api/imaging/tags/:id` | Delete tag | `imaging:admin` |
| POST | `/api/imaging/images/:id/tags` | Add tags to image | `imaging:annotate` |
| DELETE | `/api/imaging/images/:id/tags/:tagId` | Remove tag | `imaging:annotate` |

### Albums

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/albums` | List albums | `imaging:view` |
| GET | `/api/imaging/albums/:id` | Get album | `imaging:view` |
| POST | `/api/imaging/albums` | Create album | `imaging:annotate` |
| PUT | `/api/imaging/albums/:id` | Update album | `imaging:annotate` |
| DELETE | `/api/imaging/albums/:id` | Delete album | `imaging:annotate` |
| POST | `/api/imaging/albums/:id/images` | Add images | `imaging:annotate` |
| DELETE | `/api/imaging/albums/:id/images/:imageId` | Remove image | `imaging:annotate` |

### Search

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/search` | Search images | `imaging:view` |
| GET | `/api/imaging/search/suggestions` | Get search suggestions | `imaging:view` |
| GET | `/api/imaging/search/saved` | List saved searches | `imaging:view` |
| POST | `/api/imaging/search/saved` | Save search | `imaging:view` |
| DELETE | `/api/imaging/search/saved/:id` | Delete saved search | `imaging:view` |

### Treatment Linking

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/imaging/images/:id/link-treatment` | Link to treatment | `imaging:annotate` |
| DELETE | `/api/imaging/images/:id/link-treatment` | Unlink treatment | `imaging:annotate` |
| GET | `/api/imaging/treatments/:id/images` | Get treatment images | `imaging:view` |

### Retention

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/retention/policies` | List policies | `imaging:admin` |
| POST | `/api/imaging/retention/policies` | Create policy | `imaging:admin` |
| PUT | `/api/imaging/retention/policies/:id` | Update policy | `imaging:admin` |
| GET | `/api/imaging/retention/report` | Get retention report | `imaging:admin` |
| POST | `/api/imaging/retention/archive` | Archive old images | `imaging:admin` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `PatientGallery` | Main gallery view | `components/imaging/` |
| `GalleryTimeline` | Chronological timeline | `components/imaging/` |
| `GalleryGrid` | Thumbnail grid view | `components/imaging/` |
| `CategoryFilter` | Filter by category | `components/imaging/` |
| `TagManager` | Manage image tags | `components/imaging/` |
| `TagPicker` | Select tags for image | `components/imaging/` |
| `ImageSearch` | Search interface | `components/imaging/` |
| `SearchFilters` | Advanced filter panel | `components/imaging/` |
| `AlbumCreator` | Create/edit albums | `components/imaging/` |
| `AlbumViewer` | View album contents | `components/imaging/` |
| `TreatmentLinker` | Link image to treatment | `components/imaging/` |
| `RetentionDashboard` | Retention policy management | `components/imaging/` |
| `ArchiveViewer` | View archived images | `components/imaging/` |

---

## Business Rules

1. **Category Assignment**: Every image must have a primary category
2. **Tag Limits**: Maximum 20 tags per image
3. **Album Limits**: Maximum 100 images per album
4. **Deletion**: Images are soft-deleted and recoverable for 30 days
5. **Retention Override**: Legal hold overrides all retention policies
6. **Minor Retention**: Extended retention for minor patients
7. **Archive Access**: Archived images retrievable but may have delay
8. **Search Scope**: Users can only search images they have access to

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Image Capture & Upload | Required | Image storage reference |
| Treatment Management | Optional | Treatment plan linking |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Cloud Storage | Required | Image storage |
| Cold Storage | Optional | Archive storage (Glacier, etc.) |
| Search Index | Optional | Full-text search (optional) |

---

## Related Documentation

- [Parent: Imaging Management](../../)
- [Image Capture & Upload](../image-capture-upload/)
- [Image Viewing & Tools](../image-viewing-tools/)
- [Reports & Collages](../reports-collages/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
