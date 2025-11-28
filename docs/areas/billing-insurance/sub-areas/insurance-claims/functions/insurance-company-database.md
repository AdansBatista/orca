# Insurance Company Database

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Insurance Company Database maintains a comprehensive database of insurance companies and their orthodontic benefit structures. This serves as the master reference for insurance payer information including electronic submission requirements, contact details, and orthodontic-specific payment patterns. Accurate payer data is essential for successful claims submission and payment posting.

---

## Core Requirements

- [ ] Store insurance company master data (name, addresses, phone, fax, email)
- [ ] Maintain electronic payer IDs for clearinghouse submission
- [ ] Track orthodontic benefit structures and payment patterns
- [ ] Store submission requirements per payer (attachments, forms)
- [ ] Maintain clearinghouse routing information
- [ ] Track payer-specific rules and exceptions
- [ ] Support bulk import from clearinghouse payer lists
- [ ] Track payer performance metrics (payment speed, denial rates)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/insurance/companies` | `insurance:read` | List insurance companies |
| GET | `/api/insurance/companies/:id` | `insurance:read` | Get company details |
| POST | `/api/insurance/companies` | `insurance:create` | Add new company |
| PUT | `/api/insurance/companies/:id` | `insurance:update` | Update company |
| DELETE | `/api/insurance/companies/:id` | `insurance:delete` | Soft delete company |
| GET | `/api/insurance/companies/search` | `insurance:read` | Search by name or payer ID |
| POST | `/api/insurance/companies/import` | `insurance:create` | Bulk import payers |

---

## Data Model

```prisma
model InsuranceCompany {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Company info
  name          String
  payerId       String      // Electronic payer ID
  type          InsuranceType @default(DENTAL)

  // Contact
  phone         String?
  fax           String?
  email         String?
  website       String?

  // Addresses
  claimsAddress    Address?
  customerService  Address?

  // Electronic submission
  clearinghouseId  String?
  supportsEligibility Boolean @default(true)
  supportsEdi837   Boolean @default(true)
  supportsEdi835   Boolean @default(true)

  // Ortho-specific
  orthoPaymentType OrthoPaymentType @default(MONTHLY)
  requiresPreauth  Boolean @default(false)
  typicalOrthoMax  Decimal?
  orthoAgeLimit    Int?

  // Notes
  notes         String?
  submissionNotes String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic  @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([payerId])
  @@index([name])
}

enum InsuranceType {
  DENTAL
  MEDICAL
  DISCOUNT_PLAN
}

enum OrthoPaymentType {
  LUMP_SUM        // Pays full amount at start
  MONTHLY         // Pays monthly during treatment
  QUARTERLY       // Pays quarterly
  MILESTONE       // Pays at treatment milestones
  COMPLETION      // Pays at treatment completion
}
```

---

## Business Rules

- Payer ID must be unique within the clinic
- Company cannot be deleted if active patient insurances reference it
- Electronic submission capabilities validated against clearinghouse
- Ortho payment type affects claim submission frequency
- Pre-authorization requirement triggers workflow for affected patients
- Notes field captures payer-specific quirks and workarounds

---

## Dependencies

**Depends On:**
- Auth & Authorization (user permissions)
- Clearinghouse Integration (payer validation)

**Required By:**
- Patient Insurance Management (insurance selection)
- Eligibility Verification (payer routing)
- Claims Submission (payer requirements)

---

## Notes

- Consider seeding with common insurance companies during clinic setup
- Integrate with clearinghouse payer list updates (monthly refresh)
- Track which payers are most used by the clinic for quick access
- Store payer logo for statement/document display

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
