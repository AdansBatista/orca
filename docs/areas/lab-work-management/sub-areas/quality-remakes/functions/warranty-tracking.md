# Warranty Tracking

> **Sub-Area**: [Quality & Remakes](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Warranty Tracking manages warranty periods for lab items and processes warranty claims. The system tracks warranty start dates, coverage periods, and claim history, enabling staff to quickly determine if a damaged or defective item qualifies for free replacement.

---

## Core Requirements

- [ ] Track warranty periods by product type
- [ ] Set warranty start date from inspection date
- [ ] Alert on upcoming warranty expirations
- [ ] Check warranty eligibility for claims
- [ ] Record warranty terms by vendor
- [ ] Maintain claim history per item
- [ ] Calculate warranty cost savings
- [ ] Report on warranty utilization

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/warranties` | `lab:track` | List warranties |
| GET | `/api/lab/warranties/:id` | `lab:track` | Get warranty details |
| GET | `/api/lab/warranties/check/:orderItemId` | `lab:track` | Check eligibility |
| POST | `/api/lab/warranties/:id/claim` | `lab:request_remake` | File warranty claim |
| GET | `/api/lab/warranties/expiring` | `lab:track` | Expiring warranties |
| GET | `/api/lab/warranties/patient/:patientId` | `lab:track` | Patient warranties |

---

## Data Model

```prisma
model LabWarranty {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderItemId String  @db.ObjectId
  patientId     String   @db.ObjectId

  productId     String   @db.ObjectId
  productName   String

  startDate     DateTime
  endDate       DateTime
  warrantyMonths Int

  status        WarrantyStatus @default(ACTIVE)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([patientId])
  @@index([endDate])
  @@index([status])
}

model WarrantyClaim {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  warrantyId    String   @db.ObjectId
  remakeRequestId String @db.ObjectId

  claimDate     DateTime @default(now())
  reason        String
  approved      Boolean?
  approvalNotes String?
  claimValue    Decimal?

  @@index([warrantyId])
}
```

---

## Business Rules

- Warranty created automatically when item passes inspection
- Warranty period defined per product and vendor
- Manufacturing defects covered under warranty
- Patient damage/loss not covered
- Multiple claims allowed within warranty period
- Warranty voided if item modified outside lab

---

## Dependencies

**Depends On:**
- Receiving Inspection (warranty start trigger)
- Lab Vendor Management (warranty terms)
- Remake Request Management (claim processing)

**Required By:**
- Financial Management (cost savings tracking)
- Quality Analytics (warranty metrics)

---

## Notes

- Standard periods: retainers 90 days, appliances 1 year
- Consider extended warranty options
- Track warranty documentation for disputes

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
