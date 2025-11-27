# Insurance Claims

> **Area**: [Billing & Insurance](../../)
>
> **Sub-Area**: 11.2 Insurance Claims
>
> **Purpose**: Handle the complete insurance claims lifecycle from eligibility verification through payment posting

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Billing & Insurance](../../) |
| **Dependencies** | Auth, Patient Billing, Treatment Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

Insurance Claims handles all aspects of the insurance billing lifecycle. This includes maintaining an insurance company database, managing patient insurance information, verifying eligibility, submitting claims electronically, tracking claim status, managing denials and appeals, processing EOBs (Explanation of Benefits), and posting insurance payments.

Orthodontic insurance billing has unique characteristics including lifetime maximums, waiting periods for orthodontic benefits, and age limitations. This sub-area is designed to handle these orthodontic-specific requirements while maximizing reimbursement and minimizing denials.

### Key Challenges Addressed

- **Complex eligibility**: Ortho benefits differ from general dental benefits
- **Claim accuracy**: Proper coding to avoid denials
- **Timely submission**: Meet insurance deadlines
- **Denial management**: Quick turnaround on denied claims
- **EOB reconciliation**: Match payments to claims accurately

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 11.2.1 | [Insurance Company Database](./functions/insurance-company-database.md) | Manage insurance company master data | 📋 Planned | High |
| 11.2.2 | [Patient Insurance Management](./functions/patient-insurance-management.md) | Store and manage patient insurance info | 📋 Planned | Critical |
| 11.2.3 | [Eligibility Verification](./functions/eligibility-verification.md) | Verify coverage and benefits | 📋 Planned | Critical |
| 11.2.4 | [Pre-Authorization](./functions/pre-authorization.md) | Submit and track pre-authorizations | 📋 Planned | High |
| 11.2.5 | [Claims Submission](./functions/claims-submission.md) | Create and submit electronic claims | 📋 Planned | Critical |
| 11.2.6 | [Claims Tracking](./functions/claims-tracking.md) | Monitor claim status and aging | 📋 Planned | Critical |
| 11.2.7 | [Denial Management](./functions/denial-management.md) | Handle denials and appeals | 📋 Planned | High |
| 11.2.8 | [EOB Processing](./functions/eob-processing.md) | Process Explanation of Benefits | 📋 Planned | Critical |
| 11.2.9 | [Insurance Payment Posting](./functions/insurance-payment-posting.md) | Post insurance payments | 📋 Planned | Critical |
| 11.2.10 | [Coordination of Benefits](./functions/coordination-of-benefits.md) | Handle dual coverage scenarios | 📋 Planned | Medium |

---

## Function Details

### 11.2.1 Insurance Company Database

**Purpose**: Maintain a comprehensive database of insurance companies and their orthodontic benefit structures.

**Key Capabilities**:
- Store insurance company details (name, addresses, phone, payer ID)
- Track orthodontic benefit structures
- Maintain submission requirements per payer
- Store clearinghouse routing information
- Track payer-specific rules and exceptions

**User Stories**:
- As a **billing staff**, I want to look up insurance company contact information
- As a **billing staff**, I want to know the payer ID for electronic claims submission
- As a **clinic admin**, I want to see which insurance companies we work with most frequently

---

### 11.2.2 Patient Insurance Management

**Purpose**: Store and manage patient insurance information including policy details and coverage.

**Key Capabilities**:
- Capture primary and secondary insurance
- Store subscriber and dependent information
- Track group numbers and policy details
- Manage insurance card images
- Track benefit usage and remaining amounts

**User Stories**:
- As a **front desk**, I want to capture a new patient's insurance information at intake
- As a **billing staff**, I want to see if a patient has orthodontic coverage
- As a **billing staff**, I want to track how much of a patient's lifetime ortho benefit has been used

---

### 11.2.3 Eligibility Verification

**Purpose**: Verify patient insurance eligibility and orthodontic benefits in real-time.

**Key Capabilities**:
- Real-time eligibility checks via clearinghouse
- Batch eligibility verification for scheduled patients
- Orthodontic-specific benefit verification
- Coverage limitation checks (age, waiting period)
- Automatic benefit estimation updates

**User Stories**:
- As a **front desk**, I want to verify a patient's insurance before their appointment
- As a **treatment coordinator**, I want to know the ortho benefit details before presenting treatment
- As a **billing staff**, I want to batch verify eligibility for tomorrow's patients

---

### 11.2.4 Pre-Authorization

**Purpose**: Submit and track pre-authorizations required by some insurance plans.

**Key Capabilities**:
- Create pre-authorization requests
- Attach required documentation (photos, x-rays, treatment plan)
- Submit electronically when supported
- Track authorization status
- Store authorization numbers for claims

**User Stories**:
- As a **billing staff**, I want to submit a pre-authorization with required documentation
- As a **billing staff**, I want to track pending pre-authorizations
- As a **doctor**, I want to know if pre-authorization is approved before starting treatment

---

### 11.2.5 Claims Submission

**Purpose**: Create and submit insurance claims electronically.

**Key Capabilities**:
- Generate claims from completed procedures
- Validate claims before submission
- Submit via EDI 837 through clearinghouse
- Track submission status
- Batch claim submission
- Handle ortho-specific claim requirements

**User Stories**:
- As a **billing staff**, I want to submit claims for all completed procedures
- As a **billing staff**, I want the system to validate claims before submission to reduce denials
- As a **billing staff**, I want to batch submit all pending claims at end of day

---

### 11.2.6 Claims Tracking

**Purpose**: Monitor claim status and aging to ensure timely payment.

**Key Capabilities**:
- Track claim status (submitted, accepted, pending, paid, denied)
- Claim aging reports
- Automatic status updates from clearinghouse
- Follow-up reminders for aging claims
- Claim search and filtering

**User Stories**:
- As a **billing staff**, I want to see all claims over 30 days without payment
- As a **billing staff**, I want to be notified when a claim is rejected
- As a **clinic admin**, I want to see insurance AR aging by payer

---

### 11.2.7 Denial Management

**Purpose**: Handle claim denials efficiently with appeals and resubmissions.

**Key Capabilities**:
- Capture denial reasons and codes
- Create appeal letters (with templates)
- Track appeal deadlines
- Resubmit corrected claims
- Analyze denial patterns
- AI-suggested denial resolutions

**User Stories**:
- As a **billing staff**, I want to see all denied claims that need attention
- As a **billing staff**, I want to generate an appeal letter with supporting documentation
- As a **clinic admin**, I want to see denial trends to identify training needs

---

### 11.2.8 EOB Processing

**Purpose**: Process Explanation of Benefits documents efficiently.

**Key Capabilities**:
- Receive electronic EOBs (EDI 835)
- AI-powered paper EOB data extraction
- Match EOBs to claims
- Review payment and adjustment details
- Flag discrepancies for review
- Batch EOB processing

**User Stories**:
- As a **billing staff**, I want EOB data automatically extracted from scanned documents
- As a **billing staff**, I want to review insurance payments and adjustments before posting
- As a **billing staff**, I want to be alerted when payment doesn't match expected amount

---

### 11.2.9 Insurance Payment Posting

**Purpose**: Post insurance payments accurately and efficiently.

**Key Capabilities**:
- Post payments from EOBs
- Apply contractual adjustments
- Handle over/under payments
- Transfer remaining balance to patient responsibility
- Bulk payment posting
- Payment reconciliation

**User Stories**:
- As a **billing staff**, I want to post insurance payments from processed EOBs
- As a **billing staff**, I want to apply the correct contractual adjustment automatically
- As a **billing staff**, I want to transfer the patient's portion to their account after insurance pays

---

### 11.2.10 Coordination of Benefits

**Purpose**: Handle patients with dual insurance coverage.

**Key Capabilities**:
- Determine primary/secondary order
- Submit to secondary after primary pays
- Track coverage across both policies
- Handle COB rules (birthday rule, etc.)
- Maximize combined benefits

**User Stories**:
- As a **billing staff**, I want to submit to secondary insurance after primary pays
- As a **billing staff**, I want the system to correctly determine primary vs. secondary
- As a **treatment coordinator**, I want to estimate the combined benefit from both policies

---

## Data Model

```prisma
model InsuranceCompany {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Company info
  name          String
  payerId       String      // Electronic payer ID
  type          InsuranceType @default(DENTAL)

  // Contact
  phone         String?
  fax           String?
  email         String?
  website       String?

  // Addresses
  claimsAddress    Address?
  customerService  Address?

  // Electronic submission
  clearinghouseId  String?
  supportsEligibility Boolean @default(true)
  supportsEdi837   Boolean @default(true)
  supportsEdi835   Boolean @default(true)

  // Ortho-specific
  orthoPaymentType OrthoPaymentType @default(MONTHLY)
  requiresPreauth  Boolean @default(false)

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic    Clinic  @relation(fields: [clinicId], references: [id])
  patientInsurances PatientInsurance[]
  claims    InsuranceClaim[]

  @@index([clinicId])
  @@index([payerId])
  @@index([name])
}

enum InsuranceType {
  DENTAL
  MEDICAL
  DISCOUNT_PLAN
}

enum OrthoPaymentType {
  LUMP_SUM        // Pays full amount at start
  MONTHLY         // Pays monthly during treatment
  QUARTERLY       // Pays quarterly
  MILESTONE       // Pays at treatment milestones
  COMPLETION      // Pays at treatment completion
}

model PatientInsurance {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  insuranceCompanyId String @db.ObjectId

  // Coverage order
  priority      InsurancePriority @default(PRIMARY)

  // Subscriber info
  subscriberId     String
  groupNumber      String?
  subscriberName   String
  subscriberDob    DateTime
  relationToSubscriber RelationToSubscriber

  // Coverage dates
  effectiveDate    DateTime
  terminationDate  DateTime?

  // Verification
  lastVerified     DateTime?
  verificationStatus VerificationStatus @default(NOT_VERIFIED)

  // Ortho benefits
  hasOrthoBenefit     Boolean @default(false)
  orthoLifetimeMax    Decimal?
  orthoUsedAmount     Decimal  @default(0)
  orthoRemainingAmount Decimal?
  orthoAgeLimit       Int?
  orthoWaitingPeriod  Int?      // months
  orthoCoveragePercent Decimal?
  orthoDeductible     Decimal?
  orthoDeductibleMet  Decimal  @default(0)

  // Card images
  cardFrontUrl     String?
  cardBackUrl      String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic      Clinic          @relation(fields: [clinicId], references: [id])
  patient     Patient         @relation(fields: [patientId], references: [id])
  company     InsuranceCompany @relation(fields: [insuranceCompanyId], references: [id])
  claims      InsuranceClaim[]
  eligibilityChecks EligibilityCheck[]
  preauthorizations Preauthorization[]

  @@index([clinicId])
  @@index([patientId])
  @@index([insuranceCompanyId])
  @@index([subscriberId])
}

enum InsurancePriority {
  PRIMARY
  SECONDARY
  TERTIARY
}

enum RelationToSubscriber {
  SELF
  SPOUSE
  CHILD
  OTHER
}

enum VerificationStatus {
  NOT_VERIFIED
  VERIFIED
  FAILED
  EXPIRED
}

model EligibilityCheck {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId
  patientInsuranceId String  @db.ObjectId

  // Check details
  checkDate         DateTime @default(now())
  serviceDate       DateTime
  status            EligibilityStatus

  // Results
  isEligible        Boolean?
  eligibilityData   Json?     // Full response data

  // Ortho-specific results
  hasOrthoBenefit   Boolean?
  orthoLifetimeMax  Decimal?
  orthoUsed         Decimal?
  orthoRemaining    Decimal?
  orthoCoverage     Decimal?
  orthoDeductible   Decimal?
  orthoDeductibleMet Decimal?

  // Error handling
  errorCode         String?
  errorMessage      String?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic           Clinic           @relation(fields: [clinicId], references: [id])
  patientInsurance PatientInsurance @relation(fields: [patientInsuranceId], references: [id])

  @@index([clinicId])
  @@index([patientInsuranceId])
  @@index([checkDate])
}

enum EligibilityStatus {
  PENDING
  SUCCESS
  FAILED
  NO_RESPONSE
}

model Preauthorization {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId
  patientId         String   @db.ObjectId
  patientInsuranceId String  @db.ObjectId

  // Auth details
  authNumber        String?
  status            PreauthStatus @default(PENDING)
  requestDate       DateTime @default(now())
  responseDate      DateTime?
  expirationDate    DateTime?

  // Treatment info
  treatmentPlanId   String?  @db.ObjectId
  procedureCodes    String[]
  requestedAmount   Decimal

  // Response
  approvedAmount    Decimal?
  denialReason      String?

  // Documents
  attachments       String[]  // URLs to supporting docs

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic           Clinic           @relation(fields: [clinicId], references: [id])
  patient          Patient          @relation(fields: [patientId], references: [id])
  patientInsurance PatientInsurance @relation(fields: [patientInsuranceId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}

enum PreauthStatus {
  DRAFT
  PENDING
  APPROVED
  PARTIAL
  DENIED
  EXPIRED
}

model InsuranceClaim {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId
  patientId         String   @db.ObjectId
  patientInsuranceId String  @db.ObjectId
  insuranceCompanyId String  @db.ObjectId

  // Claim identification
  claimNumber       String   @unique
  internalClaimId   String?  // Clearinghouse tracking ID
  payerClaimId      String?  // Insurance company's claim ID

  // Claim details
  claimType         ClaimType @default(ORIGINAL)
  serviceDate       DateTime
  filingDate        DateTime?
  status            ClaimStatus @default(DRAFT)

  // Amounts
  billedAmount      Decimal
  allowedAmount     Decimal?
  paidAmount        Decimal?
  patientResponsibility Decimal?
  adjustmentAmount  Decimal?

  // Related
  originalClaimId   String?  @db.ObjectId  // For corrected/replacement claims
  preauthNumber     String?

  // Rendering provider
  renderingProviderId String? @db.ObjectId
  npi               String?

  // Submission tracking
  submissionMethod  SubmissionMethod?
  submittedAt       DateTime?
  submittedBy       String?  @db.ObjectId
  acceptedAt        DateTime?
  rejectedAt        DateTime?
  rejectionReason   String?

  // Denial tracking
  deniedAt          DateTime?
  denialCode        String?
  denialReason      String?
  appealDeadline    DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic           Clinic           @relation(fields: [clinicId], references: [id])
  patient          Patient          @relation(fields: [patientId], references: [id])
  patientInsurance PatientInsurance @relation(fields: [patientInsuranceId], references: [id])
  insuranceCompany InsuranceCompany @relation(fields: [insuranceCompanyId], references: [id])
  items            ClaimItem[]
  eobs             EOB[]
  statusHistory    ClaimStatusHistory[]

  @@index([clinicId])
  @@index([patientId])
  @@index([patientInsuranceId])
  @@index([claimNumber])
  @@index([status])
  @@index([serviceDate])
  @@index([filingDate])
}

enum ClaimType {
  ORIGINAL
  CORRECTED
  REPLACEMENT
  VOID
}

enum ClaimStatus {
  DRAFT
  READY
  SUBMITTED
  ACCEPTED
  PENDING
  PAID
  PARTIAL
  DENIED
  APPEALED
  VOID
  CLOSED
}

enum SubmissionMethod {
  ELECTRONIC
  PAPER
  PORTAL
}

model ClaimItem {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  claimId     String   @db.ObjectId

  // Line details
  lineNumber  Int
  procedureCode    String   // CDT code
  procedureCodeModifier String?
  description      String
  serviceDate      DateTime
  quantity         Int      @default(1)
  toothNumbers     String[]

  // Amounts
  billedAmount     Decimal
  allowedAmount    Decimal?
  paidAmount       Decimal?
  adjustmentAmount Decimal?
  patientResponsibility Decimal?

  // Status
  status           ClaimItemStatus @default(PENDING)
  denialCode       String?
  denialReason     String?

  // Source
  procedureId      String?  @db.ObjectId

  // Relations
  claim    InsuranceClaim  @relation(fields: [claimId], references: [id])

  @@index([claimId])
  @@index([procedureCode])
}

enum ClaimItemStatus {
  PENDING
  PAID
  DENIED
  ADJUSTED
}

model EOB {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  claimId       String?  @db.ObjectId

  // EOB identification
  eobNumber     String?
  checkNumber   String?
  eftNumber     String?
  receivedDate  DateTime

  // Source
  receiptMethod EOBReceiptMethod
  documentUrl   String?   // Scanned EOB image
  rawData       Json?     // EDI 835 parsed data

  // Amounts
  totalPaid     Decimal
  totalAdjusted Decimal  @default(0)
  patientResponsibility Decimal @default(0)

  // Processing
  status        EOBStatus @default(PENDING)
  processedAt   DateTime?
  processedBy   String?  @db.ObjectId

  // AI extraction (for paper EOBs)
  extractionConfidence Decimal?
  extractedData Json?
  needsReview   Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic          @relation(fields: [clinicId], references: [id])
  claim     InsuranceClaim? @relation(fields: [claimId], references: [id])
  payments  InsurancePayment[]

  @@index([clinicId])
  @@index([claimId])
  @@index([status])
  @@index([receivedDate])
}

enum EOBReceiptMethod {
  ELECTRONIC   // EDI 835
  SCANNED      // Paper scanned
  MANUAL       // Manually entered
  PORTAL       // Downloaded from payer portal
}

enum EOBStatus {
  PENDING
  REVIEWING
  PROCESSED
  DISCREPANCY
  VOID
}

model InsurancePayment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  eobId         String   @db.ObjectId
  claimId       String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Payment details
  paymentDate   DateTime
  amount        Decimal
  adjustmentAmount Decimal @default(0)
  adjustmentReason String?

  // Posting
  postedAt      DateTime?
  postedBy      String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic         @relation(fields: [clinicId], references: [id])
  eob       EOB            @relation(fields: [eobId], references: [id])

  @@index([clinicId])
  @@index([eobId])
  @@index([claimId])
  @@index([paymentDate])
}

model ClaimStatusHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  claimId       String   @db.ObjectId

  // Status change
  previousStatus ClaimStatus?
  newStatus      ClaimStatus
  changedAt      DateTime @default(now())
  changedBy      String?  @db.ObjectId

  // Details
  notes          String?
  errorCode      String?
  errorMessage   String?

  // Relations
  claim    InsuranceClaim @relation(fields: [claimId], references: [id])

  @@index([claimId])
  @@index([changedAt])
}
```

---

## API Endpoints

### Insurance Companies

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/insurance/companies` | List insurance companies | `insurance:read` |
| GET | `/api/insurance/companies/:id` | Get company details | `insurance:read` |
| POST | `/api/insurance/companies` | Add company | `insurance:create` |
| PUT | `/api/insurance/companies/:id` | Update company | `insurance:update` |

### Patient Insurance

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/patients/:id/insurance` | List patient's insurance | `insurance:read` |
| POST | `/api/patients/:id/insurance` | Add insurance | `insurance:create` |
| PUT | `/api/patients/:id/insurance/:insuranceId` | Update insurance | `insurance:update` |
| DELETE | `/api/patients/:id/insurance/:insuranceId` | Remove insurance | `insurance:delete` |

### Eligibility

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/insurance/eligibility/check` | Check eligibility | `insurance:verify` |
| POST | `/api/insurance/eligibility/batch` | Batch check | `insurance:verify` |
| GET | `/api/insurance/eligibility/history/:patientInsuranceId` | Get history | `insurance:read` |

### Claims

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/insurance/claims` | List claims | `insurance:read` |
| GET | `/api/insurance/claims/:id` | Get claim details | `insurance:read` |
| POST | `/api/insurance/claims` | Create claim | `insurance:submit_claim` |
| PUT | `/api/insurance/claims/:id` | Update claim | `insurance:update` |
| POST | `/api/insurance/claims/:id/submit` | Submit claim | `insurance:submit_claim` |
| POST | `/api/insurance/claims/:id/void` | Void claim | `insurance:void` |
| POST | `/api/insurance/claims/batch-submit` | Batch submit | `insurance:submit_claim` |

### EOB Processing

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/insurance/eobs` | List EOBs | `insurance:read` |
| POST | `/api/insurance/eobs` | Create EOB | `insurance:create` |
| POST | `/api/insurance/eobs/upload` | Upload scanned EOB | `insurance:create` |
| POST | `/api/insurance/eobs/:id/process` | Process EOB | `insurance:post_payment` |
| POST | `/api/insurance/eobs/:id/post` | Post payment | `insurance:post_payment` |

### Denial Management

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/insurance/denials` | List denied claims | `insurance:read` |
| POST | `/api/insurance/claims/:id/appeal` | Create appeal | `insurance:appeal` |
| POST | `/api/insurance/claims/:id/resubmit` | Resubmit claim | `insurance:submit_claim` |

---

## External Integrations

### Clearinghouse Integration

| Clearinghouse | Supported Operations |
|---------------|---------------------|
| Tesia | Eligibility, Claims (837), ERA (835) |
| Availity | Eligibility, Claims (837), ERA (835) |
| Change Healthcare | Eligibility, Claims (837), ERA (835) |
| DentalXChange | Eligibility, Claims (837), ERA (835) |

### Integration Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      Orca        │────▶│  Clearinghouse   │────▶│ Insurance Payer  │
│                  │     │                  │     │                  │
│ - Create claim   │     │ - Validate EDI   │     │ - Process claim  │
│ - Submit EDI 837 │     │ - Route to payer │     │ - Adjudicate     │
│                  │     │ - Track status   │     │ - Generate ERA   │
│                  │◀────│                  │◀────│                  │
│ - Receive ERA    │     │ - Return 835     │     │ - Send ERA       │
│ - Post payment   │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## AI Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| EOB Data Extraction | Extract data from scanned EOBs | Vision AI + OCR |
| Insurance Fax Processing | Parse incoming insurance faxes | Document AI |
| Claims Optimization | Suggest optimal coding | LLM analysis |
| Denial Pattern Analysis | Identify denial trends | ML analytics |
| Appeal Letter Generation | Draft appeal letters | LLM generation |

---

## Business Rules

1. **Claim Timeliness**: Claims must be submitted within payer's deadline (typically 90-365 days)
2. **Eligibility Verification**: Verify eligibility within 30 days of service
3. **Primary First**: Always bill primary insurance before secondary
4. **Ortho Billing**: Monthly ortho claims submitted per payer's schedule
5. **Denial Appeals**: Appeals must be filed within deadline (typically 30-90 days)
6. **EOB Matching**: EOBs must match to claims before posting
7. **Contractual Adjustments**: Apply allowed amounts per fee schedule

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `InsuranceCompanyList` | List/search companies | `components/insurance/` |
| `PatientInsuranceCard` | Show patient's coverage | `components/insurance/` |
| `InsuranceForm` | Add/edit patient insurance | `components/insurance/` |
| `EligibilityChecker` | Run eligibility check | `components/insurance/` |
| `ClaimsList` | List claims with filters | `components/insurance/` |
| `ClaimDetail` | Full claim view | `components/insurance/` |
| `ClaimSubmissionWizard` | Create and submit claim | `components/insurance/` |
| `EOBList` | List EOBs | `components/insurance/` |
| `EOBProcessor` | Review and post EOB | `components/insurance/` |
| `DenialWorkqueue` | Manage denied claims | `components/insurance/` |
| `ClaimAgingReport` | Claims aging dashboard | `components/insurance/` |

---

## Related Documentation

- [Parent: Billing & Insurance](../../)
- [Patient Billing](../patient-billing/)
- [Payment Processing](../payment-processing/)
- [Collections](../collections/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
