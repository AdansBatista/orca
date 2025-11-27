# Waitlist & Recovery

> **Area**: [Booking & Scheduling](../../)
>
> **Sub-Area**: 2.1.3 Waitlist & Recovery
>
> **Purpose**: Manage patient waitlists, fill last-minute openings, and recover from failed appointments

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Booking & Scheduling](../../) |
| **Dependencies** | Auth, Appointment Management, Patient Communications |
| **Last Updated** | 2024-11-26 |

---

## Overview

Waitlist & Recovery manages patient waitlists for scheduling and handles recovery workflows for failed appointments (no-shows, cancellations). This sub-area helps practices maximize chair utilization by quickly filling openings and maintaining patient engagement even after missed appointments.

Effective waitlist management ensures patients who want earlier appointments can get them, while recovery workflows help identify at-risk patients and bring them back into active treatment.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.1.3.1 | [Waitlist Management](./functions/waitlist-management.md) | Manage patients waiting for appointments | 📋 Planned | High |
| 2.1.3.2 | [Opening Notifications](./functions/opening-notifications.md) | Notify waitlist patients of openings | 📋 Planned | High |
| 2.1.3.3 | [Failed Appointment Recovery](./functions/failed-appointment-recovery.md) | Handle no-shows and cancellations | 📋 Planned | High |
| 2.1.3.4 | [Cancellation Tracking](./functions/cancellation-tracking.md) | Track and analyze cancellation patterns | 📋 Planned | Medium |
| 2.1.3.5 | [At-Risk Patient Identification](./functions/at-risk-patients.md) | Identify patients at risk of dropout | 📋 Planned | Medium |
| 2.1.3.6 | [Re-engagement Campaigns](./functions/re-engagement-campaigns.md) | Campaign outreach for inactive patients | 📋 Planned | Medium |

---

## Function Details

### 2.1.3.1 Waitlist Management

**Purpose**: Manage a prioritized list of patients waiting for appointments, with preferences for dates, times, and providers.

**Key Capabilities**:
- Add patients to waitlist with preferences
- Priority levels (urgent, standard, flexible)
- Date range preferences
- Time of day preferences (morning, afternoon, evening)
- Provider preferences
- Appointment type specification
- Waitlist position tracking
- Automatic removal when booked
- Expiration dates for waitlist entries
- Waitlist notes and comments

**User Stories**:
- As a **front desk**, I want to add a patient to the waitlist when no appointments are available
- As a **front desk**, I want to see the waitlist prioritized by urgency so I can fill openings appropriately
- As a **patient**, I want to specify my availability so I only get notified about convenient times

---

### 2.1.3.2 Opening Notifications

**Purpose**: Automatically notify waitlist patients when appointment openings match their preferences.

**Key Capabilities**:
- Match openings to waitlist preferences
- Multi-channel notifications (SMS, email, phone)
- First-come-first-served booking links
- Hold period for patient response
- Automatic escalation to next in line
- Bulk notification for multiple openings
- Notification timing rules (don't notify at night)
- Patient response tracking
- Conversion rate tracking (notification → booking)

**User Stories**:
- As a **patient**, I want to be notified immediately when an appointment opens up that matches my preferences
- As a **front desk**, I want the system to automatically offer openings to waitlist patients so I don't have to call manually
- As a **clinic admin**, I want to track how effective our waitlist notifications are at filling cancellations

---

### 2.1.3.3 Failed Appointment Recovery

**Purpose**: Implement systematic workflows to recover from no-shows and cancellations.

**Key Capabilities**:
- Automatic outreach after missed appointments
- Capture reason for no-show/cancellation
- Immediate re-booking suggestions
- Multi-touch follow-up sequences
- Manual outreach task generation
- Grace period before marking as no-show
- Differentiate between no-show and late cancellation
- Track recovery success rates
- Link to treatment impact (missed appointments affect treatment timeline)

**User Stories**:
- As a **front desk**, I want the system to automatically text patients after a no-show asking them to reschedule
- As a **clinic admin**, I want to capture cancellation reasons to identify patterns
- As a **doctor**, I want to see when patients' no-shows are impacting their treatment progress

---

### 2.1.3.4 Cancellation Tracking

**Purpose**: Track and analyze cancellation patterns to identify issues and improve scheduling.

**Key Capabilities**:
- Cancellation reason categorization
- Late cancellation vs. advance cancellation tracking
- Cancellation rates by patient, provider, day, time
- Cancellation pattern analysis
- Late cancellation policy enforcement
- No-show fee tracking
- Cancellation impact on revenue
- Provider-level cancellation metrics
- Same-day cancellation alerts

**Cancellation Reason Categories**:
- Schedule conflict
- Illness
- Transportation issue
- Forgot appointment
- Financial concerns
- Weather
- Family emergency
- Changed providers
- Other

**User Stories**:
- As a **clinic admin**, I want to see cancellation rates by day of week to optimize scheduling
- As a **billing staff**, I want to track late cancellation fees that should be charged
- As a **doctor**, I want to identify which appointment types have highest cancellation rates

---

### 2.1.3.5 At-Risk Patient Identification

**Purpose**: Identify patients at risk of dropping out of treatment based on appointment behavior.

**Key Capabilities**:
- Multiple missed appointment flagging
- Appointment frequency analysis
- Treatment progress correlation
- Risk scoring algorithm
- Alert generation for at-risk patients
- Recommended interventions
- Historical dropout pattern matching
- AI-powered prediction models
- Dashboard for at-risk patient review

**Risk Indicators**:
- 2+ consecutive no-shows
- Decreasing appointment frequency
- Multiple reschedules
- Long gaps between appointments
- Incomplete treatment milestones
- Payment issues
- Communication non-responsiveness

**User Stories**:
- As a **treatment coordinator**, I want to be alerted when patients are at risk of dropping out
- As a **doctor**, I want to see at-risk patients on my dashboard so I can personally reach out
- As a **clinic admin**, I want AI to predict which patients might drop out before they do

---

### 2.1.3.6 Re-engagement Campaigns

**Purpose**: Campaign-based outreach to re-engage inactive patients and bring them back to treatment.

**Key Capabilities**:
- Define inactive patient criteria
- Campaign creation and scheduling
- Multi-channel outreach (email, SMS, mail)
- Message templates for re-engagement
- Special offers/incentives integration
- Campaign performance tracking
- Segmentation by treatment stage
- Personalized messaging
- A/B testing for message effectiveness

**User Stories**:
- As a **clinic admin**, I want to create a campaign targeting patients who haven't been seen in 90+ days
- As a **marketing**, I want to track which re-engagement messages are most effective
- As a **treatment coordinator**, I want to send personalized outreach to patients who dropped out mid-treatment

---

## Data Model

```prisma
model WaitlistEntry {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Waitlist details
  appointmentTypeId  String   @db.ObjectId
  priority      WaitlistPriority @default(STANDARD)
  status        WaitlistStatus @default(ACTIVE)

  // Preferences
  preferredProviderId  String?  @db.ObjectId
  dateRangeStart       DateTime?
  dateRangeEnd         DateTime?
  preferredTimes       TimePreference[]
  preferredDays        Int[]    // 0-6 (Sunday-Saturday)

  // Notes
  notes         String?
  reasonForWaitlist  String?

  // Expiration
  expiresAt     DateTime?

  // Tracking
  position      Int?     // Dynamic position in queue
  addedAt       DateTime @default(now())
  addedBy       String   @db.ObjectId

  // Notifications sent
  notificationsSent  Int   @default(0)
  lastNotifiedAt     DateTime?

  // Resolution
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId
  resolution    WaitlistResolution?
  bookedAppointmentId  String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])
  appointmentType AppointmentType @relation(fields: [appointmentTypeId], references: [id])
  notifications WaitlistNotification[]

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
  @@index([priority])
  @@index([appointmentTypeId])
}

enum WaitlistPriority {
  URGENT
  HIGH
  STANDARD
  FLEXIBLE
}

enum WaitlistStatus {
  ACTIVE
  NOTIFIED      // Currently being offered an opening
  BOOKED        // Successfully booked
  EXPIRED       // Entry expired
  REMOVED       // Manually removed
  DECLINED      // Patient declined all offers
}

enum WaitlistResolution {
  BOOKED
  EXPIRED
  PATIENT_REMOVED
  STAFF_REMOVED
  DECLINED_ALL_OFFERS
}

type TimePreference {
  type     String    // "MORNING", "AFTERNOON", "EVENING", "SPECIFIC"
  startTime String?  // For SPECIFIC: "09:00"
  endTime   String?  // For SPECIFIC: "12:00"
}

model WaitlistNotification {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  waitlistEntryId String @db.ObjectId
  clinicId      String   @db.ObjectId

  // Opening offered
  appointmentSlotStart DateTime
  appointmentSlotEnd   DateTime
  providerId    String   @db.ObjectId
  chairId       String?  @db.ObjectId

  // Notification details
  channel       NotificationChannel
  sentAt        DateTime @default(now())
  message       String

  // Hold period
  holdExpiresAt DateTime
  holdReleased  Boolean  @default(false)

  // Response
  respondedAt   DateTime?
  response      NotificationResponse?

  // Result
  bookedAppointmentId  String?  @db.ObjectId

  // Relations
  waitlistEntry WaitlistEntry @relation(fields: [waitlistEntryId], references: [id])

  @@index([waitlistEntryId])
  @@index([clinicId])
  @@index([holdExpiresAt])
}

enum NotificationChannel {
  SMS
  EMAIL
  PHONE
  PUSH
}

enum NotificationResponse {
  ACCEPTED
  DECLINED
  NO_RESPONSE
  EXPIRED
}

model AppointmentCancellation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  appointmentId String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Cancellation details
  cancellationType  CancellationType
  cancelledAt       DateTime @default(now())
  cancelledBy       String   @db.ObjectId
  cancelledByType   CancelledByType

  // Original appointment info (snapshot)
  originalStartTime DateTime
  originalEndTime   DateTime
  originalProviderId String  @db.ObjectId
  appointmentTypeId  String  @db.ObjectId

  // Reason
  reason            CancellationReason
  reasonDetails     String?

  // Notice period
  noticeHours       Float    // Hours before appointment
  isLateCancel      Boolean  @default(false)

  // Fee
  lateCancelFee     Float?
  feeWaived         Boolean  @default(false)
  feeWaivedReason   String?

  // Recovery
  recoveryStatus    RecoveryStatus @default(PENDING)
  recoveryAttempts  RecoveryAttempt[]
  rescheduledAppointmentId String? @db.ObjectId

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([cancelledAt])
  @@index([reason])
  @@index([recoveryStatus])
}

enum CancellationType {
  CANCELLED      // Patient cancelled in advance
  LATE_CANCEL    // Cancelled within late cancel window
  NO_SHOW        // Patient didn't show up
  PRACTICE_CANCEL // Practice cancelled (provider sick, etc.)
}

enum CancelledByType {
  PATIENT
  STAFF
  SYSTEM
  PROVIDER
}

enum CancellationReason {
  SCHEDULE_CONFLICT
  ILLNESS
  TRANSPORTATION
  FORGOT
  FINANCIAL
  WEATHER
  FAMILY_EMERGENCY
  CHANGED_PROVIDERS
  PRACTICE_CLOSURE
  PROVIDER_UNAVAILABLE
  OTHER
}

enum RecoveryStatus {
  PENDING
  IN_PROGRESS
  RECOVERED
  LOST
  NOT_NEEDED
}

type RecoveryAttempt {
  attemptedAt   DateTime
  channel       NotificationChannel
  result        RecoveryAttemptResult
  notes         String?
}

enum RecoveryAttemptResult {
  RESCHEDULED
  NO_RESPONSE
  DECLINED
  PENDING
}

model PatientRiskScore {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Risk assessment
  riskScore     Float    // 0-100, higher = more at risk
  riskLevel     RiskLevel
  calculatedAt  DateTime @default(now())

  // Risk factors
  riskFactors   RiskFactor[]

  // Recommendations
  recommendedActions String[]

  // Status
  status        RiskStatus @default(ACTIVE)
  reviewedAt    DateTime?
  reviewedBy    String?  @db.ObjectId
  reviewNotes   String?

  // Intervention
  interventionStatus  InterventionStatus?
  interventionAt      DateTime?
  interventionBy      String?  @db.ObjectId

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([riskLevel])
  @@index([status])
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum RiskStatus {
  ACTIVE
  REVIEWED
  RESOLVED
  DROPPED_OUT
}

enum InterventionStatus {
  PENDING
  IN_PROGRESS
  SUCCESSFUL
  UNSUCCESSFUL
}

type RiskFactor {
  factor       String
  weight       Float
  description  String
  value        String?
}

model ReEngagementCampaign {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Campaign info
  name          String
  description   String?
  status        CampaignStatus @default(DRAFT)

  // Targeting criteria
  inactiveDays  Int      // Patients not seen in X days
  treatmentStages String[] // Filter by treatment stage
  includeNoShows Boolean @default(true)
  includeDropouts Boolean @default(true)

  // Messages
  channels      NotificationChannel[]
  messageTemplates CampaignMessage[]

  // Schedule
  startDate     DateTime?
  endDate       DateTime?
  sendTimes     String[] // Times of day to send

  // Incentive
  hasIncentive  Boolean  @default(false)
  incentiveDetails String?

  // Stats
  targetCount   Int      @default(0)
  sentCount     Int      @default(0)
  responseCount Int      @default(0)
  rebookedCount Int      @default(0)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  launchedAt DateTime?
  completedAt DateTime?

  // Audit
  createdBy String  @db.ObjectId

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  recipients   CampaignRecipient[]

  @@index([clinicId])
  @@index([status])
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

type CampaignMessage {
  channel      NotificationChannel
  subject      String?
  body         String
  sequence     Int      // Order in multi-touch campaign
  delayDays    Int      // Days after previous message
}

model CampaignRecipient {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  campaignId    String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Status
  status        RecipientStatus @default(PENDING)

  // Contact attempts
  lastContactedAt DateTime?
  contactAttempts Int      @default(0)

  // Response
  respondedAt   DateTime?
  response      RecipientResponse?
  rebookedAppointmentId String? @db.ObjectId

  // Relations
  campaign     ReEngagementCampaign @relation(fields: [campaignId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])

  @@index([campaignId])
  @@index([patientId])
  @@index([status])
}

enum RecipientStatus {
  PENDING
  CONTACTED
  RESPONDED
  REBOOKED
  UNSUBSCRIBED
  BOUNCED
}

enum RecipientResponse {
  INTERESTED
  NOT_INTERESTED
  REBOOKED
  NO_RESPONSE
}
```

---

## API Endpoints

### Waitlist

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/waitlist` | List waitlist entries | `booking:manage_waitlist` |
| GET | `/api/booking/waitlist/:id` | Get entry details | `booking:manage_waitlist` |
| POST | `/api/booking/waitlist` | Add to waitlist | `booking:manage_waitlist` |
| PUT | `/api/booking/waitlist/:id` | Update entry | `booking:manage_waitlist` |
| DELETE | `/api/booking/waitlist/:id` | Remove from waitlist | `booking:manage_waitlist` |
| POST | `/api/booking/waitlist/:id/notify` | Send notification | `booking:manage_waitlist` |
| GET | `/api/booking/waitlist/match/:slotId` | Find matching entries | `booking:manage_waitlist` |
| POST | `/api/booking/waitlist/:id/book` | Book from waitlist | `booking:manage_waitlist` |

### Cancellations

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/cancellations` | List cancellations | `booking:view_calendar` |
| GET | `/api/booking/cancellations/:id` | Get cancellation details | `booking:view_calendar` |
| PUT | `/api/booking/cancellations/:id/reason` | Update reason | `booking:modify_appointment` |
| POST | `/api/booking/cancellations/:id/waive-fee` | Waive late cancel fee | `booking:cancel_appointment` |
| GET | `/api/booking/cancellations/analytics` | Cancellation analytics | `booking:view_analytics` |

### Recovery

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/recovery/pending` | List pending recovery | `booking:manage_waitlist` |
| POST | `/api/booking/recovery/:id/attempt` | Log recovery attempt | `booking:manage_waitlist` |
| PUT | `/api/booking/recovery/:id/status` | Update recovery status | `booking:manage_waitlist` |

### At-Risk Patients

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/at-risk` | List at-risk patients | `booking:view_analytics` |
| GET | `/api/booking/at-risk/:patientId` | Get risk details | `booking:view_analytics` |
| POST | `/api/booking/at-risk/:patientId/review` | Mark as reviewed | `booking:view_analytics` |
| POST | `/api/booking/at-risk/:patientId/intervene` | Log intervention | `booking:view_analytics` |
| GET | `/api/booking/at-risk/calculate` | Trigger risk calculation | `booking:view_analytics` |

### Re-engagement Campaigns

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/campaigns` | List campaigns | `booking:view_analytics` |
| GET | `/api/booking/campaigns/:id` | Get campaign details | `booking:view_analytics` |
| POST | `/api/booking/campaigns` | Create campaign | `booking:manage_reminders` |
| PUT | `/api/booking/campaigns/:id` | Update campaign | `booking:manage_reminders` |
| POST | `/api/booking/campaigns/:id/launch` | Launch campaign | `booking:manage_reminders` |
| POST | `/api/booking/campaigns/:id/pause` | Pause campaign | `booking:manage_reminders` |
| GET | `/api/booking/campaigns/:id/stats` | Get campaign stats | `booking:view_analytics` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `WaitlistPanel` | Display and manage waitlist | `components/booking/` |
| `WaitlistEntryForm` | Add/edit waitlist entry | `components/booking/` |
| `WaitlistEntryCard` | Display waitlist entry | `components/booking/` |
| `OpeningNotifier` | Match and notify waitlist | `components/booking/` |
| `CancellationForm` | Capture cancellation details | `components/booking/` |
| `CancellationReasonSelect` | Reason selection dropdown | `components/booking/` |
| `RecoveryTaskList` | List patients needing follow-up | `components/booking/` |
| `RecoveryAttemptLog` | Log recovery attempts | `components/booking/` |
| `AtRiskDashboard` | Dashboard of at-risk patients | `components/booking/` |
| `RiskScoreCard` | Display patient risk details | `components/booking/` |
| `CampaignBuilder` | Create re-engagement campaigns | `components/booking/` |
| `CampaignStats` | Campaign performance metrics | `components/booking/` |
| `CancellationAnalytics` | Cancellation trends and patterns | `components/booking/` |

---

## Business Rules

1. **Waitlist Priority**: Urgent entries always offered openings first, then by add date
2. **Hold Period**: Waitlist patients have 2 hours (configurable) to respond before opening offered to next
3. **Notification Limits**: Maximum 3 notifications per waitlist entry before manual intervention
4. **Late Cancel Definition**: Cancellations within 24 hours (configurable) of appointment are late cancellations
5. **No-Show Grace Period**: Patient marked as no-show 15 minutes after appointment start (configurable)
6. **Recovery Timeout**: Recovery attempts stop after 30 days or 3 attempts (configurable)
7. **Risk Threshold**: Patients with 2+ no-shows in 90 days automatically flagged as at-risk
8. **Campaign Consent**: Re-engagement campaigns respect patient communication preferences
9. **Waitlist Expiration**: Entries expire after 90 days (configurable) if not resolved
10. **Fee Waiver Authority**: Only clinic_admin can waive late cancellation fees

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Appointment Management | Required | Appointment data and booking |
| Patient Communications | Required | SMS/email notifications |
| Billing & Insurance | Optional | Late cancellation fee tracking |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Twilio | Required | SMS notifications |
| SendGrid/SES | Required | Email notifications |

---

## Security Requirements

### Access Control
- **View waitlist**: front_desk, clinical_staff, clinic_admin
- **Manage waitlist**: front_desk, clinic_admin
- **View analytics**: clinic_admin, doctor
- **Manage campaigns**: clinic_admin

### Audit Requirements
- Log all waitlist additions and removals
- Track cancellation reason changes
- Record recovery attempts
- Log campaign launches and modifications

### Data Protection
- Patient contact information protected per HIPAA
- Communication records retained per policy
- Risk scores are internal data, not shared with patients

---

## Related Documentation

- [Parent: Booking & Scheduling](../../)
- [Appointment Management](../appointment-management/)
- [Emergency & Reminders](../emergency-reminders/)
- [Patient Communications](../../../patient-communications/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
