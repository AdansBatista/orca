# Aging Reports

> **Sub-Area**: [Collections Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Aging Reports generates and analyzes accounts receivable aging reports. This function provides visibility into outstanding balances categorized by age (current, 30, 60, 90, 120+ days), supports filtering by patient type, payer, and account status, and enables export for analysis. Aging reports are essential for managing cash flow and prioritizing collection efforts.

---

## Core Requirements

- [ ] Standard aging buckets (Current, 30, 60, 90, 120+ days)
- [ ] Separate aging by patient AR and insurance AR
- [ ] Filter by guarantor, payer, account status, amount range
- [ ] Export to Excel and PDF
- [ ] Schedule automated report delivery
- [ ] Trend analysis over time
- [ ] Drill-down from summary to individual accounts
- [ ] Real-time vs. end-of-day reporting options

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/collections/aging` | `collections:read` | Get aging report |
| GET | `/api/collections/aging/summary` | `collections:read` | Get aging summary |
| GET | `/api/collections/aging/detail` | `collections:read` | Get detailed aging |
| GET | `/api/collections/aging/export` | `collections:export` | Export aging report |
| GET | `/api/collections/aging/trends` | `collections:read` | Get aging trends |
| POST | `/api/collections/aging/schedule` | `collections:manage` | Schedule report |

---

## Data Model

```prisma
// Aging is computed from PatientAccount and Invoice models
// No separate model needed - this is a reporting function

model AgingReportSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Schedule details
  name          String
  frequency     ReportFrequency
  dayOfWeek     Int?     // For weekly (0=Sunday)
  dayOfMonth    Int?     // For monthly
  time          String   // HH:MM format

  // Report parameters
  reportType    AgingReportType
  includeZeroBalance Boolean @default(false)
  arType        ARType?  // Patient, Insurance, or All
  minBalance    Decimal?

  // Delivery
  recipients    String[] // Email addresses
  format        ReportFormat @default(PDF)

  // Status
  isActive      Boolean  @default(true)
  lastRunAt     DateTime?
  nextRunAt     DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([isActive])
  @@index([nextRunAt])
}

enum ReportFrequency {
  DAILY
  WEEKLY
  MONTHLY
}

enum AgingReportType {
  SUMMARY
  DETAIL
  BY_PAYER
  BY_GUARANTOR
}

enum ARType {
  PATIENT
  INSURANCE
  ALL
}

enum ReportFormat {
  PDF
  EXCEL
  CSV
}
```

---

## Business Rules

- Aging calculated from invoice due date, not service date
- Current = not yet due; 30 = 1-30 days past due, etc.
- Insurance AR includes claims submitted but not paid
- Patient AR includes patient responsibility not paid
- Exclude accounts in bankruptcy or legal hold
- Zero-balance accounts excluded by default
- Trend data retained for 24 months
- Report generation optimized for large datasets

---

## Dependencies

**Depends On:**
- Patient Account Management (account balances)
- Insurance Claims (insurance AR)
- Invoice data (aging calculation)

**Required By:**
- Collection Workflows (prioritization)
- Financial Reporting (AR metrics)
- Dashboard widgets (AR summary)

---

## Notes

- Pre-compute aging buckets nightly for performance
- Implement caching for frequently-accessed reports
- Consider AR days calculation (DSO - Days Sales Outstanding)
- Support comparison to previous period
- Alert on significant AR increase

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
