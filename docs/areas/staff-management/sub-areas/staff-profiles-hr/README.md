# Staff Profiles & HR

> **Area**: [Staff Management](../../)
>
> **Sub-Area**: 2.1 Staff Profiles & HR
>
> **Purpose**: Manage employee profiles, employment records, credentials, certifications, and HR documentation

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Staff Management](../../) |
| **Dependencies** | Auth, User Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Staff Profiles & HR provides comprehensive employee management for orthodontic practices. This includes complete staff profiles with personal and professional information, credential and certification tracking for clinical staff, employment records, and secure HR document management. The system ensures compliance with healthcare regulations by tracking required credentials like dental licenses, DEA registrations, and clinical certifications.

The sub-area supports the unique staffing requirements of orthodontic practices, including provider credential management (NPI, DEA, state licenses), clinical certification tracking (X-ray, CPR, infection control), and multi-location staff assignments.

### Key Capabilities

- Complete employee demographics and contact management
- Provider credential tracking with expiration alerts
- Clinical certification monitoring and compliance
- Employment history and position tracking
- Emergency contact management
- Secure HR document storage
- Multi-location staff assignments
- Automated credential expiration notifications
- Credential verification workflows

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.1.1 | [Employee Profiles](./functions/employee-profiles.md) | Create and manage staff profiles | 📋 Planned | Critical |
| 2.1.2 | [Employment Records](./functions/employment-records.md) | Track employment history and changes | 📋 Planned | High |
| 2.1.3 | [Credential Management](./functions/credential-management.md) | Track provider licenses and registrations | 📋 Planned | Critical |
| 2.1.4 | [Certification Tracking](./functions/certification-tracking.md) | Monitor clinical certifications | 📋 Planned | Critical |
| 2.1.5 | [Emergency Contacts](./functions/emergency-contacts.md) | Manage emergency contact information | 📋 Planned | Medium |
| 2.1.6 | [Document Management](./functions/document-management.md) | Store and manage HR documents | 📋 Planned | High |

---

## Function Details

### 2.1.1 Employee Profiles

**Purpose**: Create and maintain comprehensive staff profiles with personal, professional, and employment information.

**Key Capabilities**:
- Personal information management (name, contact, demographics)
- Professional information (job title, department, hire date)
- Provider-specific details (NPI, DEA, provider type)
- Profile photo management
- Multi-location assignments
- Status tracking (active, on leave, terminated)

**Orthodontic-Specific Fields**:
| Field | Applicable Roles | Notes |
|-------|------------------|-------|
| NPI Number | Orthodontists, Dentists | Required for billing |
| DEA Number | Providers with prescriptive authority | Controlled substance tracking |
| Provider Type | All clinical staff | Orthodontist, Hygienist, Assistant, EFDA |
| State License Number | Licensed providers | State-specific license tracking |
| Specialty Certification | Orthodontists | Specialty board certification |

**User Stories**:
- As a **clinic admin**, I want to create new staff profiles so employees can access the system
- As a **staff member**, I want to update my contact information so the practice can reach me
- As a **clinic admin**, I want to see all staff assigned to a location for scheduling purposes

---

### 2.1.2 Employment Records

**Purpose**: Track employment history including position changes, status updates, and compensation changes.

**Key Capabilities**:
- Record employment events (hire, promotion, transfer, termination)
- Track position and title changes
- Document compensation changes (restricted access)
- Record leave periods (FMLA, maternity/paternity, etc.)
- Maintain employment history timeline
- Generate employment verification reports

**Employment Record Types**:
- **Hire**: Initial employment record
- **Promotion**: Position advancement
- **Transfer**: Location or department change
- **Title Change**: Job title modification
- **Compensation Change**: Salary/hourly rate adjustment
- **Leave Start/End**: Leave of absence documentation
- **Termination**: Employment end record
- **Status Change**: Active/inactive status updates

**User Stories**:
- As a **clinic admin**, I want to record promotions so employment history is accurate
- As a **HR manager**, I want to track leave periods for FMLA compliance
- As a **clinic admin**, I want to generate employment verification for loan applications

---

### 2.1.3 Credential Management

**Purpose**: Track and monitor provider credentials including state licenses, DEA registrations, and specialty certifications.

**Key Capabilities**:
- Record credential details (type, number, issuing authority)
- Track expiration dates with automated alerts
- Verification workflow for new credentials
- Document storage for credential copies
- Credential status tracking (active, expired, pending renewal)
- Integration with verification databases

**Credential Types**:
| Credential | Description | Expiration Tracking |
|------------|-------------|---------------------|
| Dental License | State dental license | Yes - varies by state |
| Orthodontic Specialty License | Specialty certification | Yes - varies by state |
| DEA Registration | Drug Enforcement Administration | Yes - 3-year cycle |
| NPI Number | National Provider Identifier | No - permanent |
| State Controlled Substance | State-level prescription authority | Yes - varies by state |
| Hygienist License | Dental hygienist license | Yes - varies by state |
| EFDA Certification | Expanded Function Dental Assistant | Yes - varies by state |

**Compliance Alerts**:
- 90 days before expiration: Initial alert
- 60 days before expiration: Reminder alert
- 30 days before expiration: Urgent alert
- Expired: Critical alert with scheduling restrictions

**User Stories**:
- As a **clinic admin**, I want to track all provider credentials in one place
- As a **provider**, I want to be notified before my license expires
- As a **compliance officer**, I want to verify credentials are current before scheduling

---

### 2.1.4 Certification Tracking

**Purpose**: Monitor clinical certifications required for orthodontic practice operations.

**Key Capabilities**:
- Track required certifications per role
- Monitor certification expiration dates
- Record CE credits earned
- Generate compliance reports
- Automated renewal reminders
- Certification verification documentation

**Required Certifications by Role**:
| Role | X-Ray | CPR/BLS | HIPAA | OSHA | Infection Control |
|------|-------|---------|-------|------|-------------------|
| Orthodontist | Required | Required | Required | Required | Required |
| Dental Assistant | Required* | Required | Required | Required | Required |
| EFDA | Required | Required | Required | Required | Required |
| Hygienist | Required | Required | Required | Required | Required |
| Front Desk | - | Recommended | Required | Required | Recommended |
| Treatment Coordinator | - | Recommended | Required | Required | Recommended |

*State-dependent requirements

**Specialty Certifications**:
- Invisalign Certification
- Incognito (Lingual Braces) Certification
- SureSmile Certification
- Damon System Training
- Nitrous Oxide Administration
- Coronal Polishing

**User Stories**:
- As a **clinic admin**, I want to ensure all clinical staff have current certifications
- As a **clinical staff**, I want to track my CE credits toward renewal
- As a **compliance officer**, I want to generate certification compliance reports

---

### 2.1.5 Emergency Contacts

**Purpose**: Maintain emergency contact information for all staff members.

**Key Capabilities**:
- Record multiple emergency contacts per staff member
- Set contact priority order
- Store relationship and contact details
- Quick access for emergency situations
- Privacy controls for contact information

**User Stories**:
- As a **staff member**, I want to add emergency contacts so I can be reached in emergencies
- As a **clinic admin**, I want quick access to emergency contacts when needed
- As a **HR manager**, I want to ensure all staff have current emergency contacts on file

---

### 2.1.6 Document Management

**Purpose**: Securely store and manage HR-related documents.

**Key Capabilities**:
- Upload and store HR documents
- Document categorization (contracts, certifications, reviews)
- Access control based on document type
- Document expiration tracking
- Version history for updated documents
- Secure, encrypted storage

**Document Categories**:
- Employment contracts and agreements
- Non-disclosure agreements
- Credential copies (licenses, certifications)
- Performance reviews
- Disciplinary documentation
- Training certificates
- Background check results
- I-9 and tax documents

**User Stories**:
- As a **clinic admin**, I want to store employee contracts securely
- As a **HR manager**, I want to access employee documents during audits
- As a **staff member**, I want to upload my updated certification documents

---

## Data Model

```prisma
model StaffProfile {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId @unique

  // Personal Information
  firstName     String
  lastName      String
  preferredName String?
  dateOfBirth   DateTime?
  gender        Gender?
  photoUrl      String?

  // Contact Information
  email         String
  phone         String?
  alternatePhone String?
  address       Address?

  // Employment Information
  employeeNumber String   @unique
  jobTitle      String
  department    String?
  employmentType EmploymentType @default(FULL_TIME)
  hireDate      DateTime
  terminationDate DateTime?
  status        StaffStatus @default(ACTIVE)

  // Provider Information
  isProvider    Boolean  @default(false)
  providerType  ProviderType?
  npiNumber     String?  @unique
  deaNumber     String?
  stateIdNumber String?

  // Compensation (restricted access)
  hourlyRate    Decimal?
  salary        Decimal?
  payType       PayType?

  // Multi-Location
  primaryClinicId String  @db.ObjectId
  assignedClinicIds String[] @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  user          User      @relation(fields: [userId], references: [id])
  credentials   Credential[]
  certifications Certification[]
  emergencyContacts EmergencyContact[]
  employmentRecords EmploymentRecord[]
  documents     StaffDocument[]

  @@index([clinicId])
  @@index([userId])
  @@index([status])
  @@index([employeeNumber])
  @@index([npiNumber])
}

model Credential {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Credential Details
  credentialType CredentialType
  credentialNumber String
  issuingAuthority String
  issuingState  String?

  // Dates
  issueDate     DateTime
  expirationDate DateTime?
  renewalDate   DateTime?

  // Status
  status        CredentialStatus @default(ACTIVE)
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId

  // Documents
  documentUrl   String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([credentialType])
  @@index([expirationDate])
  @@index([status])
}

model Certification {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Certification Details
  certificationType CertificationType
  certificationName String
  issuingOrganization String
  certificateNumber String?

  // Dates
  issueDate     DateTime
  expirationDate DateTime?
  renewalDueDate DateTime?

  // CE Credits
  ceCredits     Decimal?
  ceCategory    String?

  // Status
  status        CertificationStatus @default(ACTIVE)

  // Documents
  documentUrl   String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([certificationType])
  @@index([expirationDate])
}

model EmergencyContact {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Contact Information
  name          String
  relationship  String
  phone         String
  alternatePhone String?
  email         String?

  // Priority
  priority      Int      @default(1)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([staffProfileId])
}

model EmploymentRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Record Type
  recordType    EmploymentRecordType

  // Position Information
  jobTitle      String?
  department    String?
  supervisor    String?

  // Dates
  effectiveDate DateTime
  endDate       DateTime?

  // Details
  reason        String?
  notes         String?

  // Compensation Changes
  previousSalary Decimal?
  newSalary     Decimal?

  // Documents
  documentUrl   String?

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([recordType])
  @@index([effectiveDate])
}

model StaffDocument {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Document Details
  documentType  StaffDocumentType
  documentName  String
  description   String?
  fileUrl       String
  fileName      String
  fileSize      Int
  mimeType      String

  // Dates
  documentDate  DateTime?
  expirationDate DateTime?

  // Access Control
  accessLevel   DocumentAccessLevel @default(HR_ONLY)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  uploadedBy    String   @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([documentType])
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  PRN
  TEMP
}

enum StaffStatus {
  ACTIVE
  ON_LEAVE
  TERMINATED
  SUSPENDED
  PENDING
}

enum ProviderType {
  ORTHODONTIST
  GENERAL_DENTIST
  ORAL_SURGEON
  HYGIENIST
  ASSISTANT
  EFDA
}

enum PayType {
  HOURLY
  SALARY
  PRODUCTION
  HYBRID
}

enum Gender {
  MALE
  FEMALE
  NON_BINARY
  OTHER
  PREFER_NOT_TO_SAY
}

enum CredentialType {
  DENTAL_LICENSE
  ORTHO_SPECIALTY_LICENSE
  HYGIENIST_LICENSE
  ASSISTANT_LICENSE
  DEA_REGISTRATION
  NPI
  STATE_CONTROLLED_SUBSTANCE
  ANESTHESIA_PERMIT
  EFDA_CERTIFICATION
}

enum CredentialStatus {
  ACTIVE
  EXPIRED
  PENDING_RENEWAL
  SUSPENDED
  REVOKED
  PENDING_VERIFICATION
}

enum CertificationType {
  XRAY_CERTIFICATION
  CPR_BLS
  ACLS
  HIPAA
  OSHA
  INFECTION_CONTROL
  NITROUS_OXIDE
  CORONAL_POLISHING
  SEALANTS
  INVISALIGN
  INCOGNITO
  SURESMILE
  DAMON
  OTHER
}

enum CertificationStatus {
  ACTIVE
  EXPIRED
  PENDING_RENEWAL
  IN_PROGRESS
}

enum EmploymentRecordType {
  HIRE
  PROMOTION
  TRANSFER
  TITLE_CHANGE
  COMPENSATION_CHANGE
  LEAVE_START
  LEAVE_END
  TERMINATION
  REHIRE
  STATUS_CHANGE
}

enum StaffDocumentType {
  CONTRACT
  NDA
  CREDENTIAL_COPY
  CERTIFICATION_COPY
  PERFORMANCE_REVIEW
  DISCIPLINARY
  BACKGROUND_CHECK
  I9_FORM
  W4_FORM
  DIRECT_DEPOSIT
  HANDBOOK_ACKNOWLEDGMENT
  OTHER
}

enum DocumentAccessLevel {
  PUBLIC           // Staff can view own
  HR_ONLY          // HR/Admin only
  MANAGEMENT       // Management and above
  CONFIDENTIAL     // Clinic admin only
}

type Address {
  street1   String
  street2   String?
  city      String
  state     String
  zipCode   String
  country   String @default("US")
}
```

---

## API Endpoints

### Staff Profiles

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff` | List staff profiles | `staff:read` |
| GET | `/api/staff/:id` | Get staff profile | `staff:read` |
| POST | `/api/staff` | Create staff profile | `staff:create` |
| PUT | `/api/staff/:id` | Update staff profile | `staff:update` |
| DELETE | `/api/staff/:id` | Delete staff (soft) | `staff:delete` |
| GET | `/api/staff/:id/photo` | Get profile photo | `staff:read` |
| PUT | `/api/staff/:id/photo` | Update profile photo | `staff:update` |

### Credentials

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/credentials` | List credentials | `credentials:read` |
| POST | `/api/staff/:id/credentials` | Add credential | `credentials:manage` |
| PUT | `/api/staff/credentials/:credentialId` | Update credential | `credentials:manage` |
| DELETE | `/api/staff/credentials/:credentialId` | Remove credential | `credentials:manage` |
| POST | `/api/staff/credentials/:credentialId/verify` | Verify credential | `credentials:manage` |
| GET | `/api/staff/credentials/expiring` | Get expiring credentials | `credentials:read` |

### Certifications

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/certifications` | List certifications | `staff:read` |
| POST | `/api/staff/:id/certifications` | Add certification | `credentials:manage` |
| PUT | `/api/staff/certifications/:certId` | Update certification | `credentials:manage` |
| DELETE | `/api/staff/certifications/:certId` | Remove certification | `credentials:manage` |
| GET | `/api/staff/certifications/expiring` | Get expiring certifications | `staff:read` |
| GET | `/api/staff/certifications/compliance` | Get compliance report | `staff:read` |

### Employment Records

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/employment-records` | Get employment history | `staff:view_hr` |
| POST | `/api/staff/:id/employment-records` | Add employment record | `staff:update` |
| GET | `/api/staff/:id/employment-verification` | Generate verification letter | `staff:view_hr` |

### Emergency Contacts

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/emergency-contacts` | List emergency contacts | `staff:read` |
| POST | `/api/staff/:id/emergency-contacts` | Add emergency contact | `staff:update` |
| PUT | `/api/staff/emergency-contacts/:contactId` | Update contact | `staff:update` |
| DELETE | `/api/staff/emergency-contacts/:contactId` | Remove contact | `staff:update` |

### Documents

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/documents` | List documents | `staff:view_hr` |
| POST | `/api/staff/:id/documents` | Upload document | `staff:update` |
| GET | `/api/staff/documents/:docId` | Download document | `staff:view_hr` |
| DELETE | `/api/staff/documents/:docId` | Delete document | `staff:delete` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `StaffList` | List/search staff with filters | `components/staff/` |
| `StaffProfile` | Full profile view with tabs | `components/staff/` |
| `StaffForm` | Create/edit staff profile | `components/staff/` |
| `StaffCard` | Summary card for staff | `components/staff/` |
| `StaffDirectory` | Organization directory | `components/staff/` |
| `CredentialList` | Display credentials with status | `components/staff/credentials/` |
| `CredentialForm` | Add/edit credential | `components/staff/credentials/` |
| `CredentialVerification` | Verification workflow | `components/staff/credentials/` |
| `CredentialExpirationAlert` | Expiring credential alerts | `components/staff/credentials/` |
| `CredentialComplianceReport` | Compliance dashboard | `components/staff/credentials/` |
| `CertificationList` | Display certifications | `components/staff/certifications/` |
| `CertificationForm` | Add/edit certification | `components/staff/certifications/` |
| `CertificationTracker` | Track CE credits | `components/staff/certifications/` |
| `EmergencyContactList` | Display emergency contacts | `components/staff/emergency/` |
| `EmergencyContactForm` | Add/edit emergency contact | `components/staff/emergency/` |
| `EmploymentTimeline` | Employment history timeline | `components/staff/employment/` |
| `EmploymentRecordForm` | Add employment event | `components/staff/employment/` |
| `DocumentUploader` | Upload staff documents | `components/staff/documents/` |
| `DocumentList` | List/download documents | `components/staff/documents/` |
| `ProviderCredentialSummary` | Provider credential overview | `components/staff/credentials/` |

---

## Business Rules

1. **Employee Numbers**: Must be unique across the organization, auto-generated if not provided
2. **NPI Validation**: NPI numbers must pass checksum validation
3. **Provider Requirements**: Staff marked as providers must have NPI numbers
4. **DEA Tracking**: Providers with prescriptive authority must have DEA numbers tracked
5. **Credential Expiration**: System alerts at 90/60/30 days before expiration
6. **Certification Requirements**: Role-based certification requirements enforced
7. **Multi-Location**: Staff can be assigned to multiple locations
8. **Termination**: Terminated staff records retained but marked inactive
9. **Document Retention**: HR documents retained per regulatory requirements
10. **Access Control**: Compensation and sensitive HR data require elevated permissions

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User accounts for staff |
| Role Management | Required | Role-based access control |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Document Storage | Required | Secure file storage |
| State Licensing APIs | Optional | License verification |
| NPI Registry | Optional | NPI validation |
| Email Service | Required | Expiration notifications |

---

## Related Documentation

- [Parent: Staff Management](../../)
- [Scheduling & Time Management](../scheduling-time-management/)
- [Roles & Permissions](../roles-permissions/)
- [Performance & Training](../performance-training/)
- [AUTH-GUIDE](../../../../guides/AUTH-GUIDE.md) - Authorization patterns

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
