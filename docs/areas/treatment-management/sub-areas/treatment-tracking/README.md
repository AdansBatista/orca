# Treatment Tracking

> **Area**: [Treatment Management](../../)
>
> **Sub-Area**: 3.4 Treatment Tracking
>
> **Purpose**: Monitor treatment progress through timeline visualization, milestone tracking, progress monitoring, and outcome assessment

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [Treatment Management](../../) |
| **Dependencies** | Treatment Planning, Clinical Documentation, Appliance Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Treatment Tracking provides comprehensive tools for monitoring orthodontic treatment progress from start to completion. This includes visual treatment timelines, milestone tracking with target dates, progress monitoring against treatment goals, debond eligibility assessment, retention protocol management, and treatment outcome documentation. The system enables proactive identification of treatment delays and supports evidence-based outcome analysis.

The sub-area helps clinical teams track treatment duration, monitor patient progress against expected timelines, identify cases requiring attention, and document treatment outcomes for quality improvement and reporting.

### Key Capabilities

- Visualize treatment timeline with phases and milestones
- Track milestone achievement against target dates
- Monitor treatment progress with expected vs. actual comparison
- Assess debond readiness with checklist criteria
- Manage retention phase protocols and compliance
- Document comprehensive treatment outcomes
- Generate progress reports and analytics
- Support proactive treatment management alerts
- Enable before/after outcome documentation with images

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.4.1 | [Timeline Visualization](./functions/timeline-visualization.md) | Visual treatment timeline display | 📋 Planned | High |
| 3.4.2 | [Milestone Tracking](./functions/milestone-tracking.md) | Track treatment milestones | 📋 Planned | Critical |
| 3.4.3 | [Progress Monitoring](./functions/progress-monitoring.md) | Monitor treatment progress | 📋 Planned | Critical |
| 3.4.4 | [Debond Scheduling](./functions/debond-scheduling.md) | Manage debond eligibility and scheduling | 📋 Planned | High |
| 3.4.5 | [Retention Protocols](./functions/retention-protocols.md) | Manage retention phase | 📋 Planned | High |
| 3.4.6 | [Outcome Assessment](./functions/outcome-assessment.md) | Document treatment outcomes | 📋 Planned | Medium |

---

## Function Details

### 3.4.1 Timeline Visualization

**Purpose**: Provide visual representation of treatment progress over time.

**Key Capabilities**:
- Display treatment timeline from start to estimated completion
- Show treatment phases with durations
- Plot milestone markers on timeline
- Indicate current position in treatment
- Highlight delays or ahead-of-schedule status
- Support interactive timeline exploration
- Filter by date ranges
- Export timeline for patient communication

**Timeline Elements**:
| Element | Description | Visual Indicator |
|---------|-------------|------------------|
| Treatment Start | Bonding/start date | Start marker |
| Phase Boundaries | Phase transitions | Phase segments |
| Milestones | Key treatment events | Diamond markers |
| Current Date | Today's position | Current line |
| Estimated End | Target completion | End marker |
| Appointments | Visit markers | Dot markers |

**User Stories**:
- As a **doctor**, I want to see treatment progress at a glance
- As a **patient**, I want to understand where I am in treatment
- As a **clinical staff**, I want to identify delayed treatments

---

### 3.4.2 Milestone Tracking

**Purpose**: Define and track key treatment milestones.

**Key Capabilities**:
- Create standard milestones based on treatment type
- Set target dates for milestones
- Track milestone achievement
- Document milestone completion details
- Generate milestone alerts for overdue items
- Support custom milestones per case
- Link milestones to clinical documentation
- Report on milestone achievement rates

**Standard Milestones by Treatment Type**:

**Comprehensive Treatment**:
| Milestone | Typical Timeline | Criteria |
|-----------|------------------|----------|
| Treatment Start | Month 0 | Bonding complete |
| Initial Alignment | Month 3-4 | Alignment achieved |
| Space Closure Start | Month 6-8 | Ready for space closure |
| Space Closure Complete | Month 12-16 | Spaces closed |
| Finishing Start | Month 14-18 | Ready for detailing |
| Debond Ready | Month 18-24 | Treatment goals met |
| Debond Complete | At debond | Appliances removed |
| Retention Start | At debond | Retainers delivered |

**Phase I Treatment**:
| Milestone | Typical Timeline | Criteria |
|-----------|------------------|----------|
| Treatment Start | Month 0 | Appliances placed |
| Midpoint Review | Month 4-6 | Progress assessment |
| Treatment Goals | Month 8-10 | Objectives achieved |
| Phase I Complete | Month 9-12 | Ready for observation |
| Observation Start | Post-Phase I | Monitoring period |

**Milestone Statuses**:
- PENDING: Not yet due
- IN_PROGRESS: Currently working toward
- ACHIEVED: Successfully completed
- MISSED: Past due, not achieved
- DEFERRED: Intentionally delayed
- CANCELLED: No longer applicable

**User Stories**:
- As a **doctor**, I want to track milestone progress for all patients
- As a **clinical staff**, I want alerts for overdue milestones
- As a **clinic admin**, I want reports on treatment timelines

---

### 3.4.3 Progress Monitoring

**Purpose**: Monitor overall treatment progress against goals.

**Key Capabilities**:
- Calculate treatment progress percentage
- Compare expected vs. actual progress
- Track visits completed vs. estimated
- Monitor treatment duration vs. estimate
- Identify cases running behind schedule
- Generate progress alerts and reports
- Support clinical decision making
- Enable trend analysis across patients

**Progress Indicators**:
| Indicator | Calculation | Target |
|-----------|-------------|--------|
| Timeline Progress | Actual / Estimated duration | On track |
| Visit Progress | Visits completed / Estimated visits | On track |
| Phase Progress | Phases completed / Total phases | Sequential |
| Milestone Progress | Milestones achieved / Total milestones | On track |
| Clinical Progress | Measurement improvements | Goals met |

**Progress Categories**:
| Status | Definition | Action |
|--------|------------|--------|
| Ahead | >10% ahead of schedule | Continue |
| On Track | Within ±10% of schedule | Continue |
| Behind | 10-25% behind | Review |
| Significantly Behind | >25% behind | Intervention |

**User Stories**:
- As a **doctor**, I want to identify patients behind schedule
- As a **clinic admin**, I want treatment duration analytics
- As a **doctor**, I want to compare actual vs. planned progress

---

### 3.4.4 Debond Scheduling

**Purpose**: Manage debond eligibility assessment and scheduling.

**Key Capabilities**:
- Define debond readiness criteria
- Create debond readiness checklists
- Track criteria completion
- Schedule debond appointments
- Document debond decision
- Support debond postponement with reasons
- Generate debond preparation tasks
- Coordinate with lab for retainer timing

**Debond Readiness Criteria**:
| Criteria | Description | Required |
|----------|-------------|----------|
| Treatment Goals | Clinical objectives achieved | Yes |
| Overbite/Overjet | Within acceptable range | Yes |
| Molar Relationship | Class I or acceptable | Yes |
| Midlines | Aligned or acceptable | Yes |
| Spacing/Crowding | Resolved | Yes |
| Root Paralleling | Verified on X-ray | Recommended |
| Patient Satisfaction | Patient approves | Yes |
| Final Records | Progress records taken | Recommended |
| Retainers Ready | Retainers ordered/received | Yes |

**Debond Workflow**:
1. Assess debond readiness criteria
2. Take final progress records
3. Order retainers from lab
4. Schedule debond appointment
5. Confirm retainers received
6. Perform debond procedure
7. Deliver retainers
8. Schedule retention check

**User Stories**:
- As a **doctor**, I want to assess if a patient is ready for debond
- As a **clinical staff**, I want to ensure retainers are ready for debond
- As a **scheduling**, I want to coordinate debond appointments

---

### 3.4.5 Retention Protocols

**Purpose**: Manage retention phase compliance and monitoring.

**Key Capabilities**:
- Define retention protocols by case type
- Track retainer delivery and status
- Monitor retention wear compliance
- Schedule retention check appointments
- Document retention issues
- Track retainer replacements
- Generate retention compliance reports
- Support long-term retention monitoring

**Retention Protocol Phases**:
| Phase | Duration | Wear Schedule | Check Interval |
|-------|----------|---------------|----------------|
| Initial | 0-6 months | Full-time | 6-8 weeks |
| Transition | 6-12 months | Nights only | 3 months |
| Maintenance | 12-24 months | Every other night | 6 months |
| Long-term | 24+ months | As directed | Annual |

**Retention Monitoring**:
| Item | Tracking | Action if Issue |
|------|----------|-----------------|
| Retainer Wear | Patient-reported compliance | Reinforce instructions |
| Retainer Fit | Clinical assessment | Adjust or replace |
| Stability | Clinical/photo comparison | Intervention if needed |
| Retainer Condition | Visual inspection | Repair or replace |

**User Stories**:
- As a **doctor**, I want to set retention protocols for patients
- As a **clinical staff**, I want to track retention compliance
- As a **front desk**, I want to schedule retention check appointments

---

### 3.4.6 Outcome Assessment

**Purpose**: Document comprehensive treatment outcomes.

**Key Capabilities**:
- Record treatment outcome ratings
- Compare initial and final measurements
- Document objectives achieved
- Calculate treatment duration and visits
- Record complications encountered
- Capture patient satisfaction
- Store before/after images
- Generate outcome reports
- Support quality improvement analysis

**Outcome Rating Scale**:
| Rating | Definition | Criteria |
|--------|------------|----------|
| Excellent | Exceptional results | All objectives exceeded |
| Good | Goals fully achieved | All objectives met |
| Satisfactory | Goals mostly achieved | Minor compromises |
| Fair | Goals partially achieved | Significant compromises |
| Poor | Goals not achieved | Treatment unsuccessful |
| Incomplete | Treatment not finished | Discontinued/transferred |

**Outcome Documentation Components**:
| Component | Description |
|-----------|-------------|
| Initial vs. Final Measurements | Quantitative improvement data |
| Objectives Assessment | Goals achieved vs. planned |
| Treatment Duration | Planned vs. actual duration |
| Visit Count | Estimated vs. actual visits |
| Complications | Issues encountered during treatment |
| Patient Satisfaction | Patient feedback and rating |
| Clinical Assessment | Provider's clinical evaluation |
| Before/After Images | Visual documentation |
| Lessons Learned | Notes for future cases |

**Outcome Metrics**:
| Metric | Calculation |
|--------|-------------|
| Duration Accuracy | Actual / Estimated duration |
| Visit Efficiency | Actual / Estimated visits |
| Goal Achievement | Objectives met / Total objectives |
| Complication Rate | Cases with complications / Total cases |
| Patient Satisfaction | Average satisfaction score |

**User Stories**:
- As a **doctor**, I want to document treatment outcomes
- As a **clinic admin**, I want outcome analytics for quality improvement
- As a **doctor**, I want to compare before/after measurements

---

## Data Model

```prisma
model TreatmentMilestone {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  treatmentPlanId String @db.ObjectId

  // Milestone Details
  milestoneName String
  milestoneType MilestoneType
  description   String?

  // Dates
  targetDate    DateTime?
  achievedDate  DateTime?

  // Status
  status        MilestoneStatus @default(PENDING)

  // Criteria
  completionCriteria String?

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  treatmentPlan TreatmentPlan @relation(fields: [treatmentPlanId], references: [id])

  @@index([clinicId])
  @@index([treatmentPlanId])
  @@index([status])
  @@index([targetDate])
}

model TreatmentProgress {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  treatmentPlanId String @db.ObjectId

  // Progress Snapshot
  snapshotDate  DateTime @default(now())

  // Timeline Progress
  treatmentDay  Int      // Days since start
  estimatedTotalDays Int
  progressPercent Int

  // Visit Progress
  completedVisits Int
  estimatedVisits Int

  // Phase Progress
  currentPhase  String?
  phaseProgress Int      @default(0)

  // Milestone Progress
  milestonesAchieved Int
  totalMilestones Int

  // Status
  progressStatus ProgressStatus @default(ON_TRACK)

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  treatmentPlan TreatmentPlan @relation(fields: [treatmentPlanId], references: [id])

  @@index([clinicId])
  @@index([treatmentPlanId])
  @@index([snapshotDate])
}

model DebondReadiness {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  treatmentPlanId String @db.ObjectId @unique

  // Assessment
  assessmentDate DateTime
  assessedBy    String   @db.ObjectId

  // Criteria Checklist
  treatmentGoalsMet Boolean @default(false)
  overbiteAcceptable Boolean @default(false)
  overjetAcceptable Boolean @default(false)
  molarRelationshipOk Boolean @default(false)
  midlinesAcceptable Boolean @default(false)
  spacingResolved Boolean @default(false)
  rootParallelingOk Boolean?
  patientSatisfied Boolean @default(false)
  finalRecordsTaken Boolean @default(false)
  retainersReady Boolean @default(false)

  // Overall Status
  isReady       Boolean  @default(false)
  readyDate     DateTime?

  // If Not Ready
  notReadyReason String?
  targetReadyDate DateTime?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  treatmentPlan TreatmentPlan @relation(fields: [treatmentPlanId], references: [id])

  @@index([clinicId])
  @@index([treatmentPlanId])
}

model RetentionProtocol {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  treatmentPlanId String @db.ObjectId @unique

  // Protocol Details
  protocolStartDate DateTime
  currentPhase  RetentionPhase @default(INITIAL)

  // Wear Schedule
  currentWearSchedule RetentionWearSchedule
  wearInstructions String?

  // Check Schedule
  nextCheckDate DateTime?
  checkIntervalMonths Int @default(3)

  // Compliance
  lastComplianceCheck DateTime?
  complianceStatus ComplianceStatus?
  complianceNotes String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  treatmentPlan TreatmentPlan @relation(fields: [treatmentPlanId], references: [id])
  checks        RetentionCheck[]

  @@index([clinicId])
  @@index([treatmentPlanId])
}

model RetentionCheck {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  retentionProtocolId String @db.ObjectId

  // Check Details
  checkDate     DateTime
  performedBy   String   @db.ObjectId

  // Assessment
  retainerConditionUpper RetainerCondition?
  retainerConditionLower RetainerCondition?
  wearCompliance ComplianceStatus
  stabilityStatus StabilityStatus

  // Findings
  findings      String?
  actionTaken   String?

  // Next Steps
  nextCheckDate DateTime?
  wearScheduleChange RetentionWearSchedule?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  retentionProtocol RetentionProtocol @relation(fields: [retentionProtocolId], references: [id])

  @@index([clinicId])
  @@index([retentionProtocolId])
}

model TreatmentOutcome {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  treatmentPlanId String @db.ObjectId @unique

  // Outcome Assessment
  assessmentDate DateTime
  assessedBy    String   @db.ObjectId

  // Results
  overallOutcome OutcomeRating
  objectivesAchieved Int
  totalObjectives Int

  // Measurements Comparison
  initialMeasurements Json?
  finalMeasurements Json?

  // Duration
  plannedDuration Int?
  actualDuration Int?
  plannedVisits  Int?
  actualVisits   Int?

  // Complications
  complications  String[]

  // Patient Satisfaction
  patientSatisfactionScore Int?
  patientFeedback String?

  // Clinical Assessment
  alignmentScore Int?
  occlusionScore Int?
  estheticsScore Int?

  // Images
  beforeImageIds String[] @db.ObjectId
  afterImageIds String[] @db.ObjectId

  // Notes
  clinicalNotes String?
  lessonsLearned String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  treatmentPlan TreatmentPlan @relation(fields: [treatmentPlanId], references: [id])

  @@index([clinicId])
  @@index([treatmentPlanId])
}

enum MilestoneType {
  TREATMENT_START
  BONDING_COMPLETE
  INITIAL_ALIGNMENT
  SPACE_CLOSURE_START
  SPACE_CLOSURE_COMPLETE
  SURGICAL_READY
  SURGERY_COMPLETE
  FINISHING_START
  DEBOND_READY
  DEBOND_COMPLETE
  RETENTION_START
  RETENTION_CHECK
  TREATMENT_COMPLETE
  CUSTOM
}

enum MilestoneStatus {
  PENDING
  IN_PROGRESS
  ACHIEVED
  MISSED
  DEFERRED
  CANCELLED
}

enum ProgressStatus {
  AHEAD
  ON_TRACK
  BEHIND
  SIGNIFICANTLY_BEHIND
}

enum RetentionPhase {
  INITIAL
  TRANSITION
  MAINTENANCE
  LONG_TERM
}

enum RetentionWearSchedule {
  FULL_TIME
  NIGHTS_ONLY
  EVERY_OTHER_NIGHT
  FEW_NIGHTS_WEEK
  AS_NEEDED
}

enum ComplianceStatus {
  EXCELLENT
  GOOD
  FAIR
  POOR
  NON_COMPLIANT
}

enum RetainerCondition {
  GOOD
  WORN
  DAMAGED
  LOST
  NEEDS_REPLACEMENT
}

enum StabilityStatus {
  STABLE
  MINOR_RELAPSE
  SIGNIFICANT_RELAPSE
  REQUIRES_TREATMENT
}

enum OutcomeRating {
  EXCELLENT
  GOOD
  SATISFACTORY
  FAIR
  POOR
  INCOMPLETE
}
```

---

## API Endpoints

### Milestones

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/milestones` | List milestones | `treatment:read` |
| POST | `/api/treatment-plans/:id/milestones` | Create milestone | `milestone:create` |
| PUT | `/api/milestones/:id` | Update milestone | `milestone:update` |
| DELETE | `/api/milestones/:id` | Delete milestone | `milestone:update` |
| POST | `/api/milestones/:id/achieve` | Mark achieved | `milestone:update` |
| GET | `/api/milestones/overdue` | Get overdue milestones | `treatment:read` |
| GET | `/api/milestones/upcoming` | Get upcoming milestones | `treatment:read` |

### Progress

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/progress` | Get progress summary | `treatment:read` |
| POST | `/api/treatment-plans/:id/progress/snapshot` | Create progress snapshot | `treatment:read` |
| GET | `/api/treatment-plans/:id/progress/history` | Progress history | `treatment:read` |
| GET | `/api/treatments/behind-schedule` | Cases behind schedule | `treatment:read` |
| GET | `/api/treatments/progress-report` | Progress analytics | `treatment:read` |

### Timeline

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/timeline` | Get treatment timeline | `treatment:read` |
| GET | `/api/treatment-plans/:id/timeline/export` | Export timeline | `treatment:read` |

### Debond Readiness

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/debond-readiness` | Get debond assessment | `treatment:read` |
| POST | `/api/treatment-plans/:id/debond-readiness` | Create assessment | `treatment:create` |
| PUT | `/api/debond-readiness/:id` | Update assessment | `treatment:update` |
| GET | `/api/debond-readiness/ready` | Get debond-ready cases | `treatment:read` |

### Retention

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/retention` | Get retention protocol | `treatment:read` |
| POST | `/api/treatment-plans/:id/retention` | Create retention protocol | `treatment:create` |
| PUT | `/api/retention/:id` | Update retention protocol | `treatment:update` |
| POST | `/api/retention/:id/checks` | Record retention check | `treatment:create` |
| GET | `/api/retention/checks/due` | Get due retention checks | `treatment:read` |

### Outcomes

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/treatment-plans/:id/outcome` | Get treatment outcome | `outcome:read` |
| POST | `/api/treatment-plans/:id/outcome` | Create outcome record | `outcome:assess` |
| PUT | `/api/outcomes/:id` | Update outcome | `outcome:assess` |
| GET | `/api/outcomes/analytics` | Outcome analytics | `outcome:read` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `TreatmentTimeline` | Visual treatment timeline | `components/treatment/tracking/` |
| `TimelineControls` | Timeline filter/zoom controls | `components/treatment/tracking/` |
| `TimelineExport` | Export timeline view | `components/treatment/tracking/` |
| `MilestoneTracker` | Track milestones list | `components/treatment/tracking/` |
| `MilestoneCard` | Individual milestone display | `components/treatment/tracking/` |
| `MilestoneForm` | Create/edit milestone | `components/treatment/tracking/` |
| `MilestoneAlerts` | Overdue milestone alerts | `components/treatment/tracking/` |
| `ProgressDashboard` | Treatment progress overview | `components/treatment/tracking/` |
| `ProgressIndicator` | Progress percentage display | `components/treatment/tracking/` |
| `ProgressComparison` | Expected vs actual chart | `components/treatment/tracking/` |
| `BehindScheduleList` | Cases needing attention | `components/treatment/tracking/` |
| `DebondReadinessCheck` | Debond eligibility checklist | `components/treatment/tracking/` |
| `DebondReadyList` | List of debond-ready patients | `components/treatment/tracking/` |
| `RetentionProtocolCard` | Display retention protocol | `components/treatment/tracking/` |
| `RetentionCheckForm` | Record retention check | `components/treatment/tracking/` |
| `RetentionSchedule` | Upcoming retention checks | `components/treatment/tracking/` |
| `OutcomeAssessmentForm` | Record treatment outcome | `components/treatment/tracking/` |
| `OutcomeComparisonView` | Before/after comparison | `components/treatment/tracking/` |
| `OutcomeAnalytics` | Outcome statistics | `components/treatment/tracking/` |
| `BeforeAfterGallery` | Image comparison gallery | `components/treatment/tracking/` |
| `TreatmentReport` | Comprehensive treatment report | `components/treatment/tracking/` |

---

## Business Rules

1. **Milestone Creation**: Standard milestones auto-created based on treatment type
2. **Milestone Updates**: Milestone status updated at relevant appointments
3. **Progress Calculation**: Progress recalculated at each visit
4. **Behind Schedule Alerts**: Alert when progress >10% behind estimate
5. **Debond Criteria**: All required criteria must be met for debond
6. **Retainer Timing**: Retainers must be ordered before debond scheduling
7. **Retention Protocol**: Retention protocol created at debond
8. **Retention Checks**: Retention check appointments scheduled per protocol
9. **Outcome Recording**: Outcome assessment required at treatment completion
10. **Image Documentation**: Before/after images required for outcome records

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Treatment Planning | Required | Treatment plan and phases |
| Clinical Documentation | Required | Visit documentation linkage |
| Appliance Management | Required | Debond and retention tracking |
| Imaging Management | Required | Before/after images |
| Scheduling | Required | Appointment scheduling |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Charting Library | Required | Timeline visualization |
| Image Storage | Required | Before/after image storage |
| Reporting Engine | Optional | Analytics and reports |

---

## Related Documentation

- [Parent: Treatment Management](../../)
- [Treatment Planning](../treatment-planning/)
- [Clinical Documentation](../clinical-documentation/)
- [Appliance Management](../appliance-management/)
- [Scheduling & Booking](../../../scheduling-booking/) - Appointment scheduling
- [Imaging Management](../../../imaging-management/) - Progress images
- [AUTH-GUIDE](../../../../guides/AUTH-GUIDE.md) - Authorization patterns

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
