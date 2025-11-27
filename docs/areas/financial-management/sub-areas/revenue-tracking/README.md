# Revenue Tracking

> **Area**: [Financial Management](../../)
>
> **Sub-Area**: 10.1 Revenue Tracking
>
> **Purpose**: Track all revenue streams including daily deposits, production, collections, and deferred revenue with orthodontic-specific considerations

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Financial Management](../../) |
| **Dependencies** | Billing & Insurance, Treatment Management, Payment Processing |
| **Last Updated** | 2024-11-26 |

---

## Overview

Revenue Tracking is the foundation of financial management for orthodontic practices. This sub-area addresses the unique revenue characteristics of orthodontics, where treatment contracts span 18-24+ months, creating complex revenue recognition requirements and significant timing differences between services rendered and payments received.

### Orthodontic Revenue Challenges

| Challenge | Impact | Solution |
|-----------|--------|----------|
| Long treatment cycles | Revenue must be recognized over 18-24 months | Deferred revenue management with automated schedules |
| Payment plans | Collections lag production | Payment plan tracking with forecasting |
| Insurance delays | 30-90 day claim cycles | Separate insurance vs patient AR tracking |
| Seasonal variation | Back-to-school and summer peaks | Seasonal trend analysis and normalization |
| Multi-party payments | Insurance + patient + guarantor | Detailed payment source tracking |

### Key Goals

- **Accurate recognition**: Match revenue to treatment delivery periods
- **Real-time visibility**: Same-day production and collection tracking
- **Reconciliation**: Daily deposit matching with payment gateway
- **Analysis**: Production vs collection gap identification
- **Forecasting**: Predict future collections based on outstanding contracts

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 10.1.1 | [Day Sheet & Reconciliation](./functions/day-sheet-reconciliation.md) | End-of-day summary and deposit reconciliation | 📋 Planned | Critical |
| 10.1.2 | [Production Tracking](./functions/production-tracking.md) | Track production by provider, procedure, location | 📋 Planned | Critical |
| 10.1.3 | [Collections Tracking](./functions/collections-tracking.md) | Monitor collections with detailed breakdowns | 📋 Planned | Critical |
| 10.1.4 | [Deferred Revenue Management](./functions/deferred-revenue-management.md) | Revenue recognition for long-term treatments | 📋 Planned | High |
| 10.1.5 | [Production vs Collection Analysis](./functions/production-vs-collection-analysis.md) | Gap analysis and collection effectiveness | 📋 Planned | High |
| 10.1.6 | [Revenue Recognition Scheduling](./functions/revenue-recognition-scheduling.md) | Automated revenue schedules for contracts | 📋 Planned | High |

---

## Function Details

### 10.1.1 Day Sheet & Daily Reconciliation

**Purpose**: Provide end-of-day financial summary and reconcile deposits with payment gateway transactions.

**Key Capabilities**:
- End-of-day financial summary dashboard
- Payment gateway deposit reconciliation (Stripe/Square)
- Cash drawer management and balancing
- Credit card batch reconciliation
- Discrepancy detection and alerts
- Multiple deposit account support
- Daily summary email to administrators

**User Stories**:
- As a **front desk**, I want to balance my cash drawer at end of day so I can close out accurately
- As a **billing staff**, I want to reconcile today's deposits with the payment gateway so I can catch discrepancies
- As a **clinic admin**, I want a daily email summary of financials so I stay informed

**Orthodontic Considerations**:
- High volume of small recurring payments (payment plans)
- Same-day payments vs. insurance payments arriving later
- Multiple payment methods per patient visit

---

### 10.1.2 Production Tracking

**Purpose**: Track production in real-time by provider, procedure type, and location.

**Key Capabilities**:
- Real-time production dashboards
- Production by provider with goals
- Production by procedure type (consults, starts, adjustments, debonds)
- Production by location for multi-site practices
- Gross vs net production (after adjustments)
- Chair time utilization analysis
- Production per new patient start

**User Stories**:
- As a **provider**, I want to see my daily production so I can track my performance against goals
- As a **clinic admin**, I want to compare production across providers so I can identify coaching opportunities
- As an **owner**, I want to see production by procedure type so I can understand my revenue mix

**Orthodontic Considerations**:
- High initial production at case start (bonding)
- Steady lower production during treatment (adjustments)
- Final production at case completion (debond)
- Treatment phase impacts production value

---

### 10.1.3 Collections Tracking

**Purpose**: Monitor all payments received with detailed breakdowns by source, method, and timing.

**Key Capabilities**:
- Daily, weekly, monthly collection reports
- Insurance vs patient collection split
- Payment plan collection tracking
- Collections by payment method (card, cash, check, ACH)
- Collection rate calculations
- Outstanding collections forecasting
- Same-day vs delayed payment analysis

**User Stories**:
- As a **billing staff**, I want to see today's collections by payment method so I can verify deposits
- As a **clinic admin**, I want to see my collection rate trend so I can identify issues early
- As an **owner**, I want to compare insurance vs patient collections so I understand my revenue mix

**Orthodontic Considerations**:
- Payment plan payments dominate collections
- Insurance payments arrive in bulk with delays
- High patient responsibility in orthodontics
- Courtesy discounts and adjustments impact collection rates

---

### 10.1.4 Deferred Revenue Management

**Purpose**: Track unearned revenue from treatment contracts and manage recognition schedules.

**Key Capabilities**:
- Deferred revenue balance tracking
- Revenue recognition schedules per treatment
- Monthly deferred revenue reporting
- Contract value vs recognized revenue
- Deferred revenue aging
- Early termination handling
- GAAP/IFRS compliant recognition

**User Stories**:
- As a **billing manager**, I want to see my deferred revenue balance so I can report accurately
- As an **accountant**, I want GAAP-compliant revenue recognition so I can prepare financial statements
- As a **clinic admin**, I want to see how much revenue is still unearned so I understand my obligations

**Orthodontic Revenue Recognition Example**:
```
Treatment Contract: $6,000
Treatment Duration: 24 months

Month 1:
  - Collected: $1,500 down payment
  - Recognized: $250 (1/24 of treatment)
  - Deferred: $1,250

Month 2:
  - Collected: $195 (payment plan)
  - Recognized: $250
  - Deferred: $1,195 (decreasing as treatment progresses)
```

---

### 10.1.5 Production vs Collection Analysis

**Purpose**: Analyze the gap between services rendered (production) and payments received (collections).

**Key Capabilities**:
- Production to collection ratio dashboard
- Lag time analysis (days between production and collection)
- Comparison by payer type (insurance, patient, guarantor)
- Adjustment tracking and categorization
- Write-off analysis
- Collection effectiveness metrics
- Historical trend analysis

**User Stories**:
- As a **billing manager**, I want to see my production vs collection gap so I can identify collection issues
- As a **clinic admin**, I want to understand adjustment patterns so I can manage discounting
- As an **owner**, I want collection effectiveness metrics so I can benchmark against industry

**Key Metrics**:
| Metric | Calculation | Benchmark |
|--------|-------------|-----------|
| Collection Rate | Collections ÷ Net Production | 98%+ |
| Adjustment Rate | Adjustments ÷ Gross Production | <5% |
| Days to Collect | Avg days from service to payment | <45 |
| Insurance Lag | Avg days for insurance payment | <30 |

---

### 10.1.6 Revenue Recognition Scheduling

**Purpose**: Create and manage automated revenue recognition schedules for treatment contracts.

**Key Capabilities**:
- Automatic schedule generation from treatment plans
- Multiple recognition methods (straight-line, milestone-based)
- Schedule modification handling
- Early termination and transfer processing
- Batch recognition processing
- Schedule audit trail
- Integration with financial reporting

**User Stories**:
- As a **billing staff**, I want automatic revenue schedules so I don't have to track manually
- As an **accountant**, I want to run monthly recognition so books reflect earned revenue
- As a **clinic admin**, I want to handle treatment transfers correctly so revenue is accurate

---

## Data Model

```prisma
model DaySheet {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  sheetDate     DateTime
  status        DaySheetStatus @default(OPEN)

  // Production summary
  grossProduction     Decimal  @default(0)
  adjustments         Decimal  @default(0)
  netProduction       Decimal  @default(0)

  // Collection summary
  totalCollections    Decimal  @default(0)
  cashCollections     Decimal  @default(0)
  cardCollections     Decimal  @default(0)
  checkCollections    Decimal  @default(0)
  achCollections      Decimal  @default(0)
  insuranceCollections Decimal @default(0)

  // Reconciliation
  expectedDeposit     Decimal  @default(0)
  actualDeposit       Decimal?
  discrepancy         Decimal  @default(0)
  reconciled          Boolean  @default(false)
  reconciledAt        DateTime?
  reconciledBy        String?  @db.ObjectId

  // Cash drawer
  cashDrawerStart     Decimal  @default(0)
  cashDrawerEnd       Decimal?
  cashVariance        Decimal  @default(0)

  // Timestamps
  closedAt      DateTime?
  closedBy      String?  @db.ObjectId
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  deposits      DailyDeposit[]
  productionEntries ProductionEntry[]

  @@unique([clinicId, sheetDate])
  @@index([clinicId])
  @@index([sheetDate])
  @@index([status])
}

enum DaySheetStatus {
  OPEN
  PENDING_RECONCILIATION
  RECONCILED
  CLOSED
  ADJUSTED
}

model DailyDeposit {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  daySheetId    String   @db.ObjectId

  // Deposit details
  depositDate   DateTime
  depositType   DepositType
  bankAccountId String?  @db.ObjectId

  // Amounts
  expectedAmount  Decimal
  actualAmount    Decimal?
  variance        Decimal  @default(0)

  // Reference
  referenceNumber String?
  gatewayBatchId  String?

  // Status
  status        DepositStatus @default(PENDING)
  matchedAt     DateTime?

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  daySheet      DaySheet  @relation(fields: [daySheetId], references: [id])
  items         DepositItem[]

  @@index([clinicId])
  @@index([daySheetId])
  @@index([depositDate])
  @@index([status])
}

enum DepositType {
  CARD_BATCH
  CASH
  CHECK
  ACH_BATCH
  INSURANCE_CHECK
  WIRE
}

enum DepositStatus {
  PENDING
  MATCHED
  VARIANCE
  RECONCILED
}

model DepositItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  depositId     String   @db.ObjectId
  paymentId     String   @db.ObjectId

  amount        Decimal
  matched       Boolean  @default(false)

  // Relations
  deposit       DailyDeposit @relation(fields: [depositId], references: [id])

  @@index([depositId])
  @@index([paymentId])
}

model ProductionEntry {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  daySheetId    String?  @db.ObjectId

  // Source
  patientId     String   @db.ObjectId
  providerId    String   @db.ObjectId
  appointmentId String?  @db.ObjectId
  procedureId   String?  @db.ObjectId
  treatmentPlanId String? @db.ObjectId

  // Production details
  productionDate DateTime
  procedureCode  String
  description    String

  // Amounts
  grossAmount   Decimal
  adjustments   Decimal  @default(0)
  netAmount     Decimal

  // Allocation
  insuranceAmount Decimal @default(0)
  patientAmount   Decimal @default(0)

  // Status
  status        ProductionStatus @default(PENDING)

  // Collection tracking
  collectedAmount Decimal @default(0)
  remainingBalance Decimal

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  daySheet      DaySheet? @relation(fields: [daySheetId], references: [id])

  @@index([clinicId])
  @@index([daySheetId])
  @@index([patientId])
  @@index([providerId])
  @@index([productionDate])
  @@index([status])
}

enum ProductionStatus {
  PENDING
  BILLED
  PARTIALLY_COLLECTED
  COLLECTED
  WRITTEN_OFF
}

model DeferredRevenue {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  treatmentPlanId String @db.ObjectId

  // Contract details
  contractValue     Decimal
  contractStartDate DateTime
  contractEndDate   DateTime

  // Recognition
  recognitionMethod RevenueRecognitionMethod @default(STRAIGHT_LINE)
  monthlyAmount     Decimal

  // Balances
  totalRecognized   Decimal @default(0)
  deferredBalance   Decimal

  // Collection tracking
  totalCollected    Decimal @default(0)
  collectedBalance  Decimal

  // Status
  status            DeferredRevenueStatus @default(ACTIVE)
  terminatedAt      DateTime?
  terminationReason String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  schedule      RevenueSchedule[]

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
  @@index([status])
}

enum RevenueRecognitionMethod {
  STRAIGHT_LINE      // Equal monthly recognition
  MILESTONE_BASED    // Recognition at treatment milestones
  PERCENT_COMPLETE   // Based on treatment progress
  CASH_BASIS         // Recognize when collected
}

enum DeferredRevenueStatus {
  ACTIVE
  COMPLETED
  TERMINATED
  TRANSFERRED
}

model RevenueSchedule {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  deferredRevenueId String   @db.ObjectId

  // Schedule details
  periodDate        DateTime
  periodNumber      Int

  // Amounts
  scheduledAmount   Decimal
  recognizedAmount  Decimal  @default(0)

  // Status
  status            ScheduleStatus @default(PENDING)
  recognizedAt      DateTime?

  // Relations
  deferredRevenue   DeferredRevenue @relation(fields: [deferredRevenueId], references: [id])

  @@index([deferredRevenueId])
  @@index([periodDate])
  @@index([status])
}

enum ScheduleStatus {
  PENDING
  RECOGNIZED
  ADJUSTED
  SKIPPED
}

model ProductionSummary {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime

  // Provider (null for clinic-wide)
  providerId    String?  @db.ObjectId

  // Production
  grossProduction    Decimal
  adjustments        Decimal
  netProduction      Decimal

  // Procedure breakdown
  consultProduction    Decimal @default(0)
  startProduction      Decimal @default(0)
  adjustmentProduction Decimal @default(0)
  debondProduction     Decimal @default(0)
  otherProduction      Decimal @default(0)

  // Collections
  totalCollections      Decimal
  insuranceCollections  Decimal
  patientCollections    Decimal

  // Rates
  collectionRate        Decimal
  adjustmentRate        Decimal

  // Timestamps
  generatedAt  DateTime @default(now())

  // Relations
  clinic       Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodType, periodStart, providerId])
  @@index([clinicId])
  @@index([periodStart])
  @@index([providerId])
}

enum PeriodType {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}
```

---

## API Endpoints

### Day Sheet

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/day-sheet` | Get day sheet for date | `finance:view_revenue` |
| GET | `/api/finance/day-sheet/:date` | Get specific day sheet | `finance:view_revenue` |
| POST | `/api/finance/day-sheet/:date/close` | Close day sheet | `finance:close_period` |
| POST | `/api/finance/day-sheet/:date/reconcile` | Reconcile deposits | `finance:close_period` |

### Production

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/production` | Get production summary | `finance:view_revenue` |
| GET | `/api/finance/production/by-provider` | Production by provider | `finance:view_revenue` |
| GET | `/api/finance/production/by-procedure` | Production by procedure | `finance:view_revenue` |
| GET | `/api/finance/production/details` | Detailed production entries | `finance:view_revenue` |

### Collections

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/collections` | Get collections summary | `finance:view_revenue` |
| GET | `/api/finance/collections/by-source` | Collections by source | `finance:view_revenue` |
| GET | `/api/finance/collections/by-method` | Collections by payment method | `finance:view_revenue` |
| GET | `/api/finance/collections/forecast` | Collections forecast | `finance:view_revenue` |

### Deferred Revenue

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/deferred-revenue` | Get deferred revenue | `finance:view_revenue` |
| GET | `/api/finance/deferred-revenue/:id` | Get specific contract | `finance:view_revenue` |
| POST | `/api/finance/deferred-revenue/recognize` | Run recognition | `finance:close_period` |
| POST | `/api/finance/deferred-revenue/:id/terminate` | Terminate contract | `finance:adjust` |

### Analysis

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/analysis/production-vs-collection` | Production vs collection | `finance:view_revenue` |
| GET | `/api/finance/analysis/collection-rate` | Collection rate trend | `finance:view_revenue` |
| GET | `/api/finance/analysis/adjustment-rate` | Adjustment rate analysis | `finance:view_revenue` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `DaySheetDashboard` | End-of-day summary | `components/finance/` |
| `DepositReconciliation` | Reconcile deposits | `components/finance/` |
| `CashDrawerBalance` | Balance cash drawer | `components/finance/` |
| `ProductionDashboard` | Production overview | `components/finance/` |
| `ProviderProductionCard` | Individual provider stats | `components/finance/` |
| `CollectionsSummary` | Collections overview | `components/finance/` |
| `CollectionsBySource` | Source breakdown chart | `components/finance/` |
| `DeferredRevenueReport` | Deferred revenue view | `components/finance/` |
| `RevenueScheduleViewer` | View recognition schedule | `components/finance/` |
| `ProductionVsCollectionChart` | Gap analysis visualization | `components/finance/` |

---

## Business Rules

1. **Day Sheet Lifecycle**: Day sheets are created automatically at midnight, can be closed only after reconciliation
2. **Deposit Matching**: Payment gateway batches must match within $0.01 tolerance
3. **Production Recording**: Production entries created automatically from completed procedures
4. **Revenue Recognition**: Run monthly on last day of month for all active treatment contracts
5. **Deferred Revenue**: Cannot recognize more than contracted amount
6. **Early Termination**: Remaining deferred revenue recognized at termination
7. **Adjustments**: All adjustments require reason code and are audit logged
8. **Period Lock**: Closed periods cannot be modified without supervisor override

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Billing & Insurance | Required | Payment and billing source data |
| Treatment Management | Required | Treatment plans for deferred revenue |
| Payment Processing | Required | Payment gateway transactions |
| Practice Orchestration | Required | Appointment and procedure completion |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Stripe/Square | Required | Payment gateway batch data |
| Bank Feeds | Optional | Deposit verification |

---

## Related Documentation

- [Parent: Financial Management](../../)
- [Expense Management](../expense-management/)
- [Financial Reports](../financial-reports/)
- [Analytics Dashboard](../analytics-dashboard/)
- [Billing & Insurance](../../../billing-insurance/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
