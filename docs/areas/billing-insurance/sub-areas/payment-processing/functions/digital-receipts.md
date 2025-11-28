# Digital Receipts

> **Sub-Area**: [Payment Processing](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Digital Receipts generates and delivers payment receipts through multiple channels. This function creates professional receipts immediately after payment, delivers them via email, SMS, or print, supports receipt retrieval and resending, and maintains an audit trail of all receipt activity. Receipts include clinic branding and all required transaction details.

---

## Core Requirements

- [ ] Generate receipts automatically after payment
- [ ] Email receipt delivery
- [ ] SMS receipt link delivery
- [ ] Print receipt option
- [ ] Receipt retrieval for patient/staff
- [ ] Resend capability
- [ ] Custom clinic branding on receipts
- [ ] Receipt audit trail

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/receipts` | `payment:read` | List receipts |
| GET | `/api/receipts/:id` | `payment:read` | Get receipt details |
| GET | `/api/receipts/:id/pdf` | `payment:read` | Download receipt PDF |
| POST | `/api/receipts/:id/send` | `payment:update` | Resend receipt |
| POST | `/api/payments/:id/receipt` | `payment:create` | Generate receipt |
| GET | `/api/patients/:id/receipts` | `payment:read` | Patient's receipts |

---

## Data Model

```prisma
model Receipt {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  paymentId     String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Receipt identification
  receiptNumber String   @unique
  receiptDate   DateTime

  // Payment summary
  amount        Decimal
  paymentMethod String   // "Visa ****1234"
  transactionId String?  // Gateway transaction ID

  // Content
  lineItems     ReceiptLineItem[]
  receiptUrl    String?  // Generated PDF URL

  // Delivery tracking
  deliveries    ReceiptDelivery[]

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  payment   Payment  @relation(fields: [paymentId], references: [id])
  patient   Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([paymentId])
  @@index([patientId])
  @@index([receiptNumber])
}

type ReceiptLineItem {
  description   String
  amount        Decimal
  invoiceNumber String?
}

model ReceiptDelivery {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  receiptId     String   @db.ObjectId

  // Delivery details
  method        DeliveryMethod
  sentTo        String   // Email, phone, or "printed"
  sentAt        DateTime

  // Tracking
  deliveryStatus DeliveryStatus @default(SENT)
  deliveredAt   DateTime?
  openedAt      DateTime?
  failureReason String?

  // Audit
  sentBy        String?  @db.ObjectId

  // Relations
  receipt    Receipt @relation(fields: [receiptId], references: [id])

  @@index([receiptId])
  @@index([sentAt])
}

enum DeliveryMethod {
  EMAIL
  SMS
  PRINT
  PORTAL
}

enum DeliveryStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  FAILED
  BOUNCED
}
```

---

## Business Rules

- Receipt generated automatically for all completed payments
- Default delivery method based on patient preference
- Receipt includes: clinic info, patient name, date, amount, payment method (masked), transaction ID
- Email receipts sent immediately after payment
- Printed receipts available on-demand at front desk
- Receipt resend limited to prevent spam
- Receipts retained for 7 years (regulatory requirement)
- Tax ID included on receipt for HSA/FSA claims

---

## Dependencies

**Depends On:**
- Payment Processing (payment data)
- Patient Communications (email/SMS delivery)
- PDF Generation service

**Required By:**
- Practice Orchestration (checkout workflow)
- Patient Portal (receipt viewing)

---

## Notes

- Generate PDF using React PDF or similar library
- Track email open rates for analytics
- Consider receipt templates for different payment types
- Include QR code linking to patient portal
- Support receipt batch printing for end-of-day

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
