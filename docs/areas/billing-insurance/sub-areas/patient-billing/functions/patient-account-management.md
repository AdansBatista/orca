# Patient Account Management

> **Sub-Area**: [Patient Billing](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Patient Account Management creates and manages patient financial accounts, tracks balances, and handles account relationships. Every patient must have a financial account before any billing activity can occur. This function supports complex multi-party scenarios common in orthodontics, including guarantor relationships where a parent pays for a child's treatment.

---

## Core Requirements

- [ ] Create financial accounts automatically when patients are added
- [ ] Track current balance with real-time calculations
- [ ] Support guarantor relationships (parent paying for child)
- [ ] Manage account status (active, suspended, collections, closed)
- [ ] Track insurance vs. patient responsibility separately
- [ ] Calculate and store aging buckets (30/60/90/120+ days)
- [ ] Provide complete transaction history view
- [ ] Support account merging and transfers

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/billing/accounts` | `billing:read` | List patient accounts with filters |
| GET | `/api/billing/accounts/:id` | `billing:read` | Get account details |
| POST | `/api/billing/accounts` | `billing:create` | Create new account |
| PUT | `/api/billing/accounts/:id` | `billing:update` | Update account |
| GET | `/api/billing/accounts/:id/balance` | `billing:read` | Get real-time balance |
| GET | `/api/billing/accounts/:id/history` | `billing:read` | Get transaction history |
| POST | `/api/billing/accounts/:id/link-guarantor` | `billing:update` | Link guarantor to account |

---

## Data Model

```prisma
model PatientAccount {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Account info
  accountNumber String   @unique
  status        PatientAccountStatus @default(ACTIVE)
  accountType   AccountType @default(INDIVIDUAL)

  // Balances (computed fields stored for performance)
  currentBalance    Decimal  @default(0)
  insuranceBalance  Decimal  @default(0)
  patientBalance    Decimal  @default(0)
  creditBalance     Decimal  @default(0)

  // Aging buckets
  aging30    Decimal  @default(0)
  aging60    Decimal  @default(0)
  aging90    Decimal  @default(0)
  aging120   Decimal  @default(0)

  // Relationships
  guarantorId    String?  @db.ObjectId
  familyGroupId  String?  @db.ObjectId

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  patient   Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([accountNumber])
}
```

---

## Business Rules

- Every patient must have exactly one financial account
- Account numbers are auto-generated and clinic-unique
- Balance = Sum(Invoices) - Sum(Payments) - Credits
- Aging calculated from invoice due date, not invoice date
- Minor patients must have a guarantor linked
- Account status changes require appropriate permissions
- Suspended accounts cannot receive new charges

---

## Dependencies

**Depends On:**
- Auth & Authorization (user permissions)
- CRM & Onboarding (patient records)

**Required By:**
- Statement Generation
- Payment Plan Builder
- Payment Processing
- Insurance Claims
- Collections Management

---

## Notes

- Balance recalculation should happen in background jobs to avoid blocking operations
- Consider caching computed balances with TTL for high-traffic accounts
- Audit all balance adjustments for compliance

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
