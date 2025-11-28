# Performance & Training

> **Area**: [Staff Management](../../)
>
> **Sub-Area**: 2.4 Performance & Training
>
> **Purpose**: Track staff performance metrics, manage goals, conduct reviews, and maintain training records

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Medium |
| **Complexity** | Medium |
| **Parent Area** | [Staff Management](../../) |
| **Dependencies** | Staff Profiles, Auth |
| **Last Updated** | 2024-11-27 |

---

## Overview

Performance & Training provides comprehensive staff development and performance management for orthodontic practices. This includes role-specific KPI tracking, goal setting and monitoring, performance review management, and training record maintenance. The system supports orthodontic-specific metrics like provider production, treatment coordinator conversion rates, and front desk efficiency.

Orthodontic practices require specialized performance tracking for different roles - providers measured on case starts and production, treatment coordinators on conversion rates and case acceptance, and clinical staff on efficiency and patient satisfaction. This sub-area provides role-appropriate metrics and goals.

### Key Capabilities

- Role-specific performance dashboards
- Provider production and case tracking
- Treatment coordinator conversion metrics
- Goal setting with progress monitoring
- Configurable review cycles
- Training compliance tracking
- CE credit management for licensed providers
- Performance trend analysis
- Recognition and feedback tools

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.4.1 | [Performance Metrics](./functions/performance-metrics.md) | Track role-specific KPIs | 📋 Planned | High |
| 2.4.2 | [Goal Tracking](./functions/goal-tracking.md) | Set and monitor performance goals | 📋 Planned | High |
| 2.4.3 | [Review Cycles](./functions/review-cycles.md) | Manage performance reviews | 📋 Planned | Medium |
| 2.4.4 | [Training Records](./functions/training-records.md) | Track training and certifications | 📋 Planned | High |
| 2.4.5 | [CE Credit Management](./functions/ce-credit-management.md) | Track continuing education | 📋 Planned | Medium |
| 2.4.6 | [Recognition & Feedback](./functions/recognition-feedback.md) | Peer recognition and feedback | 📋 Planned | Low |

---

## Function Details

### 2.4.1 Performance Metrics

**Purpose**: Track and display role-specific key performance indicators.

**Key Capabilities**:
- Role-based metric dashboards
- Real-time performance tracking
- Historical trend analysis
- Benchmark comparisons
- Automated metric calculations
- Custom metric definitions

**Provider Metrics**:
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Case Starts | New treatments begun | Count per period |
| Production | Revenue generated | Billed amount |
| Collections | Revenue collected | Collected amount |
| Average Case Value | Value per case start | Total value / case starts |
| Treatment Days | Clinical days worked | Days with appointments |
| Patients Seen | Patient encounters | Unique patients |
| Procedures Completed | Treatment procedures | Procedure count |

**Treatment Coordinator Metrics**:
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Consultations | New patient consults | Count per period |
| Conversion Rate | Consults to starts | Starts / Consults × 100 |
| Case Acceptance | Dollar acceptance | Accepted / Presented × 100 |
| Average Presented | Average case value presented | Total presented / consults |
| Same-Day Starts | Cases started day of consult | Same-day / Total starts × 100 |
| Follow-Up Completion | Pending follow-ups completed | Completed / Scheduled × 100 |
| Contract Collection | Down payments collected | Collected / Expected × 100 |

**Clinical Staff Metrics**:
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Patients Assisted | Patient encounters | Count per period |
| Chair Time Efficiency | Time with patients vs scheduled | Productive / Scheduled × 100 |
| On-Time Rate | Appointments running on time | On-time / Total × 100 |
| Patient Satisfaction | Patient feedback scores | Average rating |
| Emergency Slots | Same-day accommodations | Count per period |

**Front Desk Metrics**:
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Scheduling Efficiency | Appointments per hour | Appointments / Hours |
| No-Show Rate | Missed appointments | No-shows / Total × 100 |
| Confirmation Rate | Confirmed appointments | Confirmed / Total × 100 |
| Wait Time | Average patient wait | Average minutes |
| Call Answer Rate | Calls answered | Answered / Incoming × 100 |
| Payment Collection | Payments collected | Collected / Due × 100 |

**User Stories**:
- As a **provider**, I want to see my production and case starts
- As a **clinic admin**, I want to compare TC conversion rates
- As a **staff member**, I want to track my performance over time

---

### 2.4.2 Goal Tracking

**Purpose**: Set, track, and achieve performance goals aligned with practice objectives.

**Key Capabilities**:
- Individual goal setting
- Team goals
- Goal templates by role
- Progress tracking
- Milestone management
- Goal cascading from practice to individual
- Achievement recognition

**Goal Categories**:
| Category | Examples | Typical Roles |
|----------|----------|---------------|
| Production | $X in monthly production | Providers |
| Conversion | X% conversion rate | Treatment Coordinators |
| Patient Satisfaction | X rating average | All clinical |
| Efficiency | X patients per day | Clinical staff |
| Training | Complete X courses | All staff |
| Team | X team achievement | Department goals |
| Professional | Certification attainment | Individual growth |

**Goal Templates**:
- Provider Production Goals
- TC Conversion Goals
- Patient Satisfaction Goals
- Efficiency Improvement Goals
- Training Completion Goals
- New Skill Development Goals

**User Stories**:
- As a **clinic admin**, I want to set quarterly goals for my team
- As a **staff member**, I want to track progress toward my goals
- As a **manager**, I want to see who is on track to meet goals

---

### 2.4.3 Review Cycles

**Purpose**: Manage formal performance review processes.

**Key Capabilities**:
- Configurable review schedules
- Self-assessment forms
- Manager assessment forms
- 360-degree feedback options
- Review meeting scheduling
- Documentation and signatures
- Review history tracking
- Improvement plan management

**Review Types**:
| Type | Frequency | Description |
|------|-----------|-------------|
| Annual | Yearly | Comprehensive annual review |
| Semi-Annual | 6 months | Mid-year check-in |
| Quarterly | 3 months | Quarterly progress review |
| Probationary | 30/60/90 days | New hire evaluations |
| Improvement | As needed | Performance improvement plans |
| Ad Hoc | As needed | Special circumstance reviews |

**Review Process**:
1. Review scheduled and notification sent
2. Employee completes self-assessment
3. Manager completes assessment
4. Review meeting conducted
5. Feedback discussed and documented
6. Goals set for next period
7. Both parties sign off
8. Review finalized and stored

**Evaluation Categories**:
- Job Knowledge & Skills
- Quality of Work
- Productivity & Efficiency
- Communication
- Teamwork & Collaboration
- Patient Care (clinical roles)
- Professionalism
- Initiative & Problem Solving
- Attendance & Reliability

**User Stories**:
- As a **clinic admin**, I want to schedule annual reviews for all staff
- As a **manager**, I want to complete assessments for my team
- As a **staff member**, I want to complete my self-assessment

---

### 2.4.4 Training Records

**Purpose**: Track and manage all staff training activities.

**Key Capabilities**:
- Training record management
- Required training tracking
- Training completion verification
- Training expiration alerts
- Training history
- Certificate storage
- Learning path management
- Training reports

**Training Categories**:
| Category | Examples | Frequency |
|----------|----------|-----------|
| Onboarding | System training, policies | One-time |
| Compliance | HIPAA, OSHA, infection control | Annual |
| Clinical | Procedure training, equipment | As needed |
| System | Software training | As needed |
| Customer Service | Communication, patient experience | Periodic |
| Leadership | Management skills | Advancement |
| Equipment | New equipment operation | As acquired |

**Required Training by Role**:
| Role | Required Training |
|------|-------------------|
| All Staff | HIPAA, OSHA, Emergency Procedures |
| Clinical Staff | Infection Control, CPR/BLS, X-Ray Safety |
| Providers | State-specific CE requirements |
| Front Desk | HIPAA, Patient Communication |
| Billing | HIPAA, Coding Updates |

**Training Status**:
- **Not Started**: Training assigned but not begun
- **In Progress**: Currently completing training
- **Completed**: Successfully finished
- **Expired**: Past expiration date, needs renewal
- **Waived**: Exempted from requirement

**User Stories**:
- As a **clinic admin**, I want to see who has overdue training
- As a **staff member**, I want to record my completed training
- As a **compliance officer**, I want to verify training compliance

---

### 2.4.5 CE Credit Management

**Purpose**: Track continuing education requirements for licensed providers.

**Key Capabilities**:
- CE requirement tracking by state
- Credit recording and verification
- Category tracking (clinical, ethics, etc.)
- License renewal integration
- CE expiration alerts
- Certificate storage
- CE provider verification
- Reporting for license renewal

**CE Requirements by License Type**:
| License | State | Credits Required | Period |
|---------|-------|------------------|--------|
| Dental (Example) | CA | 50 credits | 2 years |
| Dental (Example) | TX | 24 credits | 2 years |
| Hygienist (Example) | CA | 25 credits | 2 years |
| Orthodontic Specialty | Varies | Per state board | Varies |

**CE Credit Categories**:
- Clinical Orthodontics
- Infection Control
- Ethics/Jurisprudence
- Pharmacology
- Radiology Safety
- CPR/Medical Emergencies
- Practice Management
- Special Topics

**User Stories**:
- As a **provider**, I want to track my CE credits toward renewal
- As a **clinic admin**, I want to see providers with upcoming CE deadlines
- As a **provider**, I want to upload my CE certificates

---

### 2.4.6 Recognition & Feedback

**Purpose**: Enable peer recognition and ongoing feedback between staff.

**Key Capabilities**:
- Peer recognition system
- Manager kudos and recognition
- Feedback request and response
- Recognition badges/awards
- Recognition feed/wall
- Anniversary and milestone recognition
- Patient compliment tracking

**Recognition Types**:
| Type | Description | Who Can Give |
|------|-------------|--------------|
| Peer Recognition | Thank you/kudos from colleagues | All staff |
| Manager Recognition | Formal recognition from supervisor | Managers |
| Patient Compliment | Patient-provided positive feedback | Patients |
| Achievement Award | Milestone or goal achievement | System/Manager |
| Service Anniversary | Tenure recognition | System |

**Feedback Types**:
- Positive Recognition
- Constructive Feedback (private)
- Skill Development Suggestions
- Collaboration Requests
- General Comments

**User Stories**:
- As a **staff member**, I want to recognize a colleague who helped me
- As a **manager**, I want to give recognition for great performance
- As a **staff member**, I want to see recognition I've received

---

## Data Model

```prisma
// Performance Goals
model PerformanceGoal {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Goal Details
  title         String
  description   String?
  category      GoalCategory
  priority      GoalPriority @default(MEDIUM)

  // Metric
  metricType    MetricType?
  metricCode    String?     // Reference to metric definition
  targetValue   Decimal?
  targetUnit    String?
  baselineValue Decimal?

  // Dates
  startDate     DateTime
  targetDate    DateTime
  completedDate DateTime?

  // Progress
  currentValue  Decimal?
  progressPercent Int     @default(0)
  status        GoalStatus @default(NOT_STARTED)

  // Milestones
  milestones    GoalMilestone[]

  // Parent Goal (for cascading)
  parentGoalId  String?  @db.ObjectId

  // Visibility
  isPrivate     Boolean  @default(false)

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
  parentGoal    PerformanceGoal? @relation("GoalHierarchy", fields: [parentGoalId], references: [id])
  childGoals    PerformanceGoal[] @relation("GoalHierarchy")
  progressLogs  GoalProgressLog[]

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([status])
  @@index([targetDate])
  @@index([category])
}

type GoalMilestone {
  title         String
  targetValue   Decimal?
  targetDate    DateTime
  completed     Boolean   @default(false)
  completedDate DateTime?
}

enum GoalCategory {
  PRODUCTION
  CONVERSION
  PATIENT_SATISFACTION
  EFFICIENCY
  QUALITY
  TRAINING
  PROFESSIONAL_DEVELOPMENT
  TEAM_COLLABORATION
  OTHER
}

enum GoalPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum MetricType {
  CURRENCY
  PERCENTAGE
  COUNT
  RATING
  TIME
  BINARY
}

enum GoalStatus {
  NOT_STARTED
  IN_PROGRESS
  AT_RISK
  ON_TRACK
  COMPLETED
  EXCEEDED
  NOT_MET
  CANCELLED
}

// Goal Progress Logs
model GoalProgressLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  goalId        String   @db.ObjectId

  // Progress Details
  previousValue Decimal?
  newValue      Decimal
  progressPercent Int

  // Notes
  notes         String?

  // Timestamps
  recordedAt    DateTime @default(now())
  recordedBy    String?  @db.ObjectId

  // Relations
  goal          PerformanceGoal @relation(fields: [goalId], references: [id])

  @@index([goalId])
  @@index([recordedAt])
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
  templateId    String?  @db.ObjectId

  // Status & Dates
  status        ReviewStatus @default(SCHEDULED)
  scheduledDate DateTime
  dueDate       DateTime?
  completedDate DateTime?
  meetingDate   DateTime?

  // Reviewer
  reviewerId    String   @db.ObjectId

  // Assessments
  selfAssessment ReviewAssessment?
  managerAssessment ReviewAssessment?

  // Overall Scores (1-5 scale)
  overallScore  Decimal?
  categoryScores Json?   // { categoryCode: score }

  // Feedback
  strengths     String?
  areasForImprovement String?
  managerComments String?
  employeeComments String?
  developmentPlan String?

  // Goals Review
  goalsAchieved Int?
  totalGoals    Int?
  goalsNotes    String?

  // Signatures
  employeeSignedAt DateTime?
  reviewerSignedAt DateTime?
  employeeAcknowledged Boolean @default(false)

  // Documents
  documentUrl   String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])
  reviewer      StaffProfile @relation("ReviewerRelation", fields: [reviewerId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([reviewerId])
  @@index([status])
  @@index([scheduledDate])
  @@index([reviewType])
}

type ReviewAssessment {
  completedAt   DateTime?
  scores        Json      // { categoryCode: { score, comments } }
  overallComments String?
}

enum ReviewType {
  ANNUAL
  SEMI_ANNUAL
  QUARTERLY
  PROBATIONARY_30
  PROBATIONARY_60
  PROBATIONARY_90
  IMPROVEMENT_PLAN
  AD_HOC
}

enum ReviewStatus {
  SCHEDULED
  SELF_REVIEW_PENDING
  SELF_REVIEW_COMPLETE
  MANAGER_REVIEW_PENDING
  MANAGER_REVIEW_COMPLETE
  MEETING_SCHEDULED
  MEETING_COMPLETE
  PENDING_SIGNATURES
  COMPLETED
  CANCELLED
}

// Review Templates
model ReviewTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId  // null for system templates

  // Template Details
  name          String
  description   String?
  reviewType    ReviewType

  // Categories
  categories    ReviewCategory[]

  // Role Targeting
  applicableRoles String[] // Role codes this template applies to

  // Status
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic?   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([reviewType])
}

type ReviewCategory {
  code          String
  name          String
  description   String?
  weight        Decimal   @default(1)
  criteria      String[]  // Evaluation criteria
  includeSelfAssessment Boolean @default(true)
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
  courseCode    String?

  // Dates
  assignedDate  DateTime?
  startDate     DateTime?
  completionDate DateTime?
  expirationDate DateTime?
  dueDate       DateTime?

  // Status
  status        TrainingStatus @default(NOT_STARTED)
  isRequired    Boolean  @default(false)

  // Assessment
  score         Decimal?
  passingScore  Decimal?
  passed        Boolean?
  attempts      Int      @default(0)

  // CE Credits
  ceCredits     Decimal?
  ceCategory    String?
  ceApproved    Boolean  @default(false)

  // Duration
  durationHours Decimal?

  // Documents
  certificateUrl String?
  completionDocUrl String?

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  assignedBy    String?  @db.ObjectId
  verifiedBy    String?  @db.ObjectId
  verifiedAt    DateTime?

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([trainingType])
  @@index([status])
  @@index([dueDate])
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
  SAFETY
  OTHER
}

enum TrainingStatus {
  NOT_STARTED
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  EXPIRED
  WAIVED
  FAILED
}

// CE Credits
model CECredit {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Credit Details
  courseName    String
  provider      String
  providerNumber String?  // ADA CERP number, etc.
  credits       Decimal
  category      CECategory

  // Dates
  completionDate DateTime
  expirationDate DateTime?

  // Verification
  certificateNumber String?
  certificateUrl String?
  verified      Boolean  @default(false)
  verifiedBy    String?  @db.ObjectId
  verifiedAt    DateTime?

  // License Association
  licenseType   String?  // Which license this applies to
  licensingBoard String?

  // Renewal Period
  renewalPeriodStart DateTime?
  renewalPeriodEnd DateTime?

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([category])
  @@index([completionDate])
  @@index([renewalPeriodEnd])
}

enum CECategory {
  CLINICAL
  ETHICS
  INFECTION_CONTROL
  PHARMACOLOGY
  RADIOLOGY
  CPR_EMERGENCY
  PRACTICE_MANAGEMENT
  SPECIAL_TOPICS
  OTHER
}

// Recognition
model Recognition {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Recognition Details
  recipientId   String   @db.ObjectId
  giverId       String   @db.ObjectId
  recognitionType RecognitionType

  // Content
  title         String?
  message       String
  badgeCode     String?  // For badge-based recognition

  // Source
  source        RecognitionSource @default(PEER)
  patientName   String?  // For patient compliments

  // Visibility
  isPublic      Boolean  @default(true)
  isAnonymous   Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  recipient     StaffProfile @relation("RecognitionRecipient", fields: [recipientId], references: [id])
  giver         StaffProfile @relation("RecognitionGiver", fields: [giverId], references: [id])

  @@index([clinicId])
  @@index([recipientId])
  @@index([giverId])
  @@index([createdAt])
  @@index([recognitionType])
}

enum RecognitionType {
  KUDOS
  THANK_YOU
  GREAT_JOB
  TEAM_PLAYER
  PATIENT_HERO
  INNOVATION
  MILESTONE
  ANNIVERSARY
  BADGE
  CUSTOM
}

enum RecognitionSource {
  PEER
  MANAGER
  PATIENT
  SYSTEM
}

// Performance Metrics (for tracking calculated metrics)
model PerformanceMetric {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Metric Details
  metricCode    String
  periodStart   DateTime
  periodEnd     DateTime
  periodType    MetricPeriod

  // Values
  value         Decimal
  target        Decimal?
  previousValue Decimal?

  // Calculation Details
  calculatedAt  DateTime @default(now())
  dataPoints    Int?     // Number of records used in calculation

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@unique([staffProfileId, metricCode, periodStart, periodEnd])
  @@index([clinicId])
  @@index([staffProfileId])
  @@index([metricCode])
  @@index([periodStart])
}

enum MetricPeriod {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}
```

---

## API Endpoints

### Performance Metrics

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/metrics` | Get staff metrics | `performance:read` |
| GET | `/api/staff/:id/metrics/:code` | Get specific metric | `performance:read` |
| GET | `/api/staff/:id/metrics/history` | Get metric history | `performance:read` |
| GET | `/api/staff/metrics/summary` | Get team metrics summary | `performance:view_all` |
| GET | `/api/staff/metrics/leaderboard` | Get performance leaderboard | `performance:view_all` |
| POST | `/api/staff/metrics/calculate` | Trigger metric calculation | `performance:manage` |

### Goals

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/goals` | Get staff goals | `performance:read` |
| GET | `/api/staff/goals/:goalId` | Get goal details | `performance:read` |
| POST | `/api/staff/:id/goals` | Create goal | `performance:create` |
| PUT | `/api/staff/goals/:goalId` | Update goal | `performance:update` |
| DELETE | `/api/staff/goals/:goalId` | Delete goal | `performance:delete` |
| POST | `/api/staff/goals/:goalId/progress` | Log progress | `performance:update` |
| PUT | `/api/staff/goals/:goalId/status` | Update status | `performance:update` |

### Reviews

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/reviews` | List reviews | `performance:read` |
| GET | `/api/staff/:id/reviews` | Get staff reviews | `performance:read` |
| GET | `/api/staff/reviews/:reviewId` | Get review details | `performance:read` |
| POST | `/api/staff/:id/reviews` | Create review | `performance:review` |
| PUT | `/api/staff/reviews/:reviewId` | Update review | `performance:review` |
| POST | `/api/staff/reviews/:reviewId/self-assessment` | Submit self-assessment | `performance:self_assess` |
| POST | `/api/staff/reviews/:reviewId/manager-assessment` | Submit manager assessment | `performance:review` |
| POST | `/api/staff/reviews/:reviewId/complete` | Complete review | `performance:review` |
| POST | `/api/staff/reviews/:reviewId/sign` | Sign review | `performance:sign` |
| GET | `/api/staff/reviews/pending` | Get pending reviews | `performance:review` |
| GET | `/api/staff/review-templates` | List templates | `performance:read` |

### Training

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/training` | Get training records | `training:read` |
| GET | `/api/staff/training/:recordId` | Get training details | `training:read` |
| POST | `/api/staff/:id/training` | Add training record | `training:manage` |
| PUT | `/api/staff/training/:recordId` | Update training | `training:manage` |
| DELETE | `/api/staff/training/:recordId` | Delete training | `training:manage` |
| POST | `/api/staff/training/:recordId/complete` | Mark complete | `training:manage` |
| GET | `/api/staff/training/required` | Get required training | `training:read` |
| GET | `/api/staff/training/overdue` | Get overdue training | `training:read` |
| GET | `/api/staff/training/expiring` | Get expiring training | `training:read` |

### CE Credits

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/ce-credits` | Get CE credits | `training:read` |
| POST | `/api/staff/:id/ce-credits` | Add CE credit | `training:manage` |
| PUT | `/api/staff/ce-credits/:creditId` | Update CE credit | `training:manage` |
| DELETE | `/api/staff/ce-credits/:creditId` | Delete CE credit | `training:manage` |
| GET | `/api/staff/:id/ce-credits/summary` | Get CE summary | `training:read` |
| POST | `/api/staff/ce-credits/:creditId/verify` | Verify CE credit | `training:verify` |

### Recognition

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/recognition` | Get recognition feed | `staff:read` |
| GET | `/api/staff/:id/recognition` | Get staff recognition | `staff:read` |
| POST | `/api/staff/:id/recognition` | Give recognition | `staff:recognize` |
| DELETE | `/api/staff/recognition/:id` | Delete recognition | `staff:manage` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `PerformanceDashboard` | Overview of performance | `components/staff/performance/` |
| `MetricCard` | Individual metric display | `components/staff/performance/` |
| `MetricChart` | Metric trend chart | `components/staff/performance/` |
| `MetricComparison` | Compare metrics | `components/staff/performance/` |
| `ProviderProductionReport` | Provider production view | `components/staff/performance/` |
| `TCConversionReport` | TC metrics report | `components/staff/performance/` |
| `GoalList` | List staff goals | `components/staff/performance/` |
| `GoalCard` | Individual goal card | `components/staff/performance/` |
| `GoalForm` | Create/edit goal | `components/staff/performance/` |
| `GoalProgress` | Goal progress tracker | `components/staff/performance/` |
| `GoalMilestones` | Milestone tracker | `components/staff/performance/` |
| `ReviewList` | List reviews | `components/staff/performance/` |
| `ReviewDetail` | Review details view | `components/staff/performance/` |
| `SelfAssessmentForm` | Self-assessment form | `components/staff/performance/` |
| `ManagerAssessmentForm` | Manager assessment form | `components/staff/performance/` |
| `ReviewSignature` | Review signature capture | `components/staff/performance/` |
| `TrainingDashboard` | Training overview | `components/staff/training/` |
| `TrainingList` | List training records | `components/staff/training/` |
| `TrainingCard` | Training summary card | `components/staff/training/` |
| `TrainingForm` | Add/edit training | `components/staff/training/` |
| `RequiredTrainingAlert` | Overdue training alert | `components/staff/training/` |
| `CECreditTracker` | CE credit tracking | `components/staff/training/` |
| `CECreditForm` | Add CE credit | `components/staff/training/` |
| `CEProgressBar` | CE progress toward renewal | `components/staff/training/` |
| `RecognitionFeed` | Recognition wall/feed | `components/staff/recognition/` |
| `RecognitionForm` | Give recognition | `components/staff/recognition/` |
| `RecognitionBadge` | Badge display | `components/staff/recognition/` |
| `AnniversaryCard` | Service anniversary | `components/staff/recognition/` |

---

## Business Rules

1. **Metric Calculations**: Performance metrics calculated based on role-specific definitions
2. **Goal Alignment**: Individual goals should align with practice/team goals
3. **Review Scheduling**: Reviews scheduled based on practice policy (annual, semi-annual, etc.)
4. **Self-Assessment**: Self-assessments due before manager assessment begins
5. **Review Completion**: Reviews require both party signatures to complete
6. **Training Requirements**: Required training must be completed by deadlines
7. **Training Expiration**: Expired training generates alerts and compliance flags
8. **CE Requirements**: CE credits tracked against state licensing requirements
9. **CE Verification**: CE credits may require verification for renewal submission
10. **Recognition Privacy**: Constructive feedback is always private
11. **Metric History**: Metric history retained for trend analysis
12. **Improvement Plans**: Failed reviews may require improvement plan documentation

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Staff Profiles | Required | Staff information |
| Auth | Required | User authentication |
| Treatment Management | Integration | Treatment data for provider metrics |
| Scheduling | Integration | Appointment data for metrics |
| Financial Management | Integration | Production/collection data |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Document Storage | Required | Certificate/document storage |
| Email Service | Required | Review/training notifications |
| Reporting Service | Optional | Advanced report generation |

---

## Related Documentation

- [Parent: Staff Management](../../)
- [Staff Profiles & HR](../staff-profiles-hr/)
- [Scheduling & Time Management](../scheduling-time-management/)
- [Roles & Permissions](../roles-permissions/)
- [Financial Management](../../../financial-management/) - Production metrics

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
