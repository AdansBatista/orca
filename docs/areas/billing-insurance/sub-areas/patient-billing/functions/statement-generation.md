# Statement Generation

> **Sub-Area**: [Patient Billing](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Statement Generation creates professional patient statements and delivers them through multiple channels. Statements summarize account activity, show current balances, and provide payment instructions. This function supports both automated monthly statement runs and on-demand generation for individual patients.

---

## Core Requirements

- [ ] Generate monthly statements automatically for accounts with balance > $0
- [ ] Support on-demand statement generation for any account
- [ ] Multiple delivery methods (email, print, patient portal)
- [ ] Include payment history and current charges
- [ ] Customizable statement templates with clinic branding
- [ ] Include payment links for online payment
- [ ] Statement versioning and audit trail
- [ ] Batch statement generation for monthly runs

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/billing/statements` | `billing:read` | List statements |
| GET | `/api/billing/statements/:id` | `billing:read` | Get statement details |
| POST | `/api/billing/statements/generate` | `billing:create` | Generate statements (batch) |
| POST | `/api/billing/accounts/:id/statement` | `billing:create` | Generate single statement |
| POST | `/api/billing/statements/:id/send` | `billing:update` | Send statement |
| GET | `/api/billing/statements/:id/pdf` | `billing:read` | Download statement PDF |

---

## Data Model

```prisma
model Statement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Statement details
  statementNumber String   @unique
  statementDate   DateTime
  periodStart     DateTime
  periodEnd       DateTime

  // Amounts
  previousBalance  Decimal
  newCharges       Decimal
  payments         Decimal
  adjustments      Decimal
  currentBalance   Decimal
  amountDue        Decimal
  dueDate          DateTime

  // Delivery
  deliveryMethod   DeliveryMethod
  sentAt           DateTime?
  viewedAt         DateTime?

  // Storage
  documentUrl      String?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic         @relation(fields: [clinicId], references: [id])
  account   PatientAccount @relation(fields: [accountId], references: [id])

  @@index([clinicId])
  @@index([accountId])
  @@index([statementDate])
}
```

---

## Business Rules

- Statements only generated for accounts with balance > $0 (configurable threshold)
- One statement per account per statement period
- Statement date determines which transactions are included
- Late fees (if applicable) calculated before statement generation
- Statements must include required regulatory disclosures
- PDF generated and stored for all statements
- Email delivery requires valid patient email on file

---

## Dependencies

**Depends On:**
- Patient Account Management (account data)
- Patient Communications (email delivery)
- PDF Generation service

**Required By:**
- Collections Management (statement tracking)
- Patient Portal (statement viewing)

---

## Notes

- Implement statement templates using React PDF or similar library
- Consider statement batching for large clinics (100+ patients)
- Track email open rates and link clicks for analytics
- Support statement reprints for front desk requests

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
