# Payment Processing

> **Area**: [Billing & Insurance](../../)
>
> **Sub-Area**: 11.3 Payment Processing
>
> **Purpose**: Modern payment gateway integration for accepting and processing patient payments

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Billing & Insurance](../../) |
| **Dependencies** | Auth, Patient Billing |
| **Last Updated** | 2024-11-26 |

---

## Overview

Payment Processing replaces traditional POS terminals with modern payment gateway integration. This sub-area handles all aspects of payment collection including card-present transactions (chip, tap, swipe), card-not-present transactions (online, phone, payment links), recurring billing for payment plans, and refund processing.

By integrating directly with payment gateways like Stripe and Square, Orca provides a seamless payment experience while maintaining PCI-DSS compliance through tokenization (no card data stored locally).

### Key Benefits

- **Unified Experience**: Same system for in-office and remote payments
- **Modern Payment Methods**: Support for all major payment types
- **Automatic Reconciliation**: Payments auto-post to patient accounts
- **PCI Compliance**: Gateway handles all card data
- **Lower Costs**: Potential savings over traditional POS rentals

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 11.3.1 | [Payment Gateway Integration](./functions/payment-gateway-integration.md) | Connect to Stripe/Square APIs | 📋 Planned | Critical |
| 11.3.2 | [Card-Present Transactions](./functions/card-present-transactions.md) | In-office card reader payments | 📋 Planned | Critical |
| 11.3.3 | [Card-Not-Present Transactions](./functions/card-not-present-transactions.md) | Online, phone, payment links | 📋 Planned | Critical |
| 11.3.4 | [Payment Method Management](./functions/payment-method-management.md) | Store and manage tokenized cards | 📋 Planned | High |
| 11.3.5 | [Recurring Billing Engine](./functions/recurring-billing-engine.md) | Automated payment plan charges | 📋 Planned | Critical |
| 11.3.6 | [Refund Processing](./functions/refund-processing.md) | Process refunds and voids | 📋 Planned | High |
| 11.3.7 | [Payment Reconciliation](./functions/payment-reconciliation.md) | Match payments to deposits | 📋 Planned | High |
| 11.3.8 | [Digital Receipts](./functions/digital-receipts.md) | Generate and send receipts | 📋 Planned | Medium |

---

## Function Details

### 11.3.1 Payment Gateway Integration

**Purpose**: Establish secure connections to payment processors (Stripe, Square).

**Key Capabilities**:
- Stripe Connect integration
- Square API integration (backup gateway)
- Multi-location support (separate merchant accounts per clinic)
- Webhook handling for payment events
- Gateway health monitoring
- Automatic failover between gateways

**User Stories**:
- As a **super admin**, I want to connect our Stripe account so that we can process payments
- As a **clinic admin**, I want to configure payment gateway settings for my clinic
- As a **system**, I want to failover to backup gateway if primary is unavailable

---

### 11.3.2 Card-Present Transactions

**Purpose**: Process in-office payments using integrated card readers.

**Key Capabilities**:
- Stripe Terminal / Square Reader support
- EMV chip card processing
- Contactless/NFC payments (tap)
- Magnetic stripe fallback
- PIN debit support
- Multiple reader support per location
- Offline payment mode

**User Stories**:
- As a **front desk**, I want to process a chip card payment at checkout
- As a **front desk**, I want to accept tap payments for quick transactions
- As a **front desk**, I want to process payments even when internet is briefly unavailable

---

### 11.3.3 Card-Not-Present Transactions

**Purpose**: Process payments when card is not physically present.

**Key Capabilities**:
- Manual card entry (phone payments)
- Payment links via email/SMS
- QR code payments
- Online payment portal
- Saved card payments (card on file)
- 3D Secure verification
- Address verification (AVS)

**User Stories**:
- As a **billing staff**, I want to send a payment link to a patient so they can pay remotely
- As a **patient**, I want to pay my bill online at my convenience
- As a **front desk**, I want to process a payment over the phone securely

---

### 11.3.4 Payment Method Management

**Purpose**: Securely store and manage patient payment methods.

**Key Capabilities**:
- Tokenized card storage (via gateway)
- Save cards for future use
- Multiple payment methods per patient
- Set default payment method
- Card expiration tracking
- Automatic card updater

**User Stories**:
- As a **front desk**, I want to save a patient's card for their payment plan
- As a **patient**, I want to manage my saved payment methods
- As a **system**, I want to notify patients before their card expires

---

### 11.3.5 Recurring Billing Engine

**Purpose**: Automatically process scheduled payments for payment plans.

**Key Capabilities**:
- Scheduled automatic charges
- Pre-charge notifications to patients
- Failed payment handling and retry
- Grace periods
- Payment plan pause/resume
- Early payoff processing
- Dunning management

**User Stories**:
- As a **patient**, I want my monthly payment charged automatically so I don't have to remember
- As a **billing staff**, I want to be notified when a scheduled payment fails
- As a **system**, I want to retry failed payments on an intelligent schedule

---

### 11.3.6 Refund Processing

**Purpose**: Process refunds and void transactions.

**Key Capabilities**:
- Full refunds to original payment method
- Partial refunds
- Same-day void (no fee)
- Refund reason tracking
- Approval workflow for large refunds
- Refund reconciliation

**User Stories**:
- As a **billing staff**, I want to refund an overpayment to the patient's card
- As a **billing staff**, I want to void a transaction made in error today
- As a **clinic admin**, I want to approve refunds over a certain amount

---

### 11.3.7 Payment Reconciliation

**Purpose**: Match processed payments to bank deposits.

**Key Capabilities**:
- Automatic reconciliation with gateway
- Daily settlement reports
- Bank deposit matching
- Fee tracking and reporting
- Payout schedule visibility
- Discrepancy identification

**User Stories**:
- As a **billing staff**, I want to see which payments are included in today's deposit
- As a **clinic admin**, I want to track payment processing fees
- As a **billing staff**, I want to identify any payment discrepancies

---

### 11.3.8 Digital Receipts

**Purpose**: Generate and deliver payment receipts.

**Key Capabilities**:
- Email receipts automatically
- SMS receipt option
- Print receipts
- Receipt retrieval/resend
- Custom receipt branding
- Receipt audit trail

**User Stories**:
- As a **front desk**, I want to send a receipt to the patient's email after payment
- As a **patient**, I want to receive a text receipt for quick reference
- As a **billing staff**, I want to resend a receipt the patient lost

---

## Data Model

```prisma
model Payment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Payment identification
  paymentNumber    String   @unique
  gatewayPaymentId String?  // Stripe/Square payment ID
  gatewayChargeId  String?  // Stripe/Square charge ID

  // Payment details
  paymentDate      DateTime
  amount           Decimal
  currency         String   @default("USD")
  status           PaymentStatus @default(PENDING)

  // Method
  paymentType      PaymentType
  paymentMethod    PaymentMethodType
  cardBrand        String?  // visa, mastercard, etc.
  cardLast4        String?
  paymentMethodId  String?  @db.ObjectId  // Stored payment method

  // Source
  sourceType       PaymentSourceType
  sourceId         String?  // Invoice, payment plan, etc.

  // Processing
  gateway          PaymentGateway
  transactionType  TransactionType @default(CHARGE)
  captureMethod    CaptureMethod?
  receiptUrl       String?

  // Reconciliation
  settlementId     String?
  settledAt        DateTime?
  depositDate      DateTime?
  processingFee    Decimal?

  // Metadata
  description      String?
  metadata         Json?
  ipAddress        String?
  deviceId         String?

  // Refund tracking
  refundedAmount   Decimal  @default(0)
  isFullyRefunded  Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  processedBy String? @db.ObjectId

  // Relations
  clinic         Clinic         @relation(fields: [clinicId], references: [id])
  account        PatientAccount @relation(fields: [accountId], references: [id])
  patient        Patient        @relation(fields: [patientId], references: [id])
  storedMethod   PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  allocations    PaymentAllocation[]
  refunds        Refund[]
  receipts       Receipt[]

  @@index([clinicId])
  @@index([accountId])
  @@index([patientId])
  @@index([paymentNumber])
  @@index([gatewayPaymentId])
  @@index([status])
  @@index([paymentDate])
  @@index([settlementId])
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
  PARTIALLY_REFUNDED
  DISPUTED
}

enum PaymentType {
  PATIENT      // Patient payment
  INSURANCE    // Insurance payment
  THIRD_PARTY  // Third party (employer, school, etc.)
}

enum PaymentMethodType {
  CREDIT_CARD
  DEBIT_CARD
  ACH
  CASH
  CHECK
  E_TRANSFER
  WIRE
  OTHER
}

enum PaymentSourceType {
  MANUAL       // Manual payment collection
  INVOICE      // Payment on invoice
  PAYMENT_PLAN // Scheduled payment plan charge
  PAYMENT_LINK // Payment link
  PORTAL       // Patient portal
  TERMINAL     // Card reader
}

enum PaymentGateway {
  STRIPE
  SQUARE
  MANUAL       // Cash, check, etc.
}

enum TransactionType {
  CHARGE
  CAPTURE
  VOID
  REFUND
}

enum CaptureMethod {
  AUTOMATIC
  MANUAL       // Pre-auth then capture
}

model PaymentMethod {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Gateway info
  gateway       PaymentGateway
  gatewayCustomerId String?  // Stripe customer ID
  gatewayMethodId   String?  // Stripe payment method ID

  // Card details (masked)
  type          PaymentMethodType
  cardBrand     String?
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
  nickname      String?

  // Status
  status        PaymentMethodStatus @default(ACTIVE)
  expirationWarningsSent Int @default(0)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  patient   Patient   @relation(fields: [patientId], references: [id])
  payments  Payment[]
  paymentPlans PaymentPlan[]

  @@index([clinicId])
  @@index([patientId])
  @@index([gatewayMethodId])
  @@index([status])
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

model PaymentAllocation {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  paymentId   String   @db.ObjectId
  invoiceId   String   @db.ObjectId

  // Allocation details
  amount      Decimal
  allocatedAt DateTime @default(now())
  allocatedBy String?  @db.ObjectId

  // Relations
  payment    Payment  @relation(fields: [paymentId], references: [id])
  invoice    Invoice  @relation(fields: [invoiceId], references: [id])

  @@index([paymentId])
  @@index([invoiceId])
}

model Refund {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  paymentId     String   @db.ObjectId

  // Refund identification
  refundNumber     String   @unique
  gatewayRefundId  String?

  // Refund details
  amount           Decimal
  reason           RefundReason
  reasonDetails    String?
  status           RefundStatus @default(PENDING)

  // Processing
  processedAt      DateTime?
  processedBy      String?  @db.ObjectId

  // Approval (for large refunds)
  requiresApproval Boolean  @default(false)
  approvedAt       DateTime?
  approvedBy       String?  @db.ObjectId
  rejectedAt       DateTime?
  rejectedBy       String?  @db.ObjectId
  rejectionReason  String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  payment   Payment  @relation(fields: [paymentId], references: [id])

  @@index([clinicId])
  @@index([paymentId])
  @@index([refundNumber])
  @@index([status])
}

enum RefundReason {
  OVERPAYMENT
  TREATMENT_CANCELLED
  INSURANCE_ADJUSTMENT
  DUPLICATE_PAYMENT
  PATIENT_REQUEST
  BILLING_ERROR
  OTHER
}

enum RefundStatus {
  PENDING
  PENDING_APPROVAL
  APPROVED
  REJECTED
  PROCESSING
  COMPLETED
  FAILED
}

model PaymentLink {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Link details
  linkCode      String   @unique
  linkUrl       String
  amount        Decimal
  description   String?

  // Options
  allowPartial  Boolean  @default(false)
  minimumAmount Decimal?

  // Related
  invoiceIds    String[] @db.ObjectId

  // Status
  status        PaymentLinkStatus @default(ACTIVE)
  expiresAt     DateTime?

  // Usage
  viewedAt      DateTime?
  paidAt        DateTime?
  paymentId     String?  @db.ObjectId

  // Delivery
  sentVia       DeliveryMethod?
  sentAt        DateTime?
  sentTo        String?  // Email or phone

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
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

model ScheduledPayment {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  paymentPlanId   String   @db.ObjectId
  paymentMethodId String?  @db.ObjectId

  // Schedule
  scheduledDate   DateTime
  amount          Decimal

  // Status
  status          ScheduledPaymentStatus @default(PENDING)

  // Processing
  attemptCount    Int      @default(0)
  lastAttemptAt   DateTime?
  nextAttemptAt   DateTime?
  processedAt     DateTime?

  // Result
  resultPaymentId String?  @db.ObjectId
  failureReason   String?
  failureCode     String?

  // Notifications
  reminderSentAt  DateTime?
  failureNotifiedAt DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic       Clinic      @relation(fields: [clinicId], references: [id])
  paymentPlan  PaymentPlan @relation(fields: [paymentPlanId], references: [id])

  @@index([clinicId])
  @@index([paymentPlanId])
  @@index([scheduledDate])
  @@index([status])
}

enum ScheduledPaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  SKIPPED
  CANCELLED
}

model Receipt {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  paymentId     String   @db.ObjectId

  // Receipt details
  receiptNumber String   @unique
  receiptDate   DateTime
  amount        Decimal

  // Content
  receiptUrl    String?  // PDF URL

  // Delivery
  deliveryMethod DeliveryMethod?
  sentTo         String?
  sentAt         DateTime?
  viewedAt       DateTime?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  payment   Payment  @relation(fields: [paymentId], references: [id])

  @@index([clinicId])
  @@index([paymentId])
  @@index([receiptNumber])
}

model PaymentSettlement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Settlement details
  settlementId  String   @unique
  gateway       PaymentGateway
  settlementDate DateTime
  depositDate   DateTime?

  // Amounts
  grossAmount   Decimal
  feeAmount     Decimal
  netAmount     Decimal
  refundAmount  Decimal  @default(0)
  chargebackAmount Decimal @default(0)

  // Reconciliation
  status        SettlementStatus @default(PENDING)
  reconciledAt  DateTime?
  reconciledBy  String?  @db.ObjectId
  discrepancy   Decimal?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([settlementId])
  @@index([settlementDate])
  @@index([status])
}

enum SettlementStatus {
  PENDING
  DEPOSITED
  RECONCILED
  DISCREPANCY
}
```

---

## API Endpoints

### Payments

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/payments` | List payments | `payment:read` |
| GET | `/api/payments/:id` | Get payment details | `payment:read` |
| POST | `/api/payments` | Create payment | `payment:process` |
| POST | `/api/payments/terminal` | Process terminal payment | `payment:process` |
| POST | `/api/payments/:id/capture` | Capture pre-auth | `payment:process` |

### Payment Methods

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/patients/:id/payment-methods` | List stored methods | `payment:read` |
| POST | `/api/patients/:id/payment-methods` | Add payment method | `payment:create` |
| PUT | `/api/patients/:id/payment-methods/:methodId` | Update method | `payment:update` |
| DELETE | `/api/patients/:id/payment-methods/:methodId` | Remove method | `payment:delete` |
| POST | `/api/patients/:id/payment-methods/:methodId/default` | Set default | `payment:update` |

### Payment Links

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/payment-links` | List payment links | `payment:read` |
| POST | `/api/payment-links` | Create payment link | `payment:create` |
| POST | `/api/payment-links/:id/send` | Send payment link | `payment:update` |
| POST | `/api/payment-links/:id/cancel` | Cancel link | `payment:update` |
| GET | `/api/pay/:code` | Public payment page | Public |
| POST | `/api/pay/:code/process` | Process link payment | Public |

### Refunds

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/refunds` | List refunds | `payment:read` |
| POST | `/api/payments/:id/refund` | Create refund | `payment:process_refund` |
| POST | `/api/refunds/:id/approve` | Approve refund | `payment:approve_refund` |
| POST | `/api/refunds/:id/reject` | Reject refund | `payment:approve_refund` |

### Terminal

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/terminal/readers` | List connected readers | `payment:read` |
| POST | `/api/terminal/readers/:id/connect` | Connect reader | `payment:process` |
| POST | `/api/terminal/readers/:id/collect` | Start payment collection | `payment:process` |
| POST | `/api/terminal/readers/:id/cancel` | Cancel collection | `payment:process` |

### Reconciliation

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/settlements` | List settlements | `payment:reconcile` |
| GET | `/api/settlements/:id` | Get settlement details | `payment:reconcile` |
| POST | `/api/settlements/:id/reconcile` | Mark reconciled | `payment:reconcile` |
| GET | `/api/settlements/:id/payments` | Get settlement payments | `payment:reconcile` |

### Webhooks

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/webhooks/stripe` | Stripe webhook handler | Webhook signature |
| POST | `/api/webhooks/square` | Square webhook handler | Webhook signature |

---

## External Integrations

### Stripe Integration

```typescript
// Key Stripe APIs used
- PaymentIntents      // Process payments
- Customers           // Store customer info
- PaymentMethods      // Store cards
- Terminal            // Card readers
- Refunds             // Process refunds
- Webhooks            // Payment events
- Balance Transactions // Reconciliation
```

### Square Integration

```typescript
// Key Square APIs used
- Payments           // Process payments
- Customers          // Store customer info
- Cards              // Store cards
- Terminal           // Card readers
- Refunds            // Process refunds
- Webhooks           // Payment events
```

---

## Security & Compliance

### PCI-DSS Compliance

| Requirement | Implementation |
|-------------|----------------|
| No card storage | Cards tokenized by gateway |
| Secure transmission | TLS 1.2+ for all API calls |
| Access control | Role-based permissions |
| Audit logging | All payment actions logged |
| Encryption | Gateway handles encryption |

### Fraud Prevention

| Feature | Description |
|---------|-------------|
| AVS | Address Verification System |
| CVV | Card verification required |
| 3D Secure | For card-not-present transactions |
| Velocity checks | Prevent repeated failed attempts |
| Device fingerprinting | Identify suspicious devices |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `PaymentForm` | Process manual payment | `components/payments/` |
| `TerminalPayment` | Card reader payment flow | `components/payments/` |
| `PaymentLinkGenerator` | Create payment links | `components/payments/` |
| `PaymentMethodList` | List stored methods | `components/payments/` |
| `AddPaymentMethod` | Add new payment method | `components/payments/` |
| `RefundDialog` | Process refund | `components/payments/` |
| `PaymentHistory` | View payment history | `components/payments/` |
| `SettlementReport` | View settlements | `components/payments/` |
| `ReceiptViewer` | View/print receipt | `components/payments/` |
| `QuickCheckout` | Streamlined checkout | `components/payments/` |

---

## Business Rules

1. **Authorization**: All payments must be authorized before capture
2. **Void vs Refund**: Same-day cancellations are voids (no fee); later cancellations are refunds
3. **Refund Approval**: Refunds over threshold require manager approval
4. **Retry Logic**: Failed recurring payments retry 3 times with increasing delays
5. **Card Expiration**: Notify patients 30 days before card expiration
6. **Receipt Required**: Receipt must be generated for all completed payments
7. **Reconciliation**: All settlements must be reconciled within 3 business days

---

## Related Documentation

- [Parent: Billing & Insurance](../../)
- [Patient Billing](../patient-billing/)
- [Insurance Claims](../insurance-claims/)
- [Collections](../collections/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
