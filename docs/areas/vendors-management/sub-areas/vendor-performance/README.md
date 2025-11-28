# Vendor Performance

> **Area**: [Vendors Management](../../)
>
> **Sub-Area**: 4. Vendor Performance
>
> **Purpose**: Track performance metrics, quality, delivery, vendor ratings, and issue management

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Medium |
| **Complexity** | Medium |
| **Parent Area** | [Vendors Management](../../) |
| **Dependencies** | Vendor Profiles, Order Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Vendor Performance provides comprehensive supplier evaluation and monitoring for orthodontic practices. This includes automated performance metrics, quality tracking, delivery performance analysis, vendor scorecards, and issue management. The system enables practices to make data-driven vendor decisions, improve supplier relationships, and ensure accountability.

The sub-area supports ongoing vendor relationship management by tracking key metrics, documenting issues, and providing comparison tools. Practices can use performance data for contract negotiations, vendor selection, and continuous improvement initiatives.

### Key Capabilities

- Automated performance scorecards
- On-time delivery tracking
- Quality issue documentation
- Price competitiveness analysis
- Vendor comparison dashboards
- Issue resolution tracking
- Performance trend analysis
- Rating and feedback system
- SLA compliance monitoring
- Vendor communication tracking

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 4.1 | [Performance Metrics](./functions/performance-metrics.md) | Track and calculate performance metrics | 📋 Planned | High |
| 4.2 | [Quality Tracking](./functions/quality-tracking.md) | Monitor product and service quality | 📋 Planned | High |
| 4.3 | [Delivery Tracking](./functions/delivery-tracking.md) | Track delivery performance | 📋 Planned | High |
| 4.4 | [Vendor Ratings](./functions/vendor-ratings.md) | Rate and score vendor performance | 📋 Planned | Medium |
| 4.5 | [Issue Tracking](./functions/issue-tracking.md) | Track and resolve vendor issues | 📋 Planned | High |

---

## Function Details

### 4.1 Performance Metrics

**Purpose**: Automatically track and calculate vendor performance metrics from order and receiving data.

**Key Capabilities**:
- Auto-calculated metrics from transactions
- Configurable metric definitions
- Period-based calculations (monthly, quarterly, annual)
- Trend analysis and visualization
- Metric thresholds and alerts
- Benchmark comparisons
- Category-specific metrics
- Export and reporting

**Core Metrics**:
| Metric | Calculation | Target |
|--------|-------------|--------|
| On-Time Delivery Rate | Orders delivered on/before expected date ÷ Total orders | > 95% |
| Order Accuracy Rate | Orders with correct items ÷ Total orders | > 99% |
| Fill Rate | Items shipped ÷ Items ordered | > 98% |
| Defect Rate | Defective items ÷ Total items received | < 1% |
| Response Time | Avg time to respond to inquiries | < 24 hours |
| Return Rate | Items returned ÷ Items ordered | < 2% |
| Price Variance | Actual price vs contracted price | < 5% |
| Invoice Accuracy | Correct invoices ÷ Total invoices | > 99% |

**Metric Categories**:
- **Delivery**: On-time, lead time, fill rate
- **Quality**: Defect rate, accuracy, returns
- **Service**: Response time, issue resolution
- **Financial**: Pricing accuracy, invoice accuracy
- **Compliance**: SLA adherence, documentation

**User Stories**:
- As a **clinic admin**, I want to see vendor performance metrics to evaluate suppliers
- As an **office manager**, I want alerts when vendor performance drops below threshold
- As a **purchasing manager**, I want to compare vendor metrics for selection decisions

---

### 4.2 Quality Tracking

**Purpose**: Monitor and document product and service quality from vendors.

**Key Capabilities**:
- Quality issue documentation
- Defect tracking and categorization
- Quality inspection results
- Product recall tracking
- Service quality monitoring
- Quality trend analysis
- Root cause documentation
- Corrective action tracking

**Quality Categories**:
| Category | Description | Examples |
|----------|-------------|----------|
| Product Defect | Manufacturing defect | Broken brackets, bent wires |
| Damage | Shipping damage | Crushed packaging, bent items |
| Contamination | Sterility or contamination | Non-sterile supplies |
| Specification | Not to spec | Wrong size, wrong material |
| Packaging | Packaging issues | Incorrect labeling, missing items |
| Service Quality | Service issues | Poor installation, incomplete work |
| Documentation | Documentation errors | Wrong SDS, missing certificates |

**Quality Metrics**:
- Defect rate by product/category
- Quality issues by vendor
- Resolution time for quality issues
- Recurring quality problems
- Quality improvement trends

**User Stories**:
- As a **clinical staff**, I want to report quality issues with supplies
- As a **quality manager**, I want to track defect rates by vendor
- As an **office manager**, I want to see quality trends for contract reviews

---

### 4.3 Delivery Tracking

**Purpose**: Track and analyze vendor delivery performance.

**Key Capabilities**:
- On-time delivery monitoring
- Lead time tracking
- Delivery accuracy
- Back-order tracking
- Shipping performance
- Carrier comparison
- Delivery trends
- Exception reporting

**Delivery Metrics**:
| Metric | Description | Calculation |
|--------|-------------|-------------|
| On-Time Rate | Percent delivered on time | On-time deliveries ÷ Total deliveries |
| Average Lead Time | Days from order to receipt | Avg(Receipt date - Order date) |
| Lead Time Variance | Consistency of lead time | Std dev of lead times |
| Back-Order Rate | Percent back-ordered | Back-ordered items ÷ Ordered items |
| Complete Shipment Rate | Full orders shipped | Complete shipments ÷ Total shipments |
| Delivery Accuracy | Correct delivery location/time | Accurate deliveries ÷ Total deliveries |

**Delivery Analysis**:
- Performance by vendor
- Performance by product category
- Seasonal trends
- Day-of-week patterns
- Rush order success rate

**User Stories**:
- As an **office manager**, I want to see delivery performance by vendor
- As a **clinical staff**, I want to know typical lead times for planning
- As a **purchasing manager**, I want to identify vendors with delivery issues

---

### 4.4 Vendor Ratings

**Purpose**: Create and manage vendor performance ratings and scorecards.

**Key Capabilities**:
- Periodic rating creation
- Multi-factor scoring (quality, delivery, price, service)
- Weighted scoring models
- Rating history
- Comparative rankings
- Rating workflows
- Vendor feedback sharing
- Rating-based recommendations

**Rating Components**:
| Component | Weight | Description |
|-----------|--------|-------------|
| Quality | 25% | Product/service quality score |
| Delivery | 25% | On-time and accurate delivery |
| Price | 20% | Competitive pricing and accuracy |
| Service | 15% | Responsiveness and support |
| Communication | 10% | Proactive communication |
| Compliance | 5% | Documentation and compliance |

**Rating Scale**:
| Score | Rating | Description |
|-------|--------|-------------|
| 4.5-5.0 | Excellent | Preferred vendor status |
| 4.0-4.4 | Good | Approved vendor, minor improvements |
| 3.0-3.9 | Fair | Acceptable, improvement plan needed |
| 2.0-2.9 | Poor | Probationary status |
| < 2.0 | Unacceptable | Consider termination |

**Scorecard Process**:
1. System calculates metrics for period
2. Manager reviews and adds subjective ratings
3. Overall score calculated
4. Scorecard approved
5. Optional: Share with vendor
6. Update vendor status if needed

**User Stories**:
- As a **clinic admin**, I want to rate vendors quarterly for accountability
- As an **office manager**, I want to compare vendor ratings for selection
- As a **purchasing manager**, I want to share scorecards with vendors for improvement

---

### 4.5 Issue Tracking

**Purpose**: Track, manage, and resolve vendor-related issues and disputes.

**Key Capabilities**:
- Issue creation and documentation
- Severity classification
- Assignment and ownership
- Status tracking
- Resolution documentation
- Financial impact tracking
- Escalation workflows
- Issue trends and analytics
- Vendor communication log

**Issue Types**:
| Type | Description | Typical Resolution |
|------|-------------|-------------------|
| Late Delivery | Order delivered late | Credit, expedited shipping |
| Wrong Item | Incorrect item shipped | Exchange, credit |
| Damaged Goods | Items damaged | Replacement, credit |
| Quality Defect | Defective product | Return, credit, replacement |
| Quantity Error | Wrong quantity | Adjustment |
| Pricing Error | Incorrect pricing | Credit, invoice correction |
| Billing Issue | Invoice problems | Correction |
| Communication | Communication failures | Process improvement |
| Service Failure | Service not delivered | Credit, re-service |
| Contract Violation | Terms not met | Credit, contract review |

**Issue Severity**:
| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| Critical | Business impact, patient safety | 4 hours | Immediate |
| High | Significant impact | 24 hours | 2 days |
| Medium | Moderate impact | 48 hours | 5 days |
| Low | Minor impact | 72 hours | 10 days |

**Issue Workflow**:
1. Issue created and categorized
2. Assigned to owner
3. Vendor contacted
4. Resolution negotiated
5. Actions completed
6. Issue closed with documentation
7. Metrics updated

**User Stories**:
- As an **office manager**, I want to log vendor issues for tracking
- As a **clinic admin**, I want to see unresolved issues by vendor
- As a **finance manager**, I want to track financial impact of vendor issues

---

## Data Model

```prisma
model VendorRating {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Rating Period
  periodStart   DateTime
  periodEnd     DateTime

  // Scores (1-5 scale)
  overallScore  Decimal
  qualityScore  Decimal?
  deliveryScore Decimal?
  priceScore    Decimal?
  serviceScore  Decimal?
  communicationScore Decimal?

  // Metrics
  onTimeDeliveryRate Decimal?
  orderAccuracyRate Decimal?
  defectRate    Decimal?
  responseTime  Decimal? // Hours

  // Statistics
  totalOrders   Int      @default(0)
  totalSpend    Decimal  @default(0)
  totalIssues   Int      @default(0)

  // Comments
  strengths     String?
  improvements  String?
  notes         String?

  // Status
  status        RatingStatus @default(DRAFT)
  reviewedBy    String?  @db.ObjectId
  reviewedAt    DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([periodStart])
  @@index([overallScore])
}

model VendorIssue {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Issue Details
  issueNumber   String   @unique
  issueType     VendorIssueType
  severity      IssueSeverity @default(MEDIUM)
  title         String
  description   String

  // References
  purchaseOrderId String? @db.ObjectId
  orderReceiptId String? @db.ObjectId
  productCode   String?

  // Assignment
  assignedTo    String?  @db.ObjectId
  escalatedTo   String?  @db.ObjectId

  // Status
  status        IssueStatus @default(OPEN)
  resolution    String?
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  // Financial Impact
  financialImpact Decimal?
  creditRequested Decimal?
  creditReceived Decimal?
  creditDate    DateTime?

  // Vendor Communication
  vendorContactedAt DateTime?
  vendorResponse String?
  vendorResponseAt DateTime?

  // Root Cause
  rootCause     String?
  preventiveAction String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])
  comments      IssueComment[]

  @@index([clinicId])
  @@index([vendorId])
  @@index([issueNumber])
  @@index([status])
  @@index([issueType])
  @@index([severity])
  @@index([assignedTo])
}

model IssueComment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  issueId       String   @db.ObjectId

  // Comment Details
  comment       String
  isInternal    Boolean  @default(true)
  commentType   CommentType @default(NOTE)

  // Attachments
  attachmentUrl String?

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId

  // Relations
  issue         VendorIssue @relation(fields: [issueId], references: [id])

  @@index([issueId])
}

model VendorMetric {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Period
  periodType    MetricPeriod
  periodStart   DateTime
  periodEnd     DateTime

  // Order Metrics
  totalOrders   Int      @default(0)
  totalLineItems Int     @default(0)
  totalSpend    Decimal  @default(0)

  // Delivery Metrics
  onTimeDeliveries Int   @default(0)
  lateDeliveries Int     @default(0)
  avgLeadTimeDays Decimal?

  // Quality Metrics
  itemsReceived Int      @default(0)
  itemsAccepted Int      @default(0)
  itemsRejected Int      @default(0)
  qualityIssues Int      @default(0)

  // Accuracy Metrics
  correctOrders Int      @default(0)
  incorrectOrders Int    @default(0)
  backOrders    Int      @default(0)

  // Returns
  itemsReturned Int      @default(0)
  returnCredits Decimal  @default(0)

  // Issues
  issuesOpened  Int      @default(0)
  issuesClosed  Int      @default(0)
  avgResolutionDays Decimal?

  // Calculated Rates
  onTimeRate    Decimal?
  accuracyRate  Decimal?
  defectRate    Decimal?
  returnRate    Decimal?
  fillRate      Decimal?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])

  @@unique([clinicId, vendorId, periodType, periodStart])
  @@index([clinicId])
  @@index([vendorId])
  @@index([periodStart])
}

enum RatingStatus {
  DRAFT
  SUBMITTED
  REVIEWED
  PUBLISHED
}

enum VendorIssueType {
  LATE_DELIVERY
  WRONG_ITEM
  DAMAGED_GOODS
  QUALITY_DEFECT
  QUANTITY_DISCREPANCY
  PRICING_ERROR
  BILLING_ISSUE
  COMMUNICATION
  SERVICE_FAILURE
  CONTRACT_VIOLATION
  OTHER
}

enum IssueSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum IssueStatus {
  OPEN
  IN_PROGRESS
  PENDING_VENDOR
  RESOLVED
  CLOSED
  ESCALATED
}

enum CommentType {
  NOTE
  STATUS_CHANGE
  VENDOR_COMMUNICATION
  ESCALATION
  RESOLUTION
}

enum MetricPeriod {
  WEEKLY
  MONTHLY
  QUARTERLY
  ANNUAL
}
```

---

## API Endpoints

### Performance Metrics

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/:id/metrics` | Get vendor metrics | `performance:read` |
| GET | `/api/vendors/:id/metrics/summary` | Get metrics summary | `performance:read` |
| GET | `/api/vendors/:id/metrics/trends` | Get metric trends | `performance:read` |
| POST | `/api/vendors/:id/metrics/calculate` | Recalculate metrics | `performance:update` |
| GET | `/api/vendors/metrics/comparison` | Compare vendor metrics | `performance:view_all` |
| GET | `/api/vendors/metrics/benchmarks` | Get category benchmarks | `performance:read` |

### Ratings

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/:id/ratings` | Get vendor ratings | `performance:read` |
| GET | `/api/vendors/ratings/:id` | Get rating details | `performance:read` |
| POST | `/api/vendors/:id/ratings` | Create rating | `performance:rate` |
| PUT | `/api/vendors/ratings/:id` | Update rating | `performance:rate` |
| POST | `/api/vendors/ratings/:id/submit` | Submit rating | `performance:rate` |
| POST | `/api/vendors/ratings/:id/publish` | Publish rating | `performance:publish` |
| GET | `/api/vendors/ratings/rankings` | Get vendor rankings | `performance:view_all` |

### Issues

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/issues` | List all issues | `performance:read` |
| GET | `/api/vendors/:id/issues` | Get vendor issues | `performance:read` |
| GET | `/api/vendors/issues/:id` | Get issue details | `performance:read` |
| POST | `/api/vendors/:id/issues` | Create issue | `performance:create` |
| PUT | `/api/vendors/issues/:id` | Update issue | `performance:update` |
| PUT | `/api/vendors/issues/:id/status` | Update status | `performance:update` |
| POST | `/api/vendors/issues/:id/assign` | Assign issue | `performance:update` |
| POST | `/api/vendors/issues/:id/escalate` | Escalate issue | `performance:escalate` |
| POST | `/api/vendors/issues/:id/resolve` | Resolve issue | `performance:update` |
| POST | `/api/vendors/issues/:id/comments` | Add comment | `performance:update` |
| GET | `/api/vendors/issues/open` | List open issues | `performance:read` |
| GET | `/api/vendors/issues/assigned` | Get my assigned issues | `performance:read` |

### Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/performance/reports` | Performance reports | `performance:view_all` |
| GET | `/api/vendors/performance/scorecard/:id` | Generate scorecard | `performance:read` |
| GET | `/api/vendors/performance/export` | Export performance data | `performance:export` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `PerformanceDashboard` | Performance overview | `components/vendors/performance/` |
| `MetricsSummary` | Metrics summary view | `components/vendors/performance/` |
| `MetricsChart` | Performance charts | `components/vendors/performance/` |
| `MetricsTrend` | Trend analysis | `components/vendors/performance/` |
| `MetricCard` | Individual metric display | `components/vendors/performance/` |
| `MetricThresholdAlert` | Threshold warnings | `components/vendors/performance/` |
| `VendorComparison` | Compare vendors | `components/vendors/performance/` |
| `VendorRankings` | Vendor rankings list | `components/vendors/performance/` |
| `QualityDashboard` | Quality metrics view | `components/vendors/performance/quality/` |
| `QualityIssueLog` | Quality issues list | `components/vendors/performance/quality/` |
| `DefectTrendChart` | Defect trends | `components/vendors/performance/quality/` |
| `DeliveryPerformance` | Delivery metrics | `components/vendors/performance/delivery/` |
| `DeliveryTrendChart` | Delivery trends | `components/vendors/performance/delivery/` |
| `LeadTimeAnalysis` | Lead time analysis | `components/vendors/performance/delivery/` |
| `VendorScorecard` | Scorecard view | `components/vendors/performance/ratings/` |
| `RatingForm` | Create/edit rating | `components/vendors/performance/ratings/` |
| `RatingHistory` | Historical ratings | `components/vendors/performance/ratings/` |
| `RatingComparison` | Compare ratings | `components/vendors/performance/ratings/` |
| `IssueList` | Issues list view | `components/vendors/performance/issues/` |
| `IssueDetail` | Issue detail view | `components/vendors/performance/issues/` |
| `IssueForm` | Create/edit issue | `components/vendors/performance/issues/` |
| `IssueStatusBadge` | Status indicator | `components/vendors/performance/issues/` |
| `IssueTimeline` | Issue history | `components/vendors/performance/issues/` |
| `IssueComments` | Issue comments | `components/vendors/performance/issues/` |
| `IssueDashboard` | Open issues overview | `components/vendors/performance/issues/` |
| `EscalationQueue` | Escalated issues | `components/vendors/performance/issues/` |

---

## Business Rules

1. **Auto-Calculation**: Metrics calculated automatically from order/receipt data
2. **Calculation Schedule**: Metrics recalculated daily, summarized weekly/monthly
3. **Rating Periods**: Quarterly ratings by default, configurable by practice
4. **Rating Approval**: Ratings require manager review before publishing
5. **Issue SLA**: Issues must be responded to within severity-based timeframes
6. **Escalation**: Unresolved issues auto-escalate after threshold days
7. **Financial Tracking**: Document financial impact of all quality/delivery issues
8. **Root Cause**: Recurring issues require root cause analysis
9. **Vendor Communication**: Document all vendor communications on issues
10. **Scorecard Sharing**: Optional sharing of scorecards with vendors for transparency

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Vendor Profiles | Required | Vendor records |
| Order Management | Required | Order and receipt data for metrics |
| Contract Management | Optional | SLA compliance tracking |
| Email Service | Required | Issue notifications |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Reporting Engine | Required | Charts and reports |
| PDF Generation | Optional | Scorecard documents |

---

## Related Documentation

- [Parent: Vendors Management](../../)
- [Vendor Profiles](../vendor-profiles/)
- [Contract Management](../contract-management/)
- [Order Management](../order-management/)
- [Financial Management](../../../financial-management/) - Credit tracking
- [Compliance & Audit](../../../compliance-audit/) - Vendor compliance

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
