# Lead Management

> **Area**: [CRM & Onboarding](../../)
>
> **Sub-Area**: 8.1 Lead Management
>
> **Purpose**: Track and nurture prospects from initial contact through conversion to active patients

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [CRM & Onboarding](../../) |
| **Dependencies** | Auth, Booking, Patient Communications |
| **Last Updated** | 2024-11-26 |

---

## Overview

Lead Management is the foundation of patient acquisition for orthodontic practices. Unlike transactional dental services, orthodontic treatment represents a significant decision with an extended consideration period. This sub-area provides tools for treatment coordinators and front desk staff to effectively capture, track, and convert leads into patients.

### Orthodontic-Specific Challenges

- **Long Sales Cycles**: Consultations to treatment start often span weeks or months
- **Multiple Decision Makers**: Parents research options and make financial decisions for children
- **High-Value Decisions**: Treatment costs ($3,000-$10,000+) require careful consideration
- **Competition**: Families often consult multiple orthodontists before deciding
- **Timing Sensitivity**: Treatment timing (based on growth/development) affects urgency

### Key Capabilities

- Multi-channel lead capture from web, phone, walk-ins, and referrals
- Visual pipeline with customizable conversion stages
- Treatment coordinator assignment and workload management
- Automated follow-up task creation and reminders
- Lead source tracking for marketing ROI analysis
- Conversion analytics by source, coordinator, and time period

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 8.1.1 | [Lead Capture & Entry](./functions/lead-capture.md) | Capture leads from multiple channels | 📋 Planned | Critical |
| 8.1.2 | [Lead Source Tracking](./functions/lead-source-tracking.md) | Track and manage marketing sources | 📋 Planned | High |
| 8.1.3 | [Conversion Pipeline](./functions/conversion-pipeline.md) | Visual pipeline and stage management | 📋 Planned | Critical |
| 8.1.4 | [Coordinator Assignment](./functions/coordinator-assignment.md) | Assign leads to treatment coordinators | 📋 Planned | High |
| 8.1.5 | [Follow-up Management](./functions/follow-up-management.md) | Task management and reminders | 📋 Planned | High |
| 8.1.6 | [Lead Analytics](./functions/lead-analytics.md) | Conversion rates and performance metrics | 📋 Planned | Medium |

---

## Function Details

### 8.1.1 Lead Capture & Entry

**Purpose**: Capture lead information from all acquisition channels into a unified system.

**Key Capabilities**:
- Web form integration (website inquiries, landing pages)
- Phone call logging with caller ID integration
- Walk-in registration at front desk
- Referral entry from dentists and existing patients
- Social media lead import
- Manual entry for business cards, events, etc.

**Lead Information Captured**:
- Contact information (name, phone, email, address)
- Patient information (who is seeking treatment, age/DOB)
- Responsible party (if different from patient)
- Referral source
- Treatment interest (braces, Invisalign, general inquiry)
- Insurance information (if known)
- Preferred contact method and time
- Initial notes/concerns

**User Stories**:
- As a **front desk**, I want to quickly log a phone inquiry so the treatment coordinator can follow up
- As a **treatment coordinator**, I want to see all new leads from today so I can prioritize callbacks
- As a **marketing manager**, I want leads from web forms to automatically enter the system with source tracking

---

### 8.1.2 Lead Source Tracking

**Purpose**: Track where leads come from to measure marketing effectiveness.

**Key Capabilities**:
- Define and manage lead source categories
- Track source at lead creation
- Support multi-touch attribution (first touch, last touch)
- Measure conversion rates by source
- Calculate cost-per-lead by source
- Compare source effectiveness over time

**Standard Source Categories**:
- Doctor referral (with referring provider)
- Patient referral (with referring patient)
- Web - Organic search
- Web - Paid advertising (Google, Facebook, etc.)
- Web - Social media
- Print advertising
- Community event
- School screening
- Walk-in
- Other (with description)

**User Stories**:
- As a **clinic admin**, I want to see which sources generate the most leads so I can allocate marketing budget
- As a **marketing manager**, I want to track which campaigns have the best conversion rates
- As a **front desk**, I want to ask callers "how did you hear about us?" and record their answer

---

### 8.1.3 Conversion Pipeline

**Purpose**: Visualize and manage leads through conversion stages to treatment start.

**Key Capabilities**:
- Visual Kanban-style pipeline board
- Customizable pipeline stages
- Stage-based automation triggers
- Time-in-stage tracking
- Bottleneck identification
- Stage conversion rates

**Default Pipeline Stages**:
1. **New Lead** - Just captured, not yet contacted
2. **Contacted** - Initial outreach made
3. **Consultation Scheduled** - Appointment booked
4. **Consultation Completed** - Exam done, treatment presented
5. **Pending Decision** - Considering treatment options
6. **Treatment Accepted** - Contract signed
7. **Treatment Started** - Active patient (converted)
8. **Lost** - Did not convert (with reason)

**Lost Reasons**:
- Chose competitor
- Cost/financial
- Timing not right
- Not a candidate
- No response/unable to contact
- Insurance issues
- Relocated
- Other

**User Stories**:
- As a **treatment coordinator**, I want to see my pipeline at a glance so I know who needs follow-up
- As a **clinic admin**, I want to identify bottlenecks where leads get stuck
- As a **doctor**, I want to see how many consultations are pending decisions

---

### 8.1.4 Coordinator Assignment

**Purpose**: Assign leads to treatment coordinators and balance workload.

**Key Capabilities**:
- Manual assignment by role
- Automatic assignment rules (round-robin, capacity-based)
- Reassignment with history tracking
- Workload visibility across coordinators
- Out-of-office handling
- Lead transfer between coordinators

**Assignment Rules**:
- Round-robin: Distribute evenly among available coordinators
- Capacity-based: Consider current workload
- Source-based: Specific coordinators for referral types
- Schedule-based: Match to coordinator availability
- Geographic: Assign based on patient location

**User Stories**:
- As a **clinic admin**, I want leads automatically assigned so no one falls through the cracks
- As a **treatment coordinator**, I want to see only my assigned leads so I can focus
- As a **front desk**, I want to reassign a lead when a coordinator is out sick

---

### 8.1.5 Follow-up Management

**Purpose**: Ensure timely follow-up with leads through task management and automation.

**Key Capabilities**:
- Create follow-up tasks with due dates
- Automated task creation based on stage
- Task reminders via in-app, email, and mobile
- Task templates for common follow-ups
- Overdue task escalation
- Activity logging for all interactions

**Automated Follow-up Rules**:
- New lead → Call within 5 minutes (speed-to-lead)
- No contact in 24 hours → Escalate to manager
- Consultation scheduled → Send confirmation
- Consultation completed → Follow up in 3 days
- Pending decision > 7 days → Check-in call
- No response after 3 attempts → Send break-up email

**Activity Types**:
- Phone call (outcome: spoke, voicemail, no answer, wrong number)
- Email sent/received
- SMS sent/received
- In-person meeting
- Note added
- Stage changed
- Document sent

**User Stories**:
- As a **treatment coordinator**, I want automatic reminders so I never forget to follow up
- As a **clinic admin**, I want to see overdue tasks so I can address bottlenecks
- As a **treatment coordinator**, I want to log my call outcomes so there's a clear history

---

### 8.1.6 Lead Analytics

**Purpose**: Measure and analyze lead performance for business optimization.

**Key Capabilities**:
- Conversion funnel visualization
- Source performance comparison
- Coordinator performance metrics
- Time-to-conversion analysis
- Lead velocity tracking
- Lost reason analysis

**Key Metrics**:
| Metric | Description |
|--------|-------------|
| Total Leads | New leads in period |
| Conversion Rate | Leads → Patients |
| Average Time to Convert | Days from lead to treatment start |
| Consultation Show Rate | Scheduled vs. attended consultations |
| Treatment Acceptance Rate | Consultations → Accepted treatment |
| Cost per Lead | Marketing spend / leads |
| Cost per Acquisition | Marketing spend / converted patients |
| Lead Source Mix | Distribution by source |
| Coordinator Conversion Rate | By individual coordinator |

**Reports**:
- Daily/weekly lead summary
- Monthly conversion funnel
- Source comparison report
- Coordinator leaderboard
- Lost lead analysis
- Marketing ROI report

**User Stories**:
- As a **clinic admin**, I want to see monthly conversion rates so I can track practice growth
- As a **marketing manager**, I want to compare lead sources so I can optimize spending
- As a **doctor**, I want to understand why leads are being lost

---

## Data Model

```prisma
model Lead {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Lead status
  status        LeadStatus @default(NEW)
  pipelineStage String     @default("new_lead")

  // Patient information
  patientFirstName    String
  patientLastName     String
  patientDob          DateTime?
  patientRelationship PatientRelationship @default(SELF)

  // Contact information (responsible party)
  firstName     String
  lastName      String
  email         String?
  phone         String?
  phoneAlt      String?
  preferredContact PreferredContact @default(PHONE)
  preferredTime    String?

  // Address
  addressLine1  String?
  addressLine2  String?
  city          String?
  state         String?
  postalCode    String?

  // Source tracking
  sourceId      String   @db.ObjectId
  sourceCampaign String?
  sourceDetail  String?  // Specific ad, referrer name, etc.

  // Referral info (if applicable)
  referringProviderId String?  @db.ObjectId
  referringPatientId  String?  @db.ObjectId

  // Treatment interest
  treatmentInterest   TreatmentInterest[]
  insuranceCarrier    String?
  insuranceMemberId   String?

  // Assignment
  assignedToId  String?  @db.ObjectId
  assignedAt    DateTime?

  // Conversion tracking
  consultationId    String?  @db.ObjectId
  convertedToPatientId String? @db.ObjectId
  convertedAt       DateTime?

  // Lost tracking
  lostAt        DateTime?
  lostReason    LostReason?
  lostNotes     String?

  // Initial notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Audit
  createdBy     String?  @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  source        LeadSource @relation(fields: [sourceId], references: [id])
  assignedTo    User?    @relation("AssignedTo", fields: [assignedToId], references: [id])
  referringProvider ReferringProvider? @relation(fields: [referringProviderId], references: [id])
  activities    LeadActivity[]
  tasks         LeadTask[]

  @@index([clinicId])
  @@index([status])
  @@index([pipelineStage])
  @@index([assignedToId])
  @@index([sourceId])
  @@index([createdAt])
}

enum LeadStatus {
  NEW
  ACTIVE
  CONVERTED
  LOST
  ARCHIVED
}

enum PatientRelationship {
  SELF
  CHILD
  SPOUSE
  OTHER
}

enum PreferredContact {
  PHONE
  EMAIL
  TEXT
  ANY
}

enum TreatmentInterest {
  BRACES_METAL
  BRACES_CLEAR
  INVISALIGN
  RETAINER
  SECOND_OPINION
  GENERAL_INQUIRY
}

enum LostReason {
  CHOSE_COMPETITOR
  COST_FINANCIAL
  TIMING_NOT_RIGHT
  NOT_A_CANDIDATE
  NO_RESPONSE
  INSURANCE_ISSUES
  RELOCATED
  OTHER
}

model LeadSource {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Source definition
  name          String
  category      LeadSourceCategory
  description   String?

  // Tracking
  isActive      Boolean  @default(true)

  // Cost tracking (for ROI)
  monthlyCost   Decimal?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  leads         Lead[]

  @@unique([clinicId, name])
  @@index([clinicId])
}

enum LeadSourceCategory {
  DOCTOR_REFERRAL
  PATIENT_REFERRAL
  WEB_ORGANIC
  WEB_PAID
  WEB_SOCIAL
  PRINT_AD
  COMMUNITY_EVENT
  SCHOOL_SCREENING
  WALK_IN
  OTHER
}

model LeadActivity {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  leadId        String   @db.ObjectId

  // Activity details
  type          LeadActivityType
  direction     ActivityDirection?
  outcome       String?
  notes         String?

  // Metadata
  durationMinutes Int?

  // Stage change tracking
  previousStage String?
  newStage      String?

  // Timestamps
  occurredAt    DateTime @default(now())
  createdAt     DateTime @default(now())

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  lead          Lead     @relation(fields: [leadId], references: [id])

  @@index([leadId])
  @@index([type])
  @@index([occurredAt])
}

enum LeadActivityType {
  PHONE_CALL
  EMAIL
  SMS
  IN_PERSON
  NOTE
  STAGE_CHANGE
  ASSIGNMENT_CHANGE
  TASK_COMPLETED
  DOCUMENT_SENT
  CONSULTATION_SCHEDULED
  CONSULTATION_COMPLETED
}

enum ActivityDirection {
  INBOUND
  OUTBOUND
}

model LeadTask {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  leadId        String   @db.ObjectId

  // Task details
  title         String
  description   String?
  type          LeadTaskType
  priority      TaskPriority @default(NORMAL)

  // Assignment
  assignedToId  String   @db.ObjectId

  // Scheduling
  dueAt         DateTime
  reminderAt    DateTime?

  // Status
  status        TaskStatus @default(PENDING)
  completedAt   DateTime?
  completedBy   String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  lead          Lead     @relation(fields: [leadId], references: [id])

  @@index([leadId])
  @@index([assignedToId])
  @@index([dueAt])
  @@index([status])
}

enum LeadTaskType {
  CALL
  EMAIL
  SMS
  FOLLOW_UP
  CONSULTATION_CONFIRM
  PAPERWORK_REMINDER
  CUSTOM
}

enum TaskPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
  OVERDUE
}

model PipelineStage {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Stage definition
  name          String
  slug          String
  description   String?
  order         Int
  color         String?

  // Automation
  autoTaskTemplate    String?  // Task template ID to create
  autoEmailTemplate   String?  // Email template ID to send
  maxDaysInStage      Int?     // Alert if lead exceeds this

  // Flags
  isTerminal    Boolean  @default(false)  // e.g., Converted, Lost
  isDefault     Boolean  @default(false)  // Default for new leads

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, slug])
  @@index([clinicId])
  @@index([order])
}
```

---

## API Endpoints

### Leads

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/leads` | List leads with filters | `lead:read` |
| GET | `/api/leads/:id` | Get lead details | `lead:read` |
| POST | `/api/leads` | Create new lead | `lead:create` |
| PUT | `/api/leads/:id` | Update lead | `lead:update` |
| POST | `/api/leads/:id/stage` | Change pipeline stage | `lead:update` |
| POST | `/api/leads/:id/assign` | Assign to coordinator | `lead:assign` |
| POST | `/api/leads/:id/convert` | Convert to patient | `lead:convert` |
| POST | `/api/leads/:id/lost` | Mark as lost | `lead:update` |

### Lead Activities

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/leads/:id/activities` | Get lead activities | `lead:read` |
| POST | `/api/leads/:id/activities` | Log activity | `lead:update` |

### Lead Tasks

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/leads/:id/tasks` | Get lead tasks | `lead:read` |
| POST | `/api/leads/:id/tasks` | Create task | `lead:update` |
| PUT | `/api/leads/tasks/:taskId` | Update task | `lead:update` |
| POST | `/api/leads/tasks/:taskId/complete` | Complete task | `lead:update` |

### Lead Sources

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lead-sources` | List sources | `lead:read` |
| POST | `/api/lead-sources` | Create source | `lead:configure` |
| PUT | `/api/lead-sources/:id` | Update source | `lead:configure` |

### Pipeline Stages

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/pipeline-stages` | List stages | `lead:read` |
| POST | `/api/pipeline-stages` | Create stage | `lead:configure` |
| PUT | `/api/pipeline-stages/:id` | Update stage | `lead:configure` |
| PUT | `/api/pipeline-stages/reorder` | Reorder stages | `lead:configure` |

### Analytics

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/leads/analytics/funnel` | Get conversion funnel | `lead:analytics` |
| GET | `/api/leads/analytics/sources` | Source performance | `lead:analytics` |
| GET | `/api/leads/analytics/coordinators` | Coordinator metrics | `lead:analytics` |
| GET | `/api/leads/analytics/lost-reasons` | Lost reason breakdown | `lead:analytics` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `LeadPipeline` | Kanban board for pipeline visualization | `components/crm/` |
| `LeadCard` | Individual lead summary in pipeline | `components/crm/` |
| `LeadDetail` | Full lead detail view | `components/crm/` |
| `LeadForm` | Create/edit lead form | `components/crm/` |
| `LeadQuickEntry` | Fast lead entry for phone calls | `components/crm/` |
| `ActivityTimeline` | Chronological activity history | `components/crm/` |
| `ActivityLogger` | Log new activities | `components/crm/` |
| `TaskList` | Lead tasks with status | `components/crm/` |
| `TaskForm` | Create/edit task | `components/crm/` |
| `SourceSelector` | Select/create lead source | `components/crm/` |
| `CoordinatorAssignment` | Assign/reassign leads | `components/crm/` |
| `LeadAnalyticsDashboard` | Analytics overview | `components/crm/` |
| `ConversionFunnel` | Visual funnel chart | `components/crm/` |
| `SourcePerformanceChart` | Source comparison chart | `components/crm/` |

---

## Business Rules

1. **Speed-to-Lead**: New leads should be contacted within 5 minutes during business hours
2. **Assignment Required**: All active leads must have an assigned treatment coordinator
3. **Activity Logging**: All contact attempts must be logged with outcomes
4. **Stage Progression**: Leads can skip stages but cannot move backwards (except to Lost)
5. **Lost Reason Required**: When marking a lead as lost, a reason must be provided
6. **Duplicate Detection**: Warn when creating a lead with matching phone or email
7. **Conversion Lock**: Once converted to patient, lead cannot be modified
8. **Follow-up Maximum**: 3 follow-up attempts with no response → suggest moving to Lost
9. **Privacy Compliance**: Lead data treated as potential PHI even before conversion

---

## AI Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| Lead Scoring | Predict conversion likelihood | ML model trained on historical conversions |
| Optimal Contact Time | Suggest best time to call | Analysis of successful contact patterns |
| Next Best Action | Recommend next follow-up action | Rule-based + ML hybrid |
| Duplicate Detection | Smart matching of potential duplicates | Fuzzy matching on name, phone, email |
| Sentiment Analysis | Analyze email/SMS tone | NLP on communication content |
| Conversion Prediction | Forecast monthly conversions | Time-series analysis |

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and coordinator roles |
| Booking & Scheduling | Required | Schedule consultations from leads |
| Patient Communications | Optional | Automated email/SMS follow-ups |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Web Forms | Webhook | Lead capture from website |
| Phone System | Optional | Caller ID integration |
| Twilio | Optional | SMS follow-up |
| SendGrid | Optional | Email follow-up |

---

## Security Requirements

### Access Control
- **View leads**: front_desk, treatment_coordinator, clinic_admin
- **Create leads**: front_desk, treatment_coordinator
- **Assign leads**: treatment_coordinator, clinic_admin
- **Convert leads**: treatment_coordinator, clinic_admin
- **View analytics**: clinic_admin, doctor

### Audit Requirements
- Log all lead access
- Track stage changes with before/after
- Record assignment changes
- Log conversion events

### Data Protection
- Lead data encrypted at rest
- PHI fields protected (DOB, health concerns)
- Secure transmission of web form data

---

## Related Documentation

- [Parent: CRM & Onboarding](../../)
- [Intake Forms](../intake-forms/)
- [Referral Tracking](../referral-tracking/)
- [Booking & Scheduling](../../booking/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
