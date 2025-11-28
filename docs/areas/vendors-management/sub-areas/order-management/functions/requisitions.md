# Requisitions

> **Sub-Area**: [Order Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Requisitions allows staff to formally request supplies and materials through an approval workflow before purchase orders are created. This function enables clinical and administrative staff to request needed items, routes requests to appropriate approvers, and converts approved requisitions into purchase orders. Provides visibility into supply needs across the organization.

---

## Core Requirements

- [ ] Create requisitions with item list and justification
- [ ] Support item selection from catalog or free-form entry
- [ ] Set urgency level (Low, Normal, High, Critical)
- [ ] Route to appropriate approver based on department/amount
- [ ] Approve, reject, or modify requisitions
- [ ] Convert approved requisitions to purchase orders
- [ ] Consolidate multiple requisitions into single PO
- [ ] Track requisition status through lifecycle
- [ ] Notify requesters of status changes
- [ ] Optional budget checking before approval

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/requisitions` | `order:read` | List requisitions |
| GET | `/api/vendors/requisitions/:id` | `order:read` | Get requisition details |
| POST | `/api/vendors/requisitions` | `order:request` | Create requisition |
| PUT | `/api/vendors/requisitions/:id` | `order:request` | Update requisition |
| DELETE | `/api/vendors/requisitions/:id` | `order:request` | Delete requisition |
| POST | `/api/vendors/requisitions/:id/approve` | `order:approve` | Approve requisition |
| POST | `/api/vendors/requisitions/:id/reject` | `order:approve` | Reject requisition |
| POST | `/api/vendors/requisitions/:id/convert` | `order:create` | Convert to PO |
| GET | `/api/vendors/requisitions/pending` | `order:approve` | Pending approvals |
| GET | `/api/vendors/requisitions/my` | `order:request` | My requisitions |

---

## Data Model

```prisma
model Requisition {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Requisition Details
  requisitionNumber String @unique
  requestedBy   String   @db.ObjectId
  department    String?

  // Dates
  requestDate   DateTime @default(now())
  neededByDate  DateTime?

  // Priority
  urgency       UrgencyLevel @default(NORMAL)

  // Status
  status        RequisitionStatus @default(PENDING)

  // Approval
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?
  rejectionReason String?

  // Conversion
  purchaseOrderId String? @db.ObjectId

  // Notes
  notes         String?
  justification String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  items         RequisitionItem[]

  @@index([clinicId])
  @@index([requisitionNumber])
  @@index([requestedBy])
  @@index([status])
}

model RequisitionItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  requisitionId String   @db.ObjectId

  // Item Details
  itemCode      String?
  description   String
  quantity      Decimal
  unit          String   @default("EA")
  estimatedCost Decimal?

  // Suggested Vendor
  suggestedVendorId String? @db.ObjectId

  @@index([requisitionId])
}

enum UrgencyLevel {
  LOW
  NORMAL
  HIGH
  CRITICAL
}

enum RequisitionStatus {
  PENDING
  APPROVED
  REJECTED
  CONVERTED
  CANCELLED
}
```

---

## Business Rules

- Requisition numbers: REQ-{YEAR}-{SEQUENCE}
- All staff can create requisitions (order:request permission)
- Routing based on department or estimated total
- Urgency affects prioritization, not approval workflow
- Critical urgency sends immediate notification to approver
- Approver can modify items/quantities before approval
- Rejected requisitions include rejection reason
- Approved requisitions must be converted within 30 days
- Multiple requisitions can combine into one PO
- Requester notified of all status changes

---

## Dependencies

**Depends On:**
- Vendor Profile Management (suggested vendors)
- Authentication & Authorization (requester, approver)
- Email Service (notifications)

**Required By:**
- Purchase Orders (conversion target)

---

## Notes

- Quick reorder from previous requisitions
- Department budgets can limit requisition approval
- Recurring requisitions for regular supply needs
- Mobile-friendly for clinical staff submissions
- Integration with inventory for low-stock alerts

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
