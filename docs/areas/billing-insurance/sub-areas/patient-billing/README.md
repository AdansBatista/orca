# Patient Billing

> **Area**: [Billing & Insurance](../../)
>
> **Sub-Area**: 11.1 Patient Billing
>
> **Purpose**: Manage patient financial accounts, generate statements, and handle treatment cost estimates

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Billing & Insurance](../../) |
| **Dependencies** | Auth, Treatment Management, CRM |
| **Last Updated** | 2024-11-26 |

---

## Overview

Patient Billing is the foundation of the financial operations in Orca. It manages all aspects of patient financial accounts, including account creation, statement generation, treatment cost estimates, payment plans, and credit balance management.

This sub-area ensures that every financial interaction with patients is tracked, documented, and reconciled. It supports complex multi-party billing scenarios common in orthodontics, where insurance, patients, and guarantors may share responsibility for treatment costs.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 11.1.1 | [Patient Account Management](./functions/patient-account-management.md) | Create and manage patient financial accounts | 📋 Planned | Critical |
| 11.1.2 | [Statement Generation](./functions/statement-generation.md) | Generate and deliver patient statements | 📋 Planned | Critical |
| 11.1.3 | [Treatment Cost Estimator](./functions/treatment-cost-estimator.md) | Calculate treatment costs with insurance | 📋 Planned | High |
| 11.1.4 | [Payment Plan Builder](./functions/payment-plan-builder.md) | Create flexible payment arrangements | 📋 Planned | High |
| 11.1.5 | [Family Account Management](./functions/family-account-management.md) | Link family member accounts | 📋 Planned | Medium |
| 11.1.6 | [Credit Balance Management](./functions/credit-balance-management.md) | Handle overpayments and credits | 📋 Planned | Medium |

---

## Function Details

### 11.1.1 Patient Account Management

**Purpose**: Create and manage patient financial accounts, track balances, and handle account relationships.

**Key Capabilities**:
- Create financial accounts for patients
- Track current balance, aging, and payment history
- Link guarantor relationships (parent paying for child)
- Manage account status (active, suspended, collections)
- Track insurance vs. patient responsibility
- Real-time balance calculations

**User Stories**:
- As a **billing staff**, I want to view a patient's complete financial account so that I can answer their billing questions
- As a **front desk**, I want to see the patient's balance at checkout so that I can collect payment
- As a **clinic admin**, I want to link family accounts so that one guarantor can pay for multiple patients

---

### 11.1.2 Statement Generation

**Purpose**: Generate professional patient statements and deliver them through multiple channels.

**Key Capabilities**:
- Generate monthly statements automatically
- On-demand statement generation
- Multiple delivery methods (email, print, portal)
- Statement customization (branding, messaging)
- Payment history on statements
- Statement versioning and audit trail

**User Stories**:
- As a **billing staff**, I want to generate statements for all patients with balances so that I can send monthly billing
- As a **patient**, I want to receive my statement by email so that I don't have to wait for mail
- As a **clinic admin**, I want to customize statement messaging so that I can communicate payment policies

---

### 11.1.3 Treatment Cost Estimator

**Purpose**: Calculate accurate treatment cost estimates including insurance coverage.

**Key Capabilities**:
- Calculate total treatment cost from procedures
- Estimate insurance coverage based on plan
- Calculate patient responsibility
- Generate written estimates for patients
- Track estimate accuracy vs. actual costs
- Support multiple estimate scenarios

**User Stories**:
- As a **treatment coordinator**, I want to generate a cost estimate so that I can present it to the patient
- As a **patient**, I want to understand my out-of-pocket cost before starting treatment
- As a **doctor**, I want to see different treatment options with their costs so that I can discuss with the patient

---

### 11.1.4 Payment Plan Builder

**Purpose**: Create flexible payment arrangements that work for patients and the practice.

**Key Capabilities**:
- Calculate payment plan options (down payment, monthly)
- Set up automatic recurring payments
- Track payment plan compliance
- Handle missed payments and modifications
- Calculate early payoff amounts
- Generate payment plan agreements

**User Stories**:
- As a **billing staff**, I want to create a payment plan that fits the patient's budget
- As a **patient**, I want to set up automatic monthly payments so that I don't miss due dates
- As a **clinic admin**, I want to set payment plan policies (minimum down payment, max terms)

---

### 11.1.5 Family Account Management

**Purpose**: Link and manage accounts for family members with shared financial responsibility.

**Key Capabilities**:
- Create family account groups
- Designate primary guarantor
- Split or combine statements
- Transfer credits between family members
- Track total family balance
- Coordinate payment plans across family

**User Stories**:
- As a **billing staff**, I want to see all family members' balances together so that I can discuss total responsibility
- As a **guarantor**, I want one statement for all my children so that I can manage payments easily
- As a **billing staff**, I want to transfer a credit from one family member to another's balance

---

### 11.1.6 Credit Balance Management

**Purpose**: Handle overpayments, credits, and refund processing.

**Key Capabilities**:
- Track credit balances by source (overpayment, insurance, adjustment)
- Apply credits to outstanding balances
- Process refunds to original payment method
- Transfer credits between accounts
- Credit aging and reporting
- Automated credit application options

**User Stories**:
- As a **billing staff**, I want to apply a patient's credit to their outstanding balance
- As a **billing staff**, I want to refund an overpayment to the patient's original payment method
- As a **clinic admin**, I want to see all outstanding credits so that I can clear them appropriately

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

  // Aging
  aging30    Decimal  @default(0)
  aging60    Decimal  @default(0)
  aging90    Decimal  @default(0)
  aging120   Decimal  @default(0)

  // Relationships
  guarantorId    String?  @db.ObjectId
  familyGroupId  String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])
  guarantor    Patient?  @relation("Guarantor", fields: [guarantorId], references: [id])
  invoices     Invoice[]
  payments     Payment[]
  paymentPlans PaymentPlan[]
  statements   Statement[]
  credits      CreditBalance[]

  @@index([clinicId])
  @@index([patientId])
  @@index([guarantorId])
  @@index([accountNumber])
  @@index([status])
}

enum PatientAccountStatus {
  ACTIVE
  SUSPENDED
  COLLECTIONS
  CLOSED
  SETTLED
}

enum AccountType {
  INDIVIDUAL
  FAMILY
  GUARANTOR
}

model Invoice {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Invoice details
  invoiceNumber String   @unique
  invoiceDate   DateTime
  dueDate       DateTime
  status        InvoiceStatus @default(PENDING)

  // Amounts
  subtotal         Decimal
  adjustments      Decimal  @default(0)
  insuranceAmount  Decimal  @default(0)
  patientAmount    Decimal
  paidAmount       Decimal  @default(0)
  balance          Decimal

  // Source
  treatmentPlanId  String?  @db.ObjectId
  appointmentId    String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic      Clinic         @relation(fields: [clinicId], references: [id])
  account     PatientAccount @relation(fields: [accountId], references: [id])
  patient     Patient        @relation(fields: [patientId], references: [id])
  items       InvoiceItem[]
  payments    PaymentAllocation[]

  @@index([clinicId])
  @@index([accountId])
  @@index([patientId])
  @@index([invoiceNumber])
  @@index([status])
  @@index([dueDate])
}

enum InvoiceStatus {
  DRAFT
  PENDING
  SENT
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
  VOID
}

model InvoiceItem {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  invoiceId   String   @db.ObjectId

  // Item details
  procedureCode   String
  description     String
  quantity        Int      @default(1)
  unitPrice       Decimal
  discount        Decimal  @default(0)
  total           Decimal

  // Insurance allocation
  insuranceAmount Decimal  @default(0)
  patientAmount   Decimal

  // Source reference
  procedureId     String?  @db.ObjectId
  toothNumbers    String[]

  // Relations
  invoice    Invoice  @relation(fields: [invoiceId], references: [id])

  @@index([invoiceId])
  @@index([procedureCode])
}

model PaymentPlan {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Plan details
  planNumber    String   @unique
  status        PaymentPlanStatus @default(ACTIVE)

  // Amounts
  totalAmount      Decimal
  downPayment      Decimal
  financedAmount   Decimal
  monthlyPayment   Decimal
  remainingBalance Decimal

  // Terms
  numberOfPayments   Int
  completedPayments  Int      @default(0)
  startDate          DateTime
  nextPaymentDate    DateTime
  endDate            DateTime

  // Payment method
  paymentMethodId    String?  @db.ObjectId
  autoPayEnabled     Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic         Clinic         @relation(fields: [clinicId], references: [id])
  account        PatientAccount @relation(fields: [accountId], references: [id])
  paymentMethod  PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  scheduledPayments ScheduledPayment[]

  @@index([clinicId])
  @@index([accountId])
  @@index([status])
  @@index([nextPaymentDate])
}

enum PaymentPlanStatus {
  PENDING
  ACTIVE
  PAUSED
  COMPLETED
  DEFAULTED
  CANCELLED
}

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

enum DeliveryMethod {
  EMAIL
  PRINT
  PORTAL
  SMS
}

model CreditBalance {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Credit details
  amount        Decimal
  remainingAmount Decimal
  source        CreditSource
  description   String?

  // Expiration
  expiresAt     DateTime?

  // Status
  status        CreditStatus @default(AVAILABLE)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic         @relation(fields: [clinicId], references: [id])
  account   PatientAccount @relation(fields: [accountId], references: [id])

  @@index([clinicId])
  @@index([accountId])
  @@index([status])
}

enum CreditSource {
  OVERPAYMENT
  INSURANCE_REFUND
  ADJUSTMENT
  PROMOTIONAL
  TRANSFER
}

enum CreditStatus {
  AVAILABLE
  APPLIED
  EXPIRED
  REFUNDED
}
```

---

## API Endpoints

### Patient Accounts

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/billing/accounts` | List patient accounts | `billing:read` |
| GET | `/api/billing/accounts/:id` | Get account details | `billing:read` |
| POST | `/api/billing/accounts` | Create account | `billing:create` |
| PUT | `/api/billing/accounts/:id` | Update account | `billing:update` |
| GET | `/api/billing/accounts/:id/balance` | Get real-time balance | `billing:read` |
| GET | `/api/billing/accounts/:id/history` | Get transaction history | `billing:read` |

### Invoices

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/billing/invoices` | List invoices | `billing:read` |
| GET | `/api/billing/invoices/:id` | Get invoice details | `billing:read` |
| POST | `/api/billing/invoices` | Create invoice | `billing:create_invoice` |
| PUT | `/api/billing/invoices/:id` | Update invoice | `billing:update` |
| POST | `/api/billing/invoices/:id/send` | Send invoice to patient | `billing:update` |
| POST | `/api/billing/invoices/:id/void` | Void invoice | `billing:void` |

### Payment Plans

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/billing/payment-plans` | List payment plans | `billing:read` |
| GET | `/api/billing/payment-plans/:id` | Get plan details | `billing:read` |
| POST | `/api/billing/payment-plans` | Create payment plan | `billing:create` |
| PUT | `/api/billing/payment-plans/:id` | Update payment plan | `billing:update` |
| POST | `/api/billing/payment-plans/:id/pause` | Pause payment plan | `billing:update` |
| POST | `/api/billing/payment-plans/:id/resume` | Resume payment plan | `billing:update` |

### Statements

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/billing/statements` | List statements | `billing:read` |
| POST | `/api/billing/statements/generate` | Generate statements | `billing:create` |
| POST | `/api/billing/statements/:id/send` | Send statement | `billing:update` |
| GET | `/api/billing/statements/:id/pdf` | Download statement PDF | `billing:read` |

### Treatment Estimates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/billing/estimates` | Create estimate | `billing:create` |
| GET | `/api/billing/estimates/:id` | Get estimate | `billing:read` |
| POST | `/api/billing/estimates/:id/accept` | Accept estimate | `billing:update` |
| GET | `/api/billing/estimates/:id/pdf` | Download estimate PDF | `billing:read` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `PatientAccountCard` | Display account summary | `components/billing/` |
| `AccountBalanceWidget` | Show current balance | `components/billing/` |
| `InvoiceList` | List invoices with filters | `components/billing/` |
| `InvoiceDetail` | Full invoice view | `components/billing/` |
| `InvoiceForm` | Create/edit invoice | `components/billing/` |
| `PaymentPlanWizard` | Create payment plan | `components/billing/` |
| `PaymentPlanCard` | Display payment plan | `components/billing/` |
| `StatementViewer` | View/print statement | `components/billing/` |
| `TreatmentEstimator` | Calculate estimates | `components/billing/` |
| `FamilyAccountManager` | Manage family accounts | `components/billing/` |
| `CreditBalanceList` | List credit balances | `components/billing/` |
| `TransactionHistory` | Show account history | `components/billing/` |

---

## Business Rules

1. **Account Creation**: Every patient must have a financial account before billing
2. **Guarantor Linking**: Minor patients must have a guarantor account linked
3. **Balance Calculation**: Balance = Sum(Invoices) - Sum(Payments) - Credits
4. **Aging Rules**: Aging calculated from invoice due date, not invoice date
5. **Statement Generation**: Statements generated only for accounts with balance > $0
6. **Payment Plan Limits**: Maximum term based on treatment type and balance amount
7. **Credit Expiration**: Promotional credits expire per policy; overpayments don't expire
8. **Refund Rules**: Refunds go to original payment method when possible

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Treatment Management | Required | Procedure codes and treatment plans |
| CRM & Onboarding | Required | Patient demographics |
| Patient Communications | Required | Statement delivery |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| PDF Generation | Required | Statement and estimate PDFs |
| Email Service | Required | Statement delivery |

---

## Security Requirements

### Access Control
- **View accounts**: billing, clinic_admin, front_desk (limited)
- **Create invoices**: billing, clinic_admin
- **Adjust balances**: billing, clinic_admin
- **Process refunds**: billing, clinic_admin
- **Write-off debt**: clinic_admin only

### Audit Requirements
- Log all balance adjustments
- Track invoice creation and modifications
- Record statement generation and delivery
- Audit refund processing

### Data Protection
- Financial data encrypted at rest
- PHI linked to financial records protected per HIPAA
- PCI compliance for stored payment methods

---

## Related Documentation

- [Parent: Billing & Insurance](../../)
- [Payment Processing](../payment-processing/)
- [Insurance Claims](../insurance-claims/)
- [Collections](../collections/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
