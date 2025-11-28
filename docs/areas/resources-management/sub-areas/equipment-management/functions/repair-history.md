# Repair History

> **Sub-Area**: [Equipment Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Repair History tracks all equipment repairs, service calls, and associated costs throughout equipment lifecycle. Clinical staff can report equipment issues, and the system tracks repair status from initial report through resolution. This function provides visibility into equipment reliability, helps identify patterns requiring replacement consideration, and manages warranty claims for covered repairs.

---

## Core Requirements

- [ ] Report equipment malfunctions with severity levels
- [ ] Track repair status through workflow (reported → diagnosed → scheduled → in progress → completed)
- [ ] Record diagnosis, work performed, and parts replaced
- [ ] Manage vendor/technician information and service tickets
- [ ] Track repair costs (labor, parts, travel)
- [ ] Handle warranty claims with claim numbers
- [ ] Track equipment downtime (duration equipment was unavailable)
- [ ] Attach repair documentation and invoices
- [ ] Analyze equipment reliability trends
- [ ] Identify equipment with frequent repairs for replacement consideration

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/equipment/:id/repairs` | `equipment:read` | Get repair history |
| POST | `/api/resources/equipment/:id/repairs` | `equipment:update` | Report equipment issue |
| PUT | `/api/resources/equipment/:id/repairs/:repairId` | `equipment:maintenance` | Update repair record |
| GET | `/api/resources/repairs/active` | `equipment:read` | Get all active repairs |
| GET | `/api/resources/repairs/analytics` | `equipment:read` | Repair analytics/trends |

---

## Data Model

```prisma
model RepairRecord {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  equipmentId     String   @db.ObjectId

  // Repair details
  reportedDate    DateTime @default(now())
  reportedBy      String   @db.ObjectId
  issueDescription String
  severity        RepairSeverity @default(MEDIUM)

  // Status tracking
  status          RepairStatus @default(REPORTED)
  scheduledDate   DateTime?
  completedDate   DateTime?

  // Resolution
  diagnosis       String?
  workPerformed   String?
  partsReplaced   String[]
  resolutionNotes String?

  // Vendor/Service
  vendorId        String?  @db.ObjectId
  technicianName  String?
  serviceTicketNumber String?

  // Costs
  laborCost       Decimal?
  partsCost       Decimal?
  travelCost      Decimal?
  totalCost       Decimal?

  // Warranty
  coveredByWarranty Boolean @default(false)
  warrantyClaimNumber String?

  // Downtime tracking
  equipmentDownStart DateTime?
  equipmentDownEnd   DateTime?

  // Documents
  attachments     String[]

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@index([clinicId])
  @@index([equipmentId])
  @@index([status])
  @@index([reportedDate])
}

enum RepairSeverity {
  LOW       // Minor issue, can wait
  MEDIUM    // Should be addressed soon
  HIGH      // Urgent, affects operations
  CRITICAL  // Equipment unusable
}

enum RepairStatus {
  REPORTED
  DIAGNOSED
  AWAITING_PARTS
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANNOT_REPAIR
  CANCELLED
}
```

---

## Business Rules

- Critical severity issues generate immediate alerts to clinic admin
- Equipment status should automatically update to IN_REPAIR when repair is active
- Downtime is calculated as time between equipmentDownStart and equipmentDownEnd
- Warranty coverage should be checked automatically based on warranty expiry date
- Repairs on disposed equipment are not allowed
- Completion of repair should prompt return-to-service verification for safety equipment

---

## Dependencies

**Depends On:**
- Equipment Catalog (requires equipment to be registered)
- Auth & Authorization (user authentication, permissions)
- Warranty Management (for warranty coverage verification)
- Supplier Management (optional - for vendor tracking)

**Required By:**
- Equipment Analytics (repair frequency analysis)
- Financial Management (repair cost tracking)
- Replacement Planning (identifies equipment needing replacement)

---

## Notes

- Consider mobile-friendly interface for clinical staff to quickly report issues
- Photo upload capability helpful for documenting issues
- Service ticket integration with major equipment vendors could streamline workflow
- Repair trend analysis should highlight equipment with >3 repairs in 12 months
- Downtime metrics useful for equipment utilization and replacement planning

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
