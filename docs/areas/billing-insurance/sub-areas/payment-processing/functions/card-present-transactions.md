# Card-Present Transactions

> **Sub-Area**: [Payment Processing](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Card-Present Transactions processes in-office payments using integrated card readers. This function supports Stripe Terminal and Square Reader devices for EMV chip cards, contactless/NFC payments (Apple Pay, Google Pay, tap-to-pay), and magnetic stripe fallback. It provides a seamless checkout experience at the front desk.

---

## Core Requirements

- [ ] Stripe Terminal / Square Reader integration
- [ ] EMV chip card processing
- [ ] Contactless/NFC payments (tap to pay)
- [ ] Magnetic stripe fallback
- [ ] PIN debit support
- [ ] Multiple readers per location
- [ ] Offline payment mode for connectivity issues
- [ ] Real-time payment status updates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/terminal/readers` | `payment:read` | List connected readers |
| POST | `/api/terminal/readers/:id/connect` | `payment:process` | Connect/wake reader |
| POST | `/api/terminal/readers/:id/disconnect` | `payment:process` | Disconnect reader |
| POST | `/api/terminal/collect` | `payment:process` | Start payment collection |
| POST | `/api/terminal/cancel` | `payment:process` | Cancel collection |
| POST | `/api/terminal/process` | `payment:process` | Process collected payment |
| GET | `/api/terminal/readers/:id/status` | `payment:read` | Get reader status |

---

## Data Model

```prisma
model CardReader {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Reader info
  name          String   // e.g., "Front Desk Reader 1"
  serialNumber  String
  deviceType    CardReaderType
  gateway       PaymentGateway

  // Gateway reference
  gatewayReaderId String  // Stripe terminal ID or Square device ID

  // Status
  status        ReaderStatus @default(OFFLINE)
  lastSeenAt    DateTime?
  firmwareVersion String?

  // Location
  locationId    String?  @db.ObjectId  // For multi-location clinics
  locationName  String?

  // Configuration
  isDefault     Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([serialNumber])
  @@index([status])
}

model TerminalTransaction {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  readerId      String   @db.ObjectId

  // Transaction details
  paymentIntentId String?  // Gateway payment intent
  amount          Decimal
  currency        String   @default("USD")
  status          TerminalTransactionStatus @default(PENDING)

  // Card details (masked)
  cardBrand       String?
  cardLast4       String?
  entryMethod     CardEntryMethod?

  // Result
  completedAt     DateTime?
  cancelledAt     DateTime?
  errorCode       String?
  errorMessage    String?

  // Associated payment
  paymentId       String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic     @relation(fields: [clinicId], references: [id])
  reader    CardReader @relation(fields: [readerId], references: [id])

  @@index([clinicId])
  @@index([readerId])
  @@index([paymentIntentId])
  @@index([status])
}

enum CardReaderType {
  STRIPE_WISPOS_E
  STRIPE_BBPOS_CHIPPER
  STRIPE_VERIFONE_P400
  SQUARE_READER
  SQUARE_TERMINAL
}

enum ReaderStatus {
  ONLINE
  OFFLINE
  BUSY
  ERROR
}

enum TerminalTransactionStatus {
  PENDING
  COLLECTING
  PROCESSING
  COMPLETED
  CANCELLED
  FAILED
}

enum CardEntryMethod {
  CHIP
  CONTACTLESS
  SWIPE
  MANUAL_KEY
}
```

---

## Business Rules

- Reader must be online before starting collection
- Chip insertion preferred; contactless next; swipe as fallback
- Transaction timeout after 60 seconds of inactivity
- Failed transactions logged for troubleshooting
- Offline payments queued and processed when connectivity restored
- Receipt printed or emailed immediately after payment
- Daily reader status check required

---

## Dependencies

**Depends On:**
- Payment Gateway Integration (gateway connection)
- Card Reader hardware (physical devices)

**Required By:**
- Payment Processing (payment records)
- Digital Receipts (receipt generation)
- Practice Orchestration (checkout workflow)

---

## Notes

- Stripe Terminal SDK for reader communication
- Support reader firmware updates through admin interface
- Track transaction times for checkout efficiency metrics
- Consider reader rental vs. purchase economics
- Implement sound/visual feedback for payment status

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
