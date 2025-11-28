# Contact Management

> **Sub-Area**: [Vendor Profiles](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Contact Management enables practices to maintain multiple contact persons per vendor with specific roles and communication preferences. This function supports role-based contact designation (sales, support, billing, account manager, emergency) allowing staff to quickly find the right person for any vendor interaction. Primary contact designation ensures efficient communication workflows.

---

## Core Requirements

- [ ] Add, edit, and remove contact persons for each vendor
- [ ] Support multiple contact types (General, Sales, Support, Billing, Technical, etc.)
- [ ] Designate one primary contact per vendor
- [ ] Store complete contact information (email, phone, mobile, fax)
- [ ] Record contact title and role within vendor organization
- [ ] Add notes and communication preferences per contact
- [ ] Search and filter contacts across all vendors
- [ ] Display contacts organized by vendor and role
- [ ] Track contact communication history (optional enhancement)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/:id/contacts` | `vendor:read` | List vendor contacts |
| POST | `/api/vendors/:id/contacts` | `vendor:update` | Add new contact |
| PUT | `/api/vendors/contacts/:contactId` | `vendor:update` | Update contact |
| DELETE | `/api/vendors/contacts/:contactId` | `vendor:update` | Delete contact |
| PUT | `/api/vendors/contacts/:contactId/primary` | `vendor:update` | Set as primary contact |

---

## Data Model

```prisma
model VendorContact {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  vendorId      String   @db.ObjectId

  // Contact Information
  firstName     String
  lastName      String
  title         String?
  email         String?
  phone         String?
  mobile        String?
  fax           String?

  // Role
  contactType   VendorContactType @default(GENERAL)
  isPrimary     Boolean  @default(false)

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  vendor        Vendor   @relation(fields: [vendorId], references: [id])

  @@index([vendorId])
  @@index([contactType])
}

enum VendorContactType {
  GENERAL
  SALES
  SUPPORT
  BILLING
  TECHNICAL
  ACCOUNT_MANAGER
  EMERGENCY
  EXECUTIVE
}
```

---

## Business Rules

- Each vendor should have at least one contact (recommended)
- Only one contact per vendor can be designated as primary
- Setting a new primary contact automatically removes primary flag from previous
- Deleting a primary contact should prompt for new primary selection
- Contact types help route communications to appropriate person
- Emergency contacts should include after-hours phone numbers

---

## Dependencies

**Depends On:**
- Vendor Profile Management (parent vendor record)

**Required By:**
- Contract Management (contract signing contacts)
- Order Management (order-related communications)
- Vendor Performance (issue communications)

---

## Notes

- Consider click-to-call/email integration for quick communication
- Mobile numbers useful for urgent communications
- Emergency contacts critical for service vendors (IT, equipment repair)
- Future enhancement: communication history logging

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
