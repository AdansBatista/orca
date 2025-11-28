# Appliance Management

> **Area**: [Treatment Management](../../)
>
> **Sub-Area**: 3.3 Appliance Management
>
> **Purpose**: Track orthodontic appliances including brackets, wires, aligners, retainers, and auxiliary devices throughout treatment

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [Treatment Management](../../) |
| **Dependencies** | Patient Management, Treatment Planning, Lab Work Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Appliance Management provides comprehensive tracking of all orthodontic appliances from placement through removal. This includes bracket systems and their configuration, wire sequences with progression tracking, clear aligner management with compliance monitoring, retainer fabrication and delivery, and auxiliary appliances. The system integrates with lab orders for retainer fabrication and inventory for supply tracking.

The sub-area supports orthodontic-specific workflows including bracket placement documentation, standard wire progression protocols, aligner delivery with IPR and attachment documentation, and comprehensive retention phase management.

### Key Capabilities

- Track bracket system selection and placement by tooth
- Manage wire progression sequences with dates and providers
- Monitor clear aligner treatment with compliance tracking
- Handle retainer orders, fabrication, and delivery
- Document auxiliary appliance usage (elastics, TADs, springs)
- Integrate with lab work orders for fabrication
- Link to inventory for supply management
- Generate appliance reports and statistics

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.3.1 | [Bracket Tracking](./functions/bracket-tracking.md) | Track bracket systems and placement | 📋 Planned | Critical |
| 3.3.2 | [Wire Sequences](./functions/wire-sequences.md) | Manage wire progression throughout treatment | 📋 Planned | Critical |
| 3.3.3 | [Aligner Tracking](./functions/aligner-tracking.md) | Track clear aligner treatment and compliance | 📋 Planned | High |
| 3.3.4 | [Retainer Management](./functions/retainer-management.md) | Manage retention appliances | 📋 Planned | High |
| 3.3.5 | [Auxiliary Appliances](./functions/auxiliary-appliances.md) | Track other orthodontic appliances | 📋 Planned | Medium |
| 3.3.6 | [Inventory Integration](./functions/inventory-integration.md) | Link appliance usage to inventory | 📋 Planned | Medium |

---

## Function Details

### 3.3.1 Bracket Tracking

**Purpose**: Document bracket system selection and placement throughout treatment.

**Key Capabilities**:
- Record bracket system type and manufacturer
- Document placement by tooth number
- Track bracket replacements and rebonds
- Note prescription (torque, tip) if applicable
- Support multiple arch configurations
- Record placement date and provider
- Track debond/removal information
- Generate bracket placement charts

**Bracket Systems**:
| System | Type | Characteristics |
|--------|------|-----------------|
| Damon Q | Self-ligating metal | Passive self-ligation, low friction |
| Damon Clear | Self-ligating clear | Esthetic, passive self-ligation |
| Damon Ultima | Self-ligating clear | Enhanced esthetics |
| 3M Clarity | Ceramic | Esthetic ceramic brackets |
| 3M Victory | Metal | Traditional twin brackets |
| American Ortho | Metal | Various prescriptions available |
| Incognito | Lingual | Custom lingual brackets |
| WIN | Lingual | Custom lingual system |
| In-Ovation | Self-ligating | Active/passive options |

**Bracket Prescriptions**:
- MBT (McLaughlin, Bennett, Trevisi)
- Roth
- Damon
- Custom

**User Stories**:
- As a **clinical staff**, I want to document which brackets are placed on each tooth
- As a **doctor**, I want to track bracket changes and rebonds
- As a **clinical staff**, I want to see current bracket configuration

---

### 3.3.2 Wire Sequences

**Purpose**: Track wire progression throughout treatment phases.

**Key Capabilities**:
- Record wire type, size, and material
- Track wire placement and removal dates
- Manage wire sequence protocols
- Document bends and customizations
- Track by arch (upper, lower)
- Assign sequence numbers
- Record placing provider
- Generate wire history reports

**Wire Sequence Protocol Example**:
| Sequence | Size | Material | Phase | Duration |
|----------|------|----------|-------|----------|
| 1 | .014 | NiTi | Initial | 6-8 weeks |
| 2 | .016 | NiTi | Alignment | 6-8 weeks |
| 3 | .016x.022 | NiTi | Leveling | 8-12 weeks |
| 4 | .019x.025 | NiTi | Leveling | 8-12 weeks |
| 5 | .019x.025 | SS | Working | 3-6 months |
| 6 | .019x.025 | TMA | Finishing | Variable |

**Wire Materials**:
| Material | Code | Characteristics | Use Phase |
|----------|------|-----------------|-----------|
| Nickel Titanium | NiTi | Superelastic, shape memory | Initial, leveling |
| Heat-Activated NiTi | NiTi-HA | Temperature responsive | Initial, leveling |
| Stainless Steel | SS | Rigid, formable | Working, space closure |
| TMA (Beta-Titanium) | TMA | Intermediate stiffness | Finishing, detailing |
| Copper NiTi | CuNiTi | Enhanced flexibility | Initial alignment |

**User Stories**:
- As a **clinical staff**, I want to document wire changes at each visit
- As a **doctor**, I want to see wire progression history
- As a **clinical staff**, I want to follow standard wire sequence protocols

---

### 3.3.3 Aligner Tracking

**Purpose**: Manage clear aligner treatment including delivery and compliance.

**Key Capabilities**:
- Track aligner case details (system, case number)
- Record total aligner count and current aligner
- Document aligner deliveries with quantities
- Track refinement sets separately
- Monitor wear compliance
- Record attachment placements
- Document IPR performed
- Integrate with aligner system APIs

**Aligner Systems**:
| System | Manufacturer | Integration |
|--------|--------------|-------------|
| Invisalign | Align Technology | iTero integration |
| ClearCorrect | Straumann | Digital submission |
| SureSmile | Dentsply Sirona | SureSmile software |
| Spark | Ormco | Digital submission |
| 3M Clarity | 3M | Digital submission |
| In-house aligners | Various | Lab integration |

**Aligner Delivery Tracking**:
- Delivery date
- Aligner number range delivered
- Wear schedule (days per aligner)
- Wear hours per day
- Attachments placed (tooth numbers)
- IPR performed (location, amount)
- Patient instructions
- Next delivery date

**User Stories**:
- As a **clinical staff**, I want to track which aligners the patient has
- As a **doctor**, I want to monitor aligner compliance
- As a **clinical staff**, I want to document attachment placements

---

### 3.3.4 Retainer Management

**Purpose**: Manage retention appliances from order through delivery.

**Key Capabilities**:
- Order retainers from lab
- Track fabrication status
- Record delivery to patient
- Document wear instructions
- Track retainer replacements
- Manage multiple retainer types
- Record lost/broken retainers
- Set retention protocol reminders

**Retainer Types**:
| Type | Description | Common Materials |
|------|-------------|------------------|
| Hawley | Traditional removable | Acrylic, wire |
| Essix | Clear vacuum-formed | Clear plastic |
| Vivera | Invisalign retainers | Proprietary material |
| Fixed/Bonded | Permanent wire | Twisted wire, fiber |
| Spring Retainer | Active retention | Wire, acrylic |
| Wrap-around | Full coverage | Acrylic, wire |

**Retention Wear Schedules**:
| Phase | Timeline | Wear Schedule |
|-------|----------|---------------|
| Initial | First 3-6 months | Full-time (22+ hours) |
| Transition | 6-12 months | Nights only |
| Maintenance | 12+ months | Every other night |
| Long-term | 2+ years | Few nights per week |

**User Stories**:
- As a **clinical staff**, I want to order retainers from the lab
- As a **clinical staff**, I want to track retainer delivery
- As a **doctor**, I want to set retention protocols for patients

---

### 3.3.5 Auxiliary Appliances

**Purpose**: Track additional orthodontic appliances and accessories.

**Key Capabilities**:
- Document auxiliary appliance placement
- Track functional appliances
- Record expansion appliance activation
- Monitor elastic wear prescriptions
- Track TAD (temporary anchorage device) placement
- Document headgear/facemask usage
- Record spring and power chain usage
- Track appliance adjustments

**Auxiliary Appliance Types**:
| Type | Category | Purpose |
|------|----------|---------|
| Herbst | Functional | Class II correction |
| MARA | Functional | Class II correction |
| Twin Block | Functional | Class II correction |
| RPE/Hyrax | Expander | Palatal expansion |
| Schwarz | Expander | Slow expansion |
| Quad Helix | Expander | Upper expansion |
| TAD | Anchorage | Skeletal anchorage |
| Headgear | Orthopedic | Class II, growth modification |
| Facemask | Orthopedic | Class III, protraction |
| Power chain | Accessory | Space closure |
| Elastic | Accessory | Various movements |
| Coil spring | Accessory | Space opening/closing |

**User Stories**:
- As a **clinical staff**, I want to document appliance placements
- As a **doctor**, I want to track expansion appliance activation
- As a **clinical staff**, I want to record elastic prescriptions

---

### 3.3.6 Inventory Integration

**Purpose**: Link appliance usage to inventory management system.

**Key Capabilities**:
- Deduct supplies upon use
- Track supply consumption by type
- Link to purchase orders
- Monitor low inventory alerts
- Generate usage reports
- Track lot numbers for recalls
- Support multiple vendors
- Calculate supply costs per case

**Inventory Categories**:
| Category | Items |
|----------|-------|
| Brackets | By system, size, tooth |
| Bands | By size |
| Wires | By size, material, form |
| Elastics | By size, force |
| Adhesives | Bonding agents, primers |
| Accessories | Power chain, springs, stops |

**User Stories**:
- As a **inventory manager**, I want usage tracked automatically
- As a **clinic admin**, I want supply cost reports per patient
- As a **purchasing**, I want to know when supplies are low

---

## Data Model

```prisma
model ApplianceRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  treatmentPlanId String? @db.ObjectId

  // Appliance Details
  applianceType ApplianceRecordType
  applianceSystem String?
  manufacturer  String?

  // Configuration
  specification Json?

  // Placement
  arch          Arch
  toothNumbers  Int[]

  // Dates
  placedDate    DateTime?
  removedDate   DateTime?

  // Status
  status        ApplianceStatus @default(ACTIVE)

  // Provider
  placedBy      String?  @db.ObjectId
  removedBy     String?  @db.ObjectId

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  treatmentPlan TreatmentPlan? @relation(fields: [treatmentPlanId], references: [id])
  wireRecords   WireRecord[]

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
  @@index([applianceType])
  @@index([status])
}

model WireRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  applianceRecordId String @db.ObjectId

  // Wire Details
  wireType      WireType
  wireSize      String
  wireMaterial  WireMaterial
  manufacturer  String?

  // Placement
  arch          Arch

  // Dates
  placedDate    DateTime
  removedDate   DateTime?

  // Status
  status        WireStatus @default(ACTIVE)

  // Provider
  placedBy      String   @db.ObjectId
  removedBy     String?  @db.ObjectId

  // Sequence
  sequenceNumber Int     @default(1)

  // Notes
  notes         String?
  bends         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  applianceRecord ApplianceRecord @relation(fields: [applianceRecordId], references: [id])

  @@index([clinicId])
  @@index([applianceRecordId])
  @@index([placedDate])
  @@index([status])
}

model AlignerRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  treatmentPlanId String? @db.ObjectId

  // Aligner Details
  alignerSystem String
  caseNumber    String?

  // Treatment Info
  totalAligners Int
  currentAligner Int     @default(1)
  refinementNumber Int   @default(0)

  // Status
  status        AlignerTreatmentStatus @default(IN_PROGRESS)

  // Dates
  startDate     DateTime
  estimatedEndDate DateTime?
  actualEndDate DateTime?

  // Delivery
  alignersDelivered Int  @default(0)
  lastDeliveryDate DateTime?

  // Wear Compliance
  averageWearHours Decimal?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  treatmentPlan TreatmentPlan? @relation(fields: [treatmentPlanId], references: [id])
  deliveries    AlignerDelivery[]

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
  @@index([status])
}

model AlignerDelivery {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  alignerRecordId String @db.ObjectId

  // Delivery Details
  deliveryDate  DateTime
  alignerNumberStart Int
  alignerNumberEnd Int

  // Instructions
  wearSchedule  Int      @default(14)
  wearHoursPerDay Int    @default(22)

  // Attachments
  attachmentsPlaced Boolean @default(false)
  attachmentTeeth Int[]

  // IPR
  iprPerformed  Boolean  @default(false)
  iprDetails    String?

  // Provider
  deliveredBy   String   @db.ObjectId

  // Notes
  instructions  String?
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  alignerRecord AlignerRecord @relation(fields: [alignerRecordId], references: [id])

  @@index([clinicId])
  @@index([alignerRecordId])
}

model RetainerRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  treatmentPlanId String? @db.ObjectId

  // Retainer Details
  retainerType  RetainerType
  arch          Arch
  material      String?

  // Lab
  labOrderId    String?  @db.ObjectId

  // Dates
  orderedDate   DateTime?
  receivedDate  DateTime?
  deliveredDate DateTime?

  // Status
  status        RetainerStatus @default(ORDERED)

  // Delivery
  deliveredBy   String?  @db.ObjectId

  // Retention Protocol
  wearSchedule  RetentionWearSchedule?
  wearInstructions String?

  // Replacement
  isReplacement Boolean  @default(false)
  replacementReason String?
  previousRetainerId String? @db.ObjectId

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  treatmentPlan TreatmentPlan? @relation(fields: [treatmentPlanId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
  @@index([status])
}

enum ApplianceRecordType {
  BRACKETS
  BANDS
  ALIGNERS
  RETAINER_FIXED
  RETAINER_REMOVABLE
  EXPANDER
  HERBST
  MARA
  HEADGEAR
  FACEMASK
  TAD
  ELASTICS
  SPRING
  POWER_CHAIN
  OTHER
}

enum ApplianceStatus {
  ORDERED
  RECEIVED
  ACTIVE
  ADJUSTED
  REMOVED
  REPLACED
  LOST
  BROKEN
}

enum WireType {
  ROUND
  RECTANGULAR
  SQUARE
}

enum WireMaterial {
  NITI
  NITI_HEAT
  STAINLESS_STEEL
  TMA
  BETA_TITANIUM
  COPPER_NITI
}

enum WireStatus {
  ACTIVE
  REMOVED
  BROKEN
  REPLACED
}

enum AlignerTreatmentStatus {
  SUBMITTED
  APPROVED
  MANUFACTURING
  IN_PROGRESS
  REFINEMENT
  COMPLETED
  DISCONTINUED
}

enum RetainerType {
  HAWLEY
  ESSIX
  VIVERA
  FIXED_BONDED
  SPRING_RETAINER
  WRAP_AROUND
}

enum RetainerStatus {
  ORDERED
  IN_FABRICATION
  RECEIVED
  DELIVERED
  ACTIVE
  REPLACED
  LOST
  BROKEN
}

enum RetentionWearSchedule {
  FULL_TIME
  NIGHTS_ONLY
  EVERY_OTHER_NIGHT
  FEW_NIGHTS_WEEK
  AS_NEEDED
}

enum Arch {
  UPPER
  LOWER
  BOTH
}
```

---

## API Endpoints

### Appliance Records

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/appliances` | List appliance records | `appliance:read` |
| GET | `/api/appliances/:id` | Get appliance record | `appliance:read` |
| POST | `/api/appliances` | Create appliance record | `appliance:create` |
| PUT | `/api/appliances/:id` | Update appliance | `appliance:update` |
| POST | `/api/appliances/:id/remove` | Remove/deactivate appliance | `appliance:update` |
| GET | `/api/patients/:patientId/appliances` | Patient's appliances | `appliance:read` |
| GET | `/api/appliances/active` | Active appliances | `appliance:read` |

### Wires

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/appliances/:applianceId/wires` | List wire records | `appliance:read` |
| POST | `/api/appliances/:applianceId/wires` | Add wire record | `appliance:create` |
| PUT | `/api/wires/:wireId` | Update wire record | `appliance:update` |
| POST | `/api/wires/:wireId/remove` | Remove wire | `appliance:update` |
| GET | `/api/patients/:patientId/wire-history` | Patient wire history | `appliance:read` |
| GET | `/api/wire-sequences` | Get wire sequence protocols | `appliance:read` |

### Aligners

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/aligners` | List aligner records | `appliance:read` |
| GET | `/api/aligners/:id` | Get aligner record | `appliance:read` |
| POST | `/api/aligners` | Create aligner record | `appliance:create` |
| PUT | `/api/aligners/:id` | Update aligner record | `appliance:update` |
| POST | `/api/aligners/:id/deliveries` | Record aligner delivery | `appliance:create` |
| PUT | `/api/aligners/:id/progress` | Update current aligner | `appliance:update` |
| GET | `/api/patients/:patientId/aligners` | Patient's aligners | `appliance:read` |

### Retainers

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/retainers` | List retainer records | `appliance:read` |
| GET | `/api/retainers/:id` | Get retainer record | `appliance:read` |
| POST | `/api/retainers` | Create retainer record | `appliance:create` |
| PUT | `/api/retainers/:id` | Update retainer | `appliance:update` |
| POST | `/api/retainers/:id/order` | Order from lab | `appliance:create` |
| POST | `/api/retainers/:id/receive` | Mark received | `appliance:update` |
| POST | `/api/retainers/:id/deliver` | Mark delivered | `appliance:update` |
| GET | `/api/patients/:patientId/retainers` | Patient's retainers | `appliance:read` |
| GET | `/api/retainers/pending` | Pending retainers | `appliance:read` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `BracketChart` | Visual bracket placement chart | `components/treatment/appliances/` |
| `BracketChartEntry` | Document bracket placement | `components/treatment/appliances/` |
| `BracketSystemSelector` | Select bracket system | `components/treatment/appliances/` |
| `WireSequenceTracker` | Track wire progression | `components/treatment/appliances/` |
| `WireChangeForm` | Record wire change | `components/treatment/appliances/` |
| `WireHistoryTimeline` | Wire history view | `components/treatment/appliances/` |
| `WireSequenceProtocol` | Display standard sequences | `components/treatment/appliances/` |
| `AlignerTracker` | Track aligner progress | `components/treatment/aligners/` |
| `AlignerProgressBar` | Visual aligner progress | `components/treatment/aligners/` |
| `AlignerDeliveryForm` | Record aligner delivery | `components/treatment/aligners/` |
| `AttachmentChart` | Document attachments | `components/treatment/aligners/` |
| `IPRRecorder` | Record IPR performed | `components/treatment/aligners/` |
| `RetainerOrderForm` | Order retainer from lab | `components/treatment/retainers/` |
| `RetainerTracker` | Track retainer status | `components/treatment/retainers/` |
| `RetainerDeliveryForm` | Record retainer delivery | `components/treatment/retainers/` |
| `RetentionProtocolCard` | Display wear instructions | `components/treatment/retainers/` |
| `AuxiliaryApplianceForm` | Record auxiliary appliance | `components/treatment/appliances/` |
| `ElasticPrescription` | Document elastic prescription | `components/treatment/appliances/` |
| `ExpansionTracker` | Track expansion progress | `components/treatment/appliances/` |
| `ToothChart` | Interactive tooth diagram | `components/treatment/shared/` |
| `ArchDiagram` | Visual arch representation | `components/treatment/shared/` |

---

## Business Rules

1. **Bracket Documentation**: All bracket placements must be documented with tooth numbers
2. **Wire Sequences**: Wire changes should follow established sequence protocols
3. **Aligner Tracking**: Current aligner should be updated at each visit
4. **Attachment Documentation**: Aligner attachments must be documented at delivery
5. **IPR Recording**: All IPR must be documented with location and amount
6. **Retainer Orders**: Retainers should be ordered before debond appointment
7. **Inventory Deduction**: Supplies should be deducted from inventory upon use
8. **Replacement Tracking**: Lost/broken appliances trigger replacement workflow
9. **Retention Protocol**: Wear schedules must be assigned at retainer delivery
10. **Provider Documentation**: Placing/removing provider must be recorded

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Patient Management | Required | Patient records |
| Treatment Planning | Required | Treatment plan linkage |
| Lab Work Management | Required | Retainer orders |
| Resources Management | Optional | Inventory tracking |
| Clinical Documentation | Required | Link to progress notes |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Invisalign/iTero | Optional | Aligner case sync |
| ClearCorrect | Optional | Aligner case sync |
| Lab Systems | Optional | Retainer order integration |
| Inventory System | Optional | Supply tracking |

---

## Related Documentation

- [Parent: Treatment Management](../../)
- [Treatment Planning](../treatment-planning/)
- [Clinical Documentation](../clinical-documentation/)
- [Treatment Tracking](../treatment-tracking/)
- [Lab Work Management](../../../lab-work-management/) - Lab orders
- [Resources Management](../../../resources-management/) - Inventory
- [AUTH-GUIDE](../../../../guides/AUTH-GUIDE.md) - Authorization patterns

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
