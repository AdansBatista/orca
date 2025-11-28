# Measurement & Calibration Tools

> **Sub-Area**: [Image Viewing & Tools](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Measurement & Calibration Tools enable precise measurements on images with proper calibration for clinical accuracy. The system supports linear distance, angle, area, and ratio measurements with multiple calibration methods including manual calibration, DICOM metadata extraction, and reference marker detection.

---

## Core Requirements

- [ ] Implement linear distance measurement (mm, inches)
- [ ] Support angle measurement (2-line and 3-point methods)
- [ ] Enable area measurement (polygon and freeform)
- [ ] Calculate perimeter measurements
- [ ] Provide ratio calculations between measurements
- [ ] Support manual calibration using known reference distance
- [ ] Extract automatic scale from DICOM pixel spacing metadata
- [ ] Detect standard calibration ball/ruler markers
- [ ] Persist measurements with image for future reference

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/images/:id/measurements` | `imaging:view` | List image measurements |
| POST | `/api/imaging/images/:id/measurements` | `imaging:annotate` | Create measurement |
| PUT | `/api/imaging/measurements/:id` | `imaging:annotate` | Update measurement |
| DELETE | `/api/imaging/measurements/:id` | `imaging:annotate` | Delete measurement |
| POST | `/api/imaging/images/:id/calibrate` | `imaging:annotate` | Set image calibration |
| GET | `/api/imaging/images/:id/calibration` | `imaging:view` | Get calibration data |

---

## Data Model

```prisma
model Measurement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId
  type          MeasurementType  // DISTANCE, ANGLE, AREA, PERIMETER, RATIO
  name          String?          // Custom label
  points        Json             // Array of {x, y} coordinates
  value         Float            // Measured value
  unit          String           // mm, degrees, mm², ratio
  calibrationId String?  @db.ObjectId
  pixelSpacing  Float?           // mm per pixel used
  color         String   @default("#FF0000")
  isVisible     Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

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

model ImageCalibration {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId
  method        CalibrationMethod
  pixelSpacing  Float            // mm per pixel
  referenceLength Float?         // Known length in mm (manual)
  referencePoints Json?          // Calibration points
  confidence    Float?           // For auto-detection
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
  @@index([imageId])
}

enum CalibrationMethod {
  MANUAL
  DICOM
  MARKER_DETECTION
  INHERITED
}
```

---

## Business Rules

- Measurements require calibration for accuracy; uncalibrated shows warning
- DICOM images auto-calibrate from pixel spacing metadata
- Manual calibration requires at least 2 points on known distance
- Measurements recalculate if calibration changes
- Ratio measurements require two existing distance measurements
- Measurements visible only to users with view permission

---

## Dependencies

**Depends On:**
- Auth & Authorization (annotate permissions)
- Advanced Image Viewer (measurement overlay display)

**Required By:**
- Cephalometric Analysis (uses measurement infrastructure)
- Clinical documentation workflows

---

## Notes

- Use sub-pixel accuracy for precise measurements
- Display measurement uncertainty based on calibration confidence
- Common orthodontic measurements: overjet, overbite, tooth width
- Consider export to treatment records for documentation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
