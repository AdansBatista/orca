# Custom Report Builder

> **Sub-Area**: [Financial Reports](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Custom Report Builder enables creation of custom financial reports with flexible dimensions and filters. This function provides a drag-and-drop report designer, supports filtering by any available dimension, offers multiple aggregation and calculation options, generates reports in various output formats, and allows scheduled delivery of recurring reports.

---

## Core Requirements

- [ ] Provide drag-and-drop report designer interface
- [ ] Support filtering by any dimension (date, provider, location, etc.)
- [ ] Offer multiple aggregation options (sum, average, count, min, max)
- [ ] Enable calculated fields with formula support
- [ ] Generate multiple output formats (PDF, Excel, CSV)
- [ ] Schedule recurring report delivery via email
- [ ] Create and share report templates across users
- [ ] Manage report permissions by role

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/reports/custom` | `finance:view_reports` | List saved custom reports |
| GET | `/api/finance/reports/custom/:id` | `finance:view_reports` | Get report definition |
| POST | `/api/finance/reports/custom` | `finance:generate_reports` | Create custom report |
| PUT | `/api/finance/reports/custom/:id` | `finance:generate_reports` | Update report |
| DELETE | `/api/finance/reports/custom/:id` | `finance:generate_reports` | Delete report |
| POST | `/api/finance/reports/custom/:id/run` | `finance:view_reports` | Execute report |
| GET | `/api/finance/report-templates` | `finance:view_reports` | List templates |
| POST | `/api/finance/report-templates` | `finance:generate_reports` | Create template |
| POST | `/api/finance/report-templates/:id/schedule` | `finance:generate_reports` | Schedule report |

---

## Data Model

```prisma
model CustomReport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Report definition
  name          String
  description   String?
  category      ReportCategory

  // Design
  configuration Json     // Report builder configuration
  columns       ReportColumn[]
  filters       ReportFilter[]
  grouping      String[]
  sorting       ReportSort[]

  // Aggregations
  aggregations  ReportAggregation[]
  calculatedFields Json?

  // Output
  defaultFormat ReportFormat @default(PDF)

  // Sharing
  isShared      Boolean  @default(false)
  sharedWith    String[] @db.ObjectId  // User or role IDs

  // Status
  isActive      Boolean  @default(true)
  lastRunAt     DateTime?
  runCount      Int      @default(0)

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  schedules     ReportSchedule[]
  history       ReportExecution[]

  @@index([clinicId])
  @@index([category])
  @@index([createdBy])
}

type ReportColumn {
  fieldId       String
  fieldName     String
  displayName   String
  dataType      DataType
  width         Int?
  format        String?
  isVisible     Boolean
  order         Int
}

type ReportFilter {
  fieldId       String
  operator      FilterOperator
  value         Json
  isRequired    Boolean
}

type ReportSort {
  fieldId       String
  direction     SortDirection
  order         Int
}

type ReportAggregation {
  fieldId       String
  aggregationType AggregationType
  displayName   String?
}

enum ReportCategory {
  REVENUE
  EXPENSE
  PRODUCTION
  COLLECTIONS
  AR
  PATIENTS
  PROVIDERS
  CUSTOM
}

enum DataType {
  STRING
  NUMBER
  CURRENCY
  DATE
  BOOLEAN
  PERCENTAGE
}

enum FilterOperator {
  EQUALS
  NOT_EQUALS
  GREATER_THAN
  LESS_THAN
  BETWEEN
  IN
  NOT_IN
  CONTAINS
  STARTS_WITH
  IS_NULL
  IS_NOT_NULL
}

enum SortDirection {
  ASC
  DESC
}

enum AggregationType {
  SUM
  AVERAGE
  COUNT
  MIN
  MAX
  DISTINCT_COUNT
}

model ReportSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  reportId      String   @db.ObjectId

  // Schedule
  name          String
  frequency     ScheduleFrequency
  dayOfWeek     Int?     // 0-6 for weekly
  dayOfMonth    Int?     // 1-31 for monthly
  time          String   // HH:MM format

  // Delivery
  recipients    String[] // Email addresses
  format        ReportFormat
  includeFilters Json?   // Default filter values

  // Status
  isActive      Boolean  @default(true)
  nextRunAt     DateTime?
  lastRunAt     DateTime?
  lastStatus    String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  report        CustomReport @relation(fields: [reportId], references: [id])

  @@index([reportId])
  @@index([isActive])
  @@index([nextRunAt])
}

enum ScheduleFrequency {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
}

enum ReportFormat {
  PDF
  EXCEL
  CSV
  HTML
}

model ReportExecution {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  reportId      String   @db.ObjectId

  // Execution details
  executedAt    DateTime @default(now())
  executedBy    String?  @db.ObjectId  // null for scheduled
  scheduleId    String?  @db.ObjectId

  // Parameters
  filterValues  Json?
  periodStart   DateTime?
  periodEnd     DateTime?

  // Results
  status        ExecutionStatus
  rowCount      Int?
  duration      Int?     // milliseconds
  documentUrl   String?
  errorMessage  String?

  // Relations
  report        CustomReport @relation(fields: [reportId], references: [id])

  @@index([reportId])
  @@index([executedAt])
}

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

---

## Business Rules

- Report templates can be shared clinic-wide or with specific users
- Scheduled reports run during off-hours to minimize system impact
- Large reports (>10,000 rows) require confirmation before execution
- Report history retained for 90 days
- Calculated fields support basic arithmetic and common functions
- Filter values can have defaults that users can override
- Export includes report parameters for reproducibility
- Role-based access controls report visibility and creation

---

## Dependencies

**Depends On:**
- Revenue Tracking (revenue data)
- Expense Management (expense data)
- All financial data sources

**Required By:**
- User-defined reporting needs
- Automated report distribution

---

## Notes

**Available Dimensions:**
- **Time**: Day, week, month, quarter, year
- **Provider**: Individual provider or provider group
- **Location**: Individual clinic or consolidated
- **Procedure**: Procedure type or category
- **Patient**: Demographics, treatment status
- **Insurance**: Carrier, plan type
- **Treatment**: Treatment type, phase
- **Account**: Account status, aging bucket

**Available Measures:**
- Production (gross, net)
- Collections (by source, method)
- Adjustments (by type)
- Patient counts
- Case counts
- AR balances
- Overhead amounts

**Formula Functions:**
- Arithmetic: +, -, *, /
- Percentage: PERCENT(value, total)
- Conditionals: IF(condition, then, else)
- Aggregates: SUM, AVG, COUNT, MIN, MAX

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
