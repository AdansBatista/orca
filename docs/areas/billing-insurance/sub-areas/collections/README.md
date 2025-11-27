# Collections Management

> **Area**: [Billing & Insurance](../../)
>
> **Sub-Area**: 11.4 Collections Management
>
> **Purpose**: Manage accounts receivable, aging, and collection workflows

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Billing & Insurance](../../) |
| **Dependencies** | Auth, Patient Billing, Payment Processing, Patient Communications |
| **Last Updated** | 2024-11-26 |

---

## Overview

Collections Management handles all aspects of accounts receivable and the collection of overdue balances. This includes generating aging reports, managing collection workflows, sending payment reminders, tracking late payments, integrating with collection agencies for severely delinquent accounts, and managing bad debt write-offs.

Effective collections directly impact practice cash flow. This sub-area uses automation and AI to prioritize collection efforts on accounts most likely to pay while maintaining positive patient relationships.

### Key Goals

- **Reduce AR days**: Decrease time to collect payments
- **Improve collection rates**: Maximize recovery of overdue balances
- **Maintain relationships**: Balance collection efforts with patient experience
- **Automate workflows**: Reduce manual collection effort
- **Predict outcomes**: Focus effort on accounts likely to pay

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 11.4.1 | [Aging Reports](./functions/aging-reports.md) | Generate AR aging reports | 📋 Planned | Critical |
| 11.4.2 | [Collection Workflows](./functions/collection-workflows.md) | Automated collection sequences | 📋 Planned | High |
| 11.4.3 | [Payment Reminders](./functions/payment-reminders.md) | Send payment reminder notices | 📋 Planned | High |
| 11.4.4 | [Late Payment Tracking](./functions/late-payment-tracking.md) | Track and manage late payments | 📋 Planned | High |
| 11.4.5 | [Collection Agency Integration](./functions/collection-agency-integration.md) | Send accounts to collections | 📋 Planned | Medium |
| 11.4.6 | [Bad Debt Management](./functions/bad-debt-management.md) | Write-off uncollectible accounts | 📋 Planned | Medium |
| 11.4.7 | [Collection Analytics](./functions/collection-analytics.md) | AR analytics and reporting | 📋 Planned | Medium |

---

## Function Details

### 11.4.1 Aging Reports

**Purpose**: Generate and analyze accounts receivable aging reports.

**Key Capabilities**:
- Standard aging buckets (Current, 30, 60, 90, 120+ days)
- Aging by patient, guarantor, or insurance
- Filter by account status, amount, payer type
- Export to Excel/PDF
- Schedule automated reports
- Trend analysis over time

**User Stories**:
- As a **billing staff**, I want to see all accounts over 90 days so I can focus collection efforts
- As a **clinic admin**, I want weekly AR aging reports emailed to me
- As a **billing staff**, I want to see insurance AR separate from patient AR

---

### 11.4.2 Collection Workflows

**Purpose**: Automate collection sequences based on account status.

**Key Capabilities**:
- Define collection workflow stages
- Automatic progression based on days overdue
- Action triggers (email, SMS, call task, letter)
- Manual override and escalation
- Pause workflows (payment plan, dispute, hardship)
- Track workflow effectiveness

**User Stories**:
- As a **billing staff**, I want overdue accounts to automatically receive reminders
- As a **billing staff**, I want to pause collections when a patient sets up a payment plan
- As a **clinic admin**, I want to customize the collection workflow for our practice

---

### 11.4.3 Payment Reminders

**Purpose**: Send payment reminder communications to patients.

**Key Capabilities**:
- Multi-channel delivery (email, SMS, letter, phone)
- Reminder templates by aging stage
- Include payment links in reminders
- Track reminder delivery and response
- Respect communication preferences
- Compliance with debt collection regulations

**User Stories**:
- As a **billing staff**, I want to send a friendly reminder to patients approaching 30 days overdue
- As a **patient**, I want to receive a payment link in my reminder so I can pay immediately
- As a **clinic admin**, I want to customize reminder messages for our practice tone

---

### 11.4.4 Late Payment Tracking

**Purpose**: Track and manage late payments on invoices and payment plans.

**Key Capabilities**:
- Identify missed payment plan payments
- Track consecutive missed payments
- Calculate late fees (if applicable)
- Flag accounts at risk of default
- Record payment promises
- Track promise-to-pay follow-ups

**User Stories**:
- As a **billing staff**, I want to see all payment plans with missed payments
- As a **billing staff**, I want to record when a patient promises to pay by a certain date
- As a **billing staff**, I want to follow up on unfulfilled payment promises

---

### 11.4.5 Collection Agency Integration

**Purpose**: Transfer severely delinquent accounts to collection agencies.

**Key Capabilities**:
- Configure collection agency partners
- Define criteria for agency referral (days, amount)
- Export accounts in required format
- Track accounts sent to collections
- Record agency payments
- Recall accounts from collections

**User Stories**:
- As a **billing staff**, I want to send accounts over 180 days to our collection agency
- As a **billing staff**, I want to track which accounts are with the collection agency
- As a **billing staff**, I want to recall an account from collections if the patient pays directly

---

### 11.4.6 Bad Debt Management

**Purpose**: Write off uncollectible accounts appropriately.

**Key Capabilities**:
- Write-off request and approval workflow
- Write-off reason tracking
- Partial vs. full write-offs
- Write-off recovery (if paid later)
- Write-off reporting
- Tax documentation support

**User Stories**:
- As a **billing staff**, I want to request a write-off for an uncollectible account
- As a **clinic admin**, I want to approve/deny write-off requests
- As a **billing staff**, I want to record a payment on a previously written-off account

---

### 11.4.7 Collection Analytics

**Purpose**: Analyze collection performance and identify trends.

**Key Capabilities**:
- Collection rate metrics
- AR days calculation
- Aging trend analysis
- Collection effort ROI
- Staff performance metrics
- Payer analysis (which payers pay slowest)

**User Stories**:
- As a **clinic admin**, I want to see our collection rate trend over the past 12 months
- As a **clinic admin**, I want to know which staff member is most effective at collections
- As a **billing staff**, I want to identify which insurance companies take longest to pay

---

## Data Model

```prisma
model CollectionWorkflow {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Workflow definition
  name          String
  description   String?
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // Trigger criteria
  triggerDays   Int      // Days overdue to trigger
  minBalance    Decimal  @default(0)
  patienceType  PatientType? // Patient, Insurance, or Both

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  stages    CollectionStage[]
  accounts  AccountCollection[]

  @@index([clinicId])
  @@index([isActive])
}

enum PatientType {
  PATIENT
  INSURANCE
  BOTH
}

model CollectionStage {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  workflowId    String   @db.ObjectId

  // Stage definition
  stageNumber   Int
  name          String
  description   String?

  // Timing
  daysFromPrevious Int   // Days after previous stage
  daysOverdue   Int      // Days overdue when this stage triggers

  // Actions
  actions       CollectionAction[]

  // Escalation
  escalateAfterDays Int?  // Days before auto-escalate to next stage

  // Relations
  workflow    CollectionWorkflow @relation(fields: [workflowId], references: [id])

  @@index([workflowId])
  @@index([stageNumber])
}

type CollectionAction {
  type          CollectionActionType
  templateId    String?   // Email/SMS/Letter template
  assignTo      String?   // Role or user for tasks
  notes         String?
}

enum CollectionActionType {
  EMAIL
  SMS
  LETTER
  PHONE_CALL
  CREATE_TASK
  FLAG_ACCOUNT
  APPLY_LATE_FEE
  SEND_TO_AGENCY
  SUSPEND_TREATMENT
}

model AccountCollection {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId
  workflowId    String   @db.ObjectId

  // Status
  status        CollectionStatus @default(ACTIVE)
  currentStage  Int      @default(1)
  enteredStageAt DateTime @default(now())

  // Balance tracking
  startingBalance Decimal
  currentBalance  Decimal
  paidAmount      Decimal  @default(0)

  // Dates
  startedAt     DateTime @default(now())
  lastActionAt  DateTime?
  pausedAt      DateTime?
  pauseReason   String?
  completedAt   DateTime?
  completionReason String?

  // Agency referral
  sentToAgencyAt DateTime?
  agencyId      String?
  agencyAccountNumber String?

  // Write-off
  writtenOffAt  DateTime?
  writeOffAmount Decimal?
  writeOffReason WriteOffReason?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic             @relation(fields: [clinicId], references: [id])
  account   PatientAccount     @relation(fields: [accountId], references: [id])
  workflow  CollectionWorkflow @relation(fields: [workflowId], references: [id])
  activities CollectionActivity[]
  promises  PaymentPromise[]

  @@index([clinicId])
  @@index([accountId])
  @@index([workflowId])
  @@index([status])
  @@index([currentStage])
}

enum CollectionStatus {
  ACTIVE
  PAUSED
  PAYMENT_PLAN
  SETTLED
  WRITTEN_OFF
  AGENCY
  COMPLETED
}

enum WriteOffReason {
  BANKRUPTCY
  DECEASED
  UNCOLLECTIBLE
  STATUTE_OF_LIMITATIONS
  SMALL_BALANCE
  HARDSHIP
  OTHER
}

model CollectionActivity {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  accountCollectionId String @db.ObjectId

  // Activity details
  activityType  CollectionActivityType
  stageNumber   Int?
  description   String

  // Communication details
  channel       CommunicationChannel?
  templateUsed  String?
  sentTo        String?  // Email or phone

  // Results
  result        String?
  responseReceived Boolean?
  paymentReceived Decimal?

  // Timestamps
  occurredAt    DateTime @default(now())
  performedBy   String?  @db.ObjectId

  // Relations
  accountCollection AccountCollection @relation(fields: [accountCollectionId], references: [id])

  @@index([accountCollectionId])
  @@index([activityType])
  @@index([occurredAt])
}

enum CollectionActivityType {
  WORKFLOW_STARTED
  STAGE_ADVANCED
  EMAIL_SENT
  SMS_SENT
  LETTER_SENT
  PHONE_CALL
  TASK_CREATED
  PAYMENT_RECEIVED
  PROMISE_MADE
  PROMISE_BROKEN
  PAUSED
  RESUMED
  SENT_TO_AGENCY
  RECALLED_FROM_AGENCY
  WRITTEN_OFF
  COMPLETED
  MANUAL_NOTE
}

enum CommunicationChannel {
  EMAIL
  SMS
  LETTER
  PHONE
  PORTAL
}

model PaymentPromise {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  accountCollectionId String @db.ObjectId
  accountId         String   @db.ObjectId

  // Promise details
  promisedAmount    Decimal
  promisedDate      DateTime
  notes             String?

  // Status
  status            PromiseStatus @default(PENDING)

  // Outcome
  paidAmount        Decimal?
  paidDate          DateTime?
  brokenAt          DateTime?
  brokenReason      String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  recordedBy String?  @db.ObjectId

  // Relations
  accountCollection AccountCollection @relation(fields: [accountCollectionId], references: [id])

  @@index([accountCollectionId])
  @@index([accountId])
  @@index([promisedDate])
  @@index([status])
}

enum PromiseStatus {
  PENDING
  FULFILLED
  PARTIAL
  BROKEN
  CANCELLED
}

model CollectionAgency {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Agency info
  name          String
  contactName   String?
  phone         String?
  email         String?
  address       Address?

  // Integration
  exportFormat  String   // CSV, XML, etc.
  feePercentage Decimal? // Agency fee percentage

  // Settings
  minBalance    Decimal  @default(0)  // Minimum balance to send
  minDays       Int      @default(120) // Minimum days overdue
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  referrals AgencyReferral[]

  @@index([clinicId])
  @@index([isActive])
}

model AgencyReferral {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  agencyId      String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Referral details
  referralDate  DateTime @default(now())
  referredBalance Decimal
  agencyAccountNumber String?

  // Status
  status        AgencyReferralStatus @default(ACTIVE)

  // Collections
  collectedAmount Decimal @default(0)
  agencyFees    Decimal  @default(0)
  netRecovered  Decimal  @default(0)

  // Recall
  recalledAt    DateTime?
  recallReason  String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic           @relation(fields: [clinicId], references: [id])
  agency    CollectionAgency @relation(fields: [agencyId], references: [id])

  @@index([clinicId])
  @@index([agencyId])
  @@index([accountId])
  @@index([status])
}

enum AgencyReferralStatus {
  ACTIVE
  COLLECTED
  PARTIAL
  RETURNED
  RECALLED
}

model WriteOff {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId
  invoiceId     String?  @db.ObjectId

  // Write-off details
  writeOffNumber String  @unique
  amount         Decimal
  reason         WriteOffReason
  reasonDetails  String?

  // Approval
  status         WriteOffStatus @default(PENDING)
  requestedBy    String   @db.ObjectId
  requestedAt    DateTime @default(now())
  approvedBy     String?  @db.ObjectId
  approvedAt     DateTime?
  rejectedBy     String?  @db.ObjectId
  rejectedAt     DateTime?
  rejectionReason String?

  // Recovery (if paid later)
  recoveredAmount Decimal @default(0)
  recoveredAt    DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([accountId])
  @@index([writeOffNumber])
  @@index([status])
}

enum WriteOffStatus {
  PENDING
  APPROVED
  REJECTED
  PARTIALLY_RECOVERED
  FULLY_RECOVERED
}

model PaymentReminder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Reminder details
  reminderType  ReminderType
  templateId    String?
  daysOverdue   Int

  // Delivery
  channel       CommunicationChannel
  sentTo        String  // Email, phone, or address
  sentAt        DateTime

  // Content
  subject       String?
  body          String?
  paymentLinkId String? @db.ObjectId

  // Response tracking
  deliveredAt   DateTime?
  openedAt      DateTime?
  clickedAt     DateTime?
  paymentReceived Boolean @default(false)
  paymentDate   DateTime?
  paymentAmount Decimal?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([accountId])
  @@index([sentAt])
  @@index([reminderType])
}

enum ReminderType {
  UPCOMING_DUE     // Before due date
  PAST_DUE_GENTLE  // 1-30 days
  PAST_DUE_FIRM    // 31-60 days
  PAST_DUE_URGENT  // 61-90 days
  FINAL_NOTICE     // 90+ days
  PAYMENT_PLAN_DUE // Upcoming payment plan
  PAYMENT_PLAN_LATE // Missed payment plan
}
```

---

## API Endpoints

### Aging Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/collections/aging` | Get aging report | `collections:read` |
| GET | `/api/collections/aging/summary` | Get aging summary | `collections:read` |
| GET | `/api/collections/aging/export` | Export aging report | `collections:export` |

### Collection Workflows

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/collections/workflows` | List workflows | `collections:read` |
| POST | `/api/collections/workflows` | Create workflow | `collections:manage` |
| PUT | `/api/collections/workflows/:id` | Update workflow | `collections:manage` |
| DELETE | `/api/collections/workflows/:id` | Delete workflow | `collections:manage` |

### Account Collections

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/collections/accounts` | List accounts in collection | `collections:read` |
| GET | `/api/collections/accounts/:id` | Get collection details | `collections:read` |
| POST | `/api/collections/accounts/:id/pause` | Pause collection | `collections:manage` |
| POST | `/api/collections/accounts/:id/resume` | Resume collection | `collections:manage` |
| POST | `/api/collections/accounts/:id/advance` | Advance to next stage | `collections:manage` |
| POST | `/api/collections/accounts/:id/activity` | Add activity note | `collections:manage` |

### Payment Promises

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/collections/promises` | List payment promises | `collections:read` |
| POST | `/api/collections/accounts/:id/promise` | Record promise | `collections:manage` |
| PUT | `/api/collections/promises/:id` | Update promise | `collections:manage` |
| POST | `/api/collections/promises/:id/fulfill` | Mark fulfilled | `collections:manage` |
| POST | `/api/collections/promises/:id/broken` | Mark broken | `collections:manage` |

### Collection Agencies

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/collections/agencies` | List agencies | `collections:read` |
| POST | `/api/collections/agencies` | Add agency | `collections:manage` |
| PUT | `/api/collections/agencies/:id` | Update agency | `collections:manage` |
| POST | `/api/collections/accounts/:id/send-to-agency` | Send to agency | `collections:send_to_agency` |
| POST | `/api/collections/accounts/:id/recall` | Recall from agency | `collections:send_to_agency` |
| GET | `/api/collections/agencies/:id/export` | Export accounts | `collections:export` |

### Write-Offs

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/collections/write-offs` | List write-offs | `collections:read` |
| POST | `/api/collections/write-offs` | Request write-off | `collections:write_off` |
| POST | `/api/collections/write-offs/:id/approve` | Approve write-off | `collections:approve_write_off` |
| POST | `/api/collections/write-offs/:id/reject` | Reject write-off | `collections:approve_write_off` |
| POST | `/api/collections/write-offs/:id/recover` | Record recovery | `collections:write_off` |

### Reminders

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/collections/reminders` | List reminders sent | `collections:read` |
| POST | `/api/collections/reminders/send` | Send reminder | `collections:manage` |
| POST | `/api/collections/reminders/batch` | Batch send reminders | `collections:manage` |

### Analytics

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/collections/analytics/summary` | Collection summary | `collections:read` |
| GET | `/api/collections/analytics/trends` | AR trend analysis | `collections:read` |
| GET | `/api/collections/analytics/effectiveness` | Workflow effectiveness | `collections:read` |

---

## AI Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| Payment Prediction | Predict likelihood of payment | ML model on payment history |
| Priority Scoring | Prioritize collection efforts | Score based on multiple factors |
| Optimal Contact Time | Predict best time to contact | Pattern analysis |
| Risk Assessment | Identify accounts at risk of default | Early warning indicators |
| Collection Optimization | Recommend workflow adjustments | A/B test analysis |

### AI-Powered Prioritization Factors

- Account balance amount
- Days overdue
- Payment history pattern
- Previous promise fulfillment rate
- Communication response rate
- Treatment value/status
- Insurance vs. patient balance
- Demographic factors (optional)

---

## Compliance Considerations

### Fair Debt Collection Practices

| Regulation | Requirement |
|------------|-------------|
| FDCPA (US) | No harassment, time restrictions, required disclosures |
| TCPA (US) | Consent required for automated calls/texts |
| PIPEDA (Canada) | Privacy protection, consent requirements |
| Provincial laws | Varies by Canadian province |

### Best Practices

- Document all collection attempts
- Respect do-not-call preferences
- Provide clear payment options
- Offer hardship accommodations
- Train staff on compliance

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `AgingReport` | Display aging report | `components/collections/` |
| `AgingSummaryCard` | Aging dashboard widget | `components/collections/` |
| `CollectionWorkqueue` | List accounts to work | `components/collections/` |
| `AccountCollectionDetail` | Collection account view | `components/collections/` |
| `CollectionTimeline` | Activity timeline | `components/collections/` |
| `WorkflowEditor` | Configure workflows | `components/collections/` |
| `PaymentPromiseForm` | Record promise | `components/collections/` |
| `ReminderComposer` | Send reminder | `components/collections/` |
| `WriteOffRequestForm` | Request write-off | `components/collections/` |
| `WriteOffApproval` | Approve write-offs | `components/collections/` |
| `AgencyExporter` | Export for agency | `components/collections/` |
| `CollectionDashboard` | Analytics dashboard | `components/collections/` |

---

## Business Rules

1. **Workflow Triggers**: Accounts enter collection workflow based on days overdue and minimum balance
2. **Stage Progression**: Auto-advance stages unless paused or paid
3. **Pause Conditions**: Payment plan setup, dispute, hardship review, or manual hold
4. **Agency Referral**: Only after exhausting internal workflow stages
5. **Write-Off Approval**: All write-offs require manager approval over threshold
6. **Reminder Limits**: Maximum reminders per day/week to avoid harassment
7. **Communication Hours**: Reminders only sent during acceptable hours

---

## Related Documentation

- [Parent: Billing & Insurance](../../)
- [Patient Billing](../patient-billing/)
- [Payment Processing](../payment-processing/)
- [Insurance Claims](../insurance-claims/)
- [Patient Communications](../../patient-communications/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
