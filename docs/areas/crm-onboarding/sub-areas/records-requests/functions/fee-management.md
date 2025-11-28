# Fee Management

> **Sub-Area**: [Records Requests](../) | **Status**: 📋 Planned | **Priority**: Low

---

## Overview

Fee Management handles billing and collection of records preparation fees for outgoing records requests where applicable. It calculates fees based on clinic fee schedules and state regulations, generates invoices, tracks payment status, and supports fee waivers while integrating with the billing system.

---

## Core Requirements

- [ ] Define configurable fee schedule per clinic
- [ ] Calculate fees based on record type, page count, and delivery method
- [ ] Generate fee invoices for requesters
- [ ] Track payment status
- [ ] Support fee waivers with reason documentation
- [ ] Ensure compliance with state maximum fee regulations
- [ ] Integrate with billing system for payment processing

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/records-fee-schedule` | `records:read` | Get fee schedule |
| PUT | `/api/records-fee-schedule` | `records:configure` | Update fee schedule |
| POST | `/api/records-requests/:id/calculate-fee` | `records:read` | Calculate request fee |
| POST | `/api/records-requests/:id/invoice` | `records:update` | Generate invoice |
| POST | `/api/records-requests/:id/waive-fee` | `records:fee_waiver` | Waive fee |
| POST | `/api/records-requests/:id/record-payment` | `records:update` | Record payment |
| GET | `/api/records-requests/fees-outstanding` | `records:read` | Get unpaid requests |

---

## Data Model

```prisma
model RecordsFeeSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Fee structure
  name          String
  isActive      Boolean  @default(true)

  // Fee items
  baseFee               Decimal  @default(0)
  perPageFee            Decimal  @default(0)
  perImageFee           Decimal  @default(0)
  electronicFormatFee   Decimal  @default(0)
  mailingFee            Decimal  @default(0)
  rushFee               Decimal  @default(0)

  // Caps
  maximumFee            Decimal?

  // Rules
  patientCopyFree       Boolean  @default(false)
  freePageLimit         Int?

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
}

// Fee fields on RecordsRequest
// feeRequired, feeAmount, feeWaived, feeWaiverReason, feePaidDate
```

---

## Business Rules

- Fees comply with state maximum allowances
- Many states require first patient copy free
- Electronic format typically lower fee than paper
- Fee not collected before authorization verified
- Records not released until fee paid (unless waived)
- Fee waivers require reason and approval
- Rush fees only applied if expedited delivery provided
- Provider-to-provider transfers may have different fee rules

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)
- Outgoing Records Preparation (fee trigger)
- Billing & Insurance (payment processing)

**Required By:**
- Outgoing Records Preparation (fee gate)
- Compliance Monitoring (fee compliance)

---

## Notes

- State fee regulations vary significantly; research required
- Consider integration with payment gateway for online payment
- Invoice generation should include fee breakdown
- Track fee waiver reasons for pattern analysis

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
