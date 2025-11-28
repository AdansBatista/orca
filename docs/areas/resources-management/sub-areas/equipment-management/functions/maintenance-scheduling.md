# Maintenance Scheduling

> **Sub-Area**: [Equipment Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Maintenance Scheduling enables proactive maintenance management for orthodontic equipment to maximize uptime and extend equipment life. The system tracks maintenance intervals by equipment type, generates automated reminders, documents completed maintenance activities, and manages vendor service appointments. This helps prevent costly repairs and ensures equipment operates safely and effectively.

---

## Core Requirements

- [ ] Set maintenance intervals per equipment or equipment type
- [ ] Generate automatic maintenance reminders (email/in-app)
- [ ] Track scheduled vs. completed maintenance dates
- [ ] Log maintenance activities with detailed documentation
- [ ] Manage vendor/technician service appointments
- [ ] Record maintenance costs (labor, parts)
- [ ] Support multiple maintenance types (preventive, calibration, inspection, cleaning, certification)
- [ ] Calculate next maintenance date based on intervals
- [ ] View maintenance calendar/schedule
- [ ] Track overdue maintenance with escalation alerts

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/equipment/:id/maintenance` | `equipment:read` | Get maintenance history |
| POST | `/api/resources/equipment/:id/maintenance` | `equipment:maintenance` | Log maintenance activity |
| PUT | `/api/resources/equipment/:id/maintenance/:maintenanceId` | `equipment:maintenance` | Update maintenance record |
| GET | `/api/resources/maintenance/schedule` | `equipment:read` | Get maintenance schedule |
| GET | `/api/resources/maintenance/overdue` | `equipment:read` | Get overdue maintenance |
| GET | `/api/resources/maintenance/upcoming` | `equipment:read` | Get upcoming maintenance |

---

## Data Model

```prisma
model MaintenanceRecord {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  equipmentId     String   @db.ObjectId

  // Maintenance details
  maintenanceType MaintenanceType
  scheduledDate   DateTime?
  completedDate   DateTime?
  status          MaintenanceStatus @default(SCHEDULED)

  // Work performed
  description     String?
  checklist       Json?    // Completed checklist items
  notes           String?

  // Vendor/Technician
  performedBy     String?  // Internal or vendor name
  vendorId        String?  @db.ObjectId
  technicianName  String?

  // Costs
  laborCost       Decimal?
  partsCost       Decimal?
  totalCost       Decimal?

  // Next maintenance
  nextMaintenanceDate DateTime?

  // Documents
  attachments     String[]

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@index([clinicId])
  @@index([equipmentId])
  @@index([status])
  @@index([scheduledDate])
}

enum MaintenanceType {
  PREVENTIVE     // Routine preventive maintenance
  CALIBRATION    // Equipment calibration
  INSPECTION     // Safety/compliance inspection
  CLEANING       // Deep cleaning
  CERTIFICATION  // Annual certification
  OTHER
}

enum MaintenanceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  OVERDUE
}
```

---

## Business Rules

- Maintenance intervals are set per equipment type with ability to override per equipment
- Overdue maintenance generates escalating alerts (7 days, 14 days, 30 days overdue)
- Safety-critical equipment (X-ray, autoclaves) requires documented maintenance compliance
- Completed maintenance automatically calculates next due date based on interval
- Equipment with overdue critical maintenance should trigger status change warning
- Maintenance costs are tracked for equipment lifecycle cost analysis

---

## Dependencies

**Depends On:**
- Equipment Catalog (requires equipment to be registered)
- Auth & Authorization (user authentication, permissions)
- Supplier Management (optional - for vendor tracking)

**Required By:**
- Equipment Status (maintenance affects equipment availability)
- Compliance Reporting (maintenance documentation for audits)
- Financial Management (maintenance cost tracking)

---

## Notes

- Consider integration with equipment vendor service portals
- Maintenance checklists should be configurable per equipment type
- Support recurring maintenance schedule templates
- Email reminders should be configurable (recipient, timing)
- Calendar view should integrate with staff scheduling for planning

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
