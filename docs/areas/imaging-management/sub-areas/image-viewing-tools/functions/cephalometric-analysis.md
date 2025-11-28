# Cephalometric Analysis

> **Sub-Area**: [Image Viewing & Tools](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Cephalometric Analysis enables tracing and analysis on lateral cephalometric X-rays for orthodontic diagnosis. The system supports landmark identification with AI assistance, linear and angular measurements, multiple analysis types (Steiner, Ricketts, McNamara), growth prediction overlays, and superimposition for treatment progress comparison.

---

## Core Requirements

- [ ] Implement landmark identification for 30+ standard cephalometric points
- [ ] Provide AI-assisted landmark detection with confidence scores
- [ ] Calculate linear measurements (SNA, SNB, ANB, etc.)
- [ ] Calculate angular measurements (FMA, IMPA, etc.)
- [ ] Support multiple analysis types (Steiner, Ricketts, McNamara, Downs, Wits)
- [ ] Include soft tissue analysis measurements
- [ ] Generate growth prediction overlays
- [ ] Enable superimposition for progress comparison
- [ ] Export analysis reports with measurements and interpretation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/ceph/:patientId` | `imaging:cephalometric` | List patient ceph analyses |
| GET | `/api/imaging/ceph/:id` | `imaging:cephalometric` | Get analysis details |
| POST | `/api/imaging/ceph` | `imaging:cephalometric` | Create new analysis |
| PUT | `/api/imaging/ceph/:id` | `imaging:cephalometric` | Update landmarks |
| POST | `/api/imaging/ceph/:id/calculate` | `imaging:cephalometric` | Calculate measurements |
| POST | `/api/imaging/ceph/:id/ai-detect` | `imaging:cephalometric` | AI landmark detection |
| GET | `/api/imaging/ceph/:id/report` | `imaging:cephalometric` | Generate analysis report |
| POST | `/api/imaging/ceph/superimpose` | `imaging:cephalometric` | Superimpose analyses |

---

## Data Model

```prisma
model CephAnalysis {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  imageId       String   @db.ObjectId
  analysisType  String           // STEINER, RICKETTS, MCNAMARA, etc.
  name          String?
  status        CephStatus @default(IN_PROGRESS)

  // Landmarks stored as JSON: { "S": {x, y}, "N": {x, y}, ... }
  landmarks     Json

  // Calculated measurements: { "SNA": 82, "SNB": 78, "ANB": 4, ... }
  measurements  Json?

  // AI detection metadata
  aiDetected    Boolean @default(false)
  aiConfidence  Json?            // Per-landmark confidence scores

  // Interpretation
  interpretation Json?           // AI or manual interpretation notes

  // Calibration
  calibrationId String?  @db.ObjectId
  pixelSpacing  Float?           // mm per pixel

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  completedAt   DateTime?
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

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

model CephNormValues {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  analysisType  String           // STEINER, RICKETTS, etc.
  measurement   String           // SNA, SNB, ANB, etc.
  normMean      Float
  normStdDev    Float
  ageGroup      String?          // Adult, Child, Adolescent
  gender        String?          // Male, Female, Any
  ethnicity     String?          // Caucasian, Asian, etc.
}
```

---

## Business Rules

- Cephalometric analysis requires `imaging:cephalometric` permission (doctor only)
- AI detection provides suggestions; doctor must verify landmarks
- Analysis cannot be marked complete until all required landmarks placed
- Measurements auto-recalculate when landmarks change
- Superimposition requires at least 2 analyses of same patient
- Norm values compared against patient demographics when available

---

## Dependencies

**Depends On:**
- Auth & Authorization (cephalometric permission)
- X-ray Integration (provides ceph X-rays)
- Measurement & Calibration Tools (calibration infrastructure)

**Required By:**
- Treatment Planning (diagnostic input)
- Case Presentation Builder (ceph analysis slides)
- Progress Tracking (superimposition comparisons)

---

## Notes

- Standard landmarks: S, N, A, B, Pog, Me, Go, ANS, PNS, Or, Po, etc.
- AI landmark detection could use pre-trained ML model or cloud API
- Consider WebAssembly for compute-intensive analysis calculations
- Export should include both visual tracing and measurement tables

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
