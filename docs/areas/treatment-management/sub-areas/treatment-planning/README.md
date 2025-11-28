# Treatment Planning

> **Area**: [Treatment Management](../../)
>
> **Sub-Area**: 3.1 Treatment Planning
>
> **Purpose**: Create and manage comprehensive orthodontic treatment plans with multiple options, case presentations, and acceptance workflows

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Treatment Management](../../) |
| **Dependencies** | Patient Management, Staff Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Treatment Planning provides comprehensive tools for creating, presenting, and managing orthodontic treatment plans. This includes building treatment plans with multiple options (e.g., braces vs. aligners), conducting professional case presentations, capturing case acceptance with informed consent, and managing treatment phases. The system supports all orthodontic treatment types from limited treatments to complex surgical cases.

The sub-area enables treatment coordinators and doctors to present treatment options professionally, track case acceptance rates, and manage the transition from consultation to active treatment with proper documentation and financial agreements.

### Key Capabilities

- Create comprehensive treatment plans with diagnosis and goals
- Define multiple treatment options with different appliance types
- Build professional case presentations with visual aids
- Capture digital signatures for treatment acceptance
- Manage treatment phases from planning through retention
- Track treatment plan versions and modifications
- Generate treatment estimates integrated with financial management
- Support all orthodontic treatment types (comprehensive, Phase I/II, aligners, surgical)

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.1.1 | [Treatment Plan Creation](./functions/treatment-plan-creation.md) | Create and configure treatment plans | 📋 Planned | Critical |
| 3.1.2 | [Treatment Options](./functions/treatment-options.md) | Define multiple treatment option alternatives | 📋 Planned | Critical |
| 3.1.3 | [Case Presentation](./functions/case-presentation.md) | Build and deliver case presentations | 📋 Planned | High |
| 3.1.4 | [Case Acceptance](./functions/case-acceptance.md) | Capture treatment acceptance and consents | 📋 Planned | Critical |
| 3.1.5 | [Phase Management](./functions/phase-management.md) | Define and track treatment phases | 📋 Planned | High |
| 3.1.6 | [Plan Modifications](./functions/plan-modifications.md) | Manage treatment plan changes and versioning | 📋 Planned | Medium |

---

## Function Details

### 3.1.1 Treatment Plan Creation

**Purpose**: Create comprehensive treatment plans with diagnosis, goals, and clinical details.

**Key Capabilities**:
- Create new treatment plans for patients
- Record chief complaint and diagnosis
- Define treatment goals and objectives
- Assign primary and supervising providers
- Set estimated duration and visit count
- Link to diagnostic records and imaging
- Support all treatment plan types

**Treatment Plan Types**:
| Type | Description | Typical Duration | Common Use Cases |
|------|-------------|------------------|------------------|
| COMPREHENSIVE | Full orthodontic treatment | 18-24 months | Crowding, spacing, bite issues |
| LIMITED | Targeted treatment | 6-12 months | Single arch, specific issue |
| PHASE_I | Early interceptive treatment | 9-12 months | Mixed dentition, growth modification |
| PHASE_II | Treatment following Phase I | 12-18 months | Permanent dentition |
| INVISALIGN | Invisalign aligner treatment | 12-24 months | Clear aligner candidates |
| CLEAR_ALIGNER | Other aligner systems | 12-24 months | ClearCorrect, other systems |
| SURGICAL | Orthognathic surgery cases | 24-36 months | Skeletal discrepancies |
| ADULT_LIMITED | Adult-focused limited treatment | 6-18 months | Pre-restorative, esthetic |
| RETENTION_ONLY | Retention phase only | Ongoing | Transfer patients, relapse |

**User Stories**:
- As a **doctor**, I want to create a treatment plan documenting diagnosis and goals
- As a **doctor**, I want to select the appropriate treatment type for the case
- As a **treatment coordinator**, I want to view treatment plans for case presentation

---

### 3.1.2 Treatment Options

**Purpose**: Define multiple treatment alternatives for patient consideration.

**Key Capabilities**:
- Create multiple treatment options per plan
- Specify appliance type for each option
- Set estimated duration and cost per option
- Mark recommended option with reasoning
- Compare options side-by-side
- Record patient's selected option
- Integrate with financial estimates

**Appliance System Options**:
| System | Category | Description |
|--------|----------|-------------|
| TRADITIONAL_METAL | Brackets | Standard metal twin brackets |
| CERAMIC_CLEAR | Brackets | Tooth-colored ceramic brackets |
| SELF_LIGATING_DAMON | Brackets | Damon system self-ligating |
| LINGUAL_INCOGNITO | Brackets | Incognito lingual brackets |
| INVISALIGN | Aligners | Invisalign clear aligners |
| CLEAR_CORRECT | Aligners | ClearCorrect aligners |
| FUNCTIONAL_APPLIANCE | Functional | Herbst, MARA, Twin Block |
| EXPANDER | Orthopedic | Palatal expansion |

**User Stories**:
- As a **doctor**, I want to define multiple treatment options so patients can choose
- As a **treatment coordinator**, I want to compare options during presentation
- As a **patient**, I want to understand the differences between treatment options

---

### 3.1.3 Case Presentation

**Purpose**: Build and deliver professional case presentations to patients and families.

**Key Capabilities**:
- Schedule case presentation appointments
- Build visual presentation with before images
- Include treatment simulation/visualization
- Present multiple treatment options
- Record presentation attendees and outcome
- Support virtual and in-person presentations
- Track follow-up requirements
- Generate presentation materials

**Presentation Components**:
- Patient diagnostic images (photos, X-rays)
- Treatment simulation/visualization
- Treatment options comparison
- Financial estimates breakdown
- Timeline visualization
- FAQ and educational content

**Presentation Outcomes**:
| Outcome | Description | Follow-up Action |
|---------|-------------|------------------|
| ACCEPTED | Patient accepts treatment | Proceed to acceptance workflow |
| DECLINED | Patient declines treatment | Document reason, close case |
| THINKING | Patient needs time to decide | Schedule follow-up |
| FOLLOW_UP_NEEDED | Additional consultation required | Schedule next meeting |
| SECOND_OPINION | Patient seeking second opinion | Document, follow up later |

**User Stories**:
- As a **treatment coordinator**, I want to build professional presentations
- As a **doctor**, I want to present treatment options clearly
- As a **clinic admin**, I want to track presentation outcomes for reporting

---

### 3.1.4 Case Acceptance

**Purpose**: Capture treatment acceptance with proper consents and agreements.

**Key Capabilities**:
- Record selected treatment option
- Capture patient/guardian digital signatures
- Obtain informed consent acknowledgment
- Document financial agreement terms
- Record insurance verification status
- Generate treatment contracts
- Integrate with financial setup
- Comply with consent regulations

**Required Consents**:
| Consent Type | Description | Required For |
|--------------|-------------|--------------|
| Informed Consent | Treatment risks/benefits acknowledgment | All treatment |
| Financial Agreement | Payment terms and responsibilities | All treatment |
| HIPAA Acknowledgment | Privacy practices notice | All treatment |
| Photo/Records Release | Permission for photos/records use | Optional |
| Minor Treatment | Guardian consent for minors | Minor patients |

**Acceptance Workflow**:
1. Patient selects treatment option
2. Review and sign informed consent
3. Review and sign financial agreement
4. Verify insurance coverage
5. Collect down payment
6. Schedule treatment start

**User Stories**:
- As a **treatment coordinator**, I want to capture all required signatures digitally
- As a **clinic admin**, I want to ensure all consents are documented
- As a **billing specialist**, I want to see financial agreement terms

---

### 3.1.5 Phase Management

**Purpose**: Define and track treatment phases within a treatment plan.

**Key Capabilities**:
- Define treatment phases with objectives
- Set planned start and end dates per phase
- Track phase progress and completion
- Manage phase transitions
- Support standard phase templates
- Customize phases per treatment type
- Link phases to milestones

**Standard Treatment Phases**:
| Phase | Description | Typical Duration |
|-------|-------------|------------------|
| INITIAL_ALIGNMENT | Initial leveling and alignment | 4-6 months |
| LEVELING | Continued leveling of arches | 2-4 months |
| SPACE_CLOSURE | Close extraction spaces | 6-12 months |
| FINISHING | Final detailing and adjustments | 3-6 months |
| DETAILING | Fine-tune occlusion and esthetics | 2-4 months |
| RETENTION | Post-treatment retention phase | Ongoing |
| PRE_SURGICAL | Preparation for orthognathic surgery | 12-18 months |
| POST_SURGICAL | Treatment after surgery | 6-12 months |
| OBSERVATION | Monitoring period (Phase I/II gap) | Variable |

**User Stories**:
- As a **doctor**, I want to define phases for the treatment plan
- As a **clinical staff**, I want to see which phase a patient is in
- As a **doctor**, I want to mark phases complete as treatment progresses

---

### 3.1.6 Plan Modifications

**Purpose**: Manage changes to treatment plans with version control.

**Key Capabilities**:
- Create new version for significant changes
- Document reason for modification
- Track modification history
- Require patient acknowledgment for changes
- Update financial estimates as needed
- Maintain audit trail of changes
- Support mid-treatment plan changes

**Modification Types**:
| Type | Description | Requires New Consent |
|------|-------------|---------------------|
| Minor Adjustment | Small timing or detail changes | No |
| Phase Addition | Adding treatment phase | Possibly |
| Appliance Change | Changing appliance type | Yes |
| Duration Extension | Extending treatment time | Financial update |
| Treatment Upgrade | Adding complexity | Yes |
| Treatment Downgrade | Reducing scope | Possibly |

**User Stories**:
- As a **doctor**, I want to modify a treatment plan and document the reason
- As a **clinic admin**, I want to track all treatment plan changes
- As a **patient**, I want to understand why my treatment changed

---

## Data Model

```prisma
model TreatmentPlan {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Plan Identification
  planNumber    String   @unique
  planName      String
  planType      TreatmentPlanType

  // Status
  status        TreatmentPlanStatus @default(DRAFT)
  version       Int      @default(1)
  isActive      Boolean  @default(false)

  // Dates
  createdDate   DateTime @default(now())
  presentedDate DateTime?
  acceptedDate  DateTime?
  startDate     DateTime?
  estimatedEndDate DateTime?
  actualEndDate DateTime?

  // Clinical Details
  chiefComplaint String?
  diagnosis     String[]
  treatmentGoals String[]

  // Providers
  primaryProviderId String  @db.ObjectId
  supervisingProviderId String? @db.ObjectId

  // Estimates
  estimatedDuration Int?    // months
  estimatedVisits Int?
  totalFee      Decimal?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Audit
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  primaryProvider StaffProfile @relation(fields: [primaryProviderId], references: [id])
  options       TreatmentOption[]
  phases        TreatmentPhase[]
  presentations CasePresentation[]
  acceptance    CaseAcceptance?

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
  @@index([primaryProviderId])
}

model TreatmentOption {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  treatmentPlanId String @db.ObjectId

  // Option Details
  optionNumber  Int
  optionName    String
  description   String?

  // Appliance Type
  applianceType ApplianceSystemType
  applianceDetails Json?

  // Treatment Details
  estimatedDuration Int?
  estimatedVisits Int?
  complexity    ComplexityLevel @default(MODERATE)

  // Financial
  totalFee      Decimal
  insuranceEstimate Decimal?
  patientEstimate Decimal?

  // Recommendation
  isRecommended Boolean  @default(false)
  recommendationReason String?

  // Selection
  isSelected    Boolean  @default(false)
  selectedDate  DateTime?
  selectedBy    String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  treatmentPlan TreatmentPlan @relation(fields: [treatmentPlanId], references: [id])

  @@index([clinicId])
  @@index([treatmentPlanId])
}

model TreatmentPhase {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  treatmentPlanId String @db.ObjectId

  // Phase Details
  phaseNumber   Int
  phaseName     String
  phaseType     TreatmentPhaseType
  description   String?
  objectives    String[]

  // Status
  status        PhaseStatus @default(NOT_STARTED)

  // Dates
  plannedStartDate DateTime?
  plannedEndDate DateTime?
  actualStartDate DateTime?
  actualEndDate DateTime?

  // Progress
  estimatedVisits Int?
  completedVisits Int     @default(0)
  progressPercent Int     @default(0)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  treatmentPlan TreatmentPlan @relation(fields: [treatmentPlanId], references: [id])

  @@index([clinicId])
  @@index([treatmentPlanId])
  @@index([status])
}

model CasePresentation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  treatmentPlanId String @db.ObjectId

  // Presentation Details
  presentationDate DateTime
  presentationType PresentationType @default(IN_PERSON)
  presentedBy   String   @db.ObjectId

  // Attendees
  attendees     String[]
  patientPresent Boolean @default(true)
  responsiblePartyPresent Boolean @default(false)

  // Content
  slidesUrl     String?
  notesUrl      String?
  recordingUrl  String?

  // Outcome
  outcome       PresentationOutcome?
  followUpDate  DateTime?
  followUpNotes String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  treatmentPlan TreatmentPlan @relation(fields: [treatmentPlanId], references: [id])
  presenter     StaffProfile @relation(fields: [presentedBy], references: [id])

  @@index([clinicId])
  @@index([treatmentPlanId])
}

model CaseAcceptance {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  treatmentPlanId String @db.ObjectId @unique

  // Acceptance Details
  acceptedDate  DateTime
  acceptedOptionId String @db.ObjectId

  // Signatures
  patientSignature String?
  patientSignedAt DateTime?
  responsiblePartySignature String?
  responsiblePartySignedAt DateTime?

  // Consents
  informedConsentSigned Boolean @default(false)
  financialAgreementSigned Boolean @default(false)
  hipaaAcknowledged Boolean @default(false)

  // Financial Agreement
  totalFee      Decimal
  downPayment   Decimal?
  monthlyPayment Decimal?
  paymentTerms  Int?

  // Insurance
  insuranceVerified Boolean @default(false)
  estimatedInsurance Decimal?
  estimatedPatientResponsibility Decimal?

  // Documents
  contractUrl   String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  processedBy   String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  treatmentPlan TreatmentPlan @relation(fields: [treatmentPlanId], references: [id])

  @@index([clinicId])
  @@index([treatmentPlanId])
}

enum TreatmentPlanType {
  COMPREHENSIVE
  LIMITED
  PHASE_I
  PHASE_II
  INVISALIGN
  CLEAR_ALIGNER
  SURGICAL
  ADULT_LIMITED
  RETENTION_ONLY
}

enum TreatmentPlanStatus {
  DRAFT
  PRESENTED
  ACCEPTED
  ACTIVE
  ON_HOLD
  COMPLETED
  DISCONTINUED
  TRANSFERRED
}

enum ApplianceSystemType {
  TRADITIONAL_METAL
  CERAMIC_CLEAR
  SELF_LIGATING_DAMON
  SELF_LIGATING_OTHER
  LINGUAL_INCOGNITO
  LINGUAL_OTHER
  INVISALIGN
  CLEAR_CORRECT
  OTHER_ALIGNER
  FUNCTIONAL_APPLIANCE
  EXPANDER
  HEADGEAR
  RETAINER_ONLY
}

enum ComplexityLevel {
  SIMPLE
  MODERATE
  COMPLEX
  SEVERE
}

enum TreatmentPhaseType {
  INITIAL_ALIGNMENT
  LEVELING
  SPACE_CLOSURE
  FINISHING
  DETAILING
  RETENTION
  PRE_SURGICAL
  POST_SURGICAL
  PHASE_I_ACTIVE
  PHASE_I_RETENTION
  OBSERVATION
  CUSTOM
}

enum PhaseStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

enum PresentationType {
  IN_PERSON
  VIRTUAL
  PHONE
  EMAIL
}

enum PresentationOutcome {
  ACCEPTED
  DECLINED
  THINKING
  FOLLOW_UP_NEEDED
  SECOND_OPINION
}
```

---

## API Endpoints

### Treatment Plans

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans` | List treatment plans | `treatment:read` |
| GET | `/api/treatment-plans/:id` | Get treatment plan details | `treatment:read` |
| POST | `/api/treatment-plans` | Create treatment plan | `treatment:create` |
| PUT | `/api/treatment-plans/:id` | Update treatment plan | `treatment:update` |
| DELETE | `/api/treatment-plans/:id` | Delete treatment plan (soft) | `treatment:delete` |
| POST | `/api/treatment-plans/:id/duplicate` | Duplicate treatment plan | `treatment:create` |
| GET | `/api/patients/:patientId/treatment-plans` | Get patient's treatment plans | `treatment:read` |

### Treatment Options

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/options` | List treatment options | `treatment:read` |
| POST | `/api/treatment-plans/:id/options` | Add treatment option | `treatment:create` |
| PUT | `/api/treatment-options/:optionId` | Update treatment option | `treatment:update` |
| DELETE | `/api/treatment-options/:optionId` | Remove treatment option | `treatment:update` |
| POST | `/api/treatment-options/:optionId/select` | Select treatment option | `treatment:update` |
| POST | `/api/treatment-options/:optionId/recommend` | Mark as recommended | `treatment:update` |

### Case Presentations

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/presentations` | List case presentations | `treatment:read` |
| POST | `/api/treatment-plans/:id/presentations` | Create case presentation | `treatment:create` |
| PUT | `/api/case-presentations/:presentationId` | Update presentation | `treatment:update` |
| POST | `/api/case-presentations/:presentationId/outcome` | Record presentation outcome | `treatment:update` |
| GET | `/api/case-presentations/pending` | Get pending follow-ups | `treatment:read` |

### Case Acceptance

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/acceptance` | Get case acceptance | `treatment:read` |
| POST | `/api/treatment-plans/:id/accept` | Accept treatment | `treatment:update` |
| PUT | `/api/case-acceptance/:acceptanceId` | Update acceptance details | `treatment:update` |
| POST | `/api/case-acceptance/:acceptanceId/sign` | Record signature | `treatment:update` |
| GET | `/api/case-acceptance/:acceptanceId/contract` | Generate contract PDF | `treatment:read` |

### Treatment Phases

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/phases` | List treatment phases | `treatment:read` |
| POST | `/api/treatment-plans/:id/phases` | Add treatment phase | `treatment:create` |
| PUT | `/api/treatment-phases/:phaseId` | Update phase | `treatment:update` |
| DELETE | `/api/treatment-phases/:phaseId` | Remove phase | `treatment:update` |
| POST | `/api/treatment-phases/:phaseId/start` | Start phase | `treatment:update` |
| POST | `/api/treatment-phases/:phaseId/complete` | Complete phase | `treatment:update` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `TreatmentPlanList` | List patient treatment plans | `components/treatment/plans/` |
| `TreatmentPlanBuilder` | Create/edit treatment plans | `components/treatment/plans/` |
| `TreatmentPlanView` | View treatment plan details | `components/treatment/plans/` |
| `TreatmentPlanSummary` | Summary card for treatment plan | `components/treatment/plans/` |
| `TreatmentTypeSelector` | Select treatment plan type | `components/treatment/plans/` |
| `DiagnosisEntry` | Enter diagnosis information | `components/treatment/plans/` |
| `TreatmentGoalsList` | Manage treatment goals | `components/treatment/plans/` |
| `TreatmentOptionCard` | Display treatment option | `components/treatment/options/` |
| `TreatmentOptionForm` | Create/edit treatment option | `components/treatment/options/` |
| `TreatmentOptionCompare` | Compare treatment options | `components/treatment/options/` |
| `ApplianceSystemPicker` | Select appliance system | `components/treatment/options/` |
| `FeeEstimateDisplay` | Show fee estimates | `components/treatment/options/` |
| `CasePresentationBuilder` | Build case presentation | `components/treatment/presentation/` |
| `CasePresentationViewer` | View/present case | `components/treatment/presentation/` |
| `PresentationSlideshow` | Presentation mode display | `components/treatment/presentation/` |
| `PresentationOutcomeForm` | Record presentation outcome | `components/treatment/presentation/` |
| `CaseAcceptanceWizard` | Step-by-step acceptance | `components/treatment/acceptance/` |
| `ConsentSignature` | Digital signature capture | `components/treatment/acceptance/` |
| `FinancialAgreementForm` | Financial agreement entry | `components/treatment/acceptance/` |
| `ContractPreview` | Preview treatment contract | `components/treatment/acceptance/` |
| `PhaseTimeline` | Visual phase timeline | `components/treatment/phases/` |
| `PhaseCard` | Display phase details | `components/treatment/phases/` |
| `PhaseEditor` | Edit phase details | `components/treatment/phases/` |
| `PhaseProgressBar` | Phase completion progress | `components/treatment/phases/` |

---

## Business Rules

1. **Plan Creation**: Only doctors can create treatment plans; requires patient record
2. **Single Active Plan**: Only one active treatment plan per patient at a time
3. **Multiple Options**: Treatment plans should have at least one option defined
4. **Recommended Option**: Only one option can be marked as recommended per plan
5. **Presentation Required**: Case presentation should be documented before acceptance
6. **Consent Requirements**: All required consents must be signed before treatment start
7. **Financial Agreement**: Financial terms must be agreed before plan activation
8. **Provider Assignment**: Primary provider required; supervising provider for certain cases
9. **Plan Versioning**: Significant changes create new version; original preserved
10. **Phase Sequence**: Phases should be completed in defined order (with exceptions)

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Patient Management | Required | Patient records for treatment association |
| Staff Management | Required | Provider profiles for plan assignment |
| Financial Management | Required | Fee estimates and payment setup |
| Imaging Management | Optional | Diagnostic images for presentation |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Document Storage | Required | Contract and consent document storage |
| Signature Service | Required | Digital signature capture and storage |
| PDF Generation | Required | Contract and presentation generation |
| Email Service | Optional | Sending contracts and follow-ups |

---

## Related Documentation

- [Parent: Treatment Management](../../)
- [Clinical Documentation](../clinical-documentation/)
- [Appliance Management](../appliance-management/)
- [Treatment Tracking](../treatment-tracking/)
- [Financial Management](../../../financial-management/) - Fee integration
- [Imaging Management](../../../imaging-management/) - Diagnostic images
- [AUTH-GUIDE](../../../../guides/AUTH-GUIDE.md) - Authorization patterns

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
