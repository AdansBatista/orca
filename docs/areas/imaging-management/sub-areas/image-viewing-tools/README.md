# Image Viewing & Tools

> **Area**: [Imaging Management](../../)
>
> **Sub-Area**: 3.3.2 Image Viewing & Tools
>
> **Purpose**: Provide professional high-resolution image viewing with clinical analysis tools including measurements, annotations, and specialized orthodontic analysis

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete (~95%) |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Imaging Management](../../) |
| **Dependencies** | Auth, Image Capture & Upload |
| **Last Updated** | 2024-12-10 |

---

## Implementation Status

### ✅ What's Implemented

**Advanced Image Viewer:**
- `ImageViewer` - Full viewer with react-zoom-pan-pinch for smooth zoom/pan
- `ImageAdjustments` - Brightness, contrast, saturation, invert, grayscale controls via CSS filters
- Rotation and flip transformations
- Full-screen viewing mode

**Before/After Comparison:**
- `BeforeAfterSlider` - Interactive drag slider for comparing two images
- `ImageComparison` - Multiple modes: side-by-side, grid (2x2), slider, overlay
- Synchronized zoom/pan across compared images

**Annotation System:**
- `AnnotationCanvas` - Fabric.js-based canvas for drawing
- `AnnotationToolbar` - Tool selection UI
- Tools: Freehand, Line, Arrow, Circle, Rectangle, Text
- Color picker, stroke width, undo/redo
- API endpoints for annotation CRUD

**Measurement Tools:**
- `MeasurementCanvas` - Canvas-based measurement system
- `MeasurementToolbar` - Tool selection UI
- Types: Linear distance, Angle (3-point), Area (polygon)
- Calibration support (pixels-per-mm)
- API endpoints for measurement CRUD

**Cephalometric Analysis:**
- `CephAnalysis` - Main ceph analysis component
- `CephCanvas` - Landmark placement canvas
- `CephToolbar` - Analysis tools
- `CephMeasurementsPanel` - Calculated measurements display
- 30+ standard landmarks (Sella, Nasion, A-point, B-point, etc.)
- Analysis presets: Steiner, Ricketts, McNamara, Downs, Wits
- Automatic measurement calculation (SNA, SNB, ANB, FMA, IMPA, etc.)
- Normative data comparison with interpretation

**3D Model Viewer:**
- `Model3DViewer` - Three.js-based 3D viewer
- `Model3DToolbar` - View controls
- Format support: STL, OBJ, PLY
- View presets, material settings, measurement tools
- Rotate, zoom, pan controls

**DICOM Viewer:**
- `DicomViewer` - DICOM image viewer
- `DicomToolbar` - Windowing and tool controls
- Window/level presets for different modalities
- DICOM metadata display
- Pan, zoom, invert tools

**Pages:**
- `/imaging/viewer/[id]` - Full image viewer page
- `/imaging/compare` - Comparison page
- `/imaging/cephalometric` - Ceph analysis page
- `/imaging/3d-viewer/[id]` - 3D model viewer page
- `/imaging/dicom/[id]` - DICOM viewer page

### ✅ Fully Complete - All viewing tools implemented

---

## Overview

Image Viewing & Tools provides the clinical interface for examining patient imaging. It offers a high-performance viewer optimized for large medical images with GPU-accelerated rendering, precise measurement tools, annotation capabilities, and specialized views for orthodontic analysis.

This sub-area replaces the need for separate imaging software by providing an integrated viewer that handles photos, X-rays, and 3D scans within the practice management system. It supports non-destructive editing, saving view states for quick reference, and powerful comparison modes for treatment progress documentation.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.3.2.1 | [Advanced Image Viewer](./functions/advanced-image-viewer.md) | High-resolution viewer with pan/zoom | 📋 Planned | Critical |
| 3.3.2.2 | [Measurement & Calibration Tools](./functions/measurement-tools.md) | Distance, angle, and area measurements | 📋 Planned | Critical |
| 3.3.2.3 | [Annotation System](./functions/annotation-system.md) | Drawings, text, and markup | 📋 Planned | High |
| 3.3.2.4 | [Comparison Views](./functions/comparison-views.md) | Side-by-side and overlay comparison | 📋 Planned | High |
| 3.3.2.5 | [Cephalometric Analysis](./functions/cephalometric-analysis.md) | Landmark tracing and measurements | 📋 Planned | High |
| 3.3.2.6 | [3D Model Viewer](./functions/3d-model-viewer.md) | STL, CBCT, and 3D visualization | 📋 Planned | Medium |

---

## Function Details

### 3.3.2.1 Advanced Image Viewer

**Purpose**: Provide a high-performance image viewer capable of handling large medical images with smooth interaction.

**Key Capabilities**:
- GPU-accelerated rendering for large images (50+ megapixels)
- Smooth zoom from 10% to 800% with preserved quality
- Pan with mouse drag, touch gestures, or keyboard
- Multiple zoom modes (fit to screen, actual size, fill)
- Full-screen viewing mode
- Minimap navigator for large images
- Image adjustment (brightness, contrast, saturation, sharpness)
- Rotation and flip transformations
- Color inversion (essential for X-rays)
- Progressive loading for instant display
- Keyboard shortcuts for power users

**View State Management**:
- Save zoom level, pan position, and adjustments per image
- Create named view presets (e.g., "Full Arch", "Upper Right Quadrant")
- Restore previous view instantly
- Share view states with other users

**Image Adjustments**:
| Adjustment | Range | Use Case |
|------------|-------|----------|
| Brightness | -100 to +100 | Enhance visibility |
| Contrast | -100 to +100 | Improve definition |
| Saturation | -100 to +100 | Color adjustment |
| Sharpness | 0 to +100 | Edge enhancement |
| Gamma | 0.5 to 2.0 | Tone curve adjustment |

**User Stories**:
- As a **doctor**, I want to zoom in on specific areas of an X-ray so that I can examine details
- As a **clinical staff**, I want to adjust brightness on a dark photo so that I can see the teeth clearly
- As a **doctor**, I want to save my preferred view of an image so that I can return to it quickly

---

### 3.3.2.2 Measurement & Calibration Tools

**Purpose**: Enable precise measurements on images with proper calibration for clinical accuracy.

**Key Capabilities**:
- Linear distance measurement (mm, inches)
- Angle measurement (2-line and 3-point)
- Area measurement (polygon and freeform)
- Perimeter measurement
- Ratio calculations
- Calibration using known reference (ruler, ball marker)
- Automatic scale detection from DICOM metadata
- Measurement history and export

**Calibration Methods**:
1. **Manual calibration**: Place points on known distance
2. **DICOM metadata**: Extract pixel spacing from X-ray
3. **Reference marker**: Use standard calibration ball
4. **Previous calibration**: Apply saved calibration

**Measurement Types**:
| Type | Description | Use Case |
|------|-------------|----------|
| **Distance** | Point-to-point | Overjet, overbite, tooth width |
| **Angle** | 3-point angle | SNA, SNB, ANB angles |
| **Area** | Enclosed region | Airway area analysis |
| **Ratio** | Two distances | Bolton ratio |

**User Stories**:
- As a **doctor**, I want to measure overjet on a photo so that I can track treatment progress
- As a **doctor**, I want to measure angles on a cephalometric X-ray for diagnosis
- As a **clinical staff**, I want to calibrate the measurement tool so that measurements are accurate

---

### 3.3.2.3 Annotation System

**Purpose**: Add visual annotations and notes to images for documentation and communication.

**Key Capabilities**:
- Drawing tools (freehand, line, arrow, circle, rectangle)
- Text annotations with formatting options
- Color-coded annotations by purpose
- Annotation layers (show/hide different sets)
- Annotation templates for common markups
- Collaborative annotations (multiple users)
- Export annotations separately from image
- Non-destructive (original image preserved)
- Undo/redo for all annotation actions

**Annotation Tools**:
| Tool | Description | Keyboard Shortcut |
|------|-------------|-------------------|
| Freehand | Draw freeform lines | `F` |
| Line | Straight line | `L` |
| Arrow | Directional pointer | `A` |
| Circle | Circular highlight | `C` |
| Rectangle | Rectangular highlight | `R` |
| Text | Text label | `T` |
| Highlight | Semi-transparent highlight | `H` |

**Annotation Categories**:
- Clinical findings (red)
- Treatment notes (blue)
- Patient communication (green)
- Internal notes (yellow)
- Questions/follow-up (orange)

**User Stories**:
- As a **doctor**, I want to draw an arrow pointing to a problem area so that I can explain it to the patient
- As a **doctor**, I want to add text notes to an X-ray so that I can document my findings
- As a **clinical staff**, I want to hide clinical annotations when showing images to the patient

---

### 3.3.2.4 Comparison Views

**Purpose**: Compare multiple images to visualize treatment progress or evaluate different views.

**Key Capabilities**:
- Side-by-side comparison (2 images)
- Grid comparison (up to 4 images)
- Before/after slider (swipe to compare)
- Overlay comparison with opacity control
- Synchronized pan and zoom across images
- Difference highlighting (automated)
- Progress timeline view
- Date-range filtering for comparisons

**Comparison Modes**:
| Mode | Description | Best For |
|------|-------------|----------|
| **Side-by-Side** | Two images next to each other | General comparison |
| **Grid** | 2x2 grid of images | Multi-phase comparison |
| **Slider** | Swipe between images | Before/after presentations |
| **Overlay** | Stack with opacity control | Superimposition |
| **Sync** | Linked pan/zoom | Detailed comparison |

**Smart Matching**:
- AI-assisted matching of comparable images
- Match by photo type (e.g., frontal smile to frontal smile)
- Match by treatment milestone
- Suggest best comparison pairs

**User Stories**:
- As a **doctor**, I want to show before/after images to the patient so that they can see their progress
- As a **treatment coordinator**, I want to create a progress slider for the patient to share
- As a **doctor**, I want synchronized zoom when comparing X-rays so that I can see the same region

---

### 3.3.2.5 Cephalometric Analysis

**Purpose**: Perform cephalometric tracing and analysis on lateral cephalometric X-rays.

**Key Capabilities**:
- Landmark identification (30+ standard points)
- AI-assisted landmark detection
- Linear measurements (SNA, SNB, ANB, etc.)
- Angular measurements (FMA, IMPA, etc.)
- Soft tissue analysis
- Growth prediction overlays
- Treatment simulation
- Superimposition for progress comparison
- Analysis export and reporting

**Standard Landmarks**:
| Landmark | Description |
|----------|-------------|
| Sella (S) | Center of sella turcica |
| Nasion (N) | Most anterior point of frontonasal suture |
| A point (A) | Deepest point on anterior maxilla |
| B point (B) | Deepest point on anterior mandible |
| Pogonion (Pog) | Most anterior point of chin |
| Menton (Me) | Most inferior point of mandible |
| Gonion (Go) | Angle of mandible |
| ANS | Anterior nasal spine |
| PNS | Posterior nasal spine |
| *And 20+ more...* | |

**Analysis Types**:
| Analysis | Description |
|----------|-------------|
| Steiner | Classical analysis |
| Ricketts | Comprehensive analysis |
| McNamara | Skeletal/airway |
| Downs | Facial pattern |
| Wits | Jaw relationship |
| Soft Tissue | Aesthetic analysis |

**User Stories**:
- As a **doctor**, I want to trace cephalometric landmarks so that I can diagnose skeletal relationships
- As a **doctor**, I want AI to suggest landmark positions so that I can work faster
- As a **treatment coordinator**, I want to generate a ceph report for the patient record

---

### 3.3.2.6 3D Model Viewer

**Purpose**: Visualize 3D scans, CBCT volumes, and digital models.

**Key Capabilities**:
- STL file rendering (dental models)
- CBCT volume visualization
- Multi-planar reconstruction (MPR)
- 3D surface rendering
- Measurement tools in 3D space
- Cross-sectional views
- Implant/bracket simulation
- Teeth segmentation
- Occlusion analysis
- Export snapshots for reports

**Viewing Modes**:
| Mode | Description | Use Case |
|------|-------------|----------|
| Surface | 3D surface rendering | Model inspection |
| Volume | Full CBCT volume | Root/bone analysis |
| Slice | Individual slice planes | Detailed anatomy |
| MPR | Orthogonal slices | Navigation |
| Panoramic Curve | Curved plane | Jaw overview |

**User Stories**:
- As a **doctor**, I want to view the patient's 3D scan so that I can plan treatment
- As a **doctor**, I want to take cross-sectional slices of CBCT so that I can assess bone
- As a **treatment coordinator**, I want to show the patient their digital model on screen

---

## Data Model

```prisma
model Annotation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId

  // Annotation info
  type          AnnotationType  // FREEHAND, LINE, ARROW, CIRCLE, RECTANGLE, TEXT
  category      AnnotationCategory @default(CLINICAL)
  layerId       String?         // For grouping annotations

  // Geometry (stored as JSON for flexibility)
  geometry      Json            // Points, dimensions, path data

  // Styling
  color         String          // Hex color
  strokeWidth   Float           @default(2)
  opacity       Float           @default(1)
  fontSize      Int?            // For text annotations

  // Content
  text          String?         // Text content or label

  // Visibility
  isVisible     Boolean  @default(true)
  isLocked      Boolean  @default(false)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Audit
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  image         Image    @relation(fields: [imageId], references: [id])

  @@index([clinicId])
  @@index([imageId])
  @@index([category])
}

enum AnnotationType {
  FREEHAND
  LINE
  ARROW
  CIRCLE
  RECTANGLE
  POLYGON
  TEXT
  HIGHLIGHT
  MEASUREMENT
}

enum AnnotationCategory {
  CLINICAL
  TREATMENT
  COMMUNICATION
  INTERNAL
  FOLLOWUP
}

model ImageViewState {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId

  // View state info
  name          String?         // Named preset (optional)
  isDefault     Boolean  @default(false)

  // Viewport
  zoom          Float           // Zoom level (1.0 = 100%)
  panX          Float           // Pan offset X
  panY          Float           // Pan offset Y
  rotation      Float           @default(0)  // Rotation degrees

  // Adjustments
  brightness    Float    @default(0)
  contrast      Float    @default(0)
  saturation    Float    @default(0)
  sharpness     Float    @default(0)
  gamma         Float    @default(1)
  inverted      Boolean  @default(false)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  image         Image    @relation(fields: [imageId], references: [id])

  @@index([clinicId])
  @@index([imageId])
}

model Measurement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId

  // Measurement info
  type          MeasurementType  // DISTANCE, ANGLE, AREA, RATIO
  name          String?          // Custom label

  // Geometry
  points        Json             // Array of {x, y} coordinates

  // Value
  value         Float            // Measured value
  unit          String           // mm, degrees, mm², ratio

  // Calibration reference
  calibrationId String?  @db.ObjectId
  pixelSpacing  Float?          // mm per pixel

  // Display
  color         String   @default("#FF0000")
  isVisible     Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  image         Image    @relation(fields: [imageId], references: [id])

  @@index([clinicId])
  @@index([imageId])
}

enum MeasurementType {
  DISTANCE
  ANGLE
  AREA
  PERIMETER
  RATIO
}

model CephAnalysis {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  imageId       String   @db.ObjectId

  // Analysis info
  analysisType  String           // STEINER, RICKETTS, MCNAMARA, etc.
  name          String?          // Custom name
  status        CephStatus @default(IN_PROGRESS)

  // Landmarks (JSON object with landmark positions)
  landmarks     Json             // { "S": {x, y}, "N": {x, y}, ... }

  // Calculated measurements
  measurements  Json             // { "SNA": 82, "SNB": 78, ... }

  // Interpretation
  interpretation Json?           // AI or manual interpretation

  // Calibration
  calibrationId String?  @db.ObjectId
  pixelSpacing  Float?          // mm per pixel

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  completedAt   DateTime?

  // Audit
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  image         Image    @relation(fields: [imageId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([imageId])
}

enum CephStatus {
  IN_PROGRESS
  COMPLETED
  REVIEWED
}

model ImageComparison {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Comparison info
  name          String?
  type          ComparisonType  // SIDE_BY_SIDE, SLIDER, OVERLAY, GRID

  // Images
  imageIds      String[] @db.ObjectId  // Array of image IDs

  // Settings
  settings      Json?           // Mode-specific settings

  // Sharing
  isShared      Boolean  @default(false)
  shareToken    String?  @unique

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
}

enum ComparisonType {
  SIDE_BY_SIDE
  SLIDER
  OVERLAY
  GRID
  TIMELINE
}
```

---

## API Endpoints

### Image Viewer

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/images/:id` | Get image with metadata | `imaging:view` |
| GET | `/api/imaging/images/:id/url` | Get signed image URL | `imaging:view` |
| GET | `/api/imaging/images/:id/thumbnail` | Get thumbnail URL | `imaging:view` |

### View States

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/images/:id/view-states` | List view states | `imaging:view` |
| POST | `/api/imaging/images/:id/view-states` | Save view state | `imaging:annotate` |
| DELETE | `/api/imaging/view-states/:id` | Delete view state | `imaging:annotate` |

### Annotations

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/images/:id/annotations` | List annotations | `imaging:view` |
| POST | `/api/imaging/images/:id/annotations` | Create annotation | `imaging:annotate` |
| PUT | `/api/imaging/annotations/:id` | Update annotation | `imaging:annotate` |
| DELETE | `/api/imaging/annotations/:id` | Delete annotation | `imaging:annotate` |

### Measurements

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/images/:id/measurements` | List measurements | `imaging:view` |
| POST | `/api/imaging/images/:id/measurements` | Create measurement | `imaging:annotate` |
| POST | `/api/imaging/images/:id/calibrate` | Set calibration | `imaging:annotate` |

### Cephalometric Analysis

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/ceph/:patientId` | List ceph analyses | `imaging:cephalometric` |
| POST | `/api/imaging/ceph` | Create ceph analysis | `imaging:cephalometric` |
| PUT | `/api/imaging/ceph/:id` | Update landmarks | `imaging:cephalometric` |
| POST | `/api/imaging/ceph/:id/calculate` | Calculate measurements | `imaging:cephalometric` |
| POST | `/api/imaging/ceph/:id/ai-detect` | AI landmark detection | `imaging:cephalometric` |

### Comparisons

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/comparisons/:patientId` | List comparisons | `imaging:view` |
| POST | `/api/imaging/comparisons` | Create comparison | `imaging:view` |
| PUT | `/api/imaging/comparisons/:id` | Update comparison | `imaging:view` |
| POST | `/api/imaging/comparisons/:id/share` | Generate share link | `imaging:export` |

### 3D Viewer

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/imaging/3d/:id` | Get 3D model data | `imaging:3d_view` |
| GET | `/api/imaging/3d/:id/slices` | Get CBCT slices | `imaging:3d_view` |
| POST | `/api/imaging/3d/:id/snapshot` | Create 2D snapshot | `imaging:3d_view` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ImageViewer` | Main image viewing component | `components/imaging/` |
| `ViewerToolbar` | Zoom, pan, adjustment controls | `components/imaging/` |
| `MeasurementTools` | Distance, angle, area tools | `components/imaging/` |
| `AnnotationPanel` | Annotation creation and management | `components/imaging/` |
| `AnnotationLayer` | Render annotations on image | `components/imaging/` |
| `ComparisonViewer` | Side-by-side and slider views | `components/imaging/` |
| `CephTracing` | Cephalometric landmark editor | `components/imaging/` |
| `CephAnalysisPanel` | Ceph measurements display | `components/imaging/` |
| `Model3DViewer` | 3D STL/CBCT viewer | `components/imaging/` |
| `ViewStateSelector` | Load/save view states | `components/imaging/` |
| `CalibrationDialog` | Set image calibration | `components/imaging/` |
| `ImageAdjustments` | Brightness, contrast sliders | `components/imaging/` |

---

## Business Rules

1. **Non-Destructive Editing**: Original images never modified; edits saved separately
2. **Annotation Ownership**: Annotations can only be edited by creator or admin
3. **Calibration Requirement**: Measurements require calibration for accuracy
4. **Ceph Permission**: Cephalometric analysis requires special permission
5. **View State Limits**: Maximum named view states per image (e.g., 10)
6. **3D Resource Limits**: CBCT viewing may be limited by browser/device capability
7. **Comparison Limits**: Maximum 4 images in grid comparison

---

## Technical Requirements

### Performance

- **Large Image Support**: Handle 50+ megapixel images smoothly
- **GPU Acceleration**: Use WebGL/Canvas for rendering
- **Progressive Loading**: Display low-res immediately, enhance progressively
- **Lazy Loading**: Load image data only when viewing
- **Caching**: Cache recently viewed images
- **Memory Management**: Release memory for off-screen images

### Browser Support

- Chrome 90+ (recommended)
- Firefox 90+
- Safari 14+
- Edge 90+
- WebGL 2.0 required for 3D viewing

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Image Capture & Upload | Required | Image storage and retrieval |
| Image Organization | Optional | Navigation between images |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Cornerstone.js | Required | DICOM viewing library |
| Three.js | Required | 3D rendering for models |
| Fabric.js | Required | Canvas annotation library |
| Sharp.js | Backend | Image processing |

---

## Related Documentation

- [Parent: Imaging Management](../../)
- [Image Capture & Upload](../image-capture-upload/)
- [Image Organization](../image-organization/)
- [Reports & Collages](../reports-collages/)

---

**Status**: ✅ Complete (~95%)
**Last Updated**: 2024-12-10
**Owner**: Development Team
