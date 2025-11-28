# Radiation Safety Compliance

> **Sub-Area**: [Clinical Protocols](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Radiation Safety Compliance manages all aspects of X-ray equipment safety and radiation exposure monitoring. This includes daily equipment safety checks, staff dosimeter badge tracking with periodic reading imports, patient exposure logging, annual inspection documentation, lead apron/thyroid collar inventory, and compliance with state radiation safety regulations.

---

## Core Requirements

- [ ] Log daily X-ray equipment safety verifications
- [ ] Track staff radiation dosimeter badge assignments
- [ ] Import and record dosimeter reading reports (monthly/quarterly)
- [ ] Alert on elevated radiation exposure readings
- [ ] Document annual X-ray equipment inspections
- [ ] Maintain lead apron and thyroid collar inventory with inspection status
- [ ] Track staff radiation safety training certifications
- [ ] Generate radiation safety compliance reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/radiation/logs` | `protocol:read` | List radiation safety logs |
| POST | `/api/compliance/radiation/logs` | `protocol:execute` | Create safety log entry |
| POST | `/api/compliance/radiation/dosimeter` | `protocol:execute` | Log dosimeter reading |
| GET | `/api/compliance/radiation/dosimeter/staff/:userId` | `audit:view_full` | Get staff exposure history |
| GET | `/api/compliance/radiation/equipment/:id/history` | `protocol:read` | Get equipment safety history |
| POST | `/api/compliance/radiation/inspection` | `protocol:execute` | Log annual inspection |
| GET | `/api/compliance/radiation/lead-aprons` | `protocol:read` | List lead apron inventory |
| POST | `/api/compliance/radiation/lead-aprons/:id/inspect` | `protocol:execute` | Log apron inspection |

---

## Data Model

```prisma
model RadiationSafetyLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Equipment
  equipmentId   String   @db.ObjectId
  equipmentName String
  equipmentType RadiationEquipmentType

  // Log type
  logType       RadiationLogType
  logDate       DateTime

  // Safety check details
  checkItems    Json     // Array of checked items
  allPassed     Boolean
  failedItems   String?

  // Dosimeter readings (for DOSIMETER_READING type)
  badgeNumber   String?
  userId        String?  @db.ObjectId
  readingValue  Decimal? // mSv or mrem
  readingPeriod String?  // "2024-Q1", "2024-01"

  // Inspection documentation
  documentUrl   String?  // Inspection report, badge report
  inspectorName String?
  certificationExpires DateTime?

  // Notes and issues
  notes         String?
  followUpRequired Boolean @default(false)
  followUpNotes String?

  // Operator
  loggedBy      String   @db.ObjectId
  loggedByName  String

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([equipmentId])
  @@index([logDate])
  @@index([logType])
  @@index([userId])
}

model LeadApronInventory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Apron info
  apronId       String   // Physical tag/ID
  type          String   // "Full apron", "Thyroid collar", etc.
  size          String?
  location      String?

  // Status
  status        ApronStatus @default(ACTIVE)
  condition     String?

  // Inspection tracking
  lastInspectionDate DateTime?
  nextInspectionDate DateTime?
  lastInspectedBy String? @db.ObjectId

  // Lifecycle
  purchaseDate  DateTime?
  warrantyExpires DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([status])
}

enum RadiationEquipmentType {
  PANORAMIC
  CEPHALOMETRIC
  INTRAORAL
  CBCT
  SCANNER
}

enum RadiationLogType {
  DAILY_SAFETY_CHECK
  MONTHLY_INSPECTION
  ANNUAL_INSPECTION
  DOSIMETER_READING
  CALIBRATION
  MAINTENANCE
}

enum ApronStatus {
  ACTIVE
  NEEDS_REPAIR
  RETIRED
}
```

---

## Business Rules

- Daily X-ray safety check required before first patient exposure
- Staff dosimeters must be worn when operating X-ray equipment
- Elevated dosimeter readings trigger ALARA review (As Low As Reasonably Achievable)
- Annual X-ray equipment inspection required by state regulations
- Lead aprons require annual visual inspection minimum
- Technique charts must be posted at each X-ray unit
- Staff radiation safety training required before X-ray operation
- Patient exposure documented in patient record (linked to imaging)

---

## Dependencies

**Depends On:**
- Resources Management (X-ray equipment inventory)
- Staff Management (staff badge assignments)
- Staff Training (radiation safety certification tracking)
- Imaging Management (patient exposure logging)

**Required By:**
- Compliance Reporting (radiation safety reports)
- Audit Management (state board compliance documentation)
- Equipment Safety Monitoring (specialized radiation equipment)

---

## Notes

- State radiation safety requirements vary; configurable per clinic location
- Common dosimeter services: Landauer, MIRION, Radiation Detection Company
- ALARA investigation typically triggered at readings above background
- Consider integration with dosimeter service for automated reading imports
- Technique charts specify exposure settings by patient size and image type

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
