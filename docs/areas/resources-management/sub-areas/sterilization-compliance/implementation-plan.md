# Autoclave Sterilization Tracking System - Implementation Plan

## Overview

Implement a standalone sterilization tracking system for SciCan STATCLAVE G4 autoclaves that integrates with patient records, generates QR codes for instrument packages, and provides comprehensive traceability from sterilization to patient use.

---

## User Review Required

> [!IMPORTANT] > **Critical Decisions Needed**
>
> 1. **Data Integration Method**: The STATCLAVE G4 offers three data retrieval options:
>
>    - **Web Portal API** (recommended): Real-time access via network connection
>    - **USB Export**: Weekly manual data transfer
>    - **Manual Entry**: Touchscreen data entry
>
>    **Recommendation**: Start with USB export for MVP, plan for web portal integration later
>
> 2. **QR Code Scope**: What information should the QR code contain?
>
>    - Batch/cycle ID only (minimal)
>    - Batch ID + sterilization date + expiration
>    - Full cycle parameters (temp, pressure, duration)
>
> 3. **Label Printing**: Do you have thermal label printers, or should we support standard printers?
>
> 4. **Instrument Grouping**: How are instruments organized?
>    - Individual instruments
>    - Cassettes (4 full-size + 4 exam per cycle)
>    - Pouches (up to 20 per cycle)

> [!WARNING] > **Technical Limitations**
>
> - **No Public API**: SciCan STATCLAVE G4 does not provide a public API for third-party integration

- Cycle type (wrapped instruments, pouches, etc.)
- Temperature
- Pressure
- Duration
- Cycle status (success/failure)
- Biological/chemical indicator results (if integrated)

**Equipment Specifications**:

- Class B vacuum sterilizer
- 11" chamber capacity
- 4 full-size cassettes + 4 exam cassettes OR 20 pouches
- 38-minute cycle time (minimum)
- Fresh water per cycle

---

## Proposed Implementation

### Phase 1: MVP (Standalone Feature)

#### Core Features

1. **Manual Cycle Entry**

   - Form to enter autoclave cycle data
   - Cycle ID, date, time, temperature, pressure, duration
   - Success/failure status
   - Operator name

2. **QR Code Generation**

   - Generate unique QR code for each sterilization batch
   - QR code contains: `BATCH-{cycleId}-{date}`
   - Printable labels (4x6 or 2x4 thermal labels)
   - Support for multiple instruments per batch

3. **Instrument Package Management**

   - Create instrument packages (cassettes/pouches)
   - Assign instruments to packages
   - Link package to sterilization batch
   - Track package expiration (typically 30-90 days)

4. **Patient Record Linking**

   - Scan QR code during patient appointment
   - Link sterilized instruments to patient chart
   - Record usage date, time, and staff member
   - Maintain complete audit trail

5. **Reporting**
   - Sterilization batch history
   - Instrument usage tracking
   - Expiration alerts
   - Compliance reports

---

### Phase 2: USB Integration (2-4 weeks after MVP)

1. **USB Data Import**

   - Upload USB export file from STATCLAVE
   - Parse cycle data automatically
   - Validate and import to database
   - Reduce manual entry

2. **Batch Processing**
   - Import multiple cycles at once
   - Auto-generate QR codes for imported batches
   - Bulk label printing

---

### Phase 3: Network Integration (Future)

1. **Web Portal Integration**

   - Connect to STATCLAVE web portal
   - Real-time cycle monitoring
   - Automatic data synchronization
   - Email notifications for cycle completion

2. **Advanced Features**
   - Biological indicator tracking
   - Chemical indicator integration
   - Predictive maintenance alerts
   - Multi-autoclave support

---

## Data Model

### Sterilization Cycle

```prisma
model SterilizationCycle {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId

  // Cycle Information
  cycleNumber       String   // From autoclave
  autoclaveId       String   // Which machine
  cycleDate         DateTime
  cycleType         CycleType

  // Cycle Parameters
  temperature       Decimal  // Celsius
  pressure          Decimal  // PSI or kPa
  duration          Int      // Minutes
  status            CycleStatus

  // Validation
  biologicalIndicator  Boolean?
  chemicalIndicator    Boolean?

  // Metadata
  operatorId        String   @db.ObjectId
  notes             String?
  importSource      ImportSource @default(MANUAL)
  importedAt        DateTime?

  // Relations
  packages          InstrumentPackage[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([clinicId, cycleDate])
  @@index([cycleNumber])
}

enum CycleType {
  WRAPPED_INSTRUMENTS
  POUCHES
  CASSETTES
  HANDPIECES
  OTHER
}

enum CycleStatus {
  SUCCESS
  FAILED
  INCOMPLETE
  ABORTED
}

enum ImportSource {
  MANUAL
  USB_IMPORT
  WEB_PORTAL
  API
}
```

### Instrument Package

```prisma
model InstrumentPackage {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId

  // Package Information
  packageNumber     String   // Unique identifier
  qrCode            String   @unique // QR code content
  packageType       PackageType

  // Sterilization
  cycleId           String   @db.ObjectId
  cycle             SterilizationCycle @relation(fields: [cycleId], references: [id])
  sterilizedDate    DateTime
  expirationDate    DateTime // Typically 30-90 days

  // Contents
  instrumentIds     String[] // Array of instrument IDs
  instrumentNames   String[] // For display
  cassetteName      String?  // If using cassette system

  // Usage Tracking
  usages            PackageUsage[]
  status            PackageStatus @default(STERILE)

  // Metadata
  preparedBy        String   @db.ObjectId
  notes             String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([clinicId, status])
  @@index([qrCode])
  @@index([expirationDate])
}

enum PackageType {
  CASSETTE_FULL
  CASSETTE_EXAM
  POUCH
  INDIVIDUAL
}

enum PackageStatus {
  STERILE
  USED
  EXPIRED
  COMPROMISED
}
```

### Package Usage

```prisma
model PackageUsage {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId

  // Package
  packageId         String   @db.ObjectId
  package           InstrumentPackage @relation(fields: [packageId], references: [id])

  // Patient Link
  patientId         String   @db.ObjectId
  appointmentId     String?  @db.ObjectId

  // Usage Details
  usedDate          DateTime
  usedBy            String   @db.ObjectId // Staff member
  procedureType     String?
  notes             String?

  createdAt         DateTime @default(now())

  @@index([packageId])
  @@index([patientId])
  @@index([usedDate])
}
```

### Autoclave Equipment

```prisma
model AutoclaveEquipment {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId

  // Equipment Info
  name              String
  manufacturer      String   @default("SciCan")
  model             String   @default("STATCLAVE G4")
  serialNumber      String

  // Network Info
  ipAddress         String?
  macAddress        String?
  webPortalUrl      String?

  // Status
  isActive          Boolean  @default(true)
  lastMaintenance   DateTime?
  nextMaintenance   DateTime?

  // Metadata
  installDate       DateTime?
  notes             String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([clinicId])
}
```

---

## API Endpoints

### Sterilization Cycles

| Method | Path                               | Permission             | Description           |
| ------ | ---------------------------------- | ---------------------- | --------------------- |
| GET    | `/api/sterilization/cycles`        | `sterilization:view`   | List cycles           |
| GET    | `/api/sterilization/cycles/:id`    | `sterilization:view`   | Get cycle details     |
| POST   | `/api/sterilization/cycles`        | `sterilization:create` | Create cycle (manual) |
| PUT    | `/api/sterilization/cycles/:id`    | `sterilization:edit`   | Update cycle          |
| POST   | `/api/sterilization/cycles/import` | `sterilization:import` | Import from USB       |
| DELETE | `/api/sterilization/cycles/:id`    | `sterilization:delete` | Delete cycle          |

### Instrument Packages

| Method | Path                                     | Permission             | Description         |
| ------ | ---------------------------------------- | ---------------------- | ------------------- |
| GET    | `/api/sterilization/packages`            | `sterilization:view`   | List packages       |
| GET    | `/api/sterilization/packages/:id`        | `sterilization:view`   | Get package details |
| POST   | `/api/sterilization/packages`            | `sterilization:create` | Create package      |
| GET    | `/api/sterilization/packages/qr/:qrCode` | `sterilization:view`   | Get by QR code      |
| POST   | `/api/sterilization/packages/:id/use`    | `sterilization:use`    | Record usage        |
| GET    | `/api/sterilization/packages/:id/label`  | `sterilization:view`   | Generate label PDF  |

### Reports

| Method | Path                                    | Permission              | Description           |
| ------ | --------------------------------------- | ----------------------- | --------------------- |
| GET    | `/api/sterilization/reports/cycles`     | `sterilization:reports` | Cycle history report  |
| GET    | `/api/sterilization/reports/usage`      | `sterilization:reports` | Usage tracking report |
| GET    | `/api/sterilization/reports/expiring`   | `sterilization:reports` | Expiring packages     |
| GET    | `/api/sterilization/reports/compliance` | `sterilization:reports` | Compliance report     |

---

## UI Components

### 1. Cycle Entry Form

- Autoclave selection
- Cycle number input
- Date/time picker
- Temperature, pressure, duration
- Cycle type selection
- Biological/chemical indicator checkboxes
- Operator selection
- Notes field

### 2. Package Creation

- Cycle selection
- Package type (cassette/pouch)
- Instrument selection (multi-select)
- Cassette name (if applicable)
- Expiration date calculator (default 30 days)
- QR code preview
- Print label button

### 3. QR Code Scanner

- Camera/scanner input
- Package information display
- Patient selection
- Procedure type
- Usage confirmation
- Print usage record

### 4. Package List

- Filter by status (sterile/used/expired)
- Search by package number
- Expiration date sorting
- Visual expiration warnings
- Bulk actions (print labels)

### 5. Cycle History

- Date range filter
- Autoclave filter
- Success/failure filter
- Cycle details modal
- Export to PDF/Excel

### 6. Dashboard

- Active sterile packages count
- Expiring soon alerts
- Recent cycles
- Usage statistics
- Compliance metrics

---

## QR Code Specification

### Format

```
ORCA-STERIL-{packageNumber}-{cycleId}
```

Example: `ORCA-STERIL-PKG001234-CYC567890`

### Data Encoding

- Use QR Code Version 2 (25x25 modules)
- Error correction level: H (30% - highest)
- Encoding: Alphanumeric mode
- Size: 1" x 1" minimum for scanning reliability

### Label Design

```
┌─────────────────────────┐
│  [QR CODE]              │
│                         │
│  Package: PKG001234     │
│  Sterilized: 11/30/2025 │
│  Expires: 12/30/2025    │
│  Cycle: CYC567890       │
│  Temp: 134°C            │
└─────────────────────────┘
```

---

## Validation Schemas

```typescript
// Cycle creation
export const createCycleSchema = z.object({
  autoclaveId: z.string().min(1),
  cycleNumber: z.string().min(1).max(50),
  cycleDate: z.coerce.date(),
  cycleType: z.enum([
    "WRAPPED_INSTRUMENTS",
    "POUCHES",
    "CASSETTES",
    "HANDPIECES",
    "OTHER",
  ]),
  temperature: z.number().min(121).max(138), // Celsius
  pressure: z.number().min(15).max(35), // PSI
  duration: z.number().int().min(3).max(60), // Minutes
  status: z.enum(["SUCCESS", "FAILED", "INCOMPLETE", "ABORTED"]),
  biologicalIndicator: z.boolean().optional(),
  chemicalIndicator: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

// Package creation
export const createPackageSchema = z.object({
  cycleId: z.string().min(1),
  packageType: z.enum([
    "CASSETTE_FULL",
    "CASSETTE_EXAM",
    "POUCH",
    "INDIVIDUAL",
  ]),
  instrumentIds: z.array(z.string()).min(1),
  instrumentNames: z.array(z.string()).min(1),
  cassetteName: z.string().max(100).optional(),
  expirationDays: z.number().int().min(1).max(365).default(30),
  notes: z.string().max(500).optional(),
});

// Package usage
export const recordUsageSchema = z.object({
  packageId: z.string().min(1),
  patientId: z.string().min(1),
  appointmentId: z.string().optional(),
  procedureType: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});
```

---

## Integration with Patient Records

### Workflow

1. **During Appointment Setup**

   - Assistant prepares instruments
   - Scans QR code on sterilized package
   - System validates package (not expired, sterile status)
   - Links to current patient appointment

2. **Usage Recording**

   - Package status changes to "USED"
   - Usage record created with patient link
   - Timestamp and staff member recorded
   - Audit trail maintained

3. **Patient Chart**
   - New section: "Sterilization Records"
   - Shows all instruments used during appointments
   - Displays sterilization batch info
   - Provides traceability for recalls

---

## Compliance & Reporting

### Required Reports

1. **Daily Sterilization Log**

   - All cycles run
   - Success/failure rates
   - Biological indicator results

2. **Package Inventory**

   - Active sterile packages
   - Expiring packages (7-day warning)
   - Expired packages requiring disposal

3. **Usage Tracking**

   - Packages used per day/week/month
   - Patient-instrument traceability
   - Recall capability

4. **Compliance Audit**
   - CDC/OSHA compliance metrics
   - Biological indicator frequency
   - Maintenance records

---

## Technical Considerations

### QR Code Library

```bash
npm install qrcode @types/qrcode
```

### Label Printing

- **Option 1**: Generate PDF labels (print on any printer)
- **Option 2**: Thermal printer integration (Zebra, Dymo)
- **Option 3**: Browser print API

### Scanner Integration

- **Option 1**: Camera-based scanning (mobile/tablet)
- **Option 2**: USB barcode scanner
- **Option 3**: Bluetooth scanner

### Data Import

- **USB File Format**: Need to reverse-engineer STATCLAVE export
- **Fallback**: CSV template for manual data entry
- **Future**: Web portal API integration

---

## Implementation Timeline

### Week 1-2: MVP Core

- [ ] Database schema and migrations
- [ ] Manual cycle entry form
- [ ] Package creation with QR generation
- [ ] Basic package list

### Week 3: QR Integration

- [ ] QR code scanner component
- [ ] Package usage recording
- [ ] Patient record linking
- [ ] Label printing (PDF)

### Week 4: Reporting

- [ ] Cycle history
- [ ] Package inventory
- [ ] Expiration alerts
- [ ] Basic compliance reports

### Week 5-6: USB Import (Phase 2)

- [ ] USB file upload
- [ ] Data parsing (format discovery)
- [ ] Batch import processing
- [ ] Validation and error handling

---

## Security Considerations

- **Permissions**: New permission group `sterilization:*`
- **Audit Logging**: All cycle and usage operations
- **Data Integrity**: Immutable cycle records
- **PHI Protection**: Patient data in usage records
- **Compliance**: HIPAA-compliant storage and access

---

## Testing Requirements

1. **QR Code Reliability**

   - Test scanning at various distances
   - Test with different lighting conditions
   - Test label durability (autoclave-safe labels)

2. **Data Validation**

   - Temperature/pressure ranges
   - Date/time validation
   - Expiration calculations

3. **Integration Testing**

   - Patient record linking
   - Appointment integration
   - Multi-user scenarios

4. **Compliance Testing**
   - Report accuracy
   - Audit trail completeness
   - Recall simulation

---

## Next Steps

1. **Confirm Requirements** with clinic owner:

   - Data integration method (USB vs manual vs web portal)
   - Label printer availability
   - QR code content preferences
   - Instrument organization system

2. **Obtain Equipment Access**:

   - STATCLAVE G4 manual/documentation
   - USB export sample file
   - Web portal credentials (if available)
   - Network access details

3. **Prototype**:

   - QR code generation and scanning
   - Label design mockup
   - Basic workflow demonstration

4. **Begin Implementation**:
   - Start with manual entry (no autoclave dependency)
   - Build core package management
   - Add patient linking
   - Iterate based on feedback
