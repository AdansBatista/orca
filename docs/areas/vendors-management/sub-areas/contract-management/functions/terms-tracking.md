# Terms Tracking

> **Sub-Area**: [Contract Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Terms Tracking manages specific contract terms, conditions, and obligations within vendor agreements. This function enables practices to track pricing terms, volume discounts, payment conditions, warranties, and other key contract provisions. By capturing terms as structured data, the system can apply contracted pricing to orders and alert on term compliance.

---

## Core Requirements

- [ ] Add and manage individual contract terms
- [ ] Support term types (Pricing, Discount, Warranty, Delivery, etc.)
- [ ] Track term values with units and effective dates
- [ ] Record term expiration for time-limited terms
- [ ] Link terms to parent contract
- [ ] Search terms across contracts for comparison
- [ ] Highlight key terms for quick reference
- [ ] Track obligation terms with compliance status
- [ ] Support amendment of terms with history
- [ ] Export terms for contract review

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/contracts/:id/terms` | `contract:view_terms` | Get contract terms |
| POST | `/api/vendors/contracts/:id/terms` | `contract:update` | Add term |
| PUT | `/api/vendors/contracts/terms/:termId` | `contract:update` | Update term |
| DELETE | `/api/vendors/contracts/terms/:termId` | `contract:update` | Delete term |
| GET | `/api/vendors/contracts/terms/search` | `contract:read` | Search terms |

---

## Data Model

```prisma
model ContractTerm {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  contractId    String   @db.ObjectId

  // Term Details
  termType      ContractTermType
  description   String
  value         Decimal?
  unit          String?
  effectiveDate DateTime?
  expirationDate DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  contract      Contract @relation(fields: [contractId], references: [id])

  @@index([contractId])
  @@index([termType])
}

enum ContractTermType {
  PRICING
  DISCOUNT
  VOLUME_DISCOUNT
  REBATE
  PAYMENT_TERMS
  DELIVERY_TERMS
  WARRANTY
  LIABILITY
  EXCLUSIVITY
  MINIMUM_ORDER
  OTHER
}
```

---

## Business Rules

- Pricing terms should include unit price and unit of measure
- Volume discount terms need tier thresholds defined
- Payment terms integrate with accounts payable
- Warranty terms track coverage period and scope
- Minimum order terms enforced during PO creation
- Terms with expiration dates alert when expiring
- Exclusivity terms flagged for vendor selection decisions
- Changed terms require contract amendment reference

---

## Dependencies

**Depends On:**
- Contract Creation (parent contract)

**Required By:**
- Pricing Agreements (pricing-specific terms)
- Order Management (apply contracted pricing)
- SLA Monitoring (service level terms)

---

## Notes

- Terms serve as structured data extracted from contract documents
- Consider term templates for common contract types
- Pricing terms feed into order pricing calculations
- Volume discount tiers need clear threshold definitions
- Terms comparison tool helpful for renegotiation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
