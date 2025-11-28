# Write-off & Adjustment Reports

> **Sub-Area**: [Financial Reports](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Write-off & Adjustment Reports tracks and analyzes all adjustments and write-offs impacting practice revenue. This function categorizes adjustments by type, monitors trends over time, analyzes impact on production, tracks recoveries of previously written-off amounts, maintains approval audit trails, and compares performance against benchmarks.

---

## Core Requirements

- [ ] Generate write-off summary by reason/category
- [ ] Categorize all adjustments with standardized reason codes
- [ ] Track adjustment trends over time with variance analysis
- [ ] Analyze impact on gross-to-net production
- [ ] Monitor recovery of previously written-off amounts
- [ ] Maintain approval audit trail for all adjustments
- [ ] Compare adjustment rates to industry benchmarks

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/reports/write-offs` | `finance:view_reports` | Write-off summary |
| GET | `/api/finance/reports/write-offs/by-category` | `finance:view_reports` | By adjustment category |
| GET | `/api/finance/reports/write-offs/by-provider` | `finance:view_reports` | By provider |
| GET | `/api/finance/reports/write-offs/detail` | `finance:view_reports` | Detailed listing |
| GET | `/api/finance/reports/write-offs/trend` | `finance:view_reports` | Trend analysis |
| GET | `/api/finance/reports/write-offs/recoveries` | `finance:view_reports` | Bad debt recoveries |
| GET | `/api/finance/reports/adjustments` | `finance:view_reports` | All adjustments report |
| POST | `/api/finance/reports/write-offs/export` | `finance:export` | Export to PDF/Excel |

---

## Data Model

```prisma
model WriteOffSummary {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodStart   DateTime
  periodEnd     DateTime

  // By category
  insuranceWriteOffs    Decimal @default(0)
  courtesyDiscounts     Decimal @default(0)
  professionalDiscounts Decimal @default(0)
  familyDiscounts       Decimal @default(0)
  badDebtWriteOffs      Decimal @default(0)
  smallBalanceWriteOffs Decimal @default(0)
  promotionalDiscounts  Decimal @default(0)
  timingAdjustments     Decimal @default(0)
  errorCorrections      Decimal @default(0)
  otherAdjustments      Decimal @default(0)

  // Totals
  totalWriteOffs        Decimal
  totalAdjustments      Decimal

  // Production context
  grossProduction       Decimal

  // Rates
  writeOffRate          Decimal
  adjustmentRate        Decimal
  badDebtRate           Decimal
  discountRate          Decimal

  // Recoveries
  badDebtRecoveries     Decimal @default(0)
  netBadDebt            Decimal

  // Counts
  writeOffCount         Int     @default(0)
  adjustmentCount       Int     @default(0)

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodStart])
  @@index([clinicId])
  @@index([periodStart])
}

model AdjustmentEntry {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Account reference
  patientId     String   @db.ObjectId
  transactionId String?  @db.ObjectId
  invoiceId     String?  @db.ObjectId

  // Adjustment details
  adjustmentDate DateTime
  category      AdjustmentCategory
  reasonCode    String
  description   String?
  amount        Decimal

  // Provider (if applicable)
  providerId    String?  @db.ObjectId

  // Approval
  requiresApproval Boolean @default(false)
  approvalStatus   ApprovalStatus @default(APPROVED)
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // Reversal tracking
  isReversal    Boolean  @default(false)
  reversesId    String?  @db.ObjectId
  reversedById  String?  @db.ObjectId

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([adjustmentDate])
  @@index([category])
}

enum AdjustmentCategory {
  INSURANCE_WRITEOFF
  COURTESY_DISCOUNT
  PROFESSIONAL_DISCOUNT
  FAMILY_DISCOUNT
  BAD_DEBT
  SMALL_BALANCE
  PROMOTIONAL
  TIMING_ADJUSTMENT
  ERROR_CORRECTION
  RECOVERY
  OTHER
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  AUTO_APPROVED
}
```

---

## Business Rules

- Insurance write-offs are contractual and expected per insurance contracts
- Courtesy discounts require reason code and may require approval
- Bad debt write-offs require collection efforts documentation
- Small balance threshold typically $5-10 (configurable)
- Adjustments above threshold require supervisor approval
- All adjustments audit logged with user and timestamp
- Reversed adjustments linked to original for tracking
- Recovery entries reduce net bad debt calculations

---

## Dependencies

**Depends On:**
- Billing & Insurance (transaction data)
- Production Tracking (gross production)

**Required By:**
- Production vs Collection Analysis
- Financial Reports (P&L adjustments)
- Analytics Dashboard (adjustment KPIs)

---

## Notes

**Adjustment Categories:**
| Category | Description | Benchmark |
|----------|-------------|-----------|
| Insurance Write-off | Contractual adjustments | Per contract |
| Courtesy Discount | Professional, family, staff | <2% of production |
| Bad Debt | Uncollectible accounts | <1% of production |
| Small Balance | Below collection threshold | Minimal |
| Promotional | Marketing discounts | Controlled |
| Error Correction | Billing corrections | Minimal |

**Key Metrics:**
- **Write-Off Rate**: Total write-offs ÷ Gross production (target <5%)
- **Bad Debt Rate**: Bad debt write-offs ÷ Net production (target <1%)
- **Discount Rate**: Courtesy/promo discounts ÷ Gross production (target <2%)

**Audit Requirements:**
- All adjustments require user authentication
- Adjustments over threshold require approval workflow
- Approval history retained for compliance
- Monthly adjustment review by management recommended

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
