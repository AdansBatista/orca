# Equipment Safety Monitoring

> **Sub-Area**: [Clinical Protocols](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Equipment Safety Monitoring tracks safety checks, maintenance schedules, and compliance verification for all clinical equipment. It manages daily, weekly, and periodic equipment verifications, documents service records and calibrations, alerts on upcoming maintenance needs, and provides equipment lifecycle tracking for autoclaves, handpieces, curing lights, compressors, and other clinical equipment.

---

## Core Requirements

- [ ] Maintain equipment inventory with safety check requirements
- [ ] Schedule and track safety checks (daily, weekly, monthly, annual)
- [ ] Log safety verification results with pass/fail status
- [ ] Document equipment maintenance and service records
- [ ] Track calibration schedules and certifications
- [ ] Alert on upcoming and overdue maintenance
- [ ] Record equipment failures and resolution
- [ ] Manage warranty and service contract information

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/equipment/safety-checks` | `protocol:read` | List safety checks |
| POST | `/api/compliance/equipment/safety-checks` | `protocol:execute` | Log safety check |
| GET | `/api/compliance/equipment/safety-checks/:equipmentId` | `protocol:read` | Get equipment check history |
| GET | `/api/compliance/equipment/maintenance-due` | `protocol:read` | List equipment needing maintenance |
| POST | `/api/compliance/equipment/maintenance` | `protocol:execute` | Log maintenance record |
| POST | `/api/compliance/equipment/failure` | `protocol:execute` | Report equipment failure |
| GET | `/api/compliance/equipment/compliance-status` | `protocol:read` | Get overall compliance status |

---

## Data Model

```prisma
model EquipmentSafetyCheck {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  equipmentId   String   @db.ObjectId

  // Check info
  checkDate     DateTime
  checkType     EquipmentCheckType
  templateId    String?  // Reference to check template

  // Results
  checkItems    Json     // Array of checked items with results
  allPassed     Boolean
  failedItems   String?
  issues        String?

  // Follow-up
  actionsRequired String?
  actionsCompletedAt DateTime?
  actionsCompletedBy String? @db.ObjectId

  // Operator
  checkedBy     String   @db.ObjectId
  checkedByName String

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([equipmentId])
  @@index([checkDate])
  @@index([checkType])
}

model EquipmentMaintenance {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  equipmentId   String   @db.ObjectId

  // Maintenance info
  maintenanceType MaintenanceType
  maintenanceDate DateTime
  description   String

  // Service details
  servicedBy    String   // Internal staff name or external vendor
  isExternal    Boolean  @default(false)
  vendorName    String?
  invoiceNumber String?
  cost          Decimal?

  // Documentation
  documentUrl   String?
  notes         String?

  // Next maintenance
  nextMaintenanceDate DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([equipmentId])
  @@index([maintenanceDate])
}

enum EquipmentCheckType {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  ANNUAL
  PRE_USE
}

enum MaintenanceType {
  PREVENTIVE
  REPAIR
  CALIBRATION
  CERTIFICATION
  REPLACEMENT_PART
  INSPECTION
}
```

---

## Business Rules

- Equipment categories and check frequencies:
  - Autoclaves: Daily startup, weekly maintenance, annual certification
  - Handpieces: Per-use inspection, weekly lubrication
  - Curing lights: Daily output verification
  - Compressors: Daily check, quarterly maintenance
  - AED: Monthly check, annual battery/pad replacement
- Failed safety checks prevent equipment use until resolved
- Overdue maintenance generates escalating alerts
- External service records must include vendor and invoice documentation
- Calibration certificates must be retained for equipment lifecycle

---

## Dependencies

**Depends On:**
- Resources Management (equipment inventory and details)
- Daily Operational Checklists (integrates equipment checks)
- Staff Management (operator identification)

**Required By:**
- Emergency Preparedness (emergency equipment checks)
- Radiation Safety Compliance (X-ray equipment specific)
- Audit Management (equipment compliance for audits)

---

## Notes

- Equipment check templates should match manufacturer recommendations
- Consider integration with equipment manufacturers for maintenance schedules
- QR codes on equipment for quick access to check history and procedures
- Dashboard should highlight: equipment needing attention today, upcoming maintenance

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
