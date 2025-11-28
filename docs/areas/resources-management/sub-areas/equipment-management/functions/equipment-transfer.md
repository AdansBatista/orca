# Equipment Transfer

> **Sub-Area**: [Equipment Management](../) | **Status**: 📋 Planned | **Priority**: Low

---

## Overview

Equipment Transfer manages the movement of equipment between clinic locations in multi-location practices. The system handles transfer requests, approval workflows, in-transit tracking, and location updates upon receipt. This supports efficient resource allocation across locations, temporary equipment loans, and centralized equipment sharing for specialized or expensive devices.

---

## Core Requirements

- [ ] Initiate transfer requests from source to destination location
- [ ] Support approval workflow for transfers
- [ ] Track transfer type (permanent, loan, return from loan)
- [ ] Monitor equipment in transit status
- [ ] Update equipment location records upon receipt
- [ ] Generate transfer documentation
- [ ] Maintain complete transfer history per equipment
- [ ] Handle equipment loans with expected return dates
- [ ] View equipment distribution across all locations
- [ ] Support urgent/priority transfers

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/resources/equipment/:id/transfer` | `equipment:transfer` | Request transfer |
| GET | `/api/resources/equipment/transfers` | `equipment:read` | List all transfers |
| GET | `/api/resources/equipment/transfers/:transferId` | `equipment:read` | Get transfer details |
| PUT | `/api/resources/equipment/transfers/:transferId` | `equipment:transfer` | Update transfer status |
| POST | `/api/resources/equipment/transfers/:transferId/approve` | `equipment:transfer` | Approve transfer |
| POST | `/api/resources/equipment/transfers/:transferId/reject` | `equipment:transfer` | Reject transfer |
| POST | `/api/resources/equipment/transfers/:transferId/ship` | `equipment:transfer` | Mark as shipped |
| POST | `/api/resources/equipment/transfers/:transferId/receive` | `equipment:transfer` | Mark as received |

---

## Data Model

```prisma
model EquipmentTransfer {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  equipmentId     String   @db.ObjectId

  // Transfer details
  transferType    TransferType
  fromClinicId    String   @db.ObjectId
  toClinicId      String   @db.ObjectId

  // For loans
  isLoan          Boolean  @default(false)
  expectedReturnDate DateTime?

  // Status workflow
  status          TransferStatus @default(REQUESTED)

  // Dates
  requestedDate   DateTime @default(now())
  approvedDate    DateTime?
  shippedDate     DateTime?
  receivedDate    DateTime?

  // People
  requestedBy     String   @db.ObjectId
  approvedBy      String?  @db.ObjectId
  shippedBy       String?  @db.ObjectId
  receivedBy      String?  @db.ObjectId
  rejectedBy      String?  @db.ObjectId

  // Reason and notes
  reason          String?
  notes           String?
  rejectionReason String?

  // Shipping
  shippingMethod  String?
  trackingNumber  String?
  carrierName     String?

  // Condition tracking
  conditionAtShip String?
  conditionAtReceipt String?
  damageNotes     String?

  // Priority
  isUrgent        Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  equipment   Equipment @relation(fields: [equipmentId], references: [id])
  fromClinic  Clinic    @relation("TransferFrom", fields: [fromClinicId], references: [id])
  toClinic    Clinic    @relation("TransferTo", fields: [toClinicId], references: [id])

  @@index([equipmentId])
  @@index([fromClinicId])
  @@index([toClinicId])
  @@index([status])
  @@index([requestedDate])
}

enum TransferType {
  PERMANENT   // Permanent relocation
  LOAN        // Temporary loan
  RETURN      // Return from loan
}

enum TransferStatus {
  REQUESTED   // Transfer requested
  APPROVED    // Approved by receiving location
  REJECTED    // Rejected by receiving location
  PREPARING   // Being prepared for shipping
  IN_TRANSIT  // Shipped, in transit
  RECEIVED    // Received at destination
  CANCELLED   // Cancelled before completion
}
```

---

## Business Rules

- Transfers require approval from receiving location (clinic admin or designated)
- Equipment clinicId updated only upon receipt confirmation
- Loans create automatic reminder for return date
- Equipment in active repair cannot be transferred
- Urgent transfers skip approval if configured by super admin
- Transfer history maintained indefinitely for audit purposes
- Equipment condition must be documented at ship and receipt
- Damage during transit triggers incident report

---

## Dependencies

**Depends On:**
- Equipment Catalog (equipment must exist)
- Multi-clinic Setup (requires multiple clinic locations)
- Auth & Authorization (user authentication, cross-clinic permissions)

**Required By:**
- Equipment Location Tracking (updates location)
- Equipment History (transfer events logged)

---

## Notes

- Super admin has visibility across all locations for equipment allocation decisions
- Consider integration with shipping carriers for tracking
- Transfer documentation should be printable for physical shipment
- Email notifications to source and destination clinic admins
- Dashboard should show equipment on loan and return dates
- Consider equipment value threshold for automatic approval

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
