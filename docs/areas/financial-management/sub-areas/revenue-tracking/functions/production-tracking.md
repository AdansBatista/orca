# Production Tracking

> **Sub-Area**: [Revenue Tracking](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Production Tracking provides real-time visibility into practice production by provider, procedure type, and location. This function calculates gross and net production, tracks production against goals, and provides detailed breakdowns essential for understanding revenue generation and provider performance in orthodontic practices.

---

## Core Requirements

- [ ] Display real-time production dashboards with configurable date ranges
- [ ] Track production by provider with individual goals and progress visualization
- [ ] Categorize production by procedure type (consults, starts, adjustments, debonds)
- [ ] Support multi-location production reporting with consolidation
- [ ] Calculate gross vs net production (after adjustments and write-offs)
- [ ] Track production per chair hour for utilization analysis
- [ ] Calculate production per new patient start for value metrics

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/production` | `finance:view_revenue` | Get production summary for period |
| GET | `/api/finance/production/by-provider` | `finance:view_revenue` | Production breakdown by provider |
| GET | `/api/finance/production/by-procedure` | `finance:view_revenue` | Production breakdown by procedure type |
| GET | `/api/finance/production/by-location` | `finance:view_revenue` | Production breakdown by location |
| GET | `/api/finance/production/details` | `finance:view_revenue` | Detailed production entries |
| GET | `/api/finance/production/goals` | `finance:view_revenue` | Provider production goals |
| PUT | `/api/finance/production/goals/:providerId` | `finance:manage_expenses` | Set provider production goals |

---

## Data Model

```prisma
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
  procedureCategory ProductionCategory
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

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  daySheet      DaySheet? @relation(fields: [daySheetId], references: [id])

  @@index([clinicId])
  @@index([providerId])
  @@index([productionDate])
  @@index([procedureCategory])
}

enum ProductionCategory {
  CONSULTATION
  RECORDS
  TREATMENT_START
  ADJUSTMENT
  DEBOND
  RETENTION
  EMERGENCY
  OTHER
}
```

---

## Business Rules

- Production entries created automatically from completed procedures
- High initial production at case start (bonding) recognized appropriately
- Adjustment visits represent steady lower production during treatment
- Final production at case completion (debond) tracked separately
- Treatment phase impacts production value recognition
- Provider production goals set monthly with annual aggregation
- Net production excludes courtesy discounts and insurance write-offs

---

## Dependencies

**Depends On:**
- Treatment Management (procedures, treatment plans)
- Staff Management (provider information)
- Booking & Scheduling (appointments)

**Required By:**
- Day Sheet & Reconciliation
- Financial Reports (P&L, production reports)
- Analytics Dashboard (KPIs)
- Provider compensation calculations

---

## Notes

- Orthodontic production patterns differ from general dental with concentrated starts and debonds
- Track procedure categories specific to orthodontics for meaningful analysis
- Production per new patient start is a key orthodontic profitability metric

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
