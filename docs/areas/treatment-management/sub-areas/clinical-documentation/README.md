# Clinical Documentation

> **Area**: [Treatment Management](../../)
>
> **Sub-Area**: 3.2 Clinical Documentation
>
> **Purpose**: Document clinical visits, procedures, findings, measurements, and treatment progress with provider signatures and compliance tracking

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Treatment Management](../../) |
| **Dependencies** | Patient Management, Staff Management, Treatment Planning |
| **Last Updated** | 2024-11-27 |

---

## Overview

Clinical Documentation provides comprehensive tools for documenting every aspect of orthodontic treatment visits. This includes SOAP-format progress notes, procedure documentation with ADA codes, clinical findings, and orthodontic-specific measurements. The system ensures documentation compliance with signature workflows, co-signature requirements, and proper amendment processes.

The sub-area supports orthodontic clinical workflows with specialized templates for different visit types (bonding, adjustments, emergencies, debond), clinical measurement tracking over time, and integration with imaging for progress photos. All documentation maintains audit trails for regulatory compliance.

### Key Capabilities

- Create structured progress notes with SOAP format
- Document procedures with ADA procedure codes
- Record clinical findings with severity levels
- Track orthodontic measurements over time
- Manage provider signatures and co-signatures
- Support note amendments with audit trail
- Use visit-type-specific templates
- Attach clinical images to documentation
- Track visit records linked to appointments
- Generate documentation for insurance claims

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.2.1 | [Progress Notes](./functions/progress-notes.md) | Create and manage clinical progress notes | 📋 Planned | Critical |
| 3.2.2 | [Procedure Documentation](./functions/procedure-documentation.md) | Document procedures with ADA codes | 📋 Planned | Critical |
| 3.2.3 | [Clinical Findings](./functions/clinical-findings.md) | Record clinical observations and issues | 📋 Planned | High |
| 3.2.4 | [Clinical Measurements](./functions/clinical-measurements.md) | Track orthodontic measurements over time | 📋 Planned | High |
| 3.2.5 | [Visit Records](./functions/visit-records.md) | Manage documentation linked to visits | 📋 Planned | High |
| 3.2.6 | [Provider Templates](./functions/provider-templates.md) | Custom documentation templates | 📋 Planned | Medium |

---

## Function Details

### 3.2.1 Progress Notes

**Purpose**: Create comprehensive clinical progress notes for each patient visit.

**Key Capabilities**:
- Create notes in SOAP format (Subjective, Objective, Assessment, Plan)
- Link notes to appointments and treatment plans
- Attach clinical images to notes
- Sign notes with provider credentials
- Require co-signature for delegated procedures
- Amend signed notes with audit trail
- Support voice-to-text entry
- Auto-populate from previous visit data

**Note Types**:
| Type | Description | Typical Content |
|------|-------------|-----------------|
| INITIAL_EXAM | Initial examination | Full clinical findings, measurements |
| CONSULTATION | Treatment consultation | Discussion, recommendations |
| RECORDS_APPOINTMENT | Diagnostic records | Records taken, findings |
| BONDING | Appliance placement | Brackets placed, issues |
| ADJUSTMENT | Regular adjustment visit | Wire changes, progress |
| EMERGENCY | Emergency visit | Problem, resolution |
| DEBOND | Appliance removal | Debond details, retention |
| RETENTION_CHECK | Retention follow-up | Retainer status, stability |
| OBSERVATION | Observation visit | Growth monitoring |
| GENERAL | General visit | Other documentation |

**SOAP Format Structure**:
- **Subjective**: Patient-reported symptoms, concerns, compliance
- **Objective**: Clinical findings, measurements, observations
- **Assessment**: Provider's clinical assessment
- **Plan**: Next steps, treatment modifications

**User Stories**:
- As a **doctor**, I want to document visits efficiently using templates
- As a **clinical staff**, I want to start notes that doctors can review and sign
- As a **doctor**, I want to review and co-sign staff documentation

---

### 3.2.2 Procedure Documentation

**Purpose**: Document procedures performed with standardized ADA codes.

**Key Capabilities**:
- Record procedures with ADA codes
- Specify tooth numbers and arch locations
- Track procedure duration
- Document performing and assisting providers
- Record complications or variations
- Link procedures to progress notes
- Support insurance claim documentation
- Track procedure status (completed, deferred)

**Common Orthodontic Procedure Codes**:
| Code | Description | Category |
|------|-------------|----------|
| D8010 | Limited orthodontic treatment - deciduous dentition | Treatment |
| D8020 | Limited orthodontic treatment - transitional dentition | Treatment |
| D8030 | Limited orthodontic treatment - adolescent dentition | Treatment |
| D8040 | Limited orthodontic treatment - adult dentition | Treatment |
| D8070 | Comprehensive orthodontic treatment - transitional | Treatment |
| D8080 | Comprehensive orthodontic treatment - adolescent | Treatment |
| D8090 | Comprehensive orthodontic treatment - adult | Treatment |
| D8660 | Pre-orthodontic treatment examination | Exam |
| D8670 | Periodic orthodontic treatment visit | Visit |
| D8680 | Orthodontic retention | Retention |
| D8681 | Removable orthodontic retainer adjustment | Retention |
| D8695 | Removal of fixed retainer | Retention |

**User Stories**:
- As a **clinical staff**, I want to document procedures for each visit
- As a **billing specialist**, I want accurate procedure codes for claims
- As a **doctor**, I want to review completed procedures

---

### 3.2.3 Clinical Findings

**Purpose**: Record clinical observations, issues, and findings requiring attention.

**Key Capabilities**:
- Document clinical findings by type
- Specify finding location (tooth numbers)
- Rate finding severity
- Track action required/taken
- Flag for follow-up if needed
- Link findings to progress notes
- Generate finding alerts for providers
- Track finding resolution over time

**Finding Types**:
| Type | Description | Typical Action |
|------|-------------|----------------|
| DECALCIFICATION | White spot lesions | Hygiene reinforcement, fluoride |
| CARIES | Cavities identified | Refer to general dentist |
| GINGIVITIS | Gum inflammation | Hygiene instruction |
| BRACKET_ISSUE | Loose/broken bracket | Recement or replace |
| WIRE_ISSUE | Wire problems | Adjust or replace wire |
| ELASTIC_COMPLIANCE | Poor elastic wear | Patient education |
| ORAL_HYGIENE | Hygiene concerns | Reinforcement, cleaning |
| ROOT_RESORPTION | Root shortening | Monitor, possible Tx change |
| IMPACTION | Impacted tooth | Monitor, surgical exposure |
| ECTOPIC_ERUPTION | Abnormal eruption path | Intervention planning |
| ANKYLOSIS | Fused tooth | Treatment modification |

**Severity Levels**:
- MILD: Minor issue, routine monitoring
- MODERATE: Requires attention, may affect treatment
- SEVERE: Significant issue, immediate action needed

**User Stories**:
- As a **doctor**, I want to document findings during clinical exam
- As a **clinical staff**, I want to see flagged findings for follow-up
- As a **doctor**, I want to track finding resolution over treatment

---

### 3.2.4 Clinical Measurements

**Purpose**: Track orthodontic measurements throughout treatment.

**Key Capabilities**:
- Record standard orthodontic measurements
- Track measurements over time
- Visualize measurement trends
- Compare initial, progress, and final measurements
- Support different measurement methods
- Generate measurement reports
- Link measurements to progress notes
- Calculate treatment progress indicators

**Orthodontic Measurements**:
| Measurement | Description | Unit | Normal Range |
|-------------|-------------|------|--------------|
| OVERJET | Horizontal overlap | mm | 2-4 mm |
| OVERBITE | Vertical overlap | mm/% | 2-4 mm (20-30%) |
| CROWDING_UPPER | Upper arch crowding | mm | 0 mm |
| CROWDING_LOWER | Lower arch crowding | mm | 0 mm |
| SPACING_UPPER | Upper arch spacing | mm | 0 mm |
| SPACING_LOWER | Lower arch spacing | mm | 0 mm |
| MIDLINE_UPPER | Upper midline deviation | mm | Centered |
| MIDLINE_LOWER | Lower midline deviation | mm | Centered |
| MOLAR_RELATIONSHIP | Molar class relationship | Class | Class I |
| CANINE_RELATIONSHIP | Canine relationship | Class | Class I |
| INTERCANINE_WIDTH | Width at canines | mm | Varies |
| INTERMOLAR_WIDTH | Width at molars | mm | Varies |

**Measurement Methods**:
| Method | Description | Use Case |
|--------|-------------|----------|
| CLINICAL | Direct clinical measurement | Chair-side exams |
| MODEL_ANALYSIS | From study models | Detailed analysis |
| DIGITAL_SCAN | From digital impressions | iTero, 3Shape scans |
| CEPHALOMETRIC | From ceph analysis | Skeletal measurements |

**User Stories**:
- As a **doctor**, I want to record measurements at each records appointment
- As a **clinical staff**, I want to track measurement changes over time
- As a **doctor**, I want to compare initial and current measurements

---

### 3.2.5 Visit Records

**Purpose**: Link documentation to appointments and manage visit-based records.

**Key Capabilities**:
- Link notes to scheduled appointments
- Track visit completion status
- Aggregate visit documentation
- Generate visit summaries
- Support walk-in/unscheduled visits
- Track visit duration
- Link to billing records
- Generate visit reports

**Visit Documentation Components**:
- Progress note for the visit
- Procedures performed
- Clinical findings recorded
- Measurements taken
- Images captured
- Next appointment scheduled
- Patient instructions given

**User Stories**:
- As a **clinical staff**, I want to see all documentation for a visit
- As a **front desk**, I want to confirm visit documentation is complete
- As a **doctor**, I want to review visit summaries

---

### 3.2.6 Provider Templates

**Purpose**: Create and manage custom documentation templates.

**Key Capabilities**:
- Create templates for different visit types
- Define template fields and defaults
- Share templates across providers
- Include common procedure sets
- Customize templates per provider
- Version control for templates
- Import/export templates
- Use templates to accelerate documentation

**Template Categories**:
| Category | Example Templates |
|----------|-------------------|
| Initial Visits | New patient exam, Consultation |
| Active Treatment | Adjustment visit, Wire change |
| Procedures | Bonding, Band placement, Debond |
| Emergency | Broken bracket, Poking wire |
| Retention | Retention check, Retainer delivery |

**User Stories**:
- As a **doctor**, I want to create custom templates for my workflow
- As a **clinic admin**, I want to share standard templates with all staff
- As a **clinical staff**, I want to use templates to speed documentation

---

## Data Model

```prisma
model ProgressNote {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  treatmentPlanId String? @db.ObjectId
  appointmentId String?  @db.ObjectId

  // Note Details
  noteDate      DateTime @default(now())
  noteType      ProgressNoteType
  chiefComplaint String?

  // Clinical Content (SOAP)
  subjective    String?
  objective     String?
  assessment    String?
  plan          String?

  // Procedures Performed
  proceduresSummary String?

  // Provider
  providerId    String   @db.ObjectId
  supervisingProviderId String? @db.ObjectId

  // Signatures
  status        NoteStatus @default(DRAFT)
  signedAt      DateTime?
  signedBy      String?  @db.ObjectId
  coSignedAt    DateTime?
  coSignedBy    String?  @db.ObjectId

  // Amendments
  isAmended     Boolean  @default(false)
  amendmentReason String?
  amendedAt     DateTime?

  // Attachments
  imageIds      String[] @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  treatmentPlan TreatmentPlan? @relation(fields: [treatmentPlanId], references: [id])
  provider      StaffProfile @relation(fields: [providerId], references: [id])
  procedures    ProcedureRecord[]
  findings      ClinicalFinding[]
  measurements  ClinicalMeasurement[]

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
  @@index([providerId])
  @@index([noteDate])
  @@index([status])
}

model ProcedureRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  progressNoteId String  @db.ObjectId

  // Procedure Details
  procedureCode String
  procedureName String
  description   String?

  // Tooth/Area
  toothNumbers  Int[]
  quadrant      Quadrant?
  arch          Arch?

  // Provider
  performedBy   String   @db.ObjectId
  assistedBy    String?  @db.ObjectId

  // Timing
  performedAt   DateTime @default(now())
  duration      Int?

  // Status
  status        ProcedureStatus @default(COMPLETED)

  // Notes
  notes         String?
  complications String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  progressNote  ProgressNote @relation(fields: [progressNoteId], references: [id])

  @@index([clinicId])
  @@index([progressNoteId])
  @@index([procedureCode])
}

model ClinicalFinding {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  progressNoteId String  @db.ObjectId

  // Finding Details
  findingType   ClinicalFindingType
  description   String
  severity      Severity?

  // Location
  toothNumbers  Int[]
  location      String?

  // Clinical Action
  actionRequired Boolean @default(false)
  actionTaken   String?
  followUpRequired Boolean @default(false)

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  progressNote  ProgressNote @relation(fields: [progressNoteId], references: [id])

  @@index([clinicId])
  @@index([progressNoteId])
  @@index([findingType])
}

model ClinicalMeasurement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  progressNoteId String? @db.ObjectId

  // Measurement Details
  measurementDate DateTime @default(now())
  measurementType OrthoMeasurementType
  value         Decimal
  unit          String   @default("mm")

  // Recording
  recordedBy    String   @db.ObjectId
  method        MeasurementMethod?

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  progressNote  ProgressNote? @relation(fields: [progressNoteId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([measurementType])
  @@index([measurementDate])
}

model NoteTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId  // null for system templates
  providerId    String?  @db.ObjectId  // null for shared templates

  // Template Details
  templateName  String
  templateType  ProgressNoteType
  description   String?

  // Content
  defaultSubjective String?
  defaultObjective String?
  defaultAssessment String?
  defaultPlan   String?
  defaultProcedures String[]  // Procedure codes

  // Status
  isActive      Boolean  @default(true)
  isSystemTemplate Boolean @default(false)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic?  @relation(fields: [clinicId], references: [id])
  provider      StaffProfile? @relation(fields: [providerId], references: [id])

  @@index([clinicId])
  @@index([providerId])
  @@index([templateType])
}

enum ProgressNoteType {
  INITIAL_EXAM
  CONSULTATION
  RECORDS_APPOINTMENT
  BONDING
  ADJUSTMENT
  EMERGENCY
  DEBOND
  RETENTION_CHECK
  OBSERVATION
  GENERAL
}

enum NoteStatus {
  DRAFT
  PENDING_SIGNATURE
  SIGNED
  PENDING_COSIGN
  COSIGNED
  AMENDED
}

enum ClinicalFindingType {
  DECALCIFICATION
  CARIES
  GINGIVITIS
  BRACKET_ISSUE
  WIRE_ISSUE
  ELASTIC_COMPLIANCE
  ORAL_HYGIENE
  ROOT_RESORPTION
  IMPACTION
  ECTOPIC_ERUPTION
  ANKYLOSIS
  OTHER
}

enum Severity {
  MILD
  MODERATE
  SEVERE
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
  ARCH_LENGTH_UPPER
  ARCH_LENGTH_LOWER
  INTERCANINE_WIDTH_UPPER
  INTERCANINE_WIDTH_LOWER
  INTERMOLAR_WIDTH_UPPER
  INTERMOLAR_WIDTH_LOWER
  CROSSBITE
  OPEN_BITE
}

enum MeasurementMethod {
  CLINICAL
  MODEL_ANALYSIS
  DIGITAL_SCAN
  CEPHALOMETRIC
}

enum Quadrant {
  UPPER_RIGHT
  UPPER_LEFT
  LOWER_LEFT
  LOWER_RIGHT
}

enum Arch {
  UPPER
  LOWER
  BOTH
}

enum ProcedureStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  DEFERRED
}
```

---

## API Endpoints

### Progress Notes

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/progress-notes` | List progress notes | `documentation:read` |
| GET | `/api/progress-notes/:id` | Get progress note | `documentation:read` |
| POST | `/api/progress-notes` | Create progress note | `documentation:create` |
| PUT | `/api/progress-notes/:id` | Update progress note | `documentation:update` |
| DELETE | `/api/progress-notes/:id` | Delete draft note | `documentation:delete` |
| POST | `/api/progress-notes/:id/sign` | Sign progress note | `documentation:sign` |
| POST | `/api/progress-notes/:id/cosign` | Co-sign note | `documentation:sign` |
| POST | `/api/progress-notes/:id/amend` | Amend signed note | `documentation:amend` |
| GET | `/api/patients/:patientId/progress-notes` | Patient's notes | `documentation:read` |
| GET | `/api/progress-notes/unsigned` | Get unsigned notes | `documentation:read` |

### Procedures

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/progress-notes/:noteId/procedures` | List procedures for note | `documentation:read` |
| POST | `/api/progress-notes/:noteId/procedures` | Add procedure to note | `documentation:create` |
| PUT | `/api/procedures/:procedureId` | Update procedure | `documentation:update` |
| DELETE | `/api/procedures/:procedureId` | Remove procedure | `documentation:update` |
| GET | `/api/procedures/codes` | Get procedure code list | `documentation:read` |

### Clinical Findings

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/progress-notes/:noteId/findings` | List findings for note | `documentation:read` |
| POST | `/api/progress-notes/:noteId/findings` | Add clinical finding | `documentation:create` |
| PUT | `/api/findings/:findingId` | Update finding | `documentation:update` |
| DELETE | `/api/findings/:findingId` | Remove finding | `documentation:update` |
| GET | `/api/patients/:patientId/findings` | Patient's findings history | `documentation:read` |
| GET | `/api/findings/action-required` | Findings requiring action | `documentation:read` |

### Measurements

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/patients/:patientId/measurements` | Get patient measurements | `documentation:read` |
| POST | `/api/patients/:patientId/measurements` | Add measurement | `documentation:create` |
| PUT | `/api/measurements/:measurementId` | Update measurement | `documentation:update` |
| DELETE | `/api/measurements/:measurementId` | Remove measurement | `documentation:update` |
| GET | `/api/patients/:patientId/measurements/trends` | Measurement trends | `documentation:read` |
| GET | `/api/patients/:patientId/measurements/compare` | Compare timepoints | `documentation:read` |

### Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/note-templates` | List templates | `documentation:read` |
| GET | `/api/note-templates/:id` | Get template | `documentation:read` |
| POST | `/api/note-templates` | Create template | `documentation:create` |
| PUT | `/api/note-templates/:id` | Update template | `documentation:update` |
| DELETE | `/api/note-templates/:id` | Delete template | `documentation:delete` |
| POST | `/api/progress-notes/from-template/:templateId` | Create note from template | `documentation:create` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ProgressNoteEditor` | Create/edit progress notes | `components/treatment/documentation/` |
| `ProgressNoteList` | List progress notes | `components/treatment/documentation/` |
| `ProgressNoteView` | View signed note | `components/treatment/documentation/` |
| `ProgressNoteSearch` | Search notes | `components/treatment/documentation/` |
| `SOAPForm` | SOAP format entry | `components/treatment/documentation/` |
| `NoteSignature` | Signature workflow | `components/treatment/documentation/` |
| `AmendmentForm` | Amend signed note | `components/treatment/documentation/` |
| `ProcedureRecorder` | Record procedures | `components/treatment/procedures/` |
| `ProcedureCodeSearch` | Search ADA codes | `components/treatment/procedures/` |
| `ProcedureList` | List procedures | `components/treatment/procedures/` |
| `ToothSelector` | Select teeth for procedures | `components/treatment/procedures/` |
| `ClinicalFindingForm` | Record findings | `components/treatment/findings/` |
| `FindingsList` | Display findings | `components/treatment/findings/` |
| `FindingAlert` | Alert for findings | `components/treatment/findings/` |
| `MeasurementEntry` | Enter measurements | `components/treatment/measurements/` |
| `MeasurementGrid` | Display all measurements | `components/treatment/measurements/` |
| `MeasurementTrends` | Trend visualization | `components/treatment/measurements/` |
| `MeasurementComparison` | Before/after comparison | `components/treatment/measurements/` |
| `TemplateSelector` | Choose note template | `components/treatment/templates/` |
| `TemplateEditor` | Create/edit templates | `components/treatment/templates/` |
| `VoiceNoteEntry` | Voice-to-text input | `components/treatment/documentation/` |
| `ImageAttachment` | Attach images to notes | `components/treatment/documentation/` |

---

## Business Rules

1. **Note Completion**: Progress notes should be completed within 24 hours of visit
2. **Signature Requirements**: All clinical notes require provider signature
3. **Co-Signature Rules**: Notes created by clinical staff require doctor co-signature
4. **Amendment Process**: Signed notes cannot be edited; use amendment workflow
5. **Procedure Documentation**: Procedures must have valid ADA codes
6. **Finding Follow-up**: Severe findings must be flagged for follow-up
7. **Measurement Tracking**: Initial measurements required before treatment start
8. **Template Access**: System templates available to all; custom templates per provider
9. **Image Association**: Progress photos should be linked to corresponding notes
10. **Audit Trail**: All documentation changes logged for compliance

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Patient Management | Required | Patient records for notes |
| Staff Management | Required | Provider credentials for signatures |
| Treatment Planning | Required | Treatment plan linkage |
| Scheduling | Optional | Appointment linkage |
| Imaging Management | Optional | Clinical image attachment |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| ADA Procedure Codes | Required | Procedure code reference |
| Speech-to-Text | Optional | Voice note entry |
| Document Storage | Required | Note and amendment storage |

---

## Related Documentation

- [Parent: Treatment Management](../../)
- [Treatment Planning](../treatment-planning/)
- [Appliance Management](../appliance-management/)
- [Treatment Tracking](../treatment-tracking/)
- [Imaging Management](../../../imaging-management/) - Photo attachment
- [Scheduling & Booking](../../../scheduling-booking/) - Visit linkage
- [AUTH-GUIDE](../../../../guides/AUTH-GUIDE.md) - Authorization patterns

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
