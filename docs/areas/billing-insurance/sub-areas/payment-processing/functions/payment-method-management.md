# Payment Method Management

> **Sub-Area**: [Payment Processing](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Payment Method Management securely stores and manages patient payment methods using gateway tokenization. Cards are tokenized by the payment gateway so Orca never stores actual card numbers. This function enables convenient recurring payments, quick checkout, and card-on-file billing while maintaining PCI-DSS compliance.

---

## Core Requirements

- [ ] Tokenized card storage via payment gateway
- [ ] Save cards during checkout (with consent)
- [ ] Support multiple payment methods per patient
- [ ] Set default payment method
- [ ] Card expiration tracking and notifications
- [ ] Automatic card updater integration
- [ ] ACH/bank account tokenization
- [ ] Secure display of masked card details

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/patients/:id/payment-methods` | `payment:read` | List stored methods |
| POST | `/api/patients/:id/payment-methods` | `payment:create` | Add payment method |
| PUT | `/api/patients/:id/payment-methods/:methodId` | `payment:update` | Update method details |
| DELETE | `/api/patients/:id/payment-methods/:methodId` | `payment:delete` | Remove method |
| POST | `/api/patients/:id/payment-methods/:methodId/default` | `payment:update` | Set as default |
| GET | `/api/payment-methods/expiring` | `payment:read` | List expiring cards |

---

## Data Model

```prisma
model PaymentMethod {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Gateway reference
  gateway       PaymentGateway
  gatewayCustomerId String?  // Stripe customer ID
  gatewayMethodId   String?  // Stripe payment method ID

  // Card details (masked, from gateway)
  type          PaymentMethodType
  cardBrand     String?  // visa, mastercard, amex, discover
  cardLast4     String?
  cardExpMonth  Int?
  cardExpYear   Int?

  // Bank account (for ACH)
  bankName      String?
  bankLast4     String?
  accountType   BankAccountType?

  // Billing address
  billingName   String?
  billingAddress Address?

  // Settings
  isDefault     Boolean  @default(false)
  nickname      String?  // e.g., "Personal Visa"

  // Status
  status        PaymentMethodStatus @default(ACTIVE)
  expirationWarningsSent Int @default(0)

  // Consent
  consentedAt   DateTime?
  consentMethod String?  // "checkout", "portal", "phone"

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  patient   Patient   @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([gatewayMethodId])
  @@index([status])
  @@index([cardExpYear, cardExpMonth])
}

enum PaymentMethodType {
  CREDIT_CARD
  DEBIT_CARD
  ACH
  OTHER
}

enum BankAccountType {
  CHECKING
  SAVINGS
}

enum PaymentMethodStatus {
  ACTIVE
  EXPIRED
  INVALID
  REMOVED
}
```

---

## Business Rules

- Patient consent required before saving payment method
- Only one default payment method per patient
- Expired cards marked as EXPIRED status, not deleted
- Card expiration warning sent 30 days before expiration
- Invalid cards (declined) marked for update
- ACH requires bank account verification before use
- Deleted methods soft-deleted for audit trail
- Automatic card updater runs monthly (if supported by gateway)

---

## Dependencies

**Depends On:**
- Payment Gateway Integration (tokenization)
- Patient Management (patient records)

**Required By:**
- Card-Not-Present Transactions (saved card payments)
- Recurring Billing Engine (automatic charges)
- Payment Plan Builder (auto-pay setup)

---

## Notes

- Use Stripe SetupIntents for secure card saving
- Implement card brand icons for visual display
- Track card update success rate for gateway comparison
- Consider wallet support (Apple Pay, Google Pay tokens)
- Comply with card network rules for card-on-file

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
