# Lab Directory Management

> **Sub-Area**: [Lab Vendor Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Lab Directory Management maintains comprehensive profiles for orthodontic lab partners. Each lab record includes contact information, capabilities, shipping preferences, and portal integration credentials. This serves as the master directory for all lab vendors the practice works with.

---

## Core Requirements

- [ ] Add and edit lab company profiles with full contact details
- [ ] Store multiple contacts per lab (primary, billing, technical)
- [ ] Track lab capabilities (products they manufacture)
- [ ] Configure shipping preferences and addresses
- [ ] Store portal credentials securely (encrypted)
- [ ] Manage active/inactive vendor status
- [ ] Support multi-location labs
- [ ] Track preferred submission method (portal, email, API)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/vendors` | `lab:track` | List lab vendors |
| GET | `/api/lab/vendors/:id` | `lab:track` | Get vendor details |
| POST | `/api/lab/vendors` | `lab:manage_vendors` | Create vendor |
| PUT | `/api/lab/vendors/:id` | `lab:manage_vendors` | Update vendor |
| DELETE | `/api/lab/vendors/:id` | `lab:manage_vendors` | Deactivate vendor |
| GET | `/api/lab/vendors/:id/capabilities` | `lab:track` | Get vendor capabilities |

---

## Data Model

```prisma
model LabVendor {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  name          String
  legalName     String?
  taxId         String?
  website       String?
  accountNumber String?

  status        VendorStatus @default(ACTIVE)
  isPreferred   Boolean  @default(false)

  address       Json     // Street, city, state, zip
  phone         String?
  email         String?

  capabilities  LabProductCategory[]
  specialties   String[]

  shippingCarrier String?
  portalUrl     String?
  credentials   Json?    // Encrypted

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  createdBy     String   @db.ObjectId

  @@index([clinicId])
  @@index([status])
}
```

---

## Business Rules

- Vendor names must be unique within a clinic
- Portal credentials encrypted at rest
- Inactive vendors hidden from order creation but preserved for history
- At least one active vendor required before lab orders can be created
- Capability matrix used for product filtering

---

## Dependencies

**Depends On:**
- Auth & Authorization (vendor management permissions)

**Required By:**
- Lab Orders (vendor selection)
- Pricing & Fee Schedules (pricing per vendor)
- Order Tracking (vendor contact info)
- Performance Metrics (metrics per vendor)

---

## Notes

- Consider lab portal API integrations for status sync
- Store account numbers for order references
- Support vendor-specific order form requirements

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
