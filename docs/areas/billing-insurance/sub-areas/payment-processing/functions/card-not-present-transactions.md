# Card-Not-Present Transactions

> **Sub-Area**: [Payment Processing](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Card-Not-Present Transactions processes payments when the card is not physically present. This includes online payments through the patient portal, phone payments with manual card entry, payment links sent via email/SMS, and payments using saved cards on file. It enables patients to pay remotely at their convenience.

---

## Core Requirements

- [ ] Manual card entry for phone payments (PCI-compliant)
- [ ] Payment links via email and SMS
- [ ] QR code payment pages
- [ ] Online patient portal payments
- [ ] Saved card (card on file) payments
- [ ] 3D Secure verification for fraud prevention
- [ ] Address Verification Service (AVS)
- [ ] CVV verification required

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/payments` | `payment:process` | Process CNP payment |
| POST | `/api/payments/card-entry` | `payment:process` | Manual card entry payment |
| POST | `/api/payment-links` | `payment:create` | Create payment link |
| POST | `/api/payment-links/:id/send` | `payment:update` | Send payment link |
| GET | `/api/pay/:code` | `public` | Payment link page |
| POST | `/api/pay/:code/process` | `public` | Process link payment |
| POST | `/api/payments/saved-card` | `payment:process` | Charge saved card |

---

## Data Model

```prisma
model PaymentLink {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Link details
  linkCode      String   @unique  // Short code for URL
  amount        Decimal
  description   String?

  // Options
  allowPartial  Boolean  @default(false)
  minimumAmount Decimal?

  // Related invoices
  invoiceIds    String[] @db.ObjectId

  // Status
  status        PaymentLinkStatus @default(ACTIVE)
  expiresAt     DateTime?

  // Usage tracking
  viewedAt      DateTime?
  viewCount     Int      @default(0)
  paidAt        DateTime?
  paymentId     String?  @db.ObjectId

  // Delivery
  sentVia       DeliveryMethod?
  sentAt        DateTime?
  sentTo        String?  // Email or phone
  deliveryStatus DeliveryStatus?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic         @relation(fields: [clinicId], references: [id])
  patient   Patient        @relation(fields: [patientId], references: [id])
  account   PatientAccount @relation(fields: [accountId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([linkCode])
  @@index([status])
  @@index([expiresAt])
}

enum PaymentLinkStatus {
  ACTIVE
  EXPIRED
  PAID
  CANCELLED
}

enum DeliveryStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
}
```

---

## Business Rules

- CVV required for all manual card entries
- Payment links expire after configurable period (default 7 days)
- 3D Secure triggered for transactions over threshold
- Failed payment attempts limited (3 per hour per IP)
- Partial payments allowed only if explicitly enabled
- Phone payments require verbal authorization recording
- AVS mismatch flags transaction for review
- Payment links single-use (invalidated after payment)

---

## Dependencies

**Depends On:**
- Payment Gateway Integration (payment processing)
- Payment Method Management (saved cards)
- Patient Communications (link delivery)

**Required By:**
- Patient Billing (remote payments)
- Collections Management (payment links in reminders)
- Patient Portal (online payments)

---

## Notes

- Use Stripe Elements or Square Web Payments SDK for PCI compliance
- Implement rate limiting on public payment endpoints
- Track conversion rate (links viewed vs. paid)
- Consider text-to-pay convenience for mobile patients
- Generate QR codes for physical statement inclusion

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
