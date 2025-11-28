# Clinical Measurements

> **Sub-Area**: [Clinical Documentation](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Clinical Measurements tracks orthodontic-specific measurements throughout treatment including overjet, overbite, crowding, spacing, and molar relationships. Measurements are recorded at multiple timepoints (initial, progress, final) enabling trend analysis and objective treatment progress assessment. Support for different measurement methods (clinical, model analysis, digital scan, cephalometric) is included.

---

## Core Requirements

- [ ] Record standard orthodontic measurements
- [ ] Track measurements over time with dates
- [ ] Support multiple measurement methods
- [ ] Link measurements to progress notes (optional)
- [ ] Visualize measurement trends
- [ ] Compare initial, progress, and final values
- [ ] Generate measurement reports
- [ ] Calculate treatment progress from measurements

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/patients/:patientId/measurements` | `documentation:read` | Get patient measurements |
| POST | `/api/patients/:patientId/measurements` | `documentation:create` | Add measurement |
| PUT | `/api/measurements/:measurementId` | `documentation:update` | Update measurement |
| DELETE | `/api/measurements/:measurementId` | `documentation:update` | Remove measurement |
| GET | `/api/patients/:patientId/measurements/trends` | `documentation:read` | Measurement trends |
| GET | `/api/patients/:patientId/measurements/compare` | `documentation:read` | Compare timepoints |

---

## Data Model

```prisma
model ClinicalMeasurement {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId         String   @db.ObjectId
  patientId        String   @db.ObjectId
  progressNoteId   String?  @db.ObjectId

  // Measurement Details
  measurementDate  DateTime @default(now())
  measurementType  OrthoMeasurementType
  value            Decimal
  unit             String   @default("mm")

  // Recording
  recordedBy       String   @db.ObjectId
  method           MeasurementMethod?

  // Notes
  notes            String?

  // Timestamps
  createdAt        DateTime @default(now())

  @@index([clinicId])
  @@index([patientId])
  @@index([measurementType])
  @@index([measurementDate])
}

enum OrthoMeasurementType {
  OVERJET
  OVERBITE
  OVERBITE_PERCENT
  CROWDING_UPPER
  CROWDING_LOWER
  SPACING_UPPER
  SPACING_LOWER
  MIDLINE_UPPER
  MIDLINE_LOWER
  MOLAR_RELATIONSHIP_RIGHT
  MOLAR_RELATIONSHIP_LEFT
  CANINE_RELATIONSHIP_RIGHT
  CANINE_RELATIONSHIP_LEFT
  INTERCANINE_WIDTH_UPPER
  INTERCANINE_WIDTH_LOWER
  INTERMOLAR_WIDTH_UPPER
  INTERMOLAR_WIDTH_LOWER
}

enum MeasurementMethod {
  CLINICAL
  MODEL_ANALYSIS
  DIGITAL_SCAN
  CEPHALOMETRIC
}
```

---

## Business Rules

- Initial measurements required before treatment start
- Normal overjet: 2-4mm; overbite: 2-4mm (20-30%)
- Molar/canine relationships recorded as Class I, II, or III
- Measurements inform treatment progress assessment
- Trend visualization supports patient communication
- Final measurements required for outcome documentation

---

## Dependencies

**Depends On:**
- Patient Management (patient records)
- Progress Notes (optional linkage)

**Required By:**
- Treatment Tracking (progress monitoring)
- Outcome Assessment (before/after comparison)

---

## Notes

- Consider digital caliper integration for accurate clinical measurements
- iTero/3Shape scan integration for digital measurements
- Cephalometric measurements from imaging integration

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
