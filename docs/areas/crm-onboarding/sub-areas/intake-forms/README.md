# Intake Forms

> **Area**: [CRM & Onboarding](../../)
>
> **Sub-Area**: 8.2 Intake Forms
>
> **Purpose**: Digital collection of patient information, medical/dental history, insurance details, and consent prior to treatment

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [CRM & Onboarding](../../) |
| **Dependencies** | Auth, Patient Records, Compliance |
| **Last Updated** | 2024-11-26 |

---

## Overview

Intake Forms digitizes the new patient paperwork process, replacing clipboards and paper forms with a modern digital experience. This sub-area enables patients (or parents of minor patients) to complete required forms before their appointment, saving chair time and reducing data entry errors.

### Orthodontic-Specific Considerations

- **Minor Patients**: Most orthodontic patients are minors, requiring parent/guardian completion
- **Comprehensive Medical History**: Orthodontic treatment interacts with growth, development, and medications
- **Multiple Form Types**: Medical history, dental history, photo consent, financial policies, treatment consent
- **Insurance Complexity**: Need both subscriber and patient information for dependent coverage
- **Long Treatment Duration**: Forms may need annual updates during multi-year treatment

### Key Capabilities

- Flexible form template builder with conditional logic
- Patient-facing portal for form completion
- Comprehensive medical and dental history collection
- Insurance information capture with image upload
- Digital consent collection with e-signatures
- Form completion tracking and reminders
- Automatic expiration and renewal workflows

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 8.2.1 | [Form Template Builder](./functions/form-template-builder.md) | Create and manage intake form templates | 📋 Planned | High |
| 8.2.2 | [Patient Form Portal](./functions/patient-form-portal.md) | Patient-facing form completion interface | 📋 Planned | Critical |
| 8.2.3 | [Medical History Collection](./functions/medical-history.md) | Capture medical history and health information | 📋 Planned | Critical |
| 8.2.4 | [Insurance Information Capture](./functions/insurance-capture.md) | Collect insurance details and card images | 📋 Planned | High |
| 8.2.5 | [Consent Form Management](./functions/consent-collection.md) | Digital consent and e-signature collection | 📋 Planned | Critical |
| 8.2.6 | [Completion Tracking](./functions/completion-tracking.md) | Track form status and send reminders | 📋 Planned | High |

---

## Function Details

### 8.2.1 Form Template Builder

**Purpose**: Create and customize intake form templates for different patient scenarios.

**Key Capabilities**:
- Drag-and-drop form builder interface
- Multiple field types (text, select, date, checkbox, signature, file upload)
- Conditional logic (show/hide fields based on answers)
- Form sections with progress indicators
- Template versioning with change tracking
- Clone and modify existing templates
- Preview mode for testing

**Field Types Supported**:
| Type | Description |
|------|-------------|
| Text | Single line text input |
| Textarea | Multi-line text input |
| Number | Numeric input with validation |
| Date | Date picker with format options |
| Select | Dropdown selection |
| Multi-select | Multiple choice checkboxes |
| Radio | Single choice radio buttons |
| Checkbox | Boolean yes/no |
| File Upload | Image/document upload |
| Signature | Digital signature capture |
| Information | Read-only text/instructions |
| Section Header | Visual grouping |

**User Stories**:
- As a **clinic admin**, I want to customize our intake forms to match our practice's needs
- As a **clinic admin**, I want to add conditional questions so forms are relevant to each patient
- As a **compliance officer**, I want to track changes to form templates for audit purposes

---

### 8.2.2 Patient Form Portal

**Purpose**: Provide a secure, user-friendly interface for patients/parents to complete intake forms.

**Key Capabilities**:
- Mobile-responsive design (most complete on phones)
- Secure access via unique link or patient portal login
- Save progress and continue later
- Form validation with clear error messages
- Language support (English, French, Spanish)
- Accessibility compliance (WCAG 2.1 AA)
- Confirmation and receipt after completion

**Access Methods**:
- Unique secure link sent via SMS or email
- Patient portal login (for returning patients)
- In-office tablet/kiosk for walk-ins
- QR code scanning from appointment reminder

**User Stories**:
- As a **patient**, I want to complete forms on my phone before my appointment
- As a **parent**, I want to save my progress and finish later if I need to look up information
- As a **front desk**, I want to send a form link to patients who haven't completed paperwork

---

### 8.2.3 Medical History Collection

**Purpose**: Capture comprehensive medical and dental history relevant to orthodontic treatment.

**Key Capabilities**:
- Structured medical history questionnaire
- Dental history specific to orthodontics
- Medication list with dosages
- Allergy documentation with severity
- Previous orthodontic treatment history
- Family dental history
- Integration with patient medical record

**Medical History Sections**:
1. **General Health**
   - Current health conditions
   - Hospitalizations and surgeries
   - Chronic conditions (diabetes, heart conditions, etc.)

2. **Medications**
   - Current medications with dosages
   - Over-the-counter medications
   - Supplements

3. **Allergies**
   - Medication allergies
   - Latex allergy (important for orthodontics)
   - Metal allergies (nickel sensitivity)

4. **Dental History**
   - Previous orthodontic treatment
   - Current dental concerns
   - Jaw problems or TMJ issues
   - Teeth grinding or clenching
   - Oral habits (thumb sucking, tongue thrust)

5. **For Minors**
   - Growth and development history
   - Tonsil/adenoid status
   - Speech therapy history
   - Expected growth considerations

**User Stories**:
- As a **doctor**, I want to see relevant medical history before examining a patient
- As a **clinical staff**, I want to know about allergies before seating a patient
- As a **patient**, I want to update my medical history when things change

---

### 8.2.4 Insurance Information Capture

**Purpose**: Collect insurance information and documentation for verification and billing.

**Key Capabilities**:
- Subscriber and patient information fields
- Insurance card image upload (front and back)
- Support for primary and secondary insurance
- Employer information for group plans
- Previous insurance documentation for mid-treatment transfers
- Integration with eligibility verification

**Information Collected**:
| Field | Purpose |
|-------|---------|
| Insurance company name | Identify carrier |
| Group/policy number | Locate plan |
| Subscriber ID/Member ID | Identify coverage |
| Subscriber name and DOB | Verify subscriber |
| Subscriber relationship | Establish patient relationship |
| Employer name | Group plan identification |
| Employer address | Claims submission |
| Card images | Reference and verification |

**User Stories**:
- As a **front desk**, I want insurance info before the appointment so I can verify benefits
- As a **billing staff**, I want clear card images for claims processing
- As a **patient**, I want to easily add a secondary insurance if I have dual coverage

---

### 8.2.5 Consent Form Management

**Purpose**: Collect legally-binding digital signatures on required consent forms.

**Key Capabilities**:
- Digital signature capture (finger, stylus, or mouse)
- Multiple signature types (patient, guardian, witness)
- Timestamp and IP logging for legal validity
- PDF generation with embedded signatures
- Consent expiration tracking
- Re-consent workflows for expiring consents
- Integration with Compliance & Documentation area

**Standard Consent Forms**:
1. **General Consent for Treatment**
   - Consent to examination
   - Consent to diagnostic imaging
   - General treatment authorization

2. **Financial Policy Agreement**
   - Payment policies
   - Cancellation/no-show policies
   - Collection procedures

3. **HIPAA Notice of Privacy Practices**
   - Acknowledgment of receipt
   - Authorization for communication

4. **Photo/Imaging Consent**
   - Clinical photography consent
   - Marketing use authorization (optional)

5. **Treatment-Specific Consent** (after treatment presentation)
   - Informed consent for orthodontic treatment
   - Risks and alternatives acknowledgment
   - Treatment estimate acknowledgment

**Signature Requirements**:
- Patients 18+ sign for themselves
- Minors require parent/guardian signature
- Some forms require patient AND parent signature
- Witness signature for certain consents

**User Stories**:
- As a **patient**, I want to sign forms digitally without printing or scanning
- As a **compliance officer**, I want signed consents stored securely with audit trails
- As a **front desk**, I want to know which patients still need to sign consents

---

### 8.2.6 Completion Tracking

**Purpose**: Monitor form completion status and ensure all required forms are complete before appointments.

**Key Capabilities**:
- Dashboard of pending/incomplete forms
- Automatic reminders (email and SMS)
- Completion status by patient and form type
- Due date tracking relative to appointments
- Escalation for chronically incomplete forms
- Batch reminder sending
- Integration with appointment workflow

**Form Status States**:
| Status | Description |
|--------|-------------|
| Not Started | Forms sent but not opened |
| In Progress | Partially completed, saved |
| Submitted | All required fields complete |
| Needs Review | Flagged for staff review |
| Approved | Reviewed and accepted |
| Expired | Past expiration date |

**Reminder Schedule**:
- Forms sent when appointment scheduled
- Reminder #1: 7 days before appointment
- Reminder #2: 3 days before appointment
- Reminder #3: 1 day before appointment
- Final: Morning of appointment (urgent)

**User Stories**:
- As a **front desk**, I want to see which patients haven't completed forms before their appointment
- As a **patient**, I want reminders so I don't forget to complete paperwork
- As a **clinic admin**, I want to customize reminder timing and messaging

---

## Data Model

```prisma
model IntakeFormTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  slug          String
  description   String?
  category      FormCategory
  version       Int      @default(1)

  // Form structure (JSON schema)
  schema        Json     // Form fields and structure
  uiSchema      Json?    // UI customization

  // Settings
  isActive      Boolean  @default(true)
  isRequired    Boolean  @default(false)
  requiresSignature Boolean @default(false)
  expiresAfterDays  Int?   // Auto-expire after X days

  // Applicable to
  patientTypes  PatientType[]  // MINOR, ADULT, ALL

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Audit
  createdBy     String?  @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  submissions   IntakeSubmission[]

  @@unique([clinicId, slug, version])
  @@index([clinicId])
  @@index([category])
  @@index([isActive])
}

enum FormCategory {
  PATIENT_INFO
  MEDICAL_HISTORY
  DENTAL_HISTORY
  INSURANCE
  CONSENT
  FINANCIAL
  CUSTOM
}

enum PatientType {
  MINOR
  ADULT
  ALL
}

model IntakeSubmission {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  templateId    String   @db.ObjectId
  patientId     String?  @db.ObjectId  // Null until patient created
  leadId        String?  @db.ObjectId  // If from lead before conversion

  // Submission status
  status        SubmissionStatus @default(NOT_STARTED)

  // Form data (encrypted JSON)
  formData      Json
  partialData   Json?    // For in-progress saves

  // Access token for secure link
  accessToken   String   @unique
  accessTokenExpires DateTime

  // Submission details
  startedAt     DateTime?
  submittedAt   DateTime?
  submittedByIp String?
  submittedByDevice String?

  // Review
  reviewedAt    DateTime?
  reviewedBy    String?  @db.ObjectId
  reviewNotes   String?

  // Expiration
  expiresAt     DateTime?
  renewedFrom   String?  @db.ObjectId  // Previous submission if renewed

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  template      IntakeFormTemplate @relation(fields: [templateId], references: [id])
  patient       Patient? @relation(fields: [patientId], references: [id])
  signatures    FormSignature[]

  @@index([clinicId])
  @@index([patientId])
  @@index([leadId])
  @@index([status])
  @@index([accessToken])
}

enum SubmissionStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  NEEDS_REVIEW
  APPROVED
  EXPIRED
  SUPERSEDED
}

model FormSignature {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  submissionId  String   @db.ObjectId

  // Signer info
  signerType    SignerType
  signerName    String
  signerRelationship String?  // For guardian signatures

  // Signature data
  signatureData String   // Base64 encoded signature image
  signedAt      DateTime
  signedFromIp  String
  signedFromDevice String?

  // Consent specifics
  consentText   String?  // What they agreed to
  consentVersion String?

  // Relations
  submission    IntakeSubmission @relation(fields: [submissionId], references: [id])

  @@index([submissionId])
}

enum SignerType {
  PATIENT
  GUARDIAN
  PARENT
  SPOUSE
  WITNESS
}

model MedicalHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Version tracking
  version       Int      @default(1)
  isActive      Boolean  @default(true)

  // General health
  generalHealth       String?  // Excellent, Good, Fair, Poor
  underPhysicianCare  Boolean  @default(false)
  physicianName       String?
  physicianPhone      String?
  lastPhysicalExam    DateTime?

  // Conditions (stored as JSON for flexibility)
  conditions          Json     // { heartDisease: false, diabetes: true, ... }
  conditionNotes      String?

  // Medications
  medications         Medication[]

  // Allergies
  allergies           Allergy[]
  hasLatexAllergy     Boolean  @default(false)
  hasMetalAllergy     Boolean  @default(false)

  // Hospitalization
  hospitalizations    Hospitalization[]

  // For minors
  birthComplications  String?
  developmentalConcerns String?
  currentGrowthStage  String?

  // Source submission
  submissionId        String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
}

type Medication {
  name          String
  dosage        String?
  frequency     String?
  prescribedFor String?
}

type Allergy {
  allergen      String
  reaction      String?
  severity      AllergySeverity
}

enum AllergySeverity {
  MILD
  MODERATE
  SEVERE
  LIFE_THREATENING
}

type Hospitalization {
  reason        String
  date          DateTime?
  hospital      String?
  notes         String?
}

model DentalHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Previous dental care
  currentDentist        String?
  dentistPhone          String?
  lastDentalVisit       DateTime?
  regularDentalCare     Boolean  @default(false)

  // Previous orthodontic
  previousOrtho         Boolean  @default(false)
  previousOrthoDoctor   String?
  previousOrthoStart    DateTime?
  previousOrthoEnd      DateTime?
  previousOrthoType     String?  // Braces, Invisalign, etc.
  previousOrthoReason   String?  // Why ended

  // Current concerns
  chiefConcern          String?
  concernDetails        String?

  // Habits
  thumbSucking          Boolean  @default(false)
  fingerSucking         Boolean  @default(false)
  tongueTrust           Boolean  @default(false)
  mouthBreathing        Boolean  @default(false)
  nailBiting            Boolean  @default(false)
  lipBiting             Boolean  @default(false)
  bruxism               Boolean  @default(false)  // Grinding/clenching

  // TMJ
  tmjSymptoms           Boolean  @default(false)
  tmjSymptomDetails     String?
  jawPainClicking       Boolean  @default(false)
  limitedOpening        Boolean  @default(false)

  // Other
  speechProblems        Boolean  @default(false)
  breathingProblems     Boolean  @default(false)
  sleepApnea            Boolean  @default(false)

  // Tonsils/Adenoids (important for growth)
  tonsilsRemoved        Boolean  @default(false)
  adenoidsRemoved       Boolean  @default(false)

  // Injuries
  facialInjury          Boolean  @default(false)
  facialInjuryDetails   String?
  dentalInjury          Boolean  @default(false)
  dentalInjuryDetails   String?

  // Source submission
  submissionId          String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
}

model PatientInsuranceInfo {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Insurance order
  priority      InsurancePriority @default(PRIMARY)

  // Subscriber info
  subscriberId          String
  subscriberFirstName   String
  subscriberLastName    String
  subscriberDob         DateTime
  subscriberRelationship SubscriberRelationship

  // Insurance company
  insuranceCompanyName  String
  insuranceCompanyId    String?  @db.ObjectId  // Link to InsuranceCompany if exists
  groupNumber           String?
  planName              String?

  // Employer
  employerName          String?
  employerAddress       String?
  employerPhone         String?

  // Card images
  cardFrontUrl          String?
  cardBackUrl           String?

  // Verification
  verifiedAt            DateTime?
  verifiedBy            String?  @db.ObjectId
  verificationStatus    VerificationStatus @default(PENDING)
  verificationNotes     String?

  // Source submission
  submissionId          String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([priority])
}

enum InsurancePriority {
  PRIMARY
  SECONDARY
  TERTIARY
}

enum SubscriberRelationship {
  SELF
  SPOUSE
  CHILD
  OTHER
}

enum VerificationStatus {
  PENDING
  VERIFIED
  FAILED
  NEEDS_UPDATE
}

model FormReminder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  submissionId  String   @db.ObjectId

  // Reminder details
  reminderType  ReminderType
  scheduledFor  DateTime
  sentAt        DateTime?
  deliveryMethod DeliveryMethod
  deliveryAddress String  // Email or phone

  // Status
  status        ReminderStatus @default(PENDING)
  errorMessage  String?

  // Timestamps
  createdAt     DateTime @default(now())

  @@index([submissionId])
  @@index([status])
  @@index([scheduledFor])
}

enum ReminderType {
  INITIAL
  FIRST_REMINDER
  SECOND_REMINDER
  FINAL_REMINDER
  EXPIRED_NOTICE
  RENEWAL_NOTICE
}

enum DeliveryMethod {
  EMAIL
  SMS
  BOTH
}

enum ReminderStatus {
  PENDING
  SENT
  FAILED
  CANCELLED
}
```

---

## API Endpoints

### Form Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/intake/templates` | List form templates | `intake:read` |
| GET | `/api/intake/templates/:id` | Get template details | `intake:read` |
| POST | `/api/intake/templates` | Create template | `intake:configure` |
| PUT | `/api/intake/templates/:id` | Update template | `intake:configure` |
| POST | `/api/intake/templates/:id/clone` | Clone template | `intake:configure` |
| GET | `/api/intake/templates/:id/preview` | Preview template | `intake:read` |

### Submissions

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/intake/submissions` | List submissions | `intake:read` |
| GET | `/api/intake/submissions/:id` | Get submission | `intake:read` |
| POST | `/api/intake/submissions` | Create submission request | `intake:create` |
| POST | `/api/intake/submissions/:id/send` | Send form link to patient | `intake:create` |
| POST | `/api/intake/submissions/:id/approve` | Approve submission | `intake:approve` |
| POST | `/api/intake/submissions/:id/reject` | Reject/request changes | `intake:approve` |

### Patient Form Portal (Public)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/portal/forms/:token` | Load form by access token | Token |
| POST | `/api/portal/forms/:token/save` | Save progress | Token |
| POST | `/api/portal/forms/:token/submit` | Submit completed form | Token |
| POST | `/api/portal/forms/:token/sign` | Submit signature | Token |

### Medical/Dental History

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/patients/:id/medical-history` | Get medical history | `patient:read` |
| PUT | `/api/patients/:id/medical-history` | Update medical history | `patient:update` |
| GET | `/api/patients/:id/dental-history` | Get dental history | `patient:read` |
| PUT | `/api/patients/:id/dental-history` | Update dental history | `patient:update` |

### Insurance Information

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/patients/:id/insurance` | List patient insurance | `patient:read` |
| POST | `/api/patients/:id/insurance` | Add insurance | `intake:update` |
| PUT | `/api/patients/:id/insurance/:insId` | Update insurance | `intake:update` |
| POST | `/api/patients/:id/insurance/:insId/verify` | Trigger verification | `insurance:verify` |

### Reminders

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/intake/reminders` | List pending reminders | `intake:read` |
| POST | `/api/intake/submissions/:id/remind` | Send manual reminder | `intake:create` |
| POST | `/api/intake/reminders/batch` | Send batch reminders | `intake:admin` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `FormTemplateBuilder` | Visual form designer | `components/intake/` |
| `FieldPalette` | Draggable field types | `components/intake/` |
| `FormPreview` | Template preview | `components/intake/` |
| `PatientFormPortal` | Public form completion UI | `components/portal/` |
| `FormRenderer` | Render form from schema | `components/intake/` |
| `SignaturePad` | Capture digital signatures | `components/intake/` |
| `SubmissionDashboard` | Track form completions | `components/intake/` |
| `SubmissionReview` | Review and approve forms | `components/intake/` |
| `MedicalHistoryView` | Display medical history | `components/patient/` |
| `DentalHistoryView` | Display dental history | `components/patient/` |
| `InsuranceCardCapture` | Insurance card upload | `components/intake/` |
| `FormReminderManager` | Configure reminders | `components/intake/` |
| `CompletionStatusBadge` | Form status indicator | `components/intake/` |

---

## Business Rules

1. **Minor Patients**: Forms for patients under 18 must be completed by parent/guardian
2. **Required Forms**: Certain forms must be complete before first appointment
3. **Signature Validation**: All consent forms require valid signature before submission
4. **Form Expiration**: Medical history expires after 12 months
5. **Version Control**: Changing a template creates a new version; old submissions remain valid
6. **Insurance Verification**: Submitted insurance info triggers automatic eligibility check
7. **HIPAA Compliance**: All form data encrypted at rest and in transit
8. **Audit Trail**: All submissions, signatures, and modifications logged
9. **Language Matching**: Forms sent in patient's preferred language
10. **Device Agnostic**: Forms must be completable on mobile devices

---

## AI Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| Smart Prefill | Suggest answers from previous submissions | ML pattern matching |
| Medical Alert Detection | Flag concerning health conditions | Rule-based + NLP |
| Insurance Card OCR | Extract info from card images | Vision AI |
| Incomplete Form Prediction | Identify likely abandoned forms | Behavioral analysis |
| Language Detection | Auto-detect preferred language | NLP |
| Handwriting Recognition | Optional for signature verification | Vision AI |

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication |
| Compliance & Documentation | Required | Consent form integration |
| Billing & Insurance | Required | Insurance verification |
| Patient Communications | Required | Send form links |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| DocuSign/HelloSign | Optional | E-signature validation |
| Twilio | Required | SMS form links |
| SendGrid | Required | Email form links |
| Cloud Storage | Required | Card image storage |
| OCR Service | Optional | Card data extraction |

---

## Security Requirements

### Access Control
- **View forms**: All clinical roles
- **Create forms**: front_desk, treatment_coordinator
- **Configure templates**: clinic_admin
- **Approve submissions**: clinical staff, clinic_admin

### Data Protection
- All form data encrypted at rest (AES-256)
- Secure HTTPS transmission
- Access tokens expire after 7 days
- Signature data stored securely

### Audit Requirements
- Log form access and downloads
- Track submission events
- Record signature events with IP
- Maintain template change history

---

## Related Documentation

- [Parent: CRM & Onboarding](../../)
- [Lead Management](../lead-management/)
- [Compliance & Documentation](../../../compliance-documentation/)
- [Billing & Insurance](../../../billing-insurance/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
