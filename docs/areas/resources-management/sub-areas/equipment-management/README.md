# Equipment Management

> **Area**: [Resources Management](../../)
>
> **Sub-Area**: 3.1 Equipment Management
>
> **Purpose**: Track orthodontic equipment throughout its lifecycle including maintenance, repairs, and depreciation

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Implemented |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [Resources Management](../../) |
| **Dependencies** | Auth, Supplier Management |
| **Last Updated** | 2024-12-01 |

---

## Overview

Equipment Management provides comprehensive tracking and lifecycle management for all orthodontic practice equipment. This includes high-value diagnostic equipment (intraoral scanners, CBCT machines), treatment equipment (curing lights, bracket tools), digital manufacturing equipment (3D printers, milling machines), and operatory equipment (dental chairs, delivery units).

The system tracks equipment from acquisition through disposal, including maintenance schedules, repair history, warranty information, and depreciation for financial reporting. Multi-location practices can manage equipment transfers and track utilization across locations.

### Key Capabilities

- Comprehensive equipment catalog with categorization
- Automated maintenance scheduling and reminders
- Repair history and vendor service tracking
- Depreciation calculation for financial reporting
- Warranty expiration monitoring
- Multi-location equipment tracking and transfers
- QR code/barcode identification support
- Equipment utilization analytics

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.1.1 | [Equipment Catalog](./functions/equipment-catalog.md) | Register and categorize equipment | ✅ Implemented | Critical |
| 3.1.2 | [Maintenance Scheduling](./functions/maintenance-scheduling.md) | Schedule and track preventive maintenance | ✅ Implemented | High |
| 3.1.3 | [Repair History](./functions/repair-history.md) | Log equipment repairs and service | ✅ Implemented | High |
| 3.1.4 | [Depreciation Tracking](./functions/depreciation-tracking.md) | Calculate and report asset depreciation | 📋 Planned | Medium |
| 3.1.5 | [Warranty Management](./functions/warranty-management.md) | Track warranties and service contracts | 📋 Planned | Medium |
| 3.1.6 | [Equipment Transfer](./functions/equipment-transfer.md) | Handle multi-location equipment moves | 📋 Planned | Low |

---

## Function Details

### 3.1.1 Equipment Catalog

**Purpose**: Maintain a comprehensive catalog of all practice equipment with detailed specifications and categorization.

**Key Capabilities**:
- Register new equipment with full specifications
- Categorize by type (diagnostic, treatment, digital, etc.)
- Store serial numbers, model information, and barcodes
- Attach documentation (manuals, specifications, photos)
- Track equipment location and room assignment
- Manage equipment status (active, in repair, retired)

**Orthodontic Equipment Types**:
| Category | Examples |
|----------|----------|
| Diagnostic | Intraoral scanners (iTero, 3Shape), CBCT machines, Cephalometric X-ray, Panoramic X-ray |
| Treatment | Curing lights, Bracket placement tools, Wire benders, Band seaters, Separators |
| Digital | 3D printers, Milling machines, Digital impression systems |
| Chair | Dental chairs, Delivery units, Suction systems, Compressors |
| Sterilization | Autoclaves, Ultrasonic cleaners, Dry heat sterilizers |

**User Stories**:
- As a **clinic admin**, I want to register new equipment so that it can be tracked in the system
- As a **clinical staff**, I want to scan equipment barcodes to quickly identify items
- As a **clinic admin**, I want to see all equipment assigned to a specific room

---

### 3.1.2 Maintenance Scheduling

**Purpose**: Schedule preventive maintenance to maximize equipment uptime and longevity.

**Key Capabilities**:
- Set maintenance intervals per equipment type
- Generate automatic maintenance reminders
- Track completed maintenance activities
- Manage vendor service appointments
- Document maintenance procedures performed
- Track maintenance costs over time

**Maintenance Types**:
- **Daily**: Cleaning, basic inspections
- **Weekly**: Deep cleaning, consumable checks
- **Monthly**: Calibration verification, filter changes
- **Quarterly**: Professional service, detailed inspections
- **Annual**: Full service, certification renewal

**User Stories**:
- As a **clinic admin**, I want to set maintenance schedules for each equipment type
- As a **clinical staff**, I want to see what maintenance is due this week
- As a **clinic admin**, I want to be alerted when maintenance is overdue

---

### 3.1.3 Repair History

**Purpose**: Track all equipment repairs, service calls, and associated costs.

**Key Capabilities**:
- Log repair requests and service calls
- Track repair status and timeline
- Record parts replaced and costs
- Manage vendor/technician information
- Document repair outcomes and notes
- Analyze equipment reliability trends

**User Stories**:
- As a **clinical staff**, I want to report an equipment malfunction
- As a **clinic admin**, I want to see the complete repair history for equipment
- As a **clinic admin**, I want to identify equipment with frequent repairs for replacement consideration

---

### 3.1.4 Depreciation Tracking

**Purpose**: Calculate equipment depreciation for financial reporting and asset management.

**Key Capabilities**:
- Track purchase price and date
- Set useful life and salvage value
- Calculate depreciation (straight-line, declining balance)
- Generate depreciation schedules
- Support book and tax depreciation methods
- Export for financial system integration

**User Stories**:
- As a **clinic admin**, I want to see the current book value of all equipment
- As a **billing/finance**, I want to export depreciation data for tax reporting
- As a **clinic admin**, I want to plan for equipment replacement based on depreciation

---

### 3.1.5 Warranty Management

**Purpose**: Track equipment warranties and service contracts to maximize coverage benefits.

**Key Capabilities**:
- Record warranty terms and expiration dates
- Set warranty expiration alerts
- Track service contracts and renewals
- Document warranty claims
- Link to vendor contact information
- Manage extended warranty options

**User Stories**:
- As a **clinic admin**, I want to be notified before warranties expire
- As a **clinical staff**, I want to know if equipment is under warranty before calling for service
- As a **clinic admin**, I want to track all active service contracts

---

### 3.1.6 Equipment Transfer

**Purpose**: Manage equipment transfers between locations in multi-clinic practices.

**Key Capabilities**:
- Initiate transfer requests between locations
- Track equipment in transit
- Update equipment location records
- Generate transfer documentation
- Maintain transfer history
- Handle equipment loans vs. permanent transfers

**User Stories**:
- As a **clinic admin**, I want to transfer equipment to another location
- As a **clinic admin**, I want to see the transfer history for equipment
- As a **super admin**, I want to see equipment distribution across all locations

---

## Data Model

```prisma
model Equipment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Identification
  name          String
  equipmentNumber String  @unique
  serialNumber  String?
  modelNumber   String?
  barcode       String?

  // Classification
  typeId        String   @db.ObjectId
  category      EquipmentCategory
  manufacturer  String?

  // Location
  roomId        String?  @db.ObjectId
  locationNotes String?

  // Status
  status        EquipmentStatus @default(ACTIVE)
  condition     EquipmentCondition @default(GOOD)

  // Purchase info
  purchaseDate  DateTime?
  purchasePrice Decimal?
  vendorId      String?  @db.ObjectId
  purchaseOrderNumber String?

  // Warranty
  warrantyStartDate DateTime?
  warrantyExpiry DateTime?
  warrantyNotes String?
  hasExtendedWarranty Boolean @default(false)

  // Service contract
  serviceContractId String? @db.ObjectId
  serviceContractExpiry DateTime?

  // Depreciation
  usefulLifeMonths Int?
  salvageValue  Decimal?
  depreciationMethod DepreciationMethod @default(STRAIGHT_LINE)
  accumulatedDepreciation Decimal @default(0)

  // Maintenance
  lastMaintenanceDate DateTime?
  nextMaintenanceDate DateTime?
  maintenanceIntervalDays Int?

  // Documents
  manualUrl     String?
  photos        String[]

  // Notes
  notes         String?
  specifications Json?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  type          EquipmentType @relation(fields: [typeId], references: [id])
  room          Room?     @relation(fields: [roomId], references: [id])
  vendor        Supplier? @relation(fields: [vendorId], references: [id])
  maintenanceRecords MaintenanceRecord[]
  repairRecords RepairRecord[]
  transferHistory EquipmentTransfer[]

  @@index([clinicId])
  @@index([typeId])
  @@index([roomId])
  @@index([status])
  @@index([equipmentNumber])
  @@index([serialNumber])
}

model EquipmentType {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId  // null for system types

  // Type info
  name          String
  code          String
  category      EquipmentCategory
  description   String?

  // Default maintenance
  defaultMaintenanceIntervalDays Int?
  maintenanceChecklist String[]

  // Depreciation defaults
  defaultUsefulLifeMonths Int?
  defaultDepreciationMethod DepreciationMethod?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic?   @relation(fields: [clinicId], references: [id])
  equipment     Equipment[]

  @@unique([clinicId, code])
  @@index([clinicId])
  @@index([category])
}

model MaintenanceRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  equipmentId   String   @db.ObjectId

  // Maintenance details
  maintenanceType MaintenanceType
  scheduledDate DateTime?
  completedDate DateTime?
  status        MaintenanceStatus @default(SCHEDULED)

  // Work performed
  description   String?
  checklist     Json?     // Completed checklist items
  notes         String?

  // Vendor/Technician
  performedBy   String?   // Internal or vendor name
  vendorId      String?   @db.ObjectId
  technicianName String?

  // Costs
  laborCost     Decimal?
  partsCost     Decimal?
  totalCost     Decimal?

  // Next maintenance
  nextMaintenanceDate DateTime?

  // Documents
  attachments   String[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  equipment     Equipment @relation(fields: [equipmentId], references: [id])
  vendor        Supplier? @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([equipmentId])
  @@index([status])
  @@index([scheduledDate])
}

enum MaintenanceType {
  PREVENTIVE
  CALIBRATION
  INSPECTION
  CLEANING
  CERTIFICATION
  OTHER
}

enum MaintenanceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  OVERDUE
}

model RepairRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  equipmentId   String   @db.ObjectId

  // Repair details
  reportedDate  DateTime @default(now())
  reportedBy    String   @db.ObjectId
  issueDescription String
  severity      RepairSeverity @default(MEDIUM)

  // Status tracking
  status        RepairStatus @default(REPORTED)
  scheduledDate DateTime?
  completedDate DateTime?

  // Resolution
  diagnosis     String?
  workPerformed String?
  partsReplaced String[]
  resolutionNotes String?

  // Vendor/Service
  vendorId      String?  @db.ObjectId
  technicianName String?
  serviceTicketNumber String?

  // Costs
  laborCost     Decimal?
  partsCost     Decimal?
  travelCost    Decimal?
  totalCost     Decimal?

  // Warranty
  coveredByWarranty Boolean @default(false)
  warrantyClaimNumber String?

  // Downtime tracking
  equipmentDownStart DateTime?
  equipmentDownEnd DateTime?

  // Documents
  attachments   String[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  equipment     Equipment @relation(fields: [equipmentId], references: [id])
  vendor        Supplier? @relation(fields: [vendorId], references: [id])

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

model EquipmentTransfer {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  equipmentId   String   @db.ObjectId

  // Transfer details
  transferType  TransferType
  fromClinicId  String   @db.ObjectId
  toClinicId    String   @db.ObjectId

  // Status
  status        TransferStatus @default(REQUESTED)
  requestedDate DateTime @default(now())
  approvedDate  DateTime?
  shippedDate   DateTime?
  receivedDate  DateTime?

  // People
  requestedBy   String   @db.ObjectId
  approvedBy    String?  @db.ObjectId
  receivedBy    String?  @db.ObjectId

  // Notes
  reason        String?
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  equipment     Equipment @relation(fields: [equipmentId], references: [id])
  fromClinic    Clinic    @relation("TransferFrom", fields: [fromClinicId], references: [id])
  toClinic      Clinic    @relation("TransferTo", fields: [toClinicId], references: [id])

  @@index([equipmentId])
  @@index([fromClinicId])
  @@index([toClinicId])
  @@index([status])
}

enum TransferType {
  PERMANENT
  LOAN
  RETURN
}

enum TransferStatus {
  REQUESTED
  APPROVED
  REJECTED
  IN_TRANSIT
  RECEIVED
  CANCELLED
}

enum EquipmentCategory {
  DIAGNOSTIC
  TREATMENT
  DIGITAL
  CHAIR
  STERILIZATION
  SAFETY
  OTHER
}

enum EquipmentStatus {
  ACTIVE
  IN_REPAIR
  OUT_OF_SERVICE
  RETIRED
  DISPOSED
}

enum EquipmentCondition {
  EXCELLENT
  GOOD
  FAIR
  POOR
}

enum DepreciationMethod {
  STRAIGHT_LINE
  DECLINING_BALANCE
  NONE
}
```

---

## API Endpoints

### Equipment Catalog

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/equipment` | List equipment | `equipment:read` |
| GET | `/api/resources/equipment/:id` | Get equipment details | `equipment:read` |
| POST | `/api/resources/equipment` | Add equipment | `equipment:create` |
| PUT | `/api/resources/equipment/:id` | Update equipment | `equipment:update` |
| DELETE | `/api/resources/equipment/:id` | Delete equipment (soft) | `equipment:delete` |
| GET | `/api/resources/equipment/types` | List equipment types | `equipment:read` |
| POST | `/api/resources/equipment/types` | Add equipment type | `equipment:create` |

### Maintenance

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/equipment/:id/maintenance` | Get maintenance history | `equipment:read` |
| POST | `/api/resources/equipment/:id/maintenance` | Log maintenance | `equipment:maintenance` |
| PUT | `/api/resources/equipment/:id/maintenance/:maintenanceId` | Update record | `equipment:maintenance` |
| GET | `/api/resources/maintenance/schedule` | Get maintenance schedule | `equipment:read` |
| GET | `/api/resources/maintenance/overdue` | Get overdue maintenance | `equipment:read` |

### Repairs

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/equipment/:id/repairs` | Get repair history | `equipment:read` |
| POST | `/api/resources/equipment/:id/repairs` | Report issue | `equipment:update` |
| PUT | `/api/resources/equipment/:id/repairs/:repairId` | Update repair | `equipment:maintenance` |
| GET | `/api/resources/repairs/active` | Get active repairs | `equipment:read` |

### Depreciation

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/equipment/depreciation` | Get depreciation report | `equipment:read` |
| GET | `/api/resources/equipment/:id/depreciation` | Get item depreciation | `equipment:read` |
| POST | `/api/resources/equipment/depreciation/calculate` | Calculate depreciation | `equipment:update` |

### Transfers

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/resources/equipment/:id/transfer` | Request transfer | `equipment:transfer` |
| PUT | `/api/resources/equipment/transfers/:transferId` | Update transfer | `equipment:transfer` |
| GET | `/api/resources/equipment/transfers` | List transfers | `equipment:read` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `EquipmentList` | List/search/filter equipment | `components/resources/equipment/` |
| `EquipmentDetail` | Full equipment view with tabs | `components/resources/equipment/` |
| `EquipmentForm` | Add/edit equipment | `components/resources/equipment/` |
| `EquipmentCard` | Summary card for equipment | `components/resources/equipment/` |
| `MaintenanceSchedule` | Calendar view of maintenance | `components/resources/equipment/` |
| `MaintenanceForm` | Log maintenance activity | `components/resources/equipment/` |
| `MaintenanceHistory` | List maintenance records | `components/resources/equipment/` |
| `RepairReportForm` | Report equipment issue | `components/resources/equipment/` |
| `RepairTracker` | Track repair status | `components/resources/equipment/` |
| `RepairHistory` | List repair records | `components/resources/equipment/` |
| `DepreciationReport` | Asset depreciation summary | `components/resources/equipment/` |
| `DepreciationSchedule` | Per-item depreciation detail | `components/resources/equipment/` |
| `WarrantyTracker` | Track warranty expirations | `components/resources/equipment/` |
| `TransferRequestForm` | Request equipment transfer | `components/resources/equipment/` |
| `TransferApproval` | Approve/reject transfers | `components/resources/equipment/` |
| `EquipmentQRScanner` | Scan equipment QR/barcodes | `components/resources/equipment/` |

---

## Business Rules

1. **Unique Identification**: Equipment numbers must be unique across the organization
2. **Serial Number Tracking**: High-value equipment must have serial numbers recorded
3. **Maintenance Compliance**: Equipment with safety implications requires documented maintenance
4. **Status Workflow**: Equipment status transitions follow defined workflow (Active → In Repair → Active or Retired)
5. **Depreciation Calculation**: Monthly depreciation calculated based on configured method
6. **Warranty Claims**: Repairs covered by warranty must reference warranty claim numbers
7. **Transfer Approval**: Equipment transfers require approval from receiving location
8. **Disposal Documentation**: Disposed equipment must have disposal reason and method documented

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Room Management | Optional | Room assignment for equipment |
| Supplier Management | Optional | Vendor tracking for purchases/repairs |
| Financial Management | Optional | Depreciation reporting integration |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Barcode/QR Scanner | Optional | Equipment identification |
| Document Storage | Required | Equipment manuals and photos |
| Email Service | Optional | Maintenance reminders |

---

## Related Documentation

- [Parent: Resources Management](../../)
- [Room/Chair Management](../room-chair-management/)
- [Sterilization & Compliance](../sterilization-compliance/)
- [Financial Management](../../financial-management/) - Depreciation reporting

---

**Status**: ✅ Implemented
**Last Updated**: 2024-12-01
**Owner**: Development Team
