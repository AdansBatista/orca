# Vendor Status

> **Sub-Area**: [Vendor Profiles](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Vendor Status manages the vendor lifecycle including approval workflows, status transitions, holds, and deactivation. This function controls which vendors can receive orders, ensuring only approved vendors with valid credentials are used for procurement. It provides status-based restrictions, approval workflows for new vendors, and maintains complete audit history of all status changes.

---

## Core Requirements

- [ ] Implement new vendor approval workflow
- [ ] Support status transitions (Pending, Active, Inactive, Suspended, Blocked)
- [ ] Enforce ordering restrictions based on vendor status
- [ ] Manage preferred vendor designation
- [ ] Implement vendor hold functionality with reason tracking
- [ ] Support deactivation with history retention
- [ ] Provide reactivation workflow for inactive vendors
- [ ] Maintain audit trail of all status changes
- [ ] Generate notifications for status changes
- [ ] Dashboard of vendors by status

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/vendors/:id/approve` | `vendor:approve` | Approve vendor |
| PUT | `/api/vendors/:id/status` | `vendor:update` | Update vendor status |
| POST | `/api/vendors/:id/suspend` | `vendor:update` | Suspend vendor |
| POST | `/api/vendors/:id/reactivate` | `vendor:update` | Reactivate vendor |
| PUT | `/api/vendors/:id/preferred` | `vendor:update` | Toggle preferred status |
| GET | `/api/vendors/pending-approval` | `vendor:read` | List pending approvals |
| GET | `/api/vendors/by-status/:status` | `vendor:read` | List by status |

---

## Data Model

```prisma
// Status fields within Vendor model
model Vendor {
  // ... other fields

  // Status
  status        VendorStatus @default(PENDING_APPROVAL)
  isPreferred   Boolean  @default(false)
  isApproved    Boolean  @default(false)
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // ... relations
}

enum VendorStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_APPROVAL
  BLOCKED
}

// Status Change Audit (could be part of general audit log)
model VendorStatusHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  vendorId      String   @db.ObjectId

  previousStatus VendorStatus
  newStatus     VendorStatus
  reason        String?

  changedBy     String   @db.ObjectId
  changedAt     DateTime @default(now())

  @@index([vendorId])
  @@index([changedAt])
}
```

---

## Business Rules

- New vendors start in PENDING_APPROVAL status
- Approval requires: complete business info, at least one contact, W-9 on file
- Only ACTIVE vendors can receive new purchase orders
- SUSPENDED vendors: existing orders continue, no new orders
- BLOCKED vendors: no orders, typically used for serious issues
- INACTIVE vendors: voluntary deactivation, can be reactivated
- Preferred vendors shown first in vendor selection
- Status changes require reason documentation
- High-value vendors may require additional approval levels

---

## Dependencies

**Depends On:**
- Vendor Profile Management (vendor record)
- Credential Tracking (approval prerequisites)
- Tax Documentation (W-9 requirement)
- Authentication & Authorization (approver permissions)

**Required By:**
- Order Management (ordering restrictions)
- Contract Management (active vendor requirement)

---

## Notes

- Consider approval delegation for vacations
- Automatic status changes based on credential expiration
- Bulk status update for vendor cleanup
- Status history visible in vendor profile
- Email notifications for status changes
- Dashboard KPIs: pending approvals, suspended vendors

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
