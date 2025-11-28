# Tax Documentation

> **Sub-Area**: [Vendor Profiles](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Tax Documentation manages W-9, W-8, and other tax-related documents for vendor compliance. This function ensures practices collect and maintain required tax documentation before processing payments, supports 1099 eligibility determination, and tracks document expiration for annual verification. Essential for year-end tax reporting and regulatory compliance.

---

## Core Requirements

- [ ] Collect and store W-9 forms for US vendors
- [ ] Manage W-8 forms for foreign vendors (W-8BEN, W-8BEN-E)
- [ ] Track Tax ID (EIN/SSN) with validation
- [ ] Determine 1099 eligibility based on vendor type and payments
- [ ] Track document dates and annual expiration
- [ ] Upload and store tax document copies
- [ ] Generate reminders for annual document refresh
- [ ] Manage tax exempt certificates and resale certificates
- [ ] Validate TIN matches vendor legal name
- [ ] Support bulk W-9 collection requests

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/:id/documents` | `vendor:read` | List vendor documents |
| POST | `/api/vendors/:id/documents` | `vendor:update` | Upload tax document |
| GET | `/api/vendors/documents/:docId` | `vendor:read` | Download document |
| DELETE | `/api/vendors/documents/:docId` | `vendor:update` | Delete document |
| GET | `/api/vendors/tax/missing-w9` | `vendor:read` | Vendors missing W-9 |
| GET | `/api/vendors/tax/1099-eligible` | `vendor:read` | 1099 eligible vendors |

---

## Data Model

```prisma
model VendorDocument {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Document Details
  documentType  VendorDocumentType
  documentName  String
  description   String?
  fileUrl       String
  fileSize      Int?
  mimeType      String?

  // Dates
  documentDate  DateTime?
  expirationDate DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  vendor        Vendor   @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([documentType])
}

enum VendorDocumentType {
  W9
  W8
  INSURANCE_CERTIFICATE
  CONTRACT
  PRICE_LIST
  PRODUCT_CATALOG
  LICENSE
  CERTIFICATION
  SDS
  SPEC_SHEET
  CORRESPONDENCE
  OTHER
}
```

---

## Business Rules

- W-9 required before first payment to US vendors receiving >$600/year
- W-8 required for all foreign vendors
- Tax documents should be refreshed annually
- TIN on W-9 must match vendor legal name
- 1099 reporting required for non-corporate vendors paid >$600/year
- Corporations (except legal/medical) generally exempt from 1099
- Tax exempt certificates required for tax-free purchases
- Documents must be retained per IRS requirements (7 years)

---

## Dependencies

**Depends On:**
- Vendor Profile Management (parent vendor record, Tax ID field)
- Document Storage (secure file storage)

**Required By:**
- Financial Management (payment processing, 1099 reporting)
- Vendor Status (payment hold if missing W-9)

---

## Notes

- Tax ID field on vendor profile should be encrypted
- Consider TIN verification service integration
- 1099-NEC for services, 1099-MISC for other payments
- Generate annual W-9 update request emails
- Track which documents are required vs optional by vendor type
- State tax exempt certificates may have different requirements

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
