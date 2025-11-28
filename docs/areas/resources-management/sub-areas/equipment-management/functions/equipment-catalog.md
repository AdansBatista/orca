# Equipment Catalog

> **Sub-Area**: [Equipment Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Equipment Catalog provides a comprehensive registry for all orthodontic practice equipment including diagnostic devices (intraoral scanners, CBCT machines), treatment equipment (curing lights, bracket tools), digital manufacturing equipment (3D printers), and operatory equipment (dental chairs, delivery units). The system tracks equipment from acquisition through disposal with full specifications, documentation, and location tracking.

---

## Core Requirements

- [ ] Register new equipment with unique equipment numbers
- [ ] Store complete equipment specifications (model, serial, manufacturer)
- [ ] Categorize equipment by type (diagnostic, treatment, digital, chair, sterilization, safety)
- [ ] Track equipment location and room assignments
- [ ] Support barcode/QR code identification for quick lookup
- [ ] Attach documentation (manuals, photos, specifications)
- [ ] Manage equipment status lifecycle (active, in repair, out of service, retired, disposed)
- [ ] Track equipment condition (excellent, good, fair, poor)
- [ ] Support multi-location equipment tracking

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/equipment` | `equipment:read` | List equipment with filtering |
| GET | `/api/resources/equipment/:id` | `equipment:read` | Get equipment details |
| POST | `/api/resources/equipment` | `equipment:create` | Register new equipment |
| PUT | `/api/resources/equipment/:id` | `equipment:update` | Update equipment details |
| DELETE | `/api/resources/equipment/:id` | `equipment:delete` | Soft delete equipment |
| GET | `/api/resources/equipment/types` | `equipment:read` | List equipment types |
| POST | `/api/resources/equipment/types` | `equipment:create` | Add custom equipment type |
| GET | `/api/resources/equipment/:id/history` | `equipment:read` | Get equipment history |

---

## Data Model

```prisma
model Equipment {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  // Identification
  name            String
  equipmentNumber String   @unique
  serialNumber    String?
  modelNumber     String?
  barcode         String?

  // Classification
  typeId          String   @db.ObjectId
  category        EquipmentCategory
  manufacturer    String?

  // Location
  roomId          String?  @db.ObjectId
  locationNotes   String?

  // Status
  status          EquipmentStatus @default(ACTIVE)
  condition       EquipmentCondition @default(GOOD)

  // Documents
  manualUrl       String?
  photos          String[]
  specifications  Json?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([equipmentNumber])
  @@index([status])
}

enum EquipmentCategory {
  DIAGNOSTIC      // Scanners, X-ray, CBCT
  TREATMENT       // Curing lights, bracket tools
  DIGITAL         // 3D printers, milling machines
  CHAIR           // Dental chairs, delivery units
  STERILIZATION   // Autoclaves, cleaners
  SAFETY          // AEDs, fire extinguishers
  OTHER
}

enum EquipmentStatus {
  ACTIVE
  IN_REPAIR
  OUT_OF_SERVICE
  RETIRED
  DISPOSED
}
```

---

## Business Rules

- Equipment numbers must be unique across the entire organization (all clinics)
- High-value equipment (over threshold) must have serial numbers recorded
- Equipment status changes must be logged in audit history
- Disposed equipment must have disposal method and reason documented
- Equipment can only be assigned to one room at a time
- Equipment types can be system-wide or clinic-specific

---

## Dependencies

**Depends On:**
- Auth & Authorization (user authentication, permissions)
- Room/Chair Management (optional - for room assignments)

**Required By:**
- Maintenance Scheduling (schedules maintenance for equipment)
- Repair History (tracks repairs by equipment)
- Depreciation Tracking (calculates depreciation)
- Warranty Management (tracks warranties)
- Room/Chair Management (equipment assignments to rooms)
- Sterilization & Compliance (autoclaves are equipment)

---

## Notes

- Consider QR code generation for equipment labels at registration time
- Equipment transfers between locations create new history entries
- Photos should be stored in document storage service with URLs referenced
- System equipment types (predefined) cannot be deleted, only deactivated

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
