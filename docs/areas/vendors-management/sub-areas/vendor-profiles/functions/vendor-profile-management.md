# Vendor Profile Management

> **Sub-Area**: [Vendor Profiles](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Vendor Profile Management provides comprehensive vendor record creation and maintenance for orthodontic practices. This function enables practices to maintain complete vendor demographics, business information, payment terms, and multi-location assignments. It serves as the foundation for all vendor-related operations including ordering, contracting, and performance tracking.

---

## Core Requirements

- [ ] Create and maintain complete vendor profiles with business information
- [ ] Support multiple vendor types (Supplier, Service Provider, Contractor, Laboratory, etc.)
- [ ] Assign vendors to categories (Orthodontic Supplies, Lab Services, Equipment, etc.)
- [ ] Configure payment terms and preferred payment methods
- [ ] Manage bank account information for ACH/wire payments
- [ ] Set credit limits and preferred vendor designation
- [ ] Assign vendors to specific clinic locations or all locations
- [ ] Auto-generate unique vendor codes with category prefix
- [ ] Support soft delete with full audit trail
- [ ] Implement vendor search and filtering by multiple criteria

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors` | `vendor:read` | List vendors with filters |
| GET | `/api/vendors/:id` | `vendor:read` | Get vendor profile |
| POST | `/api/vendors` | `vendor:create` | Create new vendor |
| PUT | `/api/vendors/:id` | `vendor:update` | Update vendor profile |
| DELETE | `/api/vendors/:id` | `vendor:delete` | Soft delete vendor |
| GET | `/api/vendors/search` | `vendor:read` | Search vendors |
| GET | `/api/vendors/categories/:category` | `vendor:read` | Get vendors by category |

---

## Data Model

```prisma
model Vendor {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Basic Information
  name          String
  legalName     String?
  vendorCode    String   @unique
  vendorType    VendorType
  categories    VendorCategoryType[]

  // Contact Information
  email         String?
  phone         String?
  fax           String?
  website       String?
  address       Address?

  // Business Information
  taxId         String?
  dunsNumber    String?
  businessType  BusinessType?

  // Payment Information
  paymentTerms  PaymentTerms @default(NET_30)
  paymentMethod PreferredPaymentMethod?
  bankAccount   BankAccount?
  creditLimit   Decimal?

  // Status
  status        VendorStatus @default(ACTIVE)
  isPreferred   Boolean  @default(false)
  isApproved    Boolean  @default(false)

  // Multi-Location
  assignedClinicIds String[] @db.ObjectId

  // Notes
  notes         String?
  internalNotes String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  contacts      VendorContact[]
  credentials   VendorCredential[]
  documents     VendorDocument[]

  @@index([clinicId])
  @@index([vendorCode])
  @@index([status])
  @@index([vendorType])
  @@index([isPreferred])
}
```

---

## Business Rules

- Vendor codes auto-generated with category prefix (e.g., SUP-001, LAB-001)
- Vendor names must be unique within the organization
- New vendors default to PENDING_APPROVAL status
- Orders cannot be placed with inactive, suspended, or blocked vendors
- Payment information required before any payment processing
- Multi-location vendors can be assigned to all or specific locations
- All vendor changes logged to audit trail

---

## Dependencies

**Depends On:**
- Authentication & Authorization (user context, permissions)
- Document Storage (for internal notes attachments)

**Required By:**
- Contact Management
- Credential Tracking
- Tax Documentation
- Vendor Status
- Contract Management
- Order Management
- Vendor Performance

---

## Notes

- Vendor codes should follow format: {CATEGORY_PREFIX}-{SEQUENCE_NUMBER}
- Bank account information must be encrypted at rest
- Support import/export of vendor data for data migration
- Consider integration with D&B for business verification

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
