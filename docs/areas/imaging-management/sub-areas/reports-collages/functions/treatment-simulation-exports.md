# Treatment Simulation Exports

> **Sub-Area**: [Reports & Collages](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Treatment Simulation Exports enables exporting treatment simulation visuals for patient presentations and documentation. The system supports ClinCheck and aligner simulation screenshots, before/predicted comparisons, video exports, integration with treatment simulators, and saving simulations as part of the permanent patient record.

---

## Core Requirements

- [ ] Export screenshots from ClinCheck/aligner simulations
- [ ] Create before/predicted side-by-side comparisons
- [ ] Generate video exports of treatment simulations
- [ ] Integrate with major aligner systems (iTero, 3Shape)
- [ ] Support smile design visualization exports
- [ ] Create virtual treatment outcome images
- [ ] Save simulation exports to patient record
- [ ] Include in case presentations
- [ ] Generate print-ready formats
- [ ] Track simulation versions and modifications

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/simulations/:patientId` | `imaging:view` | List patient simulations |
| POST | `/api/imaging/simulations/import` | `imaging:capture` | Import simulation from system |
| GET | `/api/imaging/simulations/:id` | `imaging:view` | Get simulation details |
| POST | `/api/imaging/simulations/:id/export` | `imaging:export` | Export simulation assets |
| POST | `/api/imaging/simulations/:id/snapshot` | `imaging:export` | Create snapshot image |
| POST | `/api/imaging/simulations/:id/video` | `imaging:export` | Generate video export |
| GET | `/api/imaging/simulations/:id/frames` | `imaging:view` | Get simulation frames |
| POST | `/api/imaging/simulations/:id/comparison` | `imaging:export` | Create before/predicted comparison |

---

## Data Model

```prisma
model TreatmentSimulation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  treatmentId   String?  @db.ObjectId
  name          String
  simulationType SimulationType
  sourceSystem  String?          // iTero, 3Shape, ClinCheck
  sourceId      String?          // External system ID

  // Simulation data
  frames        Json?            // Array of frame URLs/data
  frameCount    Int?
  metadata      Json?            // System-specific metadata

  // Status
  status        SimulationStatus @default(ACTIVE)
  version       Int     @default(1)
  isApproved    Boolean @default(false)
  approvedAt    DateTime?
  approvedBy    String?  @db.ObjectId

  // Links
  scanId        String?  @db.ObjectId  // Source 3D scan

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  exports       SimulationExport[]
  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentId])
}

enum SimulationType {
  ALIGNER         // Invisalign, ClearCorrect
  SMILE_DESIGN    // DSD, proprietary
  BRACKET_PREVIEW // Virtual bracket placement
  SUPERIMPOSITION // Ceph overlay/prediction
  CUSTOM
}

enum SimulationStatus {
  ACTIVE
  SUPERSEDED     // New version exists
  ARCHIVED
}

model SimulationExport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  simulationId  String   @db.ObjectId
  exportType    ExportType
  name          String?

  // Generated assets
  imageUrl      String?          // Static image
  videoUrl      String?          // Video export
  gifUrl        String?          // Animated GIF
  pdfUrl        String?          // PDF document

  // Settings
  settings      Json?            // Export-specific settings
  frameRange    Json?            // { start, end } frame indices

  // Comparison
  beforeImageId String?  @db.ObjectId
  comparisonUrl String?          // Before/predicted comparison

  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  simulation    TreatmentSimulation @relation(fields: [simulationId], references: [id])
  @@index([clinicId])
  @@index([simulationId])
}

enum ExportType {
  SNAPSHOT        // Single frame image
  VIDEO           // Full simulation video
  GIF             // Animated GIF
  COMPARISON      // Before/after comparison
  PDF             // Document with frames
}
```

---

## Business Rules

- Simulations linked to treatment plan for context
- Multiple versions tracked; only one active at a time
- Approved simulations shown to patient; unapproved are draft
- Video exports generated as background job
- iTero/3Shape sync requires configured integration
- Exports saved to patient imaging gallery
- Print formats optimized for 300 DPI

---

## Dependencies

**Depends On:**
- Auth & Authorization (export permissions)
- 3D Scanner Integration (source scan data)
- Treatment Management (treatment plan context)
- Cloud Storage (asset storage)

**Required By:**
- Case Presentation Builder (simulation slides)
- Patient Communication (treatment visualization)
- Treatment consultations

---

## Notes

- iTero Outcome Simulator API for ClinCheck data
- Consider iframe embedding for interactive web simulations
- Video encoding via FFmpeg for efficient processing
- Smile design may use 2D photo manipulation or 3D rendering

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
