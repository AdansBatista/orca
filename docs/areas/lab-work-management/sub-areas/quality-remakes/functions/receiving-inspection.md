# Receiving Inspection

> **Sub-Area**: [Quality & Remakes](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Receiving Inspection provides quality assurance for lab items upon delivery. Each product type has a specific inspection checklist to verify quality before patient use. Failed inspections trigger the remake request workflow with photo documentation.

---

## Core Requirements

- [ ] Product-specific inspection checklists
- [ ] Pass/fail criteria for each checklist item
- [ ] Photo documentation of quality issues
- [ ] Assign inspector and timestamp
- [ ] Support bulk inspection for multi-item orders
- [ ] Allow conditional acceptance with notes
- [ ] Maintain inspection history per item
- [ ] Trigger remake workflow on failure

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/inspections` | `lab:track` | List inspections |
| GET | `/api/lab/inspections/:id` | `lab:track` | Get inspection details |
| POST | `/api/lab/orders/:orderId/items/:itemId/inspect` | `lab:track` | Create inspection |
| PUT | `/api/lab/inspections/:id` | `lab:track` | Update inspection |
| POST | `/api/lab/inspections/:id/photos` | `lab:track` | Upload inspection photos |
| GET | `/api/lab/products/:productId/checklist` | `lab:track` | Get inspection checklist |

---

## Data Model

```prisma
model LabInspection {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId
  labOrderItemId String  @db.ObjectId

  inspectedAt   DateTime @default(now())
  inspectedBy   String   @db.ObjectId

  result        InspectionResult  // PASS, PASS_WITH_NOTES, FAIL_REMAKE, FAIL_ADJUSTMENT
  notes         String?

  checklist     Json?    // [{item, passed, notes}]

  remakeRequestId String? @db.ObjectId

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([labOrderId])
  @@index([result])
}

model InspectionPhoto {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  inspectionId  String   @db.ObjectId

  storageKey    String
  fileName      String
  description   String?

  createdAt     DateTime @default(now())

  @@index([inspectionId])
}
```

---

## Business Rules

- All delivered items should be inspected before patient use
- Failed inspections require at least one photo
- Pass with notes still marks item as ready
- Warranty period starts from inspection pass date
- Inspection checklist defined per product type

---

## Dependencies

**Depends On:**
- Order Tracking (received items)
- Lab Vendor Management (product checklist schemas)

**Required By:**
- Remake Request Management (failed inspections)
- Warranty Tracking (warranty start date)
- Patient Pickup Tracking (ready items)

---

## Notes

- Checklist items: fit, appearance, function, materials
- Consider mobile-friendly inspection interface
- Support voice notes for hands-free documentation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
