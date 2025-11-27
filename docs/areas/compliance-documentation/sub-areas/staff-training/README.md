# Staff Training

> **Area**: [Compliance & Documentation](../../)
>
> **Sub-Area**: 12.3 Staff Training
>
> **Purpose**: Track staff certifications, manage training programs, monitor compliance education, and ensure credential validity

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Compliance & Documentation](../../) |
| **Dependencies** | Auth, Staff Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

Staff Training management ensures that all orthodontic practice staff maintain required certifications, complete mandatory training, and meet continuing education requirements. This sub-area handles certification tracking, training program administration, expiration alerting, and compliance reporting.

Orthodontic practices require staff to maintain various certifications including professional licenses, CPR/BLS certification, radiation safety training, HIPAA training, and OSHA compliance training. This system ensures certifications don't lapse, training is completed on schedule, and the practice can demonstrate staff compliance during audits.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 12.3.1 | [Certification Management](./functions/certification-management.md) | Track licenses and certifications | 📋 Planned | Critical |
| 12.3.2 | [Training Program Administration](./functions/training-program-administration.md) | Manage training programs and assignments | 📋 Planned | High |
| 12.3.3 | [Expiration Alert System](./functions/expiration-alert-system.md) | Alert on upcoming expirations | 📋 Planned | Critical |
| 12.3.4 | [Continuing Education Tracking](./functions/continuing-education-tracking.md) | Track CE credits and requirements | 📋 Planned | High |
| 12.3.5 | [Onboarding Checklist Management](./functions/onboarding-checklist-management.md) | New hire training checklists | 📋 Planned | Medium |
| 12.3.6 | [Training Compliance Reporting](./functions/training-compliance-reporting.md) | Generate compliance reports | 📋 Planned | Medium |

---

## Function Details

### 12.3.1 Certification Management

**Purpose**: Track all staff licenses, certifications, and credentials with document storage and verification.

**Key Capabilities**:
- Certification record management
- Document upload and storage
- Expiration date tracking
- License verification integration
- Certification history maintenance
- Multi-state license tracking
- Certification requirement templates by role
- Verification status tracking

**User Stories**:
- As a **clinic admin**, I want to see all staff certifications and their expiration dates
- As a **staff member**, I want to upload my renewed CPR card when I recertify
- As a **compliance officer**, I want to verify that all required certifications are current

**Required Certifications by Role**:
| Role | Required Certifications |
|------|------------------------|
| Orthodontist | Dental license, DEA (if applicable), CPR/BLS, State radiation certification |
| Dental Assistant | DA license/registration, CPR/BLS, Radiation certification, Coronal polish (state-dependent) |
| Orthodontic Assistant | X-ray certification, CPR/BLS, Expanded functions certification |
| Front Desk | CPR/BLS (recommended), HIPAA training |
| Office Manager | CPR/BLS, OSHA training, HIPAA training |

**Certification Types**:
| Category | Certifications |
|----------|---------------|
| Professional License | Dental license, Dental assistant license, RDA |
| Life Support | CPR, BLS, ACLS, PALS |
| Radiation | X-ray certification, Radiology supervisor |
| Regulatory | HIPAA training, OSHA training, Infection control |
| Specialty | Invisalign certification, Expanded functions |
| State-Specific | Coronal polish, Local anesthesia, Nitrous oxide |

---

### 12.3.2 Training Program Administration

**Purpose**: Create, assign, and track completion of training programs for staff.

**Key Capabilities**:
- Training program creation
- Training assignment by role/individual
- Progress tracking
- Completion verification
- Training material management
- Quiz/assessment integration
- Training schedule management
- Trainer/facilitator assignment

**User Stories**:
- As a **clinic admin**, I want to assign annual HIPAA training to all staff
- As a **staff member**, I want to see what training I need to complete
- As a **trainer**, I want to track which staff have completed my training session

**Standard Training Programs**:
| Program | Frequency | Duration | Required For |
|---------|-----------|----------|--------------|
| HIPAA Privacy & Security | Annual | 1-2 hours | All staff |
| OSHA Bloodborne Pathogens | Annual | 1-2 hours | Clinical staff |
| Infection Control | Annual | 1-2 hours | Clinical staff |
| Fire Safety | Annual | 30 min | All staff |
| Emergency Procedures | Annual | 1 hour | All staff |
| Radiation Safety | Initial + periodic | 1-2 hours | X-ray operators |
| New Employee Orientation | Initial | 4-8 hours | New hires |
| Sexual Harassment Prevention | Annual (some states) | 1-2 hours | All staff |

---

### 12.3.3 Expiration Alert System

**Purpose**: Proactively alert staff and administrators about upcoming certification and training expirations.

**Key Capabilities**:
- Configurable alert thresholds (30/60/90 days)
- Multi-channel notifications (email, SMS, in-app)
- Escalation paths for non-response
- Dashboard alerts for administrators
- Bulk expiration reports
- Calendar integration for renewal dates
- Automatic training assignment on expiration
- Grace period management

**User Stories**:
- As a **staff member**, I want to be notified 60 days before my CPR expires
- As a **clinic admin**, I want to see a dashboard of all upcoming expirations
- As an **office manager**, I want expired certifications to escalate to me

**Alert Schedule**:
| Days Before | Alert Level | Recipients |
|-------------|-------------|------------|
| 90 days | Early warning | Staff member |
| 60 days | Standard | Staff member |
| 30 days | Urgent | Staff member, supervisor |
| 14 days | Critical | Staff member, supervisor, admin |
| Expired | Overdue | Staff member, supervisor, admin, compliance |

**Escalation Actions**:
- 30 days: Training assignment triggered
- 14 days: Supervisor notification
- Expired: Work restriction consideration
- 30 days overdue: HR notification

---

### 12.3.4 Continuing Education Tracking

**Purpose**: Track continuing education credits required for license renewal and professional development.

**Key Capabilities**:
- CE credit logging
- CE requirement tracking by license type
- CE credit categorization (clinical, ethics, etc.)
- CE completion documentation
- CE provider/course database
- Renewal cycle tracking
- CE gap analysis
- CE transcript generation

**User Stories**:
- As a **doctor**, I want to track my CE credits toward license renewal
- As a **dental assistant**, I want to see how many CE hours I need in each category
- As a **clinic admin**, I want to ensure all licensed staff meet CE requirements

**CE Requirements (Examples)**:
| License | CE Hours/Period | Special Requirements |
|---------|-----------------|---------------------|
| Dentist (typical) | 40 hours/2 years | Infection control, ethics |
| Dental Assistant | 25 hours/2 years | Varies by state |
| RDA | 25-50 hours/2 years | State-dependent |
| Dental Hygienist | 24-36 hours/2 years | State-dependent |

**CE Categories**:
- Clinical (general)
- Infection control/OSHA
- Ethics/jurisprudence
- CPR/emergency
- Specialty (orthodontics)
- Practice management
- Technology/digital dentistry

---

### 12.3.5 Onboarding Checklist Management

**Purpose**: Manage new employee orientation and onboarding training requirements.

**Key Capabilities**:
- Onboarding checklist templates by role
- Task assignment and tracking
- Training schedule generation
- Mentor/buddy assignment
- Documentation collection
- Probation period tracking
- Onboarding completion verification
- New hire compliance verification

**User Stories**:
- As a **clinic admin**, I want a standardized onboarding process for new assistants
- As a **new employee**, I want to see what I need to complete during my first weeks
- As a **mentor**, I want to track my new hire's progress

**Onboarding Phases**:

**Day 1 (Administrative)**:
- [ ] Complete employment paperwork
- [ ] Review employee handbook
- [ ] Set up system access/credentials
- [ ] Facility tour and introductions
- [ ] Emergency procedures review
- [ ] HIPAA training (initial)

**Week 1 (Compliance)**:
- [ ] OSHA Bloodborne Pathogens training
- [ ] Infection control training
- [ ] Fire safety and evacuation
- [ ] CPR verification or scheduling
- [ ] Radiation safety (if applicable)

**Week 2-4 (Role Training)**:
- [ ] Software system training
- [ ] Clinical protocols review
- [ ] Shadow experienced staff
- [ ] Procedure-specific training
- [ ] Equipment operation training

**Month 1-3 (Verification)**:
- [ ] Competency assessments
- [ ] Protocol acknowledgments
- [ ] 30-day review
- [ ] 90-day review

---

### 12.3.6 Training Compliance Reporting

**Purpose**: Generate reports on training completion, certification status, and compliance gaps.

**Key Capabilities**:
- Compliance dashboard
- Individual staff training records
- Department/team reports
- Audit-ready compliance reports
- Gap analysis reports
- Expiration forecast reports
- Training completion trends
- Cost/time analysis

**User Stories**:
- As a **clinic admin**, I want to generate a compliance report for our annual audit
- As a **compliance officer**, I want to identify staff with compliance gaps
- As an **HR manager**, I want to track training costs and time spent

**Key Reports**:
| Report | Purpose | Frequency |
|--------|---------|-----------|
| Certification Status | All certifications by status | Weekly/Monthly |
| Training Completion | Training program completion rates | Monthly |
| Expiration Forecast | Upcoming expirations by period | Monthly |
| Compliance Gap | Staff missing required items | On-demand |
| Audit Summary | Comprehensive compliance for audits | Annual/On-demand |
| CE Progress | CE hours by staff and category | Quarterly |
| Onboarding Status | New hire completion progress | Weekly |

---

## Data Model

```prisma
model Certification {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  // Certification info
  type          CertificationType
  name          String
  issuingBody   String
  licenseNumber String?
  state         String?   // For state-specific licenses

  // Dates
  issueDate     DateTime
  expirationDate DateTime?
  renewedDate   DateTime?  // Last renewal

  // Verification
  verificationStatus VerificationStatus @default(PENDING)
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId
  verificationNotes String?

  // Documentation
  documentUrl   String?
  documentName  String?

  // Status
  status        CertificationStatus @default(ACTIVE)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  user      User   @relation(fields: [userId], references: [id])
  history   CertificationHistory[]
  alerts    CertificationAlert[]

  @@index([clinicId])
  @@index([userId])
  @@index([type])
  @@index([expirationDate])
  @@index([status])
}

enum CertificationType {
  DENTAL_LICENSE
  DENTAL_ASSISTANT_LICENSE
  RDA
  RDH
  DEA
  CPR_BLS
  ACLS
  PALS
  XRAY_CERTIFICATION
  HIPAA_TRAINING
  OSHA_TRAINING
  INFECTION_CONTROL
  CORONAL_POLISH
  LOCAL_ANESTHESIA
  NITROUS_OXIDE
  EXPANDED_FUNCTIONS
  INVISALIGN
  OTHER
}

enum VerificationStatus {
  PENDING
  VERIFIED
  FAILED
  EXPIRED
}

enum CertificationStatus {
  ACTIVE
  EXPIRING_SOON
  EXPIRED
  REVOKED
  SUPERSEDED
}

model CertificationHistory {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  certificationId String   @db.ObjectId

  // History record
  action          String   // "CREATED", "RENEWED", "EXPIRED", etc.
  previousExpDate DateTime?
  newExpDate      DateTime?
  documentUrl     String?
  notes           String?

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String?  @db.ObjectId

  // Relations
  certification Certification @relation(fields: [certificationId], references: [id])

  @@index([certificationId])
}

model CertificationAlert {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  certificationId String   @db.ObjectId

  // Alert info
  alertType       AlertType
  alertDate       DateTime
  daysUntilExpiry Int

  // Delivery
  sentVia         String[]  // ["email", "sms", "in_app"]
  sentAt          DateTime?
  acknowledged    Boolean   @default(false)
  acknowledgedAt  DateTime?

  // Relations
  certification Certification @relation(fields: [certificationId], references: [id])

  @@index([certificationId])
  @@index([alertDate])
}

enum AlertType {
  EARLY_WARNING    // 90 days
  STANDARD         // 60 days
  URGENT           // 30 days
  CRITICAL         // 14 days
  EXPIRED          // Overdue
}

model TrainingProgram {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Program info
  name          String
  code          String   @unique
  category      TrainingCategory
  description   String?

  // Content
  content       String?  // Training material content
  materialUrls  String[] // Links to training materials
  duration      Int?     // Expected duration in minutes

  // Settings
  frequency     TrainingFrequency
  passingScore  Int?     // If has assessment
  isRequired    Boolean  @default(true)
  requiredForRoles String[]

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic      Clinic @relation(fields: [clinicId], references: [id])
  assignments TrainingAssignment[]

  @@index([clinicId])
  @@index([category])
  @@index([isActive])
}

enum TrainingCategory {
  COMPLIANCE       // HIPAA, OSHA
  CLINICAL         // Clinical procedures
  SAFETY           // Fire, emergency
  SOFTWARE         // System training
  ONBOARDING       // New hire
  PROFESSIONAL     // Professional development
  CUSTOMER_SERVICE
  OTHER
}

enum TrainingFrequency {
  ONCE             // One-time training
  ANNUAL           // Every year
  BIENNIAL         // Every 2 years
  QUARTERLY        // Every 3 months
  AS_NEEDED
}

model TrainingAssignment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId
  programId     String   @db.ObjectId

  // Assignment info
  assignedDate  DateTime @default(now())
  dueDate       DateTime
  assignedBy    String?  @db.ObjectId

  // Completion
  status        TrainingStatus @default(ASSIGNED)
  startedAt     DateTime?
  completedAt   DateTime?
  completedBy   String?  @db.ObjectId  // Who marked complete

  // Assessment (if applicable)
  score         Int?
  passed        Boolean?
  attempts      Int      @default(0)

  // Documentation
  certificateUrl String?
  notes         String?

  // For recurring
  previousAssignmentId String? @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  user      User   @relation(fields: [userId], references: [id])
  program   TrainingProgram @relation(fields: [programId], references: [id])

  @@index([clinicId])
  @@index([userId])
  @@index([programId])
  @@index([status])
  @@index([dueDate])
}

enum TrainingStatus {
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  OVERDUE
  WAIVED
  FAILED
}

model ContinuingEducation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  // CE info
  courseName    String
  provider      String
  category      CECategory
  credits       Decimal
  completionDate DateTime

  // Tracking
  licenseType   CertificationType  // Which license this applies to
  renewalCycleStart DateTime
  renewalCycleEnd   DateTime

  // Documentation
  certificateUrl String?
  courseId      String?  // External course ID

  // Verification
  verified      Boolean  @default(false)
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  user      User   @relation(fields: [userId], references: [id])

  @@index([clinicId])
  @@index([userId])
  @@index([licenseType])
  @@index([completionDate])
  @@index([category])
}

enum CECategory {
  CLINICAL
  INFECTION_CONTROL
  ETHICS
  CPR_EMERGENCY
  SPECIALTY
  PRACTICE_MANAGEMENT
  TECHNOLOGY
  OTHER
}

model OnboardingChecklist {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  // Checklist info
  templateId    String?  @db.ObjectId
  role          String   // Role being onboarded for
  startDate     DateTime
  targetCompletionDate DateTime

  // Progress
  status        OnboardingStatus @default(IN_PROGRESS)
  items         Json     // Array of checklist items with completion status
  completedItems Int     @default(0)
  totalItems    Int

  // Assignments
  mentorId      String?  @db.ObjectId
  supervisorId  String   @db.ObjectId

  // Reviews
  thirtyDayReviewDate DateTime?
  thirtyDayReviewNotes String?
  ninetyDayReviewDate DateTime?
  ninetyDayReviewNotes String?

  // Completion
  completedAt   DateTime?
  completedBy   String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic     Clinic @relation(fields: [clinicId], references: [id])
  user       User   @relation("OnboardingUser", fields: [userId], references: [id])
  mentor     User?  @relation("OnboardingMentor", fields: [mentorId], references: [id])
  supervisor User   @relation("OnboardingSupervisor", fields: [supervisorId], references: [id])

  @@index([clinicId])
  @@index([userId])
  @@index([status])
}

enum OnboardingStatus {
  NOT_STARTED
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  TERMINATED
}
```

---

## API Endpoints

### Certifications

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/certifications` | List all certifications | `training:view_all` |
| GET | `/api/compliance/certifications/my` | Get my certifications | `training:view_own` |
| POST | `/api/compliance/certifications` | Add certification | `training:manage` |
| PUT | `/api/compliance/certifications/:id` | Update certification | `training:manage` |
| POST | `/api/compliance/certifications/:id/renew` | Record renewal | `training:manage` |
| POST | `/api/compliance/certifications/:id/verify` | Verify certification | `training:manage` |
| GET | `/api/compliance/certifications/expiring` | Get expiring certifications | `training:view_all` |

### Training Programs

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/training/programs` | List programs | `training:read` |
| POST | `/api/compliance/training/programs` | Create program | `training:manage` |
| PUT | `/api/compliance/training/programs/:id` | Update program | `training:manage` |
| POST | `/api/compliance/training/programs/:id/assign` | Assign to staff | `training:manage` |

### Training Assignments

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/training/assignments` | List all assignments | `training:view_all` |
| GET | `/api/compliance/training/assignments/my` | Get my assignments | `training:view_own` |
| POST | `/api/compliance/training/assignments/:id/start` | Start training | `training:view_own` |
| POST | `/api/compliance/training/assignments/:id/complete` | Complete training | `training:view_own` |
| GET | `/api/compliance/training/assignments/overdue` | Get overdue training | `training:view_all` |

### Continuing Education

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/ce` | List CE records | `training:view_all` |
| GET | `/api/compliance/ce/my` | Get my CE records | `training:view_own` |
| POST | `/api/compliance/ce` | Add CE record | `training:view_own` |
| GET | `/api/compliance/ce/requirements/:userId` | Get CE requirements | `training:view_own` |
| GET | `/api/compliance/ce/progress/:userId` | Get CE progress | `training:view_own` |

### Onboarding

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/onboarding` | List onboarding records | `training:view_all` |
| POST | `/api/compliance/onboarding` | Start onboarding | `training:manage` |
| PUT | `/api/compliance/onboarding/:id` | Update onboarding | `training:manage` |
| POST | `/api/compliance/onboarding/:id/items/:itemId` | Complete item | `training:view_own` |

### Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/training/reports/status` | Certification status report | `audit:view_full` |
| GET | `/api/compliance/training/reports/expiration` | Expiration forecast | `training:view_all` |
| GET | `/api/compliance/training/reports/compliance` | Compliance gap report | `audit:view_full` |
| GET | `/api/compliance/training/reports/ce-summary` | CE summary report | `training:view_all` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `CertificationList` | Display staff certifications | `components/compliance/` |
| `CertificationCard` | Individual certification display | `components/compliance/` |
| `CertificationForm` | Add/edit certification | `components/compliance/` |
| `CertificationUploader` | Upload certification documents | `components/compliance/` |
| `ExpirationDashboard` | Upcoming expirations view | `components/compliance/` |
| `TrainingProgramList` | Available training programs | `components/compliance/` |
| `TrainingAssignmentCard` | Training assignment display | `components/compliance/` |
| `TrainingProgressTracker` | Track training completion | `components/compliance/` |
| `CETracker` | CE credit tracking | `components/compliance/` |
| `CEProgressChart` | Visual CE progress | `components/compliance/` |
| `OnboardingChecklist` | New hire checklist UI | `components/compliance/` |
| `OnboardingProgress` | Onboarding status view | `components/compliance/` |
| `ComplianceDashboard` | Overall training compliance | `components/compliance/` |
| `StaffCredentialCard` | Quick credential view | `components/compliance/` |

---

## Business Rules

1. **Required Certifications**: Staff cannot perform certain tasks without valid certifications
2. **Expiration Enforcement**: Expired certifications generate automatic alerts
3. **Training Due Dates**: Overdue training assignments escalate to supervisors
4. **CE Requirements**: System tracks CE toward license renewal requirements
5. **Onboarding Completion**: New hires must complete onboarding within specified timeframe
6. **Verification Requirement**: Certain certifications require manual verification
7. **Documentation Required**: All certifications must have uploaded documentation
8. **Role-Based Requirements**: Training requirements determined by staff role

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication |
| Staff Management | Required | Staff profiles and roles |
| Patient Communications | Optional | Alert delivery |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Document Storage | Required | Certificate storage |
| Email/SMS Service | Required | Alert notifications |
| License Verification APIs | Optional | Automated verification |
| LMS Integration | Optional | External training platforms |

---

## Security Requirements

### Access Control
- **View own records**: All staff
- **View all records**: clinic_admin, HR
- **Manage certifications**: clinic_admin, HR
- **Manage training**: clinic_admin

### Audit Requirements
- Log all certification changes
- Track training completions
- Document verification activities
- Record alert delivery

### Data Protection
- Certification documents encrypted at rest
- License numbers treated as sensitive data
- Training records maintained per retention policy

---

## Related Documentation

- [Parent: Compliance & Documentation](../../)
- [Consent Forms](../consent-forms/)
- [Clinical Protocols](../clinical-protocols/)
- [Audit Management](../audit-management/)
- [Staff Management](../../staff-management/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
