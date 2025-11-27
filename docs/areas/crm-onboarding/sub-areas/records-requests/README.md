# Records Requests

> **Area**: [CRM & Onboarding](../../)
>
> **Sub-Area**: 8.4 Records Requests
>
> **Purpose**: Manage the intake and release of patient records between providers, ensuring compliance with regulations and timely transfer

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Medium |
| **Complexity** | Medium |
| **Parent Area** | [CRM & Onboarding](../../) |
| **Dependencies** | Auth, Compliance, Document Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

Records Requests handles the bidirectional flow of patient records between the orthodontic practice and other healthcare providers. This includes receiving records from previous providers for new patients and releasing records to other providers when requested.

### Orthodontic-Specific Considerations

- **Multi-Provider Care**: Orthodontic patients maintain relationships with general dentists
- **Transfer Patients**: Patients relocating mid-treatment need comprehensive records
- **Long Treatment Records**: Treatment spanning 2+ years generates extensive documentation
- **Imaging Heavy**: X-rays and photos are critical components of orthodontic records
- **Retention Records**: Post-treatment retention must be documented for years

### Key Capabilities

- Track incoming records requests from new patients
- Manage outgoing records releases to other providers
- Verify patient authorization for records release
- Monitor compliance with state timing regulations
- Track fees for records preparation
- Ensure secure transfer of protected health information

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 8.4.1 | [Incoming Records Management](./functions/incoming-requests.md) | Request and track records from other providers | 📋 Planned | High |
| 8.4.2 | [Outgoing Records Preparation](./functions/outgoing-preparation.md) | Compile and prepare records for release | 📋 Planned | High |
| 8.4.3 | [Authorization Verification](./functions/authorization-verification.md) | Verify patient consent for records transfer | 📋 Planned | Critical |
| 8.4.4 | [Transfer Status Tracking](./functions/transfer-tracking.md) | Track request status and completion | 📋 Planned | Medium |
| 8.4.5 | [Fee Management](./functions/fee-management.md) | Handle records preparation fees | 📋 Planned | Low |
| 8.4.6 | [Compliance Monitoring](./functions/compliance-monitoring.md) | Ensure regulatory compliance | 📋 Planned | High |

---

## Function Details

### 8.4.1 Incoming Records Management

**Purpose**: Request and receive patient records from previous providers for new patients.

**Key Capabilities**:
- Create records request for new patients
- Generate standardized request letters
- Track request status and follow-ups
- Log receipt of records
- Integration with patient imaging/documents
- Reminder system for outstanding requests

**Workflow**:
```
New Patient → Identify Previous Provider → Create Request → Send Request
                                                              ↓
Patient Record ← File in Chart ← Receive Records ← Follow Up if Needed
```

**Information Needed for Request**:
| Field | Purpose |
|-------|---------|
| Previous provider name | Identify source |
| Provider address/fax | Send request |
| Dates of treatment | Scope of records |
| Patient authorization | Legal compliance |
| Specific records needed | X-rays, notes, photos |

**Request Types**:
- Full orthodontic records
- X-rays only
- Treatment summary
- Specific documents

**User Stories**:
- As a **front desk**, I want to send a records request to a patient's previous orthodontist
- As a **clinical staff**, I want to know when requested records have arrived
- As a **treatment coordinator**, I want to follow up on overdue records requests

---

### 8.4.2 Outgoing Records Preparation

**Purpose**: Compile and prepare patient records for release to other providers.

**Key Capabilities**:
- Receive and log release requests
- Identify required documents
- Compile records package
- Quality review before release
- Track preparation time
- Multiple delivery methods

**Records Components**:
| Component | Description |
|-----------|-------------|
| Treatment summary | Overview of treatment provided |
| Clinical notes | Progress notes, observations |
| Treatment plan | Original and modifications |
| X-rays | All diagnostic images |
| Photos | Clinical photography series |
| Consent forms | Signed treatment consents |
| Financial summary | Optional, if requested |
| Retention instructions | Post-treatment guidelines |

**Delivery Methods**:
- Secure electronic transfer (preferred)
- Encrypted email
- Secure patient portal
- Physical mail (certified)
- Fax (for summary documents)
- In-person pickup

**User Stories**:
- As a **front desk**, I want to log an incoming records release request
- As a **clinical staff**, I want to compile the required records for transfer
- As a **doctor**, I want to review records before release to ensure completeness

---

### 8.4.3 Authorization Verification

**Purpose**: Verify proper patient consent before releasing any protected health information.

**Key Capabilities**:
- Validate authorization form completeness
- Verify patient/guardian signature
- Check authorization expiration
- Validate requesting party identity
- Document verification in audit trail
- Handle minor patient authorizations

**Authorization Requirements**:
- Patient (or guardian for minors) signature
- Date of authorization
- Description of information to be released
- Recipient identification
- Purpose of disclosure
- Expiration date or event
- Right to revoke

**Verification Checklist**:
- [ ] Valid signature present
- [ ] Patient identity confirmed
- [ ] Guardian verification (for minors)
- [ ] Authorization not expired
- [ ] Scope includes requested records
- [ ] Recipient matches requester

**User Stories**:
- As a **compliance officer**, I want to ensure all releases have valid authorization
- As a **front desk**, I want to verify an authorization before processing a request
- As a **clinic admin**, I want to audit authorization compliance

---

### 8.4.4 Transfer Status Tracking

**Purpose**: Track the complete lifecycle of records requests from initiation to completion.

**Key Capabilities**:
- Visual dashboard of all active requests
- Status tracking with timestamps
- Automatic status updates
- Reminder and escalation system
- Request history per patient
- Metrics and reporting

**Request Statuses**:
| Status | Description |
|--------|-------------|
| Created | Request logged but not sent |
| Sent | Request sent to provider |
| Acknowledged | Provider confirmed receipt |
| In Progress | Provider preparing records |
| Received/Sent | Records transferred |
| Completed | Filed/delivered and closed |
| Cancelled | Request cancelled |
| Failed | Unable to obtain/deliver |

**Timeline Tracking**:
- Request created date
- Request sent date
- First follow-up date
- Each subsequent follow-up
- Receipt/delivery date
- Filing/completion date

**User Stories**:
- As a **front desk**, I want to see all pending records requests at a glance
- As a **clinical staff**, I want to be reminded to follow up on overdue requests
- As a **clinic admin**, I want to report on average turnaround times

---

### 8.4.5 Fee Management

**Purpose**: Handle billing and collection of records preparation fees where applicable.

**Key Capabilities**:
- Define fee schedule for records
- Calculate fees based on record type/volume
- Generate fee invoices
- Track payment status
- Handle fee waivers
- Integrate with billing system

**Fee Considerations**:
| Factor | Description |
|--------|-------------|
| State regulations | Maximum allowable fees |
| Page count | Paper record copies |
| Image count | X-rays, photos |
| Electronic vs. paper | Different fee structures |
| Patient vs. provider | Some states limit patient fees |
| Urgency | Rush fees (where allowed) |

**Fee Workflow**:
```
Request Received → Calculate Fee → Notify Requester → Payment Received → Prepare Records
                                          ↓
                              Fee Waiver (if applicable)
```

**User Stories**:
- As a **front desk**, I want to calculate the fee for a records request
- As a **billing staff**, I want to track unpaid records fees
- As a **clinic admin**, I want to configure our fee schedule

---

### 8.4.6 Compliance Monitoring

**Purpose**: Ensure all records requests comply with applicable regulations.

**Key Capabilities**:
- State-specific timing requirements
- HIPAA minimum necessary standard
- Authorization expiration monitoring
- Audit trail maintenance
- Compliance reporting
- Breach prevention

**Regulatory Requirements**:
| Regulation | Requirement |
|------------|-------------|
| HIPAA | Authorization, minimum necessary, accounting of disclosures |
| State Law | Response time limits (typically 30-60 days) |
| PIPEDA (Canada) | Consent requirements, access rights |
| Minor Records | Guardian authorization, age of consent |

**Timing Compliance**:
- Most states: 30 days to respond
- Some states: 15-20 days
- Extensions: Documented reasons
- Urgent requests: Expedited handling

**Compliance Alerts**:
- Approaching deadline warnings
- Overdue request alerts
- Missing authorization flags
- Expiring authorization notices

**User Stories**:
- As a **compliance officer**, I want to ensure no requests exceed legal deadlines
- As a **clinic admin**, I want compliance reports for audits
- As a **front desk**, I want alerts when requests are approaching deadlines

---

## Data Model

```prisma
model RecordsRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Request type
  direction     RequestDirection
  requestType   RecordsRequestType

  // Patient
  patientId     String   @db.ObjectId

  // External party (provider making/receiving request)
  externalProviderName    String
  externalProviderAddress String?
  externalProviderPhone   String?
  externalProviderFax     String?
  externalProviderEmail   String?
  contactPerson           String?

  // Request details
  recordsRequested    String[]  // Types of records
  dateRangeStart      DateTime?
  dateRangeEnd        DateTime?
  purpose             String?
  urgency             RequestUrgency @default(ROUTINE)
  notes               String?

  // Authorization
  authorizationId     String?  @db.ObjectId
  authorizationVerified Boolean @default(false)
  authorizationVerifiedBy String? @db.ObjectId
  authorizationVerifiedAt DateTime?

  // Status tracking
  status              RecordsRequestStatus @default(CREATED)
  statusHistory       StatusChange[]

  // Timing
  requestDate         DateTime @default(now())
  sentDate            DateTime?
  acknowledgedDate    DateTime?
  dueDate             DateTime?
  completedDate       DateTime?

  // Delivery
  deliveryMethod      DeliveryMethod?
  deliveryReference   String?  // Tracking number, etc.

  // Fees (for outgoing)
  feeRequired         Boolean  @default(false)
  feeAmount           Decimal?
  feeWaived           Boolean  @default(false)
  feeWaiverReason     String?
  feePaidDate         DateTime?

  // Documents
  requestDocumentUrl  String?  // Request letter
  responseDocumentUrl String?  // Records package
  authorizationDocumentUrl String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Audit
  createdBy     String?  @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  authorization RecordsAuthorization? @relation(fields: [authorizationId], references: [id])
  followUps     RecordsFollowUp[]

  @@index([clinicId])
  @@index([patientId])
  @@index([direction])
  @@index([status])
  @@index([dueDate])
}

enum RequestDirection {
  INCOMING  // We are requesting records
  OUTGOING  // Someone is requesting our records
}

enum RecordsRequestType {
  FULL_RECORDS
  TREATMENT_SUMMARY
  XRAYS_ONLY
  PHOTOS_ONLY
  SPECIFIC_DOCUMENTS
  TRANSFER_PACKAGE
}

enum RequestUrgency {
  ROUTINE
  EXPEDITED
  URGENT
}

enum RecordsRequestStatus {
  CREATED
  AUTHORIZATION_PENDING
  READY_TO_SEND
  SENT
  ACKNOWLEDGED
  IN_PROGRESS
  FEE_PENDING
  PREPARING
  QUALITY_REVIEW
  READY_TO_DELIVER
  DELIVERED
  RECEIVED
  FILED
  COMPLETED
  CANCELLED
  FAILED
}

type StatusChange {
  status        RecordsRequestStatus
  changedAt     DateTime
  changedBy     String
  notes         String?
}

model RecordsAuthorization {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Authorization details
  authorizationType   AuthorizationType
  authorizedRecords   String[]
  authorizedRecipient String
  recipientType       RecipientType

  // Purpose
  purpose       String?

  // Signatures
  patientSignature      String?  // Base64 signature image
  patientSignedDate     DateTime?
  guardianSignature     String?  // For minors
  guardianName          String?
  guardianRelationship  String?
  guardianSignedDate    DateTime?

  // Validity
  effectiveDate     DateTime @default(now())
  expirationDate    DateTime?
  expirationEvent   String?  // "Upon completion of treatment"

  // Revocation
  revoked           Boolean  @default(false)
  revokedDate       DateTime?
  revocationReason  String?

  // Verification
  isValid           Boolean  @default(true)
  verificationNotes String?

  // Document
  documentUrl       String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  requests      RecordsRequest[]

  @@index([clinicId])
  @@index([patientId])
  @@index([isValid])
  @@index([expirationDate])
}

enum AuthorizationType {
  RELEASE_TO_PROVIDER
  RELEASE_TO_PATIENT
  RELEASE_TO_THIRD_PARTY
  INCOMING_REQUEST
}

enum RecipientType {
  HEALTHCARE_PROVIDER
  PATIENT_SELF
  INSURANCE_COMPANY
  LEGAL_REPRESENTATIVE
  FAMILY_MEMBER
  OTHER
}

model RecordsFollowUp {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  requestId     String   @db.ObjectId

  // Follow-up details
  followUpType  FollowUpType
  scheduledDate DateTime
  completedDate DateTime?

  // Communication
  method        CommunicationMethod?
  outcome       FollowUpOutcome?
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Audit
  createdBy     String   @db.ObjectId
  completedBy   String?  @db.ObjectId

  // Relations
  request       RecordsRequest @relation(fields: [requestId], references: [id])

  @@index([requestId])
  @@index([scheduledDate])
}

enum FollowUpType {
  INITIAL_CHECK
  STATUS_CHECK
  REMINDER
  ESCALATION
  FINAL_NOTICE
}

enum CommunicationMethod {
  PHONE
  FAX
  EMAIL
  MAIL
  PORTAL
}

enum FollowUpOutcome {
  NO_ANSWER
  LEFT_MESSAGE
  SPOKE_WITH_STAFF
  CONFIRMED_IN_PROGRESS
  CONFIRMED_SENT
  ISSUE_IDENTIFIED
  REQUEST_CANCELLED
}

model RecordsFeeSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Fee structure
  name          String
  isActive      Boolean  @default(true)

  // Fee items
  baseFee               Decimal  @default(0)
  perPageFee            Decimal  @default(0)
  perImageFee           Decimal  @default(0)
  electronicFormatFee   Decimal  @default(0)
  mailingFee            Decimal  @default(0)
  rushFee               Decimal  @default(0)

  // Caps
  maximumFee            Decimal?

  // Rules
  patientCopyFree       Boolean  @default(false)
  freePageLimit         Int?

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
}

model RecordsDeliveryLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  requestId     String   @db.ObjectId

  // Delivery details
  deliveryMethod    DeliveryMethod
  deliveryAddress   String?  // Email, fax, mailing address
  deliveredAt       DateTime

  // Tracking
  trackingNumber    String?
  confirmationCode  String?
  deliveryStatus    DeliveryStatus @default(SENT)

  // Verification
  receivedConfirmation  Boolean  @default(false)
  confirmedAt           DateTime?
  confirmedBy           String?

  // Documents
  documentCount     Int?
  imageCount        Int?
  totalPages        Int?

  // Timestamps
  createdAt     DateTime @default(now())

  // Audit
  sentBy        String   @db.ObjectId

  @@index([requestId])
}

enum DeliveryMethod {
  SECURE_PORTAL
  ENCRYPTED_EMAIL
  FAX
  CERTIFIED_MAIL
  REGULAR_MAIL
  IN_PERSON
}

enum DeliveryStatus {
  SENT
  IN_TRANSIT
  DELIVERED
  FAILED
  RETURNED
}
```

---

## API Endpoints

### Records Requests

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/records-requests` | List requests | `records:read` |
| GET | `/api/records-requests/:id` | Get request details | `records:read` |
| POST | `/api/records-requests` | Create request | `records:create` |
| PUT | `/api/records-requests/:id` | Update request | `records:update` |
| POST | `/api/records-requests/:id/send` | Send request letter | `records:send` |
| POST | `/api/records-requests/:id/status` | Update status | `records:update` |

### Authorizations

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/records-authorizations` | List authorizations | `records:read` |
| GET | `/api/records-authorizations/:id` | Get authorization | `records:read` |
| POST | `/api/records-authorizations` | Create authorization | `records:create` |
| POST | `/api/records-authorizations/:id/verify` | Verify authorization | `records:authorize` |
| POST | `/api/records-authorizations/:id/revoke` | Revoke authorization | `records:authorize` |

### Follow-ups

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/records-requests/:id/follow-ups` | Get follow-ups | `records:read` |
| POST | `/api/records-requests/:id/follow-ups` | Log follow-up | `records:update` |
| PUT | `/api/records-requests/:id/follow-ups/:fid` | Update follow-up | `records:update` |

### Delivery

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/records-requests/:id/prepare` | Start preparation | `records:prepare` |
| POST | `/api/records-requests/:id/deliver` | Record delivery | `records:send` |
| GET | `/api/records-requests/:id/delivery-log` | Get delivery history | `records:read` |

### Fees

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/records-fee-schedule` | Get fee schedule | `records:read` |
| PUT | `/api/records-fee-schedule` | Update fee schedule | `records:configure` |
| POST | `/api/records-requests/:id/calculate-fee` | Calculate request fee | `records:read` |
| POST | `/api/records-requests/:id/waive-fee` | Waive fee | `records:fee_waiver` |

### Compliance

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/records-requests/compliance/overdue` | Get overdue requests | `records:compliance` |
| GET | `/api/records-requests/compliance/expiring-auth` | Expiring authorizations | `records:compliance` |
| GET | `/api/records-requests/compliance/report` | Compliance report | `records:compliance` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `RecordsRequestDashboard` | Overview of all requests | `components/records/` |
| `RecordsRequestList` | List with filters | `components/records/` |
| `RecordsRequestDetail` | Full request view | `components/records/` |
| `IncomingRequestForm` | Create incoming request | `components/records/` |
| `OutgoingRequestForm` | Log outgoing request | `components/records/` |
| `AuthorizationForm` | Create/verify authorization | `components/records/` |
| `AuthorizationVerifier` | Verification workflow | `components/records/` |
| `FollowUpTimeline` | Follow-up history | `components/records/` |
| `FollowUpLogger` | Log follow-up activity | `components/records/` |
| `RecordsPackageBuilder` | Compile outgoing records | `components/records/` |
| `FeeCalculator` | Calculate and display fees | `components/records/` |
| `ComplianceAlerts` | Overdue/expiring alerts | `components/records/` |
| `StatusTracker` | Visual status progression | `components/records/` |
| `RequestLetterGenerator` | Generate request letters | `components/records/` |

---

## Business Rules

1. **Authorization Required**: No records released without valid authorization
2. **Minor Consent**: Guardian authorization required for patients under 18
3. **Timing Compliance**: All requests must be completed within state-mandated timeframes
4. **Minimum Necessary**: Only release records specifically authorized
5. **Fee Limits**: Fees must comply with state maximum allowances
6. **Patient Copy Free**: Many states require free copy to patient (first copy)
7. **Verification Before Release**: All authorizations verified before preparation begins
8. **Secure Transfer**: PHI must be transferred via approved secure methods
9. **Audit Trail**: All requests, transfers, and access logged
10. **Follow-up Schedule**: Automatic follow-up reminders at 7, 14, 21 days

---

## AI Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| OCR Authorization Extraction | Extract authorization data from scanned forms | Vision AI |
| Deadline Prediction | Predict likely completion based on provider history | ML model |
| Smart Follow-up Timing | Optimize follow-up timing | Historical analysis |
| Records Completeness Check | Verify package includes all required documents | Rule-based + ML |
| Provider Response Scoring | Rate external providers on response time | Statistical analysis |
| Compliance Risk Detection | Flag high-risk requests early | Pattern detection |

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication |
| Compliance & Documentation | Required | Authorization tracking |
| Document Management | Required | Records storage |
| Billing & Insurance | Optional | Fee invoicing |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Fax Service | Required | Request/response transmission |
| Secure Email | Required | Electronic delivery |
| Mail Service | Optional | Physical mailing |
| Cloud Storage | Required | Records package storage |

---

## Security Requirements

### Access Control
- **View requests**: front_desk, clinical staff, clinic_admin
- **Create requests**: front_desk
- **Authorize release**: clinic_admin, doctor
- **Prepare records**: clinical staff
- **Send records**: front_desk, clinical staff
- **Waive fees**: clinic_admin

### Audit Requirements
- Log all request access
- Track authorization verification
- Record all deliveries with confirmation
- Maintain accounting of disclosures

### Data Protection
- All records encrypted at rest
- Secure transmission channels only
- Access logged for each patient record
- Minimum necessary enforcement

---

## Related Documentation

- [Parent: CRM & Onboarding](../../)
- [Referral Tracking](../referral-tracking/)
- [Compliance & Documentation](../../../compliance-documentation/)
- [Imaging Management](../../../imaging-management/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
