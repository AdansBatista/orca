# Lab Order Creation

> **Sub-Area**: [Lab Orders](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Lab Order Creation enables clinicians and staff to create new lab orders for patients, selecting products, configuring specifications, attaching digital files, and submitting to orthodontic labs. Orders can be linked to treatment plans and patient appointments to ensure lab work arrives when needed.

---

## Core Requirements

- [ ] Create orders from patient record or treatment plan context
- [ ] Support multiple items per order (e.g., upper and lower retainers)
- [ ] Auto-populate patient demographics and treatment context
- [ ] Select lab vendor (manual or via preference rules)
- [ ] Calculate estimated cost from fee schedules
- [ ] Link orders to treatment milestones and appointments
- [ ] Save orders as drafts before submission
- [ ] Generate unique clinic order numbers

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/orders` | `lab:track` | List lab orders with filters |
| GET | `/api/lab/orders/:id` | `lab:track` | Get order details |
| POST | `/api/lab/orders` | `lab:create_order` | Create new order |
| PUT | `/api/lab/orders/:id` | `lab:create_order` | Update draft order |
| POST | `/api/lab/orders/:id/submit` | `lab:submit_order` | Submit order to lab |
| POST | `/api/lab/orders/:id/cancel` | `lab:create_order` | Cancel order |
| GET | `/api/lab/orders/patient/:patientId` | `lab:track` | Get patient's orders |

---

## Data Model

```prisma
model LabOrder {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  patientId       String   @db.ObjectId

  orderNumber     String   @unique
  externalOrderId String?
  vendorId        String   @db.ObjectId

  status          LabOrderStatus @default(DRAFT)
  priority        OrderPriority @default(STANDARD)
  isRush          Boolean  @default(false)

  orderDate       DateTime @default(now())
  submittedAt     DateTime?
  neededByDate    DateTime?

  treatmentId     String?  @db.ObjectId
  appointmentId   String?  @db.ObjectId

  subtotal        Decimal  @default(0)
  totalCost       Decimal  @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  createdBy       String   @db.ObjectId

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}
```

---

## Business Rules

- Every order must be associated with a patient and clinic
- Orders can only be edited while in DRAFT status
- Vendor must be selected before submission
- Due dates cannot be before product turnaround time
- Order numbers are auto-generated and unique per clinic

---

## Dependencies

**Depends On:**
- Auth & Authorization (user permissions)
- Lab Vendor Management (vendor/product catalog)
- Imaging Management (for file attachments)

**Required By:**
- Order Tracking (tracks submitted orders)
- Quality & Remakes (inspection of received items)

---

## Notes

- Support auto-order suggestions from treatment milestones
- Consider batch creation for common multi-item orders
- Integrate with practice management for appointment linking

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
