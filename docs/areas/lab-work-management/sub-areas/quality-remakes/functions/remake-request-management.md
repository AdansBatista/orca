# Remake Request Management

> **Sub-Area**: [Quality & Remakes](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Remake Request Management handles the full lifecycle of remake requests for items that fail inspection. The system documents reasons, manages lab communication, tracks remake progress, and handles cost responsibility (warranty vs. billable).

---

## Core Requirements

- [ ] Initiate remake from failed inspection
- [ ] Document reason and detailed description
- [ ] Attach photos showing issues
- [ ] Send remake request to lab
- [ ] Track remake order separately from original
- [ ] Determine cost responsibility (warranty/lab/patient)
- [ ] Support approval workflow for billable remakes
- [ ] Option for rush remake processing

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/remakes` | `lab:track` | List remake requests |
| GET | `/api/lab/remakes/:id` | `lab:track` | Get remake details |
| POST | `/api/lab/remakes` | `lab:request_remake` | Create remake request |
| PUT | `/api/lab/remakes/:id` | `lab:request_remake` | Update remake |
| POST | `/api/lab/remakes/:id/approve` | `lab:approve_remake` | Approve remake cost |
| PUT | `/api/lab/remakes/:id/status` | `lab:track` | Update status |
| POST | `/api/lab/remakes/:id/send-to-lab` | `lab:request_remake` | Send to lab |

---

## Data Model

```prisma
model RemakeRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId
  labOrderItemId String  @db.ObjectId
  vendorId      String   @db.ObjectId

  requestNumber String   @unique
  status        RemakeStatus @default(REQUESTED)

  reason        RemakeReason  // FIT_ISSUE, DESIGN_ISSUE, MATERIAL_DEFECT, etc.
  reasonDetail  String
  photos        String[]

  isWarrantyClaim Boolean @default(false)
  warrantyApproved Boolean?

  estimatedCost Decimal?
  actualCost    Decimal?
  costResponsibility CostResponsibility @default(LAB)

  approvalRequired Boolean @default(false)
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  requestedAt   DateTime @default(now())
  estimatedDelivery DateTime?
  completedAt   DateTime?

  remakeOrderId String?  @db.ObjectId

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  requestedBy   String   @db.ObjectId

  @@index([clinicId])
  @@index([labOrderId])
  @@index([vendorId])
  @@index([status])
}
```

---

## Business Rules

- Failed inspection required to initiate remake
- Photo documentation required for all remakes
- Warranty claims checked against warranty period
- Non-warranty remakes over threshold require approval
- Remake affects vendor quality metrics
- Lab notified immediately upon request creation

---

## Dependencies

**Depends On:**
- Receiving Inspection (failed inspection trigger)
- Warranty Tracking (warranty eligibility)
- Communication Hub (lab notification)

**Required By:**
- Quality Analytics (remake rate calculation)
- Performance Metrics (vendor quality)
- Financial Management (remake costs)

---

## Notes

- Track original item return if required by lab
- Support partial remakes (fix adjustment only)
- Consider automatic remake ordering

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
