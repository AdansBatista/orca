# Image Capture & Upload

> **Area**: [Imaging Management](../../)
>
> **Sub-Area**: 3.3.1 Image Capture & Upload
>
> **Purpose**: Capture and import patient images from multiple sources with orthodontic-specific protocols and quality standards

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Imaging Management](../../) |
| **Dependencies** | Auth, Treatment Management, Device Integration |
| **Last Updated** | 2024-11-26 |

---

## Overview

Image Capture & Upload is the entry point for all patient imaging in Orca. It provides standardized workflows for capturing photos, importing X-rays, and integrating with 3D scanners. The system enforces orthodontic photo protocols, validates image quality, and ensures consistent documentation across the practice.

This sub-area handles the complex challenge of integrating with diverse imaging hardware (cameras, X-ray systems, intraoral scanners) while maintaining a unified patient imaging experience. It supports both real-time capture during appointments and batch import for previously captured images.

**Think about just having uploading process, not interfacing with cameras and scanners**


---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.3.1.1 | [Intraoral Camera Integration](./functions/intraoral-camera-integration.md) | Direct capture from intraoral cameras | 📋 Planned | High |
| 3.3.1.2 | [DSLR/Camera Import](./functions/dslr-camera-import.md) | Import from professional cameras | 📋 Planned | Critical |
| 3.3.1.3 | [X-ray Integration](./functions/xray-integration.md) | DICOM import from X-ray systems | 📋 Planned | Critical |
| 3.3.1.4 | [3D Scanner Integration](./functions/3d-scanner-integration.md) | iTero, 3Shape, and STL import | 📋 Planned | High |
| 3.3.1.5 | [Photo Protocol Management](./functions/photo-protocol-management.md) | Standard photo series configuration | 📋 Planned | High |
| 3.3.1.6 | [Batch Upload & Processing](./functions/batch-upload-processing.md) | Multi-image upload and processing | 📋 Planned | Medium |

---

## Function Details

### 3.3.1.1 Intraoral Camera Integration

**Purpose**: Capture images directly from intraoral cameras connected to workstations.

**Key Capabilities**:
- USB and video capture device support
- Real-time preview with capture controls
- Automatic image optimization (brightness, contrast)
- Integration with common intraoral camera brands
- Foot pedal capture support
- Live feed annotation before capture

**Supported Devices**:
- DEXIS CariVu
- Carestream
- Acteon SOPROCARE
- MouthWatch
- Generic USB cameras

**User Stories**:
- As a **clinical staff**, I want to capture intraoral photos during the appointment so that I can document treatment progress
- As a **doctor**, I want to use a foot pedal to capture images hands-free during examination
- As a **clinical staff**, I want to preview the image before saving so that I can ensure quality

---

### 3.3.1.2 DSLR/Camera Import

**Purpose**: Import high-resolution photos from professional DSLR cameras and mobile devices.

**Key Capabilities**:
- USB tethered capture from DSLR
- Memory card import workflow
- WiFi import from supported cameras
- Mobile device upload (smartphone photos)
- EXIF metadata preservation
- Camera settings recommendations for orthodontic photography

**Supported Cameras**:
- Canon EOS series (tethered)
- Nikon D series (tethered)
- Sony Alpha series (tethered)
- Any camera via memory card import
- iOS/Android devices via upload

**User Stories**:
- As a **clinical staff**, I want to import photos from the DSLR after a photo session so that they appear in the patient record
- As a **photographer**, I want real-time tethered capture so that I can see photos on screen immediately
- As a **doctor**, I want to upload a photo from my phone so that I can quickly document a concern

---

### 3.3.1.3 X-ray Integration

**Purpose**: Import diagnostic X-rays from digital radiography systems via DICOM standard.

**Key Capabilities**:
- DICOM import (file-based and network)
- Support for panoramic X-rays
- Cephalometric X-ray handling
- Periapical and bitewing import
- CBCT 3D volume import
- Patient matching and verification
- Radiation exposure logging

**Supported Systems**:
- Carestream (CS series)
- Planmeca
- Dentsply Sirona
- Vatech
- KaVo Kerr
- Any DICOM-compliant system

**DICOM Support**:
- DICOM file import (.dcm)
- DICOM Storage SCP (network receive)
- DICOM Query/Retrieve (PACS integration)
- DICOM Modality Worklist (optional)

**User Stories**:
- As a **clinical staff**, I want to import the panoramic X-ray so that the doctor can review it with the patient
- As a **doctor**, I want CBCT scans automatically linked to the patient so that I can plan treatment
- As a **system admin**, I want X-rays to flow automatically from our X-ray system to Orca

---

### 3.3.1.4 3D Scanner Integration

**Purpose**: Import 3D scans and digital impressions from intraoral scanners.

**Key Capabilities**:
- iTero cloud integration (API)
- 3Shape file import
- STL file import (universal)
- PLY and OBJ format support
- Scan metadata preservation
- Automatic scan type detection (upper, lower, bite)
- Treatment simulator integration

**Supported Scanners**:
- iTero Element (cloud sync)
- 3Shape TRIOS (file export)
- Carestream (file export)
- Medit (file export)
- Any scanner via STL export

**User Stories**:
- As a **clinical staff**, I want iTero scans to sync automatically so that I don't have to manually import them
- As a **doctor**, I want to view 3D scans in the patient record so that I can plan treatment
- As a **treatment coordinator**, I want to show the patient their digital impression on screen

---

### 3.3.1.5 Photo Protocol Management

**Purpose**: Define and enforce standardized photo series for consistent orthodontic documentation.

**Key Capabilities**:
- Standard orthodontic photo series templates
- Custom protocol creation
- Protocol assignment to appointment types
- Capture checklist during photo sessions
- Photo positioning guides
- Quality criteria enforcement
- Retake notification and tracking

**Standard Photo Series**:

| Series Type | Photos | Use Case |
|-------------|--------|----------|
| **Initial Records** | 12 photos | New patient comprehensive |
| **Progress Check** | 8 photos | Standard progress photos |
| **Debond Records** | 12 photos | Treatment completion |
| **Retainer Check** | 5 photos | Post-treatment follow-up |
| **Consultation** | 5 photos | Quick consultation set |

**Photo Checklist (Initial Records)**:
1. Extraoral - Frontal smile
2. Extraoral - Frontal relaxed
3. Extraoral - Profile right
4. Extraoral - Profile left
5. Extraoral - 3/4 smile
6. Intraoral - Frontal occlusion
7. Intraoral - Right buccal
8. Intraoral - Left buccal
9. Intraoral - Upper occlusal
10. Intraoral - Lower occlusal
11. Intraoral - Overjet (if applicable)
12. Extraoral - Full face frontal

**User Stories**:
- As a **clinical staff**, I want a checklist showing which photos I need to take so that I capture a complete set
- As a **clinic admin**, I want to customize our photo protocols to match our practice standards
- As a **doctor**, I want to be notified if a photo set is incomplete before the patient leaves

---

### 3.3.1.6 Batch Upload & Processing

**Purpose**: Efficiently upload and process multiple images at once.

**Key Capabilities**:
- Drag-and-drop multi-file upload
- Folder import for bulk images
- Automatic patient matching by filename
- Parallel upload for speed
- Background processing queue
- Thumbnail generation
- Multi-resolution variant creation
- Duplicate detection

**Processing Pipeline**:
1. File validation (format, size, corruption)
2. EXIF extraction and preservation
3. Patient matching (if automated)
4. Thumbnail generation (150px)
5. Preview generation (800px)
6. Full resolution optimization
7. Storage upload (S3-compatible)
8. Database record creation

**User Stories**:
- As a **clinical staff**, I want to upload an entire folder of photos at once so that I can save time
- As a **office manager**, I want to bulk import historical images during system migration
- As a **clinical staff**, I want uploads to continue in the background while I work

---

## Data Model

```prisma
model Image {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Image identification
  imageNumber   String   @unique  // Clinic-specific image ID
  filename      String            // Original filename
  fileType      ImageFileType     // PHOTO, XRAY, SCAN_3D, VIDEO
  category      ImageCategory     // EXTRAORAL, INTRAORAL, PANORAMIC, etc.
  subcategory   String?           // Specific view (frontal_smile, right_buccal)

  // Storage
  storageKey    String            // Cloud storage key
  thumbnailKey  String?           // Thumbnail storage key
  previewKey    String?           // Preview storage key
  originalSize  Int               // Original file size in bytes
  mimeType      String            // MIME type

  // Image properties
  width         Int?
  height        Int?
  colorSpace    String?
  bitDepth      Int?

  // Capture information
  capturedAt    DateTime          // When image was taken
  capturedBy    String?  @db.ObjectId  // Staff who captured
  deviceType    String?           // Camera, intraoral, X-ray system
  deviceName    String?           // Specific device identifier

  // EXIF/Metadata
  metadata      Json?             // Full EXIF data
  cameraModel   String?
  lensInfo      String?
  focalLength   Float?
  aperture      Float?
  shutterSpeed  String?
  iso           Int?

  // DICOM-specific (for X-rays)
  dicomData     Json?             // DICOM tags
  modality      String?           // OPG, CEPH, CBCT, etc.
  studyId       String?           // DICOM Study UID
  seriesId      String?           // DICOM Series UID
  instanceId    String?           // DICOM SOP Instance UID

  // Protocol/Treatment linking
  protocolId    String?  @db.ObjectId  // Photo protocol used
  protocolSlot  String?           // Position in protocol
  treatmentId   String?  @db.ObjectId  // Linked treatment plan
  milestoneId   String?  @db.ObjectId  // Linked treatment milestone
  appointmentId String?  @db.ObjectId  // Appointment when captured

  // Quality
  qualityScore  Float?            // AI quality assessment (0-100)
  qualityNotes  String?           // Quality issues detected
  needsRetake   Boolean  @default(false)

  // Status
  status        ImageStatus @default(ACTIVE)
  isArchived    Boolean  @default(false)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Audit
  createdBy     String?  @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  annotations   Annotation[]
  versions      ImageVersion[]
  tags          ImageTagAssignment[]

  @@index([clinicId])
  @@index([patientId])
  @@index([category])
  @@index([capturedAt])
  @@index([protocolId])
  @@index([treatmentId])
  @@index([status])
}

enum ImageFileType {
  PHOTO
  XRAY
  SCAN_3D
  VIDEO
  DOCUMENT
}

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

enum ImageStatus {
  PROCESSING
  ACTIVE
  ARCHIVED
  DELETED
}

model PhotoProtocol {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Protocol info
  name          String            // e.g., "Initial Records"
  description   String?
  photoCount    Int               // Expected number of photos
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // Protocol slots
  slots         PhotoProtocolSlot[]

  // Usage
  appointmentTypes String[]       // Appointment types that use this

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  images        Image[]

  @@index([clinicId])
  @@index([isActive])
}

model PhotoProtocolSlot {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  protocolId    String   @db.ObjectId

  // Slot info
  position      Int               // Order in protocol
  name          String            // e.g., "Frontal Smile"
  category      ImageCategory
  subcategory   String?           // Specific view type
  description   String?           // Instructions for capture
  required      Boolean  @default(true)

  // Capture guidance
  guideImageUrl String?           // Reference image showing ideal shot
  positioningNotes String?        // Positioning instructions
  lightingNotes String?           // Lighting recommendations

  // Relations
  protocol      PhotoProtocol @relation(fields: [protocolId], references: [id])

  @@index([protocolId])
}

model ImageUploadBatch {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Batch info
  batchNumber   String   @unique
  status        BatchStatus @default(PENDING)
  source        String            // DSLR, folder_import, migration

  // Progress
  totalFiles    Int
  processedFiles Int      @default(0)
  successCount  Int       @default(0)
  failureCount  Int       @default(0)

  // Patient (if all images for one patient)
  patientId     String?  @db.ObjectId

  // Processing
  startedAt     DateTime?
  completedAt   DateTime?
  errorLog      String[]

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([status])
}

enum BatchStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

---

## API Endpoints

### Image Upload

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/imaging/upload` | Upload single image | `imaging:capture` |
| POST | `/api/imaging/upload/batch` | Upload multiple images | `imaging:capture` |
| GET | `/api/imaging/upload/batch/:id` | Get batch status | `imaging:capture` |
| DELETE | `/api/imaging/upload/batch/:id` | Cancel batch upload | `imaging:capture` |

### Camera/Device Integration

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/devices` | List connected devices | `imaging:capture` |
| POST | `/api/imaging/devices/:id/capture` | Capture from device | `imaging:capture` |
| GET | `/api/imaging/devices/:id/preview` | Get device preview stream | `imaging:capture` |

### DICOM

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/imaging/dicom/import` | Import DICOM files | `imaging:capture` |
| POST | `/api/imaging/dicom/query` | Query PACS for studies | `imaging:admin` |
| POST | `/api/imaging/dicom/retrieve` | Retrieve from PACS | `imaging:admin` |

### 3D Scanner

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/3d/itero/scans` | List iTero scans | `imaging:capture` |
| POST | `/api/imaging/3d/itero/sync` | Sync iTero scan | `imaging:capture` |
| POST | `/api/imaging/3d/import` | Import STL/PLY file | `imaging:capture` |

### Photo Protocols

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/protocols` | List protocols | `imaging:view` |
| GET | `/api/imaging/protocols/:id` | Get protocol details | `imaging:view` |
| POST | `/api/imaging/protocols` | Create protocol | `imaging:admin` |
| PUT | `/api/imaging/protocols/:id` | Update protocol | `imaging:admin` |
| DELETE | `/api/imaging/protocols/:id` | Delete protocol | `imaging:admin` |
| POST | `/api/imaging/protocols/:id/session` | Start capture session | `imaging:capture` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ImageUploader` | Drag-drop upload interface | `components/imaging/` |
| `CameraCapture` | Live camera capture UI | `components/imaging/` |
| `IntraoralCapture` | Intraoral camera interface | `components/imaging/` |
| `DicomImporter` | DICOM file import wizard | `components/imaging/` |
| `ScannerSync` | 3D scanner sync interface | `components/imaging/` |
| `ProtocolCaptureSession` | Photo protocol capture flow | `components/imaging/` |
| `UploadProgress` | Batch upload progress | `components/imaging/` |
| `ImagePreview` | Quick preview during upload | `components/imaging/` |
| `ProtocolManager` | Protocol CRUD interface | `components/imaging/` |
| `PhotoGuide` | Visual positioning guide | `components/imaging/` |

---

## Business Rules

1. **Patient Association**: Every image must be associated with a patient
2. **Original Preservation**: Original images are never modified; edits create new versions
3. **Quality Validation**: Images below quality threshold trigger retake notification
4. **Protocol Enforcement**: Photo sessions use protocol checklists
5. **DICOM Matching**: DICOM imports require patient verification before linking
6. **Storage Limits**: Per-image size limits with warning for exceptionally large files
7. **Duplicate Detection**: Warn on potential duplicate image upload
8. **Capture Logging**: All captures logged with timestamp, device, and operator

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Treatment Management | Optional | Treatment plan and milestone linking |
| Booking & Scheduling | Optional | Appointment association |
| Practice Orchestration | Optional | Daily workflow integration |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Cloud Storage (S3) | Required | Image file storage |
| Image Processing | Required | Sharp.js for image manipulation |
| DICOM Toolkit | Required | dcmjs for DICOM parsing |
| iTero API | Optional | Scanner cloud integration |

---

## Security Requirements

### Access Control
- **Capture images**: clinical_staff, doctor
- **Import X-rays**: clinical_staff, doctor
- **Manage protocols**: clinic_admin
- **Delete images**: clinic_admin only

### Audit Requirements
- Log all image uploads with user and timestamp
- Track DICOM imports with source system
- Record patient-image associations
- Audit protocol compliance

### Data Protection
- Images encrypted at rest in cloud storage
- HTTPS for all image transfers
- Signed URLs for image access
- No PHI in filenames (use IDs)

---

## Related Documentation

- [Parent: Imaging Management](../../)
- [Image Viewing & Tools](../image-viewing-tools/)
- [Image Organization](../image-organization/)
- [Reports & Collages](../reports-collages/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
