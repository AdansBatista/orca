# Treatment Cost Estimator

> **Sub-Area**: [Patient Billing](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Treatment Cost Estimator calculates accurate treatment cost estimates including insurance coverage estimates and patient responsibility. This function is critical for treatment coordinators during case presentations, helping patients understand their financial obligations before committing to treatment. It supports multiple estimate scenarios and tracks estimate accuracy over time.

---

## Core Requirements

- [ ] Calculate total treatment cost from selected procedures
- [ ] Estimate insurance coverage based on patient's plan benefits
- [ ] Calculate patient responsibility (total - insurance)
- [ ] Generate written estimates for patient signature
- [ ] Support multiple estimate scenarios (e.g., different treatment options)
- [ ] Track estimate accuracy vs. actual costs for analytics
- [ ] Include down payment and monthly payment options
- [ ] Apply courtesy discounts and adjustments

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/billing/estimates` | `billing:create` | Create treatment estimate |
| GET | `/api/billing/estimates/:id` | `billing:read` | Get estimate details |
| PUT | `/api/billing/estimates/:id` | `billing:update` | Update estimate |
| POST | `/api/billing/estimates/:id/accept` | `billing:update` | Accept estimate (patient signed) |
| GET | `/api/billing/estimates/:id/pdf` | `billing:read` | Download estimate PDF |
| GET | `/api/patients/:id/estimates` | `billing:read` | List patient's estimates |

---

## Data Model

```prisma
model TreatmentEstimate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Estimate details
  estimateNumber   String   @unique
  estimateDate     DateTime @default(now())
  expiresAt        DateTime
  status           EstimateStatus @default(DRAFT)

  // Treatment reference
  treatmentPlanId  String?  @db.ObjectId

  // Cost breakdown
  proceduresCost   Decimal
  discounts        Decimal  @default(0)
  subtotal         Decimal
  insuranceEstimate Decimal @default(0)
  patientEstimate  Decimal

  // Payment options
  downPaymentRequired Decimal @default(0)
  monthlyPayment      Decimal?
  paymentTerms        Int?  // months

  // Acceptance
  acceptedAt       DateTime?
  acceptedBy       String?  // Patient signature
  signatureUrl     String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  patient   Patient  @relation(fields: [patientId], references: [id])
  items     EstimateItem[]

  @@index([clinicId])
  @@index([patientId])
  @@index([estimateNumber])
  @@index([status])
}

model EstimateItem {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  estimateId  String   @db.ObjectId

  // Item details
  procedureCode    String
  description      String
  quantity         Int      @default(1)
  unitFee          Decimal
  discount         Decimal  @default(0)
  total            Decimal

  // Insurance estimate
  insurancePercent Decimal  @default(0)
  insuranceAmount  Decimal  @default(0)
  patientAmount    Decimal

  // Relations
  estimate   TreatmentEstimate @relation(fields: [estimateId], references: [id])

  @@index([estimateId])
}

enum EstimateStatus {
  DRAFT
  PRESENTED
  ACCEPTED
  DECLINED
  EXPIRED
  SUPERSEDED
}
```

---

## Business Rules

- Insurance estimates based on verified benefits (if available) or plan defaults
- Estimates expire after configurable period (default 30 days)
- Accepted estimates create associated invoices or payment plans
- Only one active estimate per treatment plan
- Discounts require appropriate permission level
- Patient signature required for acceptance
- Estimate accuracy tracked for insurance estimation improvements

---

## Dependencies

**Depends On:**
- Patient Account Management (account data)
- Treatment Management (procedure codes, treatment plans)
- Insurance Claims (patient insurance, benefit verification)

**Required By:**
- Payment Plan Builder (creates plan from accepted estimate)
- Treatment Management (estimate acceptance triggers treatment start)

---

## Notes

- Integrate with eligibility verification to get accurate benefit estimates
- Consider AI-powered estimation based on historical claim outcomes
- Store multiple scenarios per patient for comparison discussions
- Track conversion rate (estimates accepted vs. presented)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
