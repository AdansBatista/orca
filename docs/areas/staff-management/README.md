# Staff Management

> **Area**: Staff Management
>
> **Phase**: 1 - Foundation Infrastructure
>
> **Purpose**: Manage staff profiles, scheduling, roles, permissions, and performance tracking for orthodontic practices

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Phase** | 1 - Foundation Infrastructure |
| **Dependencies** | Authentication & Authorization |
| **Last Updated** | 2024-11-27 |

---

## Overview

The Staff Management area provides comprehensive workforce management capabilities for orthodontic practices. This includes staff profiles and HR records, shift scheduling and time-off management, role-based access control, and performance tracking with training records. The system supports multi-location staff assignments, provider credential tracking, and orthodontic-specific performance metrics.

### Key Capabilities

- **Staff Profiles & HR**: Complete employee profiles with credentials, certifications, emergency contacts, and employment history
- **Scheduling & Time Management**: Shift scheduling, time-off requests, coverage management, and overtime tracking
- **Roles & Permissions**: Role-based access control with custom roles and multi-location access management
- **Performance & Training**: Performance metrics, goal tracking, review cycles, and training record management

### Business Value

- Ensure regulatory compliance with credential and certification tracking
- Optimize staffing with intelligent scheduling and coverage management
- Protect patient data with granular role-based access control
- Improve staff retention through performance tracking and career development
- Streamline HR operations with centralized employee management
- Support multi-location practices with unified staff management

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.1 | [Staff Profiles & HR](./sub-areas/staff-profiles-hr/) | Employee profiles, employment records, credentials, certifications, emergency contacts | 📋 Planned | Critical |
| 2.2 | [Scheduling & Time Management](./sub-areas/scheduling-time-management/) | Shift scheduling, time-off requests, coverage management, overtime tracking | 📋 Planned | High |
| 2.3 | [Roles & Permissions](./sub-areas/roles-permissions/) | Role-based access control, custom roles, permission assignment, multi-location access | 📋 Planned | Critical |
| 2.4 | [Performance & Training](./sub-areas/performance-training/) | Performance metrics, goal tracking, review cycles, training records | 📋 Planned | Medium |

---

## Sub-Area Details

### 2.1 Staff Profiles & HR

Comprehensive employee profile and HR record management for all practice staff.

**Functions:**
- Employee Profile Management
- Employment Record Tracking
- Credential & License Management
- Certification Tracking
- Emergency Contact Management
- Document Management

**Key Features:**
- Complete employee demographics and contact information
- Provider credential tracking (dental licenses, DEA, NPI numbers)
- Clinical certification monitoring (X-ray, CPR, infection control)
- Automated credential expiration alerts
- Employment history and position tracking
- Secure document storage for HR files

---

### 2.2 Scheduling & Time Management

Manage staff schedules, time-off requests, and ensure adequate coverage across locations.

**Functions:**
- Shift Scheduling
- Time-Off Request Management
- Coverage Management
- Overtime Tracking
- Schedule Conflict Detection
- Multi-Location Scheduling

**Key Features:**
- Visual schedule builder with drag-and-drop
- Automated conflict detection and resolution suggestions
- Time-off request workflow with approval routing
- Coverage gap identification and alerts
- Overtime monitoring and alerts
- Cross-location schedule visibility

---

### 2.3 Roles & Permissions

Define and manage access control with role-based permissions and multi-location access.

**Functions:**
- Role Definition & Management
- Permission Assignment
- Custom Role Creation
- Multi-Location Access Control
- Permission Templates
- Access Audit Logging

**Key Features:**
- Pre-defined orthodontic practice roles
- Granular permission controls for sensitive operations
- Custom role creation for specific needs
- Location-specific access assignments
- Role inheritance and hierarchies
- Complete audit trail of access changes

---

### 2.4 Performance & Training

Track staff performance, manage goals, conduct reviews, and maintain training records.

**Functions:**
- Performance Metric Tracking
- Goal Setting & Monitoring
- Review Cycle Management
- Training Record Tracking
- Continuing Education Management
- Provider Production Tracking

**Key Features:**
- Role-specific KPI dashboards (provider production, TC conversions, front desk metrics)
- Goal setting with progress tracking
- Configurable review cycles and templates
- Training compliance monitoring
- CE credit tracking for licensed providers
- Performance trend analysis and reporting

---

## Orthodontic Staff Roles

| Role | Description | Key Credentials | Primary Functions |
|------|-------------|-----------------|-------------------|
| **Orthodontist** | Primary treatment provider | Dental license, Ortho specialty license, DEA, NPI | Treatment planning, appliance adjustments, clinical decisions |
| **Associate Orthodontist** | Secondary treatment provider | Dental license, Ortho specialty license, DEA, NPI | Patient care, treatment execution |
| **Treatment Coordinator** | Patient consultation and case presentation | - | New patient consults, treatment presentations, financial discussions |
| **Clinical Lead** | Supervises clinical staff | X-ray certification, CPR, Infection control | Staff supervision, clinical protocols |
| **Orthodontic Assistant** | Chair-side patient care | X-ray certification (state-dependent), CPR, Infection control | Bracket placement, wire changes, patient education |
| **Expanded Function Assistant** | Advanced clinical procedures | EFDA certification, X-ray, CPR | Expanded duties per state regulations |
| **Front Desk Coordinator** | Patient scheduling and reception | HIPAA training | Scheduling, check-in/out, patient communications |
| **Insurance Coordinator** | Insurance and billing | - | Claims processing, benefits verification |
| **Office Manager** | Practice operations | - | Staff management, operations, vendor relations |
| **Lab Technician** | Appliance fabrication | - | Retainer fabrication, appliance repair |

---

## Integration Points

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Authentication & Authorization | User accounts | Link staff profiles to system accounts |
| Scheduling & Booking | Provider availability | Staff schedules affect appointment availability |
| Patient Management | Provider assignment | Assign providers to patient cases |
| Treatment Management | Provider actions | Track who performs treatments |
| Financial Management | Payroll data | Hours worked, overtime for payroll |
| Financial Management | Provider production | Track provider revenue generation |
| Compliance & Audit | Access logs | Audit trail for PHI access |
| Resources Management | Equipment certification | Track staff certified on equipment |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| Payroll Systems | Export/API | Export hours, overtime for payroll processing |
| State Licensing Boards | Verification API | Verify provider licenses |
| DEA Database | Verification | Verify DEA registration |
| NPI Registry | Verification | Verify NPI numbers |
| Background Check Services | API | Employment verification |
| Training Platforms | API | CE credit import |
| HR Systems | Export | Employee data synchronization |

---

## User Roles & Permissions

| Role | Profiles | Scheduling | Roles | Performance |
|------|----------|------------|-------|-------------|
| Super Admin | Full | Full | Full | Full |
| Clinic Admin | Full | Full | Full | Full |
| Doctor | View Own, View Team | View Own, View Team | View | View Own |
| Clinical Staff | View Own | View Own, Request | View | View Own |
| Front Desk | View Limited | View, Assist | View | View Own |
| Billing | View Limited | View | View | View |
| Read Only | View | View | View | View |

### Special Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `staff:create` | Add new staff members | clinic_admin |
| `staff:update` | Update staff profiles | clinic_admin |
| `staff:delete` | Remove staff (soft delete) | clinic_admin |
| `staff:view_hr` | View HR/sensitive information | clinic_admin |
| `staff:view_salary` | View compensation information | clinic_admin |
| `credentials:manage` | Manage credentials and certifications | clinic_admin |
| `schedule:create` | Create staff schedules | clinic_admin, office_manager |
| `schedule:update` | Modify schedules | clinic_admin, office_manager |
| `schedule:approve_timeoff` | Approve time-off requests | clinic_admin, office_manager |
| `roles:create` | Create custom roles | clinic_admin |
| `roles:assign` | Assign roles to users | clinic_admin |
| `permissions:manage` | Manage permission assignments | super_admin, clinic_admin |
| `performance:view_all` | View all staff performance | clinic_admin |
| `performance:review` | Conduct performance reviews | clinic_admin, office_manager |
| `training:manage` | Manage training records | clinic_admin |

---

## Data Models

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   StaffProfile  │────▶│   Credential    │     │  Certification  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               ▲
        │                                               │
        ▼                                               │
┌─────────────────┐     ┌─────────────────┐            │
│ EmploymentRecord│     │ EmergencyContact│────────────┘
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   StaffShift    │────▶│  TimeOffRequest │     │ ShiftAssignment │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      Role       │────▶│   Permission    │     │  RoleAssignment │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ PerformanceGoal │────▶│ PerformanceReview│    │ TrainingRecord  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Prisma Schemas

```prisma
// Staff Profile
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

  // Provider Information (for clinical staff)
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
  primaryClinic Clinic    @relation("PrimaryClinic", fields: [primaryClinicId], references: [id])
  credentials   Credential[]
  certifications Certification[]
  emergencyContacts EmergencyContact[]
  employmentRecords EmploymentRecord[]
  shifts        StaffShift[]
  timeOffRequests TimeOffRequest[]
  performanceGoals PerformanceGoal[]
  performanceReviews PerformanceReview[]
  trainingRecords TrainingRecord[]

  @@index([clinicId])
  @@index([userId])
  @@index([status])
  @@index([employeeNumber])
  @@index([npiNumber])
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  PRN         // As needed
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

type Address {
  street1   String
  street2   String?
  city      String
  state     String
  zipCode   String
  country   String @default("US")
}

// Credentials (Licenses)
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

// Certifications
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

  // CE Credits (if applicable)
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

// Emergency Contacts
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
  priority      Int      @default(1)  // 1 = primary

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([staffProfileId])
}

// Employment Records
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

// Staff Shifts
model StaffShift {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Shift Details
  shiftDate     DateTime @db.Date
  startTime     DateTime
  endTime       DateTime
  breakMinutes  Int      @default(0)

  // Location
  locationId    String   @db.ObjectId

  // Status
  status        ShiftStatus @default(SCHEDULED)

  // Actual Times (for time tracking)
  clockIn       DateTime?
  clockOut      DateTime?
  actualBreakMinutes Int?

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([shiftDate])
  @@index([locationId])
  @@index([status])
}

enum ShiftStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

// Time-Off Requests
model TimeOffRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Request Details
  requestType   TimeOffType
  startDate     DateTime @db.Date
  endDate       DateTime @db.Date
  totalHours    Decimal?
  isPartialDay  Boolean  @default(false)
  partialStartTime DateTime?
  partialEndTime DateTime?

  // Status
  status        TimeOffStatus @default(PENDING)

  // Reason
  reason        String?
  notes         String?

  // Approval
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?
  rejectionReason String?

  // Coverage
  coverageBy    String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([startDate])
  @@index([status])
}

enum TimeOffType {
  VACATION
  SICK
  PERSONAL
  BEREAVEMENT
  JURY_DUTY
  MILITARY
  MATERNITY
  PATERNITY
  FMLA
  UNPAID
  CONTINUING_EDUCATION
  OTHER
}

enum TimeOffStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  WITHDRAWN
}

// Roles
model Role {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId  // null for system roles

  // Role Details
  name          String
  code          String
  description   String?
  isSystemRole  Boolean  @default(false)

  // Hierarchy
  level         Int      @default(0)  // For role inheritance
  parentRoleId  String?  @db.ObjectId

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic?   @relation(fields: [clinicId], references: [id])
  parentRole    Role?     @relation("RoleHierarchy", fields: [parentRoleId], references: [id])
  childRoles    Role[]    @relation("RoleHierarchy")
  permissions   RolePermission[]
  assignments   RoleAssignment[]

  @@unique([clinicId, code])
  @@index([clinicId])
  @@index([code])
}

// Role Permissions
model RolePermission {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  roleId        String   @db.ObjectId
  permission    String   // e.g., "patient:read", "treatment:create"

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  role          Role      @relation(fields: [roleId], references: [id])

  @@unique([roleId, permission])
  @@index([roleId])
  @@index([permission])
}

// Role Assignments
model RoleAssignment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  userId        String   @db.ObjectId
  roleId        String   @db.ObjectId

  // Location-Specific (optional)
  clinicId      String?  @db.ObjectId  // If set, role only applies to this clinic

  // Dates
  effectiveFrom DateTime @default(now())
  effectiveUntil DateTime?

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  assignedBy    String?  @db.ObjectId

  // Relations
  user          User      @relation(fields: [userId], references: [id])
  role          Role      @relation(fields: [roleId], references: [id])
  clinic        Clinic?   @relation(fields: [clinicId], references: [id])

  @@unique([userId, roleId, clinicId])
  @@index([userId])
  @@index([roleId])
  @@index([clinicId])
}

// Performance Goals
model PerformanceGoal {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Goal Details
  title         String
  description   String?
  category      GoalCategory
  metricType    MetricType?
  targetValue   Decimal?
  targetUnit    String?

  // Dates
  startDate     DateTime
  targetDate    DateTime

  // Progress
  currentValue  Decimal?
  progressPercent Int     @default(0)
  status        GoalStatus @default(NOT_STARTED)

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([status])
  @@index([targetDate])
}

enum GoalCategory {
  PRODUCTION
  PATIENT_SATISFACTION
  EFFICIENCY
  QUALITY
  PROFESSIONAL_DEVELOPMENT
  TEAM_COLLABORATION
  OTHER
}

enum MetricType {
  CURRENCY
  PERCENTAGE
  COUNT
  RATING
  BINARY
}

enum GoalStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  EXCEEDED
  NOT_MET
  CANCELLED
}

// Performance Reviews
model PerformanceReview {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Review Details
  reviewPeriodStart DateTime
  reviewPeriodEnd DateTime
  reviewType    ReviewType
  reviewDate    DateTime?

  // Status
  status        ReviewStatus @default(SCHEDULED)

  // Scores (1-5 scale)
  overallScore  Decimal?
  categoryScores Json?   // { category: score }

  // Feedback
  strengths     String?
  areasForImprovement String?
  managerComments String?
  employeeComments String?

  // Goals
  goalsAchieved Int?
  totalGoals    Int?

  // Reviewer
  reviewerId    String?  @db.ObjectId

  // Signatures
  employeeSignedAt DateTime?
  reviewerSignedAt DateTime?

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
  @@index([status])
  @@index([reviewDate])
}

enum ReviewType {
  ANNUAL
  SEMI_ANNUAL
  QUARTERLY
  PROBATIONARY
  IMPROVEMENT_PLAN
  AD_HOC
}

enum ReviewStatus {
  SCHEDULED
  SELF_REVIEW
  MANAGER_REVIEW
  MEETING_SCHEDULED
  COMPLETED
  CANCELLED
}

// Training Records
model TrainingRecord {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Training Details
  trainingType  TrainingType
  trainingName  String
  description   String?
  provider      String?

  // Dates
  startDate     DateTime
  completionDate DateTime?
  expirationDate DateTime?

  // Status
  status        TrainingStatus @default(NOT_STARTED)

  // CE Credits
  ceCredits     Decimal?
  ceCategory    String?

  // Assessment
  score         Decimal?
  passingScore  Decimal?
  passed        Boolean?

  // Documents
  certificateUrl String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([trainingType])
  @@index([status])
  @@index([expirationDate])
}

enum TrainingType {
  ONBOARDING
  COMPLIANCE
  CLINICAL
  SYSTEM
  EQUIPMENT
  CUSTOMER_SERVICE
  LEADERSHIP
  CONTINUING_EDUCATION
  CERTIFICATION
  OTHER
}

enum TrainingStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  EXPIRED
  WAIVED
}
```

---

## API Endpoints

### Staff Profiles

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff` | List staff members | `staff:read` |
| GET | `/api/staff/:id` | Get staff profile | `staff:read` |
| POST | `/api/staff` | Create staff profile | `staff:create` |
| PUT | `/api/staff/:id` | Update staff profile | `staff:update` |
| DELETE | `/api/staff/:id` | Delete staff (soft) | `staff:delete` |
| GET | `/api/staff/:id/credentials` | Get staff credentials | `credentials:read` |
| POST | `/api/staff/:id/credentials` | Add credential | `credentials:manage` |
| GET | `/api/staff/:id/certifications` | Get staff certifications | `staff:read` |
| POST | `/api/staff/:id/certifications` | Add certification | `credentials:manage` |

### Scheduling

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/schedules` | Get schedules | `schedule:read` |
| GET | `/api/staff/:id/schedules` | Get staff schedule | `schedule:read` |
| POST | `/api/staff/:id/shifts` | Create shift | `schedule:create` |
| PUT | `/api/staff/shifts/:shiftId` | Update shift | `schedule:update` |
| DELETE | `/api/staff/shifts/:shiftId` | Delete shift | `schedule:update` |
| GET | `/api/staff/time-off` | List time-off requests | `schedule:read` |
| POST | `/api/staff/:id/time-off` | Request time-off | `schedule:request` |
| PUT | `/api/staff/time-off/:requestId` | Update request | `schedule:approve_timeoff` |

### Roles & Permissions

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/roles` | List roles | `roles:read` |
| GET | `/api/roles/:id` | Get role details | `roles:read` |
| POST | `/api/roles` | Create role | `roles:create` |
| PUT | `/api/roles/:id` | Update role | `roles:update` |
| DELETE | `/api/roles/:id` | Delete role | `roles:delete` |
| GET | `/api/roles/:id/permissions` | Get role permissions | `roles:read` |
| PUT | `/api/roles/:id/permissions` | Update permissions | `permissions:manage` |
| POST | `/api/staff/:id/roles` | Assign role | `roles:assign` |

### Performance & Training

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/goals` | Get staff goals | `performance:read` |
| POST | `/api/staff/:id/goals` | Create goal | `performance:create` |
| PUT | `/api/staff/goals/:goalId` | Update goal | `performance:update` |
| GET | `/api/staff/:id/reviews` | Get performance reviews | `performance:read` |
| POST | `/api/staff/:id/reviews` | Create review | `performance:review` |
| PUT | `/api/staff/reviews/:reviewId` | Update review | `performance:review` |
| GET | `/api/staff/:id/training` | Get training records | `training:read` |
| POST | `/api/staff/:id/training` | Add training record | `training:manage` |
| GET | `/api/staff/training/due` | Get due/overdue training | `training:read` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `StaffList` | List/search staff members | `components/staff/` |
| `StaffProfile` | Full staff profile view | `components/staff/` |
| `StaffForm` | Add/edit staff profile | `components/staff/` |
| `StaffCard` | Summary card for staff | `components/staff/` |
| `CredentialList` | Display credentials | `components/staff/credentials/` |
| `CredentialForm` | Add/edit credential | `components/staff/credentials/` |
| `CredentialAlert` | Expiring credential alert | `components/staff/credentials/` |
| `CertificationTracker` | Track certifications | `components/staff/credentials/` |
| `ScheduleCalendar` | Visual schedule view | `components/staff/scheduling/` |
| `ShiftEditor` | Edit shifts | `components/staff/scheduling/` |
| `TimeOffRequestForm` | Request time off | `components/staff/scheduling/` |
| `TimeOffApprovalList` | Approve time-off requests | `components/staff/scheduling/` |
| `CoverageView` | Show coverage gaps | `components/staff/scheduling/` |
| `RoleList` | List roles | `components/staff/roles/` |
| `RoleEditor` | Edit role permissions | `components/staff/roles/` |
| `RoleAssignment` | Assign roles to staff | `components/staff/roles/` |
| `PermissionMatrix` | View permissions matrix | `components/staff/roles/` |
| `GoalTracker` | Track performance goals | `components/staff/performance/` |
| `GoalForm` | Create/edit goals | `components/staff/performance/` |
| `ReviewForm` | Conduct performance review | `components/staff/performance/` |
| `ReviewHistory` | View review history | `components/staff/performance/` |
| `TrainingDashboard` | Training overview | `components/staff/training/` |
| `TrainingRecord` | View training details | `components/staff/training/` |
| `CETracker` | Track CE credits | `components/staff/training/` |
| `ProductionReport` | Provider production metrics | `components/staff/performance/` |

---

## Business Rules

### Staff Profiles
1. **Employee Numbers**: Must be unique across the organization
2. **Provider Requirements**: Providers must have NPI numbers recorded
3. **Multi-Location Access**: Staff can be assigned to multiple locations with location-specific roles
4. **Termination**: Terminated staff accounts are deactivated but records retained
5. **Data Access**: Staff can view their own profile; HR data requires elevated permissions

### Credentials & Certifications
1. **Expiration Alerts**: System alerts 90/60/30 days before credential expiration
2. **Verification**: Provider credentials should be verified against state databases
3. **Clinical Requirements**: Clinical staff must maintain current X-ray, CPR, and infection control certifications
4. **DEA Compliance**: DEA numbers must be verified and tracked for controlled substance handling
5. **Expired Credentials**: Staff with expired required credentials are flagged for scheduling restrictions

### Scheduling
1. **Overtime Tracking**: Hours over 40/week flagged for overtime consideration
2. **Break Requirements**: Shifts over 6 hours must include break time
3. **Conflict Detection**: System prevents double-booking staff across locations
4. **Coverage Requirements**: Minimum staffing levels enforced for clinical operations
5. **Time-Off Blackout**: Blackout dates can be set for high-demand periods

### Roles & Permissions
1. **System Roles**: Pre-defined system roles cannot be deleted (only deactivated)
2. **Role Inheritance**: Child roles inherit parent role permissions
3. **Super Admin**: Super admin role has full access and cannot be restricted
4. **Audit Logging**: All permission changes logged for compliance
5. **Location Scoping**: Roles can be scoped to specific locations

### Performance & Training
1. **Review Cycles**: Reviews should be scheduled per practice policy (annual, semi-annual)
2. **Goal Alignment**: Goals should align with practice objectives
3. **Training Compliance**: Required training must be completed by deadlines
4. **CE Requirements**: Licensed providers must meet CE requirements per state regulations
5. **Documentation**: Performance issues must be documented for HR compliance

---

## Compliance Requirements

### HIPAA Workforce Requirements
- Background checks for staff with PHI access
- Workforce security training documentation
- Access authorization documentation
- Termination procedures for revoking access
- Sanction policy documentation

### Credential Verification
- State dental license verification
- DEA registration verification
- NPI validation
- Specialty certification verification
- Criminal background checks (where required)

### Employment Law Compliance
- I-9 employment eligibility documentation
- W-4 tax withholding documentation
- Equal opportunity employment records
- ADA accommodation documentation
- FMLA tracking and documentation

### State-Specific Requirements
- X-ray certification requirements vary by state
- Expanded function assistant regulations
- Supervision requirements for clinical staff
- Continuing education requirements

---

## Implementation Notes

### Phase 1 Dependencies
- **Authentication & Authorization**: User authentication and base permissions system

### Implementation Order
1. Roles & Permissions (foundation for access control)
2. Staff Profiles & HR (core employee management)
3. Scheduling & Time Management (operational scheduling)
4. Performance & Training (staff development)

### Key Technical Decisions
- Use user accounts as base, staff profiles extend with employment details
- Role-based permissions with clinic-scoped assignments
- Soft delete for all staff records (compliance requirement)
- Encrypted storage for sensitive HR data

### Multi-Location Considerations
- Staff can work at multiple locations
- Roles can be location-specific
- Schedules tracked per location
- Credentials apply organization-wide

---

## File Structure

```
docs/areas/staff-management/
├── README.md                      # This file
├── requirements.md                # Detailed requirements
├── features.md                    # Feature overview
└── sub-areas/
    ├── staff-profiles-hr/
    │   ├── README.md
    │   └── functions/
    │       ├── employee-profiles.md
    │       ├── employment-records.md
    │       ├── credential-management.md
    │       ├── certification-tracking.md
    │       └── emergency-contacts.md
    │
    ├── scheduling-time-management/
    │   ├── README.md
    │   └── functions/
    │       ├── shift-scheduling.md
    │       ├── time-off-management.md
    │       ├── coverage-management.md
    │       └── overtime-tracking.md
    │
    ├── roles-permissions/
    │   ├── README.md
    │   └── functions/
    │       ├── role-management.md
    │       ├── permission-assignment.md
    │       ├── custom-roles.md
    │       └── multi-location-access.md
    │
    └── performance-training/
        ├── README.md
        └── functions/
            ├── performance-metrics.md
            ├── goal-tracking.md
            ├── review-cycles.md
            └── training-records.md
```

---

## Related Documentation

- [Requirements](./requirements.md) - Detailed requirements list
- [Features](./features.md) - Feature specifications
- [Authentication & Authorization](../authentication/) - User authentication
- [Scheduling & Booking](../scheduling-booking/) - Appointment scheduling integration
- [Financial Management](../financial-management/) - Payroll integration
- [Practice Orchestration](../practice-orchestration/) - Workflow integration
- [AUTH-GUIDE](../../guides/AUTH-GUIDE.md) - Authorization patterns

---

## Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Planned | 📋 | Documented, not started |
| In Progress | 🔄 | Currently being implemented |
| Review | 👀 | Under review |
| Testing | 🧪 | In testing |
| Completed | ✅ | Fully implemented |
| Blocked | 🚫 | Blocked by dependency |

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
