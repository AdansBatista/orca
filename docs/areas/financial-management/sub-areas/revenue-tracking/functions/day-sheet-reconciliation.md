# Day Sheet & Daily Reconciliation

> **Sub-Area**: [Revenue Tracking](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Day Sheet & Daily Reconciliation provides end-of-day financial summary and deposit reconciliation for orthodontic practices. This function tracks all daily financial activity, matches payments to bank deposits, manages cash drawer balancing, and ensures accurate daily close-out procedures essential for financial accuracy.

---

## Core Requirements

- [ ] Generate end-of-day financial summary dashboard showing production, collections, and adjustments
- [ ] Reconcile payment gateway (Stripe/Square) batch deposits with recorded payments
- [ ] Manage cash drawer opening and closing balances with variance tracking
- [ ] Support multiple deposit account types (card batches, cash, checks, ACH, insurance)
- [ ] Detect and alert on reconciliation discrepancies exceeding tolerance thresholds
- [ ] Send automated daily summary emails to clinic administrators
- [ ] Enforce day sheet lifecycle (open → pending reconciliation → reconciled → closed)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/day-sheet` | `finance:view_revenue` | Get day sheet for current date |
| GET | `/api/finance/day-sheet/:date` | `finance:view_revenue` | Get day sheet for specific date |
| POST | `/api/finance/day-sheet/:date/close` | `finance:close_period` | Close day sheet after reconciliation |
| POST | `/api/finance/day-sheet/:date/reconcile` | `finance:close_period` | Reconcile deposits for day sheet |
| PUT | `/api/finance/day-sheet/:date/cash-drawer` | `finance:close_period` | Update cash drawer balances |
| GET | `/api/finance/deposits` | `finance:view_revenue` | List daily deposits |
| POST | `/api/finance/deposits/:id/match` | `finance:close_period` | Match deposit to payments |

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

  // Timestamps & Audit
  closedAt      DateTime?
  closedBy      String?  @db.ObjectId
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  deposits      DailyDeposit[]

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
```

---

## Business Rules

- Day sheets are created automatically at midnight for each clinic
- Cannot close a day sheet until all deposits are reconciled within $0.01 tolerance
- Cash drawer variance requires explanation note if exceeding $5.00
- Closed day sheets cannot be modified without supervisor override and audit logging
- Insurance payments may post to different day sheet than deposit date
- Payment gateway batch reconciliation runs automatically at 6 AM

---

## Dependencies

**Depends On:**
- Billing & Insurance (payment source data)
- Payment Processing (payment gateway transactions)
- Practice Orchestration (appointment/procedure completions)

**Required By:**
- Financial Reports (daily financial data)
- Revenue Tracking Summary Reports
- Month-End Close Process

---

## Notes

- High volume of small recurring payments from payment plans is common in orthodontics
- Same-day payments vs insurance payments arriving later require separate tracking
- Multiple payment methods per patient visit should be tracked individually

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
