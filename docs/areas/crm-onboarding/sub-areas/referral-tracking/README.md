# Referral Tracking

> **Area**: [CRM & Onboarding](../../)
>
> **Sub-Area**: 8.3 Referral Tracking
>
> **Purpose**: Manage referral relationships with dentists and specialists, track patient referral sources, and maintain professional communication with referring providers

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [CRM & Onboarding](../../) |
| **Dependencies** | Auth, Lead Management, Patient Communications |
| **Last Updated** | 2024-11-26 |

---

## Overview

Referral Tracking manages the lifeblood of most orthodontic practices: referrals from general dentists and existing patients. Unlike general dentistry, orthodontic practices typically receive a significant portion of new patients through professional referrals, making these relationships critical to practice growth.

### Orthodontic-Specific Considerations

- **Professional Referral Network**: General dentists are the primary referral source
- **Relationship Reciprocity**: Some orthodontists refer back to general dentists for non-ortho work
- **Progress Updates**: Referring dentists expect treatment progress reports
- **Specialist Network**: Referrals to oral surgeons, periodontists, TMJ specialists
- **Patient Referrals**: Word-of-mouth from satisfied patients/families
- **Competition Awareness**: Multiple orthodontists may compete for the same referring dentists

### Key Capabilities

- Referring provider directory management
- Referral source attribution at patient level
- Automated acknowledgment letters
- Treatment progress reports to referring dentists
- Referral analytics and conversion tracking
- Specialist outbound referral management

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 8.3.1 | [Referring Provider Directory](./functions/provider-directory.md) | Manage database of referring providers | 📋 Planned | High |
| 8.3.2 | [Referral Source Attribution](./functions/referral-attribution.md) | Track which provider/patient referred each new patient | 📋 Planned | Critical |
| 8.3.3 | [Acknowledgment Letters](./functions/acknowledgment-letters.md) | Auto-generate thank you letters to referrers | 📋 Planned | High |
| 8.3.4 | [Progress Reports](./functions/progress-reports.md) | Send treatment updates to referring dentists | 📋 Planned | Medium |
| 8.3.5 | [Referral Analytics](./functions/referral-analytics.md) | Analyze referral patterns and performance | 📋 Planned | Medium |
| 8.3.6 | [Specialist Network](./functions/specialist-network.md) | Manage outbound referrals to specialists | 📋 Planned | Medium |

---

## Function Details

### 8.3.1 Referring Provider Directory

**Purpose**: Maintain a comprehensive database of referring dental providers and specialists.

**Key Capabilities**:
- Create and manage referring provider profiles
- Track provider contact information
- Record practice details and preferences
- Note relationship history and strength
- Track preferred communication methods
- Document liaison/contact person at each office
- Import from dental directories

**Provider Information Tracked**:
| Category | Fields |
|----------|--------|
| Basic Info | Name, credentials, specialty |
| Practice | Practice name, address, phone, fax |
| Contacts | Office manager, referral coordinator |
| Communication | Preferred method, email, portal access |
| Relationship | Relationship start date, notes, strength rating |
| Preferences | Preferred report format, communication frequency |

**User Stories**:
- As a **front desk**, I want to quickly look up a referring dentist's fax number
- As a **treatment coordinator**, I want to see the relationship history with a referring doctor
- As a **clinic admin**, I want to identify our most valuable referring relationships

---

### 8.3.2 Referral Source Attribution

**Purpose**: Track the referral source for every new patient for accurate attribution.

**Key Capabilities**:
- Capture referral source at patient creation
- Link to specific referring provider or patient
- Support multiple referral types
- Track first-touch vs. last-touch attribution
- Associate referrals with leads before conversion
- Handle unknown/walk-in cases

**Referral Types**:
| Type | Description |
|------|-------------|
| Doctor Referral | Referred by general dentist |
| Specialist Referral | Referred by another specialist |
| Patient Referral | Referred by existing patient |
| Family Referral | Family member is existing patient |
| Self-Referral | Found practice independently |
| Marketing | Response to advertising |

**Attribution Flow**:
```
Lead Created → Source Recorded → Converted to Patient → Attribution Finalized
     ↓                                                           ↓
Referring dentist                                    Referral counted
identified                                           in analytics
```

**User Stories**:
- As a **front desk**, I want to record who referred each new patient
- As a **marketing manager**, I want accurate referral source data for analysis
- As a **treatment coordinator**, I want to mention the referring doctor when greeting patients

---

### 8.3.3 Acknowledgment Letters

**Purpose**: Automatically generate and send thank-you letters to referral sources.

**Key Capabilities**:
- Template-based letter generation
- Automatic trigger on new patient referral
- Personalization with patient and doctor names
- Multiple delivery methods (print, email, fax, portal)
- Letter queue management
- Batch printing for mailing
- Letter history tracking

**Letter Templates**:
1. **New Patient Thank You**
   - Sent when referral starts treatment
   - Thanks for the referral
   - Brief treatment plan mention

2. **Consultation Thank You**
   - Sent after consultation (even if not starting)
   - Thanks for thinking of us
   - Offer to discuss case

3. **Treatment Complete**
   - Sent when patient completes treatment
   - Share successful outcome
   - Request continued referrals

4. **General Appreciation**
   - Periodic thank you for relationship
   - Practice updates/news

**Merge Fields Available**:
- Referring doctor name and credentials
- Patient name
- Treatment type
- Start date
- Doctor (orthodontist) name
- Practice name and contact info

**User Stories**:
- As a **clinic admin**, I want thank-you letters sent automatically when patients start
- As a **front desk**, I want to review and approve letters before sending
- As a **treatment coordinator**, I want to customize the letter for special cases

---

### 8.3.4 Progress Reports

**Purpose**: Keep referring dentists informed about their referred patients' treatment progress.

**Key Capabilities**:
- Scheduled progress reports (quarterly, annually)
- Milestone-triggered reports (treatment start, mid-point, completion)
- Customizable report templates
- Include treatment phase, next steps, estimated completion
- Option to include clinical images
- Delivery via secure portal, fax, or mail
- Opt-out management for providers

**Report Types**:
| Type | Trigger | Content |
|------|---------|---------|
| Treatment Started | First appointment | Treatment plan summary, estimated timeline |
| Mid-Treatment | 50% complete | Progress photos, phase update, remaining timeline |
| Treatment Complete | Retention start | Final photos, outcome summary, retention plan |
| Annual Update | Calendar-based | All active patients for that provider |

**Report Content Options**:
- Treatment summary
- Current phase
- Clinical photos (if authorized)
- Estimated completion date
- Next scheduled appointment
- Notes from orthodontist

**User Stories**:
- As a **referring dentist**, I want to know how my referred patients are progressing
- As a **doctor**, I want to send progress updates to build referring relationships
- As a **clinic admin**, I want to automate progress reports to save time

---

### 8.3.5 Referral Analytics

**Purpose**: Measure referral performance and identify opportunities for growth.

**Key Capabilities**:
- Track referral volume by source
- Measure conversion rates by referrer
- Calculate referral value (revenue generated)
- Identify declining referral patterns
- Compare referrer performance
- Track referral relationship ROI
- Generate executive reports

**Key Metrics**:
| Metric | Description |
|--------|-------------|
| Total Referrals | Count of referred patients in period |
| Referral Conversion Rate | Referred leads → Started treatment |
| Referral Value | Average treatment value from referrals |
| Top Referrers | Ranked list by volume or value |
| Referral Trends | Month-over-month changes |
| New Referrers | First-time referring providers |
| Dormant Referrers | Previously active, now quiet |
| Referral Mix | Professional vs. patient referrals |

**Reports**:
- Monthly referral summary
- Top 10 referrers report
- Referral source comparison
- Provider-specific referral history
- Referral trend analysis
- Dormant referrer alert list

**User Stories**:
- As a **clinic admin**, I want to identify our top referring dentists
- As a **doctor**, I want to know which referrers have stopped sending patients
- As a **marketing manager**, I want to compare professional vs. patient referral effectiveness

---

### 8.3.6 Specialist Network

**Purpose**: Manage outbound referrals to specialists and track their outcomes.

**Key Capabilities**:
- Specialist directory (oral surgeons, periodontists, TMJ, ENT)
- Referral letter generation
- Outbound referral tracking
- Appointment status tracking
- Report/note receipt logging
- Outcome documentation
- Specialist feedback collection

**Common Specialist Types**:
| Specialty | Common Referral Reasons |
|-----------|------------------------|
| Oral Surgeon | Extractions, exposures, jaw surgery |
| Periodontist | Gum disease, gingival surgery |
| Endodontist | Root canals for teeth in treatment |
| TMJ Specialist | TMD evaluation and treatment |
| ENT | Airway evaluation, breathing issues |
| Pediatric Dentist | Pre-ortho pediatric care |
| Sleep Medicine | Sleep apnea evaluation |

**Referral Workflow**:
```
Patient needs specialist → Create referral → Generate letter → Track appointment
        ↓                                                           ↓
  Document reason                                           Receive report
        ↓                                                           ↓
  Select specialist                                         Update patient record
```

**User Stories**:
- As a **doctor**, I want to quickly refer a patient to an oral surgeon with proper documentation
- As a **clinical staff**, I want to track whether the patient completed their specialist appointment
- As a **treatment coordinator**, I want to ensure specialist reports are received and filed

---

## Data Model

```prisma
model ReferringProvider {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Provider info
  providerType  ProviderType
  firstName     String
  lastName      String
  credentials   String?  // DDS, DMD, etc.
  specialty     String?

  // Practice info
  practiceName  String?
  npi           String?  // National Provider Identifier

  // Contact info
  addressLine1  String?
  addressLine2  String?
  city          String?
  state         String?
  postalCode    String?
  phone         String?
  fax           String?
  email         String?
  website       String?

  // Office contacts
  officeManager String?
  referralCoordinator String?
  preferredContact String?

  // Communication preferences
  preferredMethod CommunicationMethod @default(FAX)
  reportsOptedIn  Boolean @default(true)
  reportFrequency ReportFrequency @default(MILESTONE)

  // Relationship tracking
  relationshipStart DateTime?
  relationshipStrength RelationshipStrength @default(MODERATE)
  notes             String?

  // Portal access
  portalEnabled     Boolean @default(false)
  portalEmail       String?

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  referrals     Referral[]
  letters       ReferralLetter[]
  progressReports ProgressReport[]

  @@index([clinicId])
  @@index([lastName])
  @@index([practiceName])
  @@index([isActive])
}

enum ProviderType {
  GENERAL_DENTIST
  PEDIATRIC_DENTIST
  ORAL_SURGEON
  PERIODONTIST
  ENDODONTIST
  PROSTHODONTIST
  TMJ_SPECIALIST
  ENT
  SLEEP_MEDICINE
  OTHER_SPECIALIST
}

enum CommunicationMethod {
  FAX
  EMAIL
  MAIL
  PORTAL
  PHONE
}

enum ReportFrequency {
  NONE
  MILESTONE   // Start, complete, major events
  QUARTERLY
  ANNUALLY
  EACH_VISIT
}

enum RelationshipStrength {
  NEW
  DEVELOPING
  MODERATE
  STRONG
  VIP
}

model Referral {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Referral type
  referralType  ReferralType

  // Who was referred
  patientId     String?  @db.ObjectId
  leadId        String?  @db.ObjectId

  // Referrer (one of these)
  referringProviderId String?  @db.ObjectId
  referringPatientId  String?  @db.ObjectId
  marketingSourceId   String?  @db.ObjectId

  // Details
  referralDate  DateTime @default(now())
  referralNotes String?

  // Outcome tracking
  consultationDate    DateTime?
  treatmentStarted    Boolean  @default(false)
  treatmentStartDate  DateTime?
  treatmentValue      Decimal?

  // Acknowledgment
  acknowledgmentSent    Boolean  @default(false)
  acknowledgmentDate    DateTime?
  acknowledgmentMethod  CommunicationMethod?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient? @relation(fields: [patientId], references: [id])
  referringProvider ReferringProvider? @relation(fields: [referringProviderId], references: [id])
  referringPatient  Patient? @relation("PatientReferrer", fields: [referringPatientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([referringProviderId])
  @@index([referralType])
  @@index([referralDate])
}

enum ReferralType {
  DOCTOR_REFERRAL
  PATIENT_REFERRAL
  FAMILY_REFERRAL
  SELF_REFERRAL
  MARKETING
  UNKNOWN
}

model ReferralLetter {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Letter type and recipient
  letterType    LetterType
  recipientType RecipientType
  referringProviderId String?  @db.ObjectId
  referringPatientId  String?  @db.ObjectId

  // Associated patient
  patientId     String?  @db.ObjectId

  // Letter content
  templateId    String?  @db.ObjectId
  subject       String?
  body          String
  mergeData     Json?    // Data used for merge

  // Delivery
  deliveryMethod CommunicationMethod
  deliveryAddress String?  // Email, fax, or mailing address
  status         LetterStatus @default(PENDING)

  // Tracking
  generatedAt   DateTime @default(now())
  sentAt        DateTime?
  deliveredAt   DateTime?
  viewedAt      DateTime?
  errorMessage  String?

  // Document
  documentUrl   String?  // PDF storage URL

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String?  @db.ObjectId
  sentBy        String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  referringProvider ReferringProvider? @relation(fields: [referringProviderId], references: [id])
  patient       Patient? @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([referringProviderId])
  @@index([patientId])
  @@index([status])
  @@index([generatedAt])
}

enum LetterType {
  NEW_PATIENT_THANK_YOU
  CONSULTATION_THANK_YOU
  TREATMENT_COMPLETE
  GENERAL_APPRECIATION
  PROGRESS_UPDATE
  SPECIALIST_REFERRAL
  CUSTOM
}

enum RecipientType {
  REFERRING_PROVIDER
  REFERRING_PATIENT
  SPECIALIST
}

enum LetterStatus {
  DRAFT
  PENDING
  QUEUED
  SENT
  DELIVERED
  FAILED
  CANCELLED
}

model ProgressReport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Recipients
  referringProviderId String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Report details
  reportType    ProgressReportType
  reportDate    DateTime @default(now())

  // Content
  treatmentPhase    String
  treatmentProgress String  // Percentage or description
  nextSteps         String?
  estimatedCompletion DateTime?
  doctorNotes       String?

  // Images (optional)
  includeImages     Boolean @default(false)
  imageUrls         String[]

  // Delivery
  deliveryMethod    CommunicationMethod
  status            LetterStatus @default(PENDING)
  sentAt            DateTime?

  // Document
  documentUrl       String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  referringProvider ReferringProvider @relation(fields: [referringProviderId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([referringProviderId])
  @@index([patientId])
  @@index([reportDate])
}

enum ProgressReportType {
  TREATMENT_STARTED
  MID_TREATMENT
  TREATMENT_COMPLETE
  QUARTERLY_UPDATE
  ANNUAL_UPDATE
  CUSTOM
}

model SpecialistReferral {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Patient being referred
  patientId     String   @db.ObjectId

  // Specialist
  specialistId  String   @db.ObjectId  // ReferringProvider with specialist type

  // Referral details
  referralReason    String
  urgency           ReferralUrgency @default(ROUTINE)
  preferredDate     DateTime?
  clinicalNotes     String?

  // Status tracking
  status            SpecialistReferralStatus @default(CREATED)
  referralLetterSent DateTime?
  appointmentScheduled DateTime?
  appointmentDate   DateTime?
  appointmentCompleted DateTime?

  // Results
  specialistNotes   String?
  reportReceived    DateTime?
  reportUrl         String?
  outcome           String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  specialist    ReferringProvider @relation(fields: [specialistId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([specialistId])
  @@index([status])
}

enum ReferralUrgency {
  ROUTINE
  SOON
  URGENT
}

enum SpecialistReferralStatus {
  CREATED
  LETTER_SENT
  APPOINTMENT_SCHEDULED
  APPOINTMENT_COMPLETED
  REPORT_RECEIVED
  CLOSED
  CANCELLED
}

model ReferralLetterTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  letterType    LetterType
  description   String?

  // Content
  subject       String?
  bodyTemplate  String   // With merge field placeholders
  signatureBlock String?

  // Settings
  isDefault     Boolean  @default(false)
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([letterType])
}
```

---

## API Endpoints

### Referring Providers

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/referring-providers` | List providers | `referral:read` |
| GET | `/api/referring-providers/:id` | Get provider details | `referral:read` |
| POST | `/api/referring-providers` | Create provider | `referral:manage_providers` |
| PUT | `/api/referring-providers/:id` | Update provider | `referral:manage_providers` |
| DELETE | `/api/referring-providers/:id` | Deactivate provider | `referral:manage_providers` |
| GET | `/api/referring-providers/:id/referrals` | Get provider's referrals | `referral:read` |
| GET | `/api/referring-providers/:id/stats` | Get provider statistics | `referral:analytics` |

### Referrals

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/referrals` | List referrals | `referral:read` |
| GET | `/api/referrals/:id` | Get referral details | `referral:read` |
| POST | `/api/referrals` | Create referral record | `referral:create` |
| PUT | `/api/referrals/:id` | Update referral | `referral:update` |

### Referral Letters

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/referral-letters` | List letters | `referral:read` |
| POST | `/api/referral-letters` | Create/generate letter | `referral:send_letters` |
| POST | `/api/referral-letters/:id/send` | Send letter | `referral:send_letters` |
| GET | `/api/referral-letters/:id/preview` | Preview letter | `referral:read` |
| GET | `/api/referral-letters/:id/pdf` | Download PDF | `referral:read` |

### Progress Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/progress-reports` | List reports | `referral:read` |
| POST | `/api/progress-reports` | Create report | `referral:send_letters` |
| POST | `/api/progress-reports/:id/send` | Send report | `referral:send_letters` |
| POST | `/api/progress-reports/batch` | Generate batch reports | `referral:admin` |

### Specialist Referrals

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/specialist-referrals` | List outbound referrals | `referral:read` |
| POST | `/api/specialist-referrals` | Create specialist referral | `referral:create` |
| PUT | `/api/specialist-referrals/:id` | Update status | `referral:update` |
| POST | `/api/specialist-referrals/:id/upload-report` | Upload specialist report | `referral:update` |

### Analytics

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/referrals/analytics/summary` | Referral summary stats | `referral:analytics` |
| GET | `/api/referrals/analytics/top-referrers` | Top referrer ranking | `referral:analytics` |
| GET | `/api/referrals/analytics/trends` | Referral trends | `referral:analytics` |
| GET | `/api/referrals/analytics/conversion` | Conversion rates | `referral:analytics` |

### Letter Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/referral-letter-templates` | List templates | `referral:read` |
| POST | `/api/referral-letter-templates` | Create template | `referral:configure` |
| PUT | `/api/referral-letter-templates/:id` | Update template | `referral:configure` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ProviderDirectory` | List and search referring providers | `components/referral/` |
| `ProviderCard` | Provider summary display | `components/referral/` |
| `ProviderDetail` | Full provider profile | `components/referral/` |
| `ProviderForm` | Create/edit provider | `components/referral/` |
| `ReferralSourceSelector` | Select referral source for patient | `components/referral/` |
| `ReferralTimeline` | Patient referral history | `components/referral/` |
| `LetterComposer` | Create and edit letters | `components/referral/` |
| `LetterPreview` | Preview letter before sending | `components/referral/` |
| `LetterQueue` | Letters pending send | `components/referral/` |
| `ProgressReportBuilder` | Create progress reports | `components/referral/` |
| `SpecialistReferralForm` | Create outbound referral | `components/referral/` |
| `SpecialistReferralTracker` | Track outbound referrals | `components/referral/` |
| `ReferralAnalyticsDashboard` | Referral metrics overview | `components/referral/` |
| `TopReferrerChart` | Visualization of top referrers | `components/referral/` |
| `ReferralTrendChart` | Trend analysis chart | `components/referral/` |

---

## Business Rules

1. **Referral Attribution**: Every patient must have a referral source recorded
2. **Acknowledgment Timing**: Thank-you letters sent within 24-48 hours of treatment start
3. **Progress Report Consent**: Patients must consent to sharing progress with referrer
4. **Relationship Maintenance**: Alert if no referrals from provider in 6+ months
5. **VIP Referrers**: Top referrers get special treatment (faster reports, phone updates)
6. **Data Privacy**: Referrer portal access limited to their referred patients only
7. **Letter Approval**: Optional review workflow before sending letters
8. **Specialist Follow-up**: Alert if specialist appointment not scheduled within 2 weeks
9. **Report Receipt**: Follow up if specialist report not received within 2 weeks

---

## AI Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| Referral Predictions | Predict referral volume trends | Time-series analysis |
| Relationship Health Score | Assess referrer relationship strength | Multi-factor scoring |
| Dormant Referrer Detection | Identify declining relationships | Pattern detection |
| Letter Personalization | Suggest personalized content | NLP + relationship history |
| Optimal Contact Timing | Best time to reach out to referrers | Historical analysis |
| ROI Calculation | Calculate value per referral relationship | Revenue attribution |

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication |
| Lead Management | Required | Referral source on leads |
| Patient Communications | Required | Letter delivery |
| Treatment Management | Optional | Progress data for reports |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Fax Service | Required | Fax letter delivery |
| SendGrid/SES | Required | Email letter delivery |
| PDF Generation | Required | Letter PDF creation |
| Referrer Portal | Optional | Provider access portal |

---

## Security Requirements

### Access Control
- **View referrals**: front_desk, treatment_coordinator, clinic_admin
- **Manage providers**: clinic_admin
- **Send letters**: treatment_coordinator, front_desk (with approval)
- **View analytics**: clinic_admin, doctor

### Audit Requirements
- Log provider directory access
- Track letter generation and sending
- Record referral source changes
- Log analytics access

### Data Protection
- Provider contact info protected
- Letter content encrypted
- Referrer portal with secure authentication

---

## Related Documentation

- [Parent: CRM & Onboarding](../../)
- [Lead Management](../lead-management/)
- [Records Requests](../records-requests/)
- [Patient Communications](../../../patient-communications/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
