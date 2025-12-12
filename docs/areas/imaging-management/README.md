# Imaging Management

> **Area**: Imaging Management
>
> **Phase**: 3 - Clinical
>
> **Purpose**: Capture, store, view, and manage all patient diagnostic imaging including photos, X-rays, scans, and 3D models with orthodontic-specific workflows

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete (~90%) |
| **Priority** | High |
| **Phase** | 3 - Clinical |
| **Dependencies** | Phase 1 (Auth, Staff), Phase 2 (Booking), Treatment Management |
| **Last Updated** | 2024-12-11 |

---

## Overview

The Imaging Management area handles the complete lifecycle of patient diagnostic imaging in orthodontic practices. This includes capturing images from various sources (intraoral cameras, DSLR, X-ray systems, 3D scanners), organizing them in patient galleries, providing advanced viewing and analysis tools, and generating reports and collages for treatment documentation.

Orthodontic practices rely heavily on imaging for diagnosis, treatment planning, progress monitoring, and case documentation. This area ensures images are captured consistently, stored securely, easily accessible, and integrated with the treatment workflow.

### Key Capabilities

- **Image Capture & Upload**: Multi-source image acquisition from cameras, X-ray systems, and scanners
- **Image Viewing & Tools**: Advanced viewer with zoom, pan, measurements, annotations, and comparison modes
- **Image Organization**: Patient galleries, categorization, tagging, and intelligent search
- **Reports & Collages**: Progress collages, before/after comparisons, and case presentations

### Business Value

- Standardized photo protocols ensure consistent, high-quality documentation
- Integrated viewing tools eliminate need for separate imaging software
- Progress tracking with side-by-side comparisons demonstrates treatment value
- Professional case presentations enhance patient communication and referral documentation
- HIPAA-compliant storage with access controls protects patient privacy
- Integration with treatment plans links images to clinical milestones

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 1 | [Image Capture & Upload](./sub-areas/image-capture-upload/) | Multi-source image acquisition and upload | ✅ Complete (~85%) | Critical |
| 2 | [Image Viewing & Tools](./sub-areas/image-viewing-tools/) | Advanced viewer with analysis tools | ✅ Complete (~95%) | Critical |
| 3 | [Image Organization](./sub-areas/image-organization/) | Patient galleries, categorization, search | ✅ Complete (~90%) | High |
| 4 | [Reports & Collages](./sub-areas/reports-collages/) | Collages, presentations, and reports | ✅ Complete (~85%) | High |

---

## Sub-Area Details

### 1. Image Capture & Upload

Capture and import images from multiple sources with orthodontic-specific protocols.

**Functions:**
- Intraoral Camera Integration
- DSLR/Camera Import
- X-ray System Integration (DICOM)
- 3D Scanner Integration (iTero/3Shape)
- Photo Protocol Management
- Batch Upload & Processing

**Key Features:**
- Standard orthodontic photo series (8-12 photos)
- DICOM import for panoramic and cephalometric X-rays
- CBCT 3D imaging support
- STL import from intraoral scanners
- Photo consistency guides (lighting, positioning, backgrounds)
- Automatic image quality validation

---

### 2. Image Viewing & Tools

Professional high-resolution image viewing with clinical analysis tools.

**Functions:**
- Advanced Image Viewer
- Measurement & Calibration Tools
- Annotation System
- Comparison Views
- Cephalometric Analysis
- 3D Model Viewer

**Key Features:**
- GPU-accelerated rendering for large images
- Pan, zoom with saved view states
- Distance, angle, and area measurements
- Synchronized side-by-side comparison
- Before/after slider visualization
- Landmark tracing for cephalometric analysis
- Non-destructive editing with undo/redo

---

### 3. Image Organization

Organize, categorize, and search patient imaging efficiently.

**Functions:**
- Patient Image Gallery
- Image Categorization
- Tagging & Metadata
- Search & Filtering
- Treatment Phase Linking
- Retention & Archival

**Key Features:**
- Automatic organization by date and type
- Custom albums and folders
- AI-assisted image tagging
- Full-text search across metadata
- Link images to treatment milestones
- HIPAA-compliant retention policies

---

### 4. Reports & Collages

Create professional presentations and documentation from patient images.

**Functions:**
- Collage Template Builder
- Progress Collage Generation
- Before/After Presentations
- Case Presentation Builder
- Referral Documentation
- Treatment Simulation Exports

**Key Features:**
- Drag-and-drop template designer
- Pre-built orthodontic layouts
- Clinic branding integration
- AI-powered image selection
- PDF and print export
- Integration with patient portal

---

## Integration Points

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Treatment Management | Treatment plans, milestones | Link images to treatment phases |
| CRM & Onboarding | Patient intake | Initial imaging during onboarding |
| Booking & Scheduling | Appointment types | Photo appointments and protocols |
| Patient Communications | Portal, sharing | Patient access to their images |
| Compliance & Documentation | Consent, audit | Photo consent and access logging |
| Practice Orchestration | Daily workflow | Image capture at appointments |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| DSLR Cameras | USB/WiFi Import | Photo capture from professional cameras |
| Intraoral Cameras | Device SDK | Direct capture from intraoral cameras |
| X-ray Systems | DICOM | Import panoramic, cephalometric, periapical |
| CBCT Systems | DICOM | 3D volumetric imaging |
| iTero Scanner | Cloud API | Digital impressions and 3D models |
| 3Shape Scanner | File Import | STL and 3D scan data |
| Local Storage | Filesystem | On-premises image storage (public/uploads/images/) |

---

## User Roles & Permissions

| Role | Capture | View | Annotate | Delete | Reports |
|------|---------|------|----------|--------|---------|
| Super Admin | Full | Full | Full | Full | Full |
| Clinic Admin | Full | Full | Full | Full | Full |
| Doctor | Full | Full | Full | With Approval | Full |
| Clinical Staff | Full | Full | Edit | None | View |
| Front Desk | Limited | Limited | None | None | View |
| Billing | None | Limited | None | None | View |
| Read Only | None | View | None | None | View |

### Special Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `imaging:capture` | Capture and upload images | doctor, clinical_staff |
| `imaging:view` | View patient images | all clinical roles |
| `imaging:annotate` | Add annotations and measurements | doctor, clinical_staff |
| `imaging:delete` | Delete images (soft delete) | clinic_admin |
| `imaging:export` | Export images and reports | doctor, clinical_staff |
| `imaging:admin` | Manage templates and settings | clinic_admin |
| `imaging:cephalometric` | Perform cephalometric analysis | doctor |
| `imaging:3d_view` | View 3D models and CBCT | doctor, clinical_staff |

---

## Data Models

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Patient     │────▶│   ImageGallery  │────▶│      Image      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                               ┌────────────────────────┼────────────────────────┐
                               ▼                        ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
                        │   Annotation    │     │    ImageTag     │     │   ImageVersion  │
                        └─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ PhotoProtocol   │────▶│  ProtocolImage  │     │ CollageTemplate │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │    Collage      │
                                                └─────────────────┘
```

### Key Models

| Model | Description |
|-------|-------------|
| `Image` | Individual image with metadata and storage reference |
| `ImageGallery` | Collection of images for a patient |
| `ImageCategory` | Classification of image types (intraoral, extraoral, X-ray) |
| `ImageTag` | Custom tags for image organization |
| `Annotation` | Measurements, drawings, and notes on images |
| `ImageVersion` | Version history for edited images |
| `PhotoProtocol` | Standard photo series definition |
| `CollageTemplate` | Layout template for image collages |
| `Collage` | Generated collage from patient images |
| `CephAnalysis` | Cephalometric analysis with landmarks and measurements |

---

## Orthodontic-Specific Features

### Standard Photo Series

Orthodontic practices use standardized photo sets for consistent documentation:

| Photo Type | Description | Count |
|------------|-------------|-------|
| **Extraoral** | Frontal smile, frontal rest, profile, 3/4 view | 4-5 |
| **Intraoral** | Frontal occlusion, right buccal, left buccal, upper occlusal, lower occlusal | 5 |
| **Additional** | Retracted frontal, overjet view, specific concerns | 2-3 |

### Cephalometric Analysis

- Landmark identification (30+ standard points)
- Linear and angular measurements
- Growth prediction overlays
- Treatment simulation
- Superimposition for progress tracking

### 3D Imaging Support

- CBCT volume viewing and analysis
- Digital impression (STL) visualization
- Virtual treatment outcomes
- Aligner simulation integration
- Smile design tools

### Progress Documentation

- Milestone-based photo capture
- Automatic progress collage generation
- Before/current/projected comparisons
- Treatment timeline visualization

---

## AI Features

| Feature | Sub-Area | Description |
|---------|----------|-------------|
| Image Quality Scoring | Capture | Assess focus, lighting, positioning |
| Auto-categorization | Organization | Automatically classify image types |
| Smart Image Selection | Reports | Select best images for collages |
| Landmark Detection | Viewing | AI-assisted cephalometric tracing |
| Before/After Matching | Reports | Match comparable images across timeline |
| Treatment Progress | Viewing | Visualize predicted treatment outcomes |
| Photo Guidance | Capture | Real-time positioning guidance during capture |

---

## Compliance Requirements

### HIPAA Compliance

- All images are PHI and require appropriate protections
- Access logging for all image views
- Encryption at rest and in transit
- Role-based access control enforcement
- Audit trail for all operations

### Image Consent

- Patient consent required for photography
- Separate consent for marketing/educational use
- Consent tracking and expiration
- Minor patient guardian consent

### Retention Policies

- Configurable retention periods by image type
- Soft delete with recovery window
- Archival to cold storage for long-term retention
- Destruction logging for compliance

### DICOM Compliance

- Standard DICOM import/export
- Proper handling of DICOM metadata
- Patient matching and verification
- Modality worklist integration

---

## Implementation Notes

### Phase 3 Dependencies

- **Phase 1 Complete**: Auth, Staff, Resources
- **Phase 2 Complete**: Booking, Practice Orchestration
- **Treatment Management**: For linking images to treatment plans

### Implementation Order

1. Image Capture & Upload (foundation for all imaging)
2. Image Viewing & Tools (enable image usage)
3. Image Organization (manage growing image library)
4. Reports & Collages (leverage organized images)

### Key Technical Decisions

- Use local filesystem storage (`public/uploads/images/`) for on-premises deployment
- Generate multiple image variants (thumbnail, preview, full)
- Implement progressive loading for large images
- Use Cornerstone.js for DICOM viewing
- Store originals separately from edited versions
- Serve images as static files via Next.js

### Performance Considerations

- Lazy loading for image galleries
- Virtual scrolling for large collections
- Background processing for batch uploads
- Image compression without quality loss
- Efficient caching strategies

---

## File Structure

```
docs/areas/imaging-management/
├── README.md                      # This file (area overview)
└── sub-areas/
    ├── image-capture-upload/
    │   ├── README.md
    │   └── functions/
    │       ├── intraoral-camera-integration.md
    │       ├── dslr-camera-import.md
    │       ├── xray-integration.md
    │       ├── 3d-scanner-integration.md
    │       ├── photo-protocol-management.md
    │       └── batch-upload-processing.md
    │
    ├── image-viewing-tools/
    │   ├── README.md
    │   └── functions/
    │       ├── advanced-image-viewer.md
    │       ├── measurement-tools.md
    │       ├── annotation-system.md
    │       ├── comparison-views.md
    │       ├── cephalometric-analysis.md
    │       └── 3d-model-viewer.md
    │
    ├── image-organization/
    │   ├── README.md
    │   └── functions/
    │       ├── patient-image-gallery.md
    │       ├── image-categorization.md
    │       ├── tagging-metadata.md
    │       ├── search-filtering.md
    │       ├── treatment-phase-linking.md
    │       └── retention-archival.md
    │
    └── reports-collages/
        ├── README.md
        └── functions/
            ├── collage-template-builder.md
            ├── progress-collage-generation.md
            ├── before-after-presentations.md
            ├── case-presentation-builder.md
            ├── referral-documentation.md
            └── treatment-simulation-exports.md
```

---

## Related Documentation

- [Treatment Management](../treatment-management/) - Treatment plan integration
- [Compliance & Documentation](../compliance-documentation/) - Consent and audit
- [Patient Communications](../patient-communications/) - Patient image access

---

## Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Planned | 📋 | Documented, not started |
| In Progress | 🔄 | Currently being implemented |
| Review | 👀 | Under review |
| Testing | 🧪 | In testing |
| Completed | ✅ | Fully implemented |
| Blocked | 🚫 | Blocked by dependency |

---

**Status**: ✅ Complete (~90%)
**Last Updated**: 2024-12-10
**Owner**: Development Team

---

## Implementation Summary

### What's Implemented

**Prisma Models:**
- `PatientImage` - Core image storage with metadata, categorization, retention, archival, legal hold
- `PhotoProtocol` - Standard photo series templates with slots
- `PhotoProtocolSlot` - Individual slots in protocols (name, category, instructions, guide image)
- `ImageTag` - Custom tags with colors and categories
- `ImageTagAssignment` - Junction table for image-tag relationships
- `ImageAnnotation` - Annotations with type, geometry, style, text
- `ImageMeasurement` - Linear, angle, area, perimeter measurements with calibration
- `CollageTemplate` - Layout templates with slots, styling, aspect ratio
- `ImageCollage` - Generated collages with slot assignments and customizations
- `ProgressReport` - Treatment progress reports with sections, summary, notes
- `CephAnalysis` - Cephalometric analysis with landmarks, measurements, presets
- `ImageRetentionPolicy` - Configurable retention rules by category
- `ImageArchiveRecord` - Audit trail for archival/restoration/deletion events

**Components (40+ components):**
- `ImageUploader.tsx` - Drag-drop upload with progress, supports images + 3D models (STL/OBJ/PLY)
- `ImageGallery.tsx` - Patient gallery with search/filter/pagination
- `ImageViewer.tsx` - Full viewer with adjustments (brightness, contrast, saturation, hue, blur)
- `ImageCard.tsx` - Card display with variants (default, compact, list)
- `ImageAdjustments.tsx` - Image filter controls with CSS filter generation
- `BeforeAfterSlider.tsx` - Interactive before/after comparison slider
- `ImageComparison.tsx` - Side-by-side or overlay comparison modes
- `annotations/AnnotationCanvas.tsx`, `AnnotationToolbar.tsx` - Drawing tools (text, rect, circle, line, polygon, freehand)
- `measurements/MeasurementCanvas.tsx`, `MeasurementToolbar.tsx` - LINEAR, ANGLE, AREA, PERIMETER measurements
- `cephalometric/CephAnalysis.tsx`, `CephCanvas.tsx`, `CephToolbar.tsx`, `CephMeasurementsPanel.tsx` - Full cephalometric analysis with 40+ landmarks, multiple presets (STEINER, DOWNS, TWEED, RICKETTS, QUICK)
- `model-viewer/Model3DViewer.tsx`, `Model3DCanvas.tsx`, `Model3DToolbar.tsx` - Three.js-based STL/PLY/OBJ viewer with view presets, material options, measurements
- `dicom-viewer/DicomViewer.tsx`, `DicomToolbar.tsx` - Cornerstone.js-based DICOM viewing with window/level, multi-modality support
- `collage/CollageEditor.tsx`, `CollagePreview.tsx`, `TemplateSelector.tsx` - Collage building with templates
- `progress-report/ReportBuilder.tsx`, `ReportSectionEditor.tsx`, `TemplateSelector.tsx` - Progress reports (INITIAL, PROGRESS, FINAL, COMPARISON)
- `presentations/PresentationBuilder.tsx`, `PresentationViewer.tsx`, `BeforeAfterPairSelector.tsx` - Before/after presentations with layouts
- `treatment-phase/TreatmentPhaseSelector.tsx`, `TreatmentPhaseBadge.tsx`, `TreatmentPhaseImageGallery.tsx` - Phase linking
- `ai-analysis/AIAnalysisPanel.tsx`, `AICephLandmarks.tsx`, `AIProgressComparison.tsx`, `QualityAnalysisPanel.tsx`, `CategorizationPanel.tsx`, `AIStatusIndicator.tsx` - AI features
- `retention/RetentionPolicyList.tsx`, `RetentionPolicyForm.tsx`, `RetentionDashboard.tsx`, `ArchiveManagement.tsx`, `LegalHoldManager.tsx` - Retention management

**Pages (12 pages):**
- `/imaging` - Dashboard with stats, quick actions, info cards
- `/imaging/protocols` - Photo protocol management (CRUD)
- `/imaging/compare` - Image comparison tool
- `/imaging/collages` - Collage builder
- `/imaging/reports` - Progress report builder
- `/imaging/presentations` - Before/after presentations
- `/imaging/cephalometric` - Cephalometric analysis list with filtering
- `/imaging/cephalometric/[id]` - Individual ceph analysis editor
- `/imaging/3d-viewer` - 3D model viewer (STL/OBJ/PLY)
- `/imaging/dicom` - DICOM medical image viewer
- `/imaging/retention` - Retention policy and archive management
- `/patients/[id]/images` - Patient image gallery
- `/patients/[id]/images/upload` - Patient-specific image upload

**API Endpoints (30+ endpoints):**
- `GET/POST /api/images` - Image upload (multipart/form-data) and listing with pagination/filtering
- `GET/PUT/DELETE /api/images/[id]` - Individual image operations with metadata updates
- `GET/POST /api/images/[id]/annotations` - Annotation CRUD
- `GET/PUT/DELETE /api/images/[id]/annotations/[annotationId]` - Individual annotation operations
- `GET/POST /api/images/[id]/measurements` - Measurement CRUD
- `GET/PUT/DELETE /api/images/[id]/measurements/[measurementId]` - Individual measurement operations
- `POST /api/images/phase-link` - Link/unlink images from treatment phases
- `GET/POST /api/imaging/protocols` - Protocol management
- `PUT/DELETE /api/imaging/protocols/[id]` - Protocol updates
- `GET/POST /api/imaging/ceph-analyses` - Ceph analysis CRUD with filtering
- `GET/PUT/DELETE /api/imaging/ceph-analyses/[id]` - Individual analysis operations
- `GET/POST /api/imaging/retention/policies` - Retention policy CRUD
- `GET/PUT/DELETE /api/imaging/retention/policies/[policyId]` - Policy operations
- `POST /api/imaging/retention/archive` - Trigger archival
- `POST /api/imaging/retention/restore` - Restore archived images
- `POST /api/imaging/retention/legal-hold` - Apply/remove legal holds
- `POST /api/imaging/retention/report` - Generate retention reports
- `GET /api/imaging/retention/storage` - Storage usage statistics

**Storage:**
- Local filesystem at `public/uploads/images/{clinicId}/{patientId}/{uuid}.ext`
- Images served via Next.js static file serving
- Thumbnail generation for images
- Support for images, 3D models (STL/OBJ/PLY), and DICOM files

**Hooks:**
- `useRetention` - Retention management hook

### What's Not Yet Implemented

- **Device Integration** (hardware-dependent, deferred):
  - Direct intraoral camera capture (USB SDK)
  - DSLR tethered/WiFi capture
  - DICOM network import (PACS integration)
  - 3D scanner cloud API (iTero, 3Shape)
- **Advanced AI features** - Auto-placement refinement for ceph landmarks
- **Batch operations** - Bulk image operations
- **Additional export formats** - More export options
