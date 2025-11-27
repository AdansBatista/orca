# Reports & Collages

> **Area**: [Imaging Management](../../)
>
> **Sub-Area**: 3.3.4 Reports & Collages
>
> **Purpose**: Create professional image collages, progress reports, case presentations, and referral documentation from patient imaging

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [Imaging Management](../../) |
| **Dependencies** | Auth, Image Capture, Image Organization, Treatment Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

Reports & Collages transforms raw patient imaging into professional documentation for clinical use, patient communication, and referral coordination. This sub-area provides tools to create standardized collages, before/after presentations, case studies, and referral letters with embedded imagery.

Orthodontic practices rely heavily on visual documentation to communicate treatment progress to patients, demonstrate outcomes to referring dentists, and build case presentations for marketing. This sub-area makes these tasks efficient through templates, automation, and AI-powered features.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.3.4.1 | [Collage Template Builder](./functions/collage-template-builder.md) | Design custom collage layouts | 📋 Planned | High |
| 3.3.4.2 | [Progress Collage Generation](./functions/progress-collage-generation.md) | Auto-generate treatment progress reports | 📋 Planned | Critical |
| 3.3.4.3 | [Before/After Presentations](./functions/before-after-presentations.md) | Create before/after comparisons | 📋 Planned | High |
| 3.3.4.4 | [Case Presentation Builder](./functions/case-presentation-builder.md) | Build comprehensive case presentations | 📋 Planned | High |
| 3.3.4.5 | [Referral Documentation](./functions/referral-documentation.md) | Create referral letters with images | 📋 Planned | Medium |
| 3.3.4.6 | [Treatment Simulation Exports](./functions/treatment-simulation-exports.md) | Export treatment simulations | 📋 Planned | Medium |

---

## Function Details

### 3.3.4.1 Collage Template Builder

**Purpose**: Create and manage reusable collage templates for consistent documentation.

**Key Capabilities**:
- Drag-and-drop layout designer
- Grid-based positioning system
- Configurable image slots with labels
- Clinic branding elements (logo, colors, contact)
- Text overlay areas for notes
- X-ray slot integration (Cornerstone.js snapshots)
- Save templates for reuse
- Template library management
- Share templates across clinics
- Mobile-responsive preview

**Template Elements**:
| Element | Description | Configuration |
|---------|-------------|---------------|
| **Image Slot** | Placeholder for patient photo | Label, size, category filter |
| **X-ray Slot** | Placeholder for X-ray snapshot | Label, modality filter |
| **Logo** | Clinic logo | Position, size |
| **Patient Info** | Name, date, case # | Fields to display |
| **Text Block** | Free-form text area | Font, color, alignment |
| **Date Stamp** | Current or capture date | Format |
| **Divider** | Visual separator | Style, color |

**Pre-Built Templates**:
| Template | Layout | Use Case |
|----------|--------|----------|
| **Progress Report 2x3** | 2 columns, 3 rows | Standard progress |
| **Full Records** | 4x3 grid | Comprehensive records |
| **Before/After** | 2 column comparison | Treatment outcome |
| **Referral Letter** | Header + 3 images | Referring dentist |
| **Ceph Comparison** | Side-by-side ceph | Analysis presentation |
| **3-Phase Progress** | 3 column timeline | Start/mid/end |

**User Stories**:
- As a **clinic admin**, I want to create branded collage templates for our practice
- As a **clinical staff**, I want to use pre-built templates for quick report creation
- As a **treatment coordinator**, I want to customize a template for a specific case type

---

### 3.3.4.2 Progress Collage Generation

**Purpose**: Automatically generate treatment progress collages from milestone images.

**Key Capabilities**:
- Automatic image selection from treatment timeline
- Template-based generation
- Milestone-to-image mapping
- Batch generation for multiple patients
- AI-powered "best image" selection
- Quality filtering (exclude low-quality images)
- Date range selection
- Treatment phase grouping
- One-click generation
- Scheduled auto-generation

**Progress Report Types**:
| Type | Images Included | Frequency |
|------|-----------------|-----------|
| **Monthly Progress** | Last 30 days' photos | Monthly |
| **Quarterly Review** | Start + quarterly milestones | Quarterly |
| **Treatment Summary** | All milestone images | On-demand |
| **Phase Completion** | Phase start/end | Per phase |
| **Final Results** | Start vs. end | At debond |

**AI Features**:
- **Best Shot Selection**: Choose sharpest, best-lit image from each category
- **Consistency Matching**: Match similar poses across timepoints
- **Quality Scoring**: Filter out blurry or poorly exposed images
- **Auto-Layout**: Suggest optimal layout for available images

**User Stories**:
- As a **clinical staff**, I want to generate a progress collage with one click
- As a **system**, I want to automatically create monthly progress reports
- As a **doctor**, I want AI to pick the best images for the collage

---

### 3.3.4.3 Before/After Presentations

**Purpose**: Create compelling before/after treatment comparisons for patients and marketing.

**Key Capabilities**:
- Side-by-side comparison layout
- Slider comparison (interactive)
- Overlay transition view
- Date and treatment duration display
- Watermarking for marketing use
- Patient consent verification
- Portfolio gallery creation
- Share to patient portal
- Export for social media (with consent)
- Privacy-compliant anonymization

**Presentation Formats**:
| Format | Description | Use Case |
|--------|-------------|----------|
| **Side-by-Side** | Static comparison | Print, documentation |
| **Slider** | Interactive swipe | Patient portal, presentations |
| **GIF Animation** | Animated transition | Social media |
| **Video** | Smooth morph transition | Marketing |
| **Print Sheet** | Multi-view comparison | Patient handout |

**Consent Integration**:
- Check patient marketing consent status
- Request consent if not obtained
- Track consent expiration
- Anonymization options for marketing

**User Stories**:
- As a **treatment coordinator**, I want to show the patient their before/after on the portal
- As a **marketing**, I want to create before/after content for social media (with consent)
- As a **doctor**, I want to add before/after to the patient's case presentation

---

### 3.3.4.4 Case Presentation Builder

**Purpose**: Build comprehensive case presentations combining images, analysis, and treatment information.

**Key Capabilities**:
- Multi-page presentation builder
- Image integration from gallery
- Cephalometric analysis embedding
- Treatment plan summary
- Timeline visualization
- Outcome prediction visuals
- Custom slide creation
- Presenter notes
- PDF export
- PowerPoint export
- Interactive web presentation

**Presentation Sections**:
| Section | Content | Purpose |
|---------|---------|---------|
| **Chief Complaint** | Patient concerns | Introduction |
| **Clinical Exam** | Photos, findings | Diagnosis |
| **Radiographic** | X-rays, analysis | Diagnosis |
| **Diagnosis** | Summary, classification | Assessment |
| **Treatment Plan** | Options, recommendations | Planning |
| **Progress** | Timeline, photos | Monitoring |
| **Outcome** | Before/after, results | Conclusion |

**AI Features**:
- **Auto-Summary**: Generate case summary from clinical notes
- **Image Curation**: Select representative images for each section
- **Layout Suggestions**: Recommend presentation structure
- **Caption Generation**: Auto-caption images with clinical context

**User Stories**:
- As a **doctor**, I want to build a case presentation for a conference
- As a **treatment coordinator**, I want to present the treatment plan to the patient
- As a **resident**, I want to document a case study for my portfolio

---

### 3.3.4.5 Referral Documentation

**Purpose**: Create professional referral letters and documentation with embedded images for referring dentists.

**Key Capabilities**:
- Referral letter templates
- Embedded image collages
- Treatment summary inclusion
- Referring doctor database integration
- Fax/email delivery
- Portal sharing for referring dentists
- Acknowledgment tracking
- Progress update reports
- Final outcome letters
- PDF generation

**Referral Document Types**:
| Type | Content | Trigger |
|------|---------|---------|
| **Initial Acknowledgment** | Receipt of referral, initial findings | New patient |
| **Consultation Summary** | Findings, recommendations | Post-consult |
| **Treatment Plan** | Proposed treatment, images | Pre-treatment |
| **Progress Update** | Current status, images | Periodic |
| **Final Report** | Outcomes, before/after | Treatment complete |

**Integration with Referral Tracking**:
- Link to referring provider record
- Auto-populate provider information
- Track sent communications
- Reminder for pending reports

**User Stories**:
- As a **doctor**, I want to send a consultation summary with images to the referring dentist
- As a **clinical staff**, I want to fax a progress report to the general dentist
- As a **system**, I want to track that referral letters were acknowledged

---

### 3.3.4.6 Treatment Simulation Exports

**Purpose**: Export treatment simulation visuals for patient presentations and documentation.

**Key Capabilities**:
- ClinCheck/simulation screenshot export
- Before/predicted side-by-side
- Video export of simulation
- Integration with aligner systems
- Smile design visualization
- Virtual treatment outcomes
- Save as part of patient record
- Include in case presentations
- Print-ready formats

**Simulation Types**:
| Type | Source | Use Case |
|------|--------|----------|
| **Aligner Simulation** | iTero, 3Shape | Invisalign presentations |
| **Smile Design** | DSD, proprietary | Aesthetic planning |
| **Virtual Brackets** | Custom | Fixed appliance preview |
| **Superimposition** | Ceph overlay | Growth prediction |

**Export Formats**:
- High-resolution images (PNG, JPEG)
- Animated GIF
- Video (MP4)
- PDF presentation

**User Stories**:
- As a **treatment coordinator**, I want to export the ClinCheck simulation for the patient
- As a **doctor**, I want to include the simulation in the case presentation
- As a **patient**, I want to see what my smile will look like after treatment

---

## Data Model

```prisma
model CollageTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  description   String?
  category      TemplateCategory @default(PROGRESS)
  isDefault     Boolean  @default(false)
  isPublic      Boolean  @default(false)  // Shared across clinics

  // Layout configuration
  layout        Json             // Grid layout specification
  elements      Json             // Array of template elements
  dimensions    Json             // Width, height, orientation

  // Branding
  includeLogo   Boolean  @default(true)
  includePatientInfo Boolean @default(true)
  headerText    String?
  footerText    String?
  primaryColor  String?

  // Thumbnail
  previewUrl    String?

  // Usage tracking
  usageCount    Int      @default(0)
  lastUsedAt    DateTime?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  collages      Collage[]

  @@index([clinicId])
  @@index([category])
  @@index([isDefault])
}

enum TemplateCategory {
  PROGRESS
  BEFORE_AFTER
  RECORDS
  REFERRAL
  CASE_PRESENTATION
  CUSTOM
}

model Collage {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  templateId    String?  @db.ObjectId

  // Collage info
  name          String
  type          CollageType @default(PROGRESS)
  status        CollageStatus @default(DRAFT)

  // Content
  elements      Json             // Resolved elements with image IDs
  renderedUrl   String?          // Generated collage image URL
  pdfUrl        String?          // PDF version URL

  // Dimensions
  width         Int
  height        Int
  orientation   Orientation @default(PORTRAIT)

  // Date range (if progress collage)
  dateFrom      DateTime?
  dateTo        DateTime?

  // Linked treatment
  treatmentId   String?  @db.ObjectId

  // Sharing
  isShared      Boolean  @default(false)
  shareToken    String?  @unique
  sharedWithPatient Boolean @default(false)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  generatedAt   DateTime?

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  template      CollageTemplate? @relation(fields: [templateId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentId])
  @@index([status])
}

enum CollageType {
  PROGRESS
  BEFORE_AFTER
  RECORDS
  REFERRAL
  CUSTOM
}

enum CollageStatus {
  DRAFT
  GENERATED
  EXPORTED
  SHARED
}

enum Orientation {
  PORTRAIT
  LANDSCAPE
}

model CasePresentation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Presentation info
  title         String
  description   String?
  status        PresentationStatus @default(DRAFT)

  // Content
  slides        Json             // Array of slide definitions
  notes         String?          // Presenter notes

  // Linked treatment
  treatmentId   String?  @db.ObjectId

  // Export
  pdfUrl        String?
  pptxUrl       String?
  webUrl        String?          // Interactive web version

  // Sharing
  isPublic      Boolean  @default(false)
  shareToken    String?  @unique

  // For case studies/portfolio
  isAnonymized  Boolean  @default(false)
  isPortfolio   Boolean  @default(false)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  presentedAt   DateTime?

  // Audit
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
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

model ReferralDocument {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  referringProviderId String @db.ObjectId

  // Document info
  documentType  ReferralDocType
  title         String
  status        DocumentStatus @default(DRAFT)

  // Content
  content       String           // Rich text content
  collageId     String?  @db.ObjectId  // Attached collage
  attachments   Json?            // Additional attachment references

  // Generation
  pdfUrl        String?

  // Delivery
  deliveryMethod DeliveryMethod?
  sentAt        DateTime?
  deliveredAt   DateTime?
  acknowledgedAt DateTime?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId
  sentBy        String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([referringProviderId])
  @@index([status])
}

enum ReferralDocType {
  ACKNOWLEDGMENT
  CONSULTATION
  TREATMENT_PLAN
  PROGRESS_UPDATE
  FINAL_REPORT
}

enum DocumentStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  SENT
  ACKNOWLEDGED
}

model BeforeAfterGallery {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Gallery info
  name          String
  description   String?
  isPublic      Boolean  @default(false)

  // Display
  sortOrder     Int      @default(0)
  coverImageId  String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
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

  // Entry info
  title         String?
  description   String?
  treatmentType String?          // e.g., "Invisalign", "Braces"
  treatmentDuration String?      // e.g., "18 months"

  // Images
  beforeImageId String   @db.ObjectId
  afterImageId  String   @db.ObjectId

  // Consent
  marketingConsentId String? @db.ObjectId
  isAnonymized  Boolean  @default(false)

  // Display
  sortOrder     Int      @default(0)
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  gallery       BeforeAfterGallery @relation(fields: [galleryId], references: [id])

  @@index([clinicId])
  @@index([galleryId])
  @@index([patientId])
}
```

---

## API Endpoints

### Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/templates` | List collage templates | `imaging:view` |
| GET | `/api/imaging/templates/:id` | Get template details | `imaging:view` |
| POST | `/api/imaging/templates` | Create template | `imaging:admin` |
| PUT | `/api/imaging/templates/:id` | Update template | `imaging:admin` |
| DELETE | `/api/imaging/templates/:id` | Delete template | `imaging:admin` |
| POST | `/api/imaging/templates/:id/duplicate` | Duplicate template | `imaging:admin` |

### Collages

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/collages/:patientId` | List patient collages | `imaging:view` |
| GET | `/api/imaging/collages/:id` | Get collage | `imaging:view` |
| POST | `/api/imaging/collages` | Create collage | `imaging:export` |
| PUT | `/api/imaging/collages/:id` | Update collage | `imaging:export` |
| POST | `/api/imaging/collages/:id/generate` | Generate/render collage | `imaging:export` |
| POST | `/api/imaging/collages/:id/share` | Generate share link | `imaging:export` |
| GET | `/api/imaging/collages/:id/pdf` | Download PDF | `imaging:export` |

### Auto-Generation

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/imaging/collages/auto-generate` | AI-powered auto-generation | `imaging:export` |
| POST | `/api/imaging/collages/batch-generate` | Batch generate for patients | `imaging:admin` |

### Case Presentations

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/presentations/:patientId` | List presentations | `imaging:view` |
| GET | `/api/imaging/presentations/:id` | Get presentation | `imaging:view` |
| POST | `/api/imaging/presentations` | Create presentation | `imaging:export` |
| PUT | `/api/imaging/presentations/:id` | Update presentation | `imaging:export` |
| POST | `/api/imaging/presentations/:id/export/pdf` | Export PDF | `imaging:export` |
| POST | `/api/imaging/presentations/:id/export/pptx` | Export PowerPoint | `imaging:export` |
| POST | `/api/imaging/presentations/:id/share` | Generate share link | `imaging:export` |

### Referral Documents

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/referral-docs/:patientId` | List referral docs | `imaging:view` |
| POST | `/api/imaging/referral-docs` | Create referral doc | `imaging:export` |
| PUT | `/api/imaging/referral-docs/:id` | Update referral doc | `imaging:export` |
| POST | `/api/imaging/referral-docs/:id/send` | Send to provider | `imaging:export` |
| GET | `/api/imaging/referral-docs/:id/pdf` | Download PDF | `imaging:export` |

### Before/After Galleries

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/before-after` | List galleries | `imaging:view` |
| GET | `/api/imaging/before-after/:id` | Get gallery | `imaging:view` |
| POST | `/api/imaging/before-after` | Create gallery | `imaging:admin` |
| POST | `/api/imaging/before-after/:id/entries` | Add entry | `imaging:export` |
| DELETE | `/api/imaging/before-after/:galleryId/entries/:id` | Remove entry | `imaging:admin` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `TemplateDesigner` | Drag-drop template editor | `components/imaging/` |
| `TemplateLibrary` | Browse/select templates | `components/imaging/` |
| `CollageEditor` | Create/edit collages | `components/imaging/` |
| `CollagePreview` | Preview collage output | `components/imaging/` |
| `ImageSlotPicker` | Select images for slots | `components/imaging/` |
| `AutoGenerateDialog` | AI auto-generation UI | `components/imaging/` |
| `BeforeAfterSlider` | Interactive comparison | `components/imaging/` |
| `BeforeAfterGrid` | Side-by-side view | `components/imaging/` |
| `PresentationBuilder` | Case presentation editor | `components/imaging/` |
| `SlideEditor` | Edit presentation slides | `components/imaging/` |
| `ReferralDocEditor` | Referral document composer | `components/imaging/` |
| `GalleryManager` | Before/after gallery admin | `components/imaging/` |
| `ShareDialog` | Share collage/presentation | `components/imaging/` |
| `ExportOptions` | Export format selection | `components/imaging/` |

---

## Business Rules

1. **Template Ownership**: Clinic-created templates private; system templates public
2. **Image Consent**: Before/after galleries require marketing consent
3. **Referral Tracking**: Referral documents link to CRM referral tracking
4. **Auto-Generation**: AI selects best images based on quality score and relevance
5. **Export Limits**: Large batch exports may be queued for background processing
6. **Share Expiration**: Shared links expire after configurable period (default: 30 days)
7. **Anonymization**: Portfolio/case study images must be anonymized
8. **PDF Quality**: Generated PDFs use high-resolution images for print quality

---

## AI Features Summary

| Feature | Function | Description |
|---------|----------|-------------|
| **Smart Image Selection** | Progress Collage | Auto-pick best images per category |
| **Quality Scoring** | All | Filter low-quality images |
| **Layout Suggestions** | Template Builder | Recommend optimal layouts |
| **Auto-Captioning** | Collages | Generate image captions |
| **Consistency Matching** | Before/After | Match comparable poses |
| **Summary Generation** | Case Presentation | Draft case summaries |
| **Treatment Summary** | Referral | Generate treatment descriptions |

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Image Capture & Upload | Required | Source images |
| Image Organization | Required | Image categorization and linking |
| Treatment Management | Optional | Treatment plan context |
| CRM & Onboarding | Optional | Referral provider data |
| Compliance & Documentation | Optional | Consent verification |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| PDF Generation | Required | Puppeteer for PDF export |
| Image Processing | Required | Sharp.js for composition |
| Cloud Storage | Required | Store generated assets |
| Email Service | Optional | Referral document delivery |
| Fax Service | Optional | Fax referral documents |

---

## Related Documentation

- [Parent: Imaging Management](../../)
- [Image Capture & Upload](../image-capture-upload/)
- [Image Viewing & Tools](../image-viewing-tools/)
- [Image Organization](../image-organization/)
- [CRM & Onboarding](../../crm-onboarding/) - Referral tracking
- [Compliance & Documentation](../../compliance-documentation/) - Consent management

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
