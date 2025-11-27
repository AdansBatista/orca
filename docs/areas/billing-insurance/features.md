# Billing & Insurance Management - Features

> **Area**: Billing & Insurance (11)
>
> **Purpose**: Feature overview and specifications for the billing and insurance management area

---

## Feature Overview

The Billing & Insurance area contains 11 major features organized across 4 sub-areas. Each feature represents a significant capability that provides value to the practice.

---

## Features by Sub-Area

### Patient Billing (11.1)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Patient Account Management | Create and manage patient financial accounts | Critical | 📋 Planned |
| Statement Generation | Generate and deliver patient statements | Critical | 📋 Planned |
| Treatment Cost Estimator | Calculate treatment costs with insurance | High | 📋 Planned |
| Payment Plan Builder | Create flexible payment arrangements | High | 📋 Planned |
| Family Account Management | Link family member accounts | Medium | 📋 Planned |
| Credit Balance Management | Handle overpayments and credits | Medium | 📋 Planned |

### Insurance Claims (11.2)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Insurance Company Database | Manage insurance company master data | High | 📋 Planned |
| Patient Insurance Management | Store and manage patient insurance info | Critical | 📋 Planned |
| Eligibility Verification | Verify coverage and benefits in real-time | Critical | 📋 Planned |
| Pre-Authorization Management | Submit and track pre-authorizations | High | 📋 Planned |
| Claims Submission | Create and submit electronic claims | Critical | 📋 Planned |
| Claims Tracking | Monitor claim status and aging | Critical | 📋 Planned |
| Denial Management | Handle denials and appeals | High | 📋 Planned |
| EOB Processing | Process Explanation of Benefits | Critical | 📋 Planned |
| Insurance Payment Posting | Post insurance payments | Critical | 📋 Planned |
| Coordination of Benefits | Handle dual coverage scenarios | Medium | 📋 Planned |

### Payment Processing (11.3)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Payment Gateway Integration | Connect to Stripe/Square | Critical | 📋 Planned |
| Card-Present Transactions | In-office card reader payments | Critical | 📋 Planned |
| Card-Not-Present Transactions | Online, phone, payment links | Critical | 📋 Planned |
| Payment Method Management | Store and manage tokenized cards | High | 📋 Planned |
| Recurring Billing Engine | Automated payment plan charges | Critical | 📋 Planned |
| Refund Processing | Process refunds and voids | High | 📋 Planned |
| Payment Reconciliation | Match payments to deposits | High | 📋 Planned |
| Digital Receipts | Generate and send receipts | Medium | 📋 Planned |

### Collections Management (11.4)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Aging Reports | Generate AR aging reports | Critical | 📋 Planned |
| Collection Workflows | Automated collection sequences | High | 📋 Planned |
| Payment Reminders | Send payment reminder notices | High | 📋 Planned |
| Late Payment Tracking | Track and manage late payments | High | 📋 Planned |
| Collection Agency Integration | Send accounts to collections | Medium | 📋 Planned |
| Bad Debt Management | Write-off uncollectible accounts | Medium | 📋 Planned |
| Collection Analytics | AR analytics and reporting | Medium | 📋 Planned |

---

## Feature Details

### 1. Patient Account Management

**Sub-Area**: Patient Billing (11.1)
**Priority**: Critical

**Description**: Create and manage patient financial accounts, track balances, and handle account relationships.

**Key Capabilities**:
- Create financial accounts for patients
- Track current balance, aging, and payment history
- Link guarantor relationships (parent paying for child)
- Manage account status (active, suspended, collections)
- Track insurance vs. patient responsibility
- Real-time balance calculations

**User Roles**: Billing, Clinic Admin, Front Desk (view)

---

### 2. Statement Generation

**Sub-Area**: Patient Billing (11.1)
**Priority**: Critical

**Description**: Generate professional patient statements and deliver them through multiple channels.

**Key Capabilities**:
- Generate monthly statements automatically
- On-demand statement generation
- Multiple delivery methods (email, print, portal)
- Statement customization (branding, messaging)
- Payment history on statements
- Include payment links for easy payment

**User Roles**: Billing, Clinic Admin

---

### 3. Treatment Cost Estimator

**Sub-Area**: Patient Billing (11.1)
**Priority**: High

**Description**: Calculate accurate treatment cost estimates including insurance coverage.

**Key Capabilities**:
- Calculate total treatment cost from procedures
- Estimate insurance coverage based on plan
- Calculate patient responsibility
- Generate written estimates for patients
- Track estimate accuracy vs. actual costs
- Support multiple estimate scenarios

**User Roles**: Billing, Treatment Coordinator, Doctor

---

### 4. Payment Plan Builder

**Sub-Area**: Patient Billing (11.1)
**Priority**: High

**Description**: Create flexible payment arrangements that work for patients and the practice.

**Key Capabilities**:
- Calculate payment plan options (down payment, monthly)
- Set up automatic recurring payments
- Track payment plan compliance
- Handle missed payments and modifications
- Calculate early payoff amounts
- Generate payment plan agreements

**User Roles**: Billing, Clinic Admin, Front Desk

---

### 5. Insurance Eligibility Verification

**Sub-Area**: Insurance Claims (11.2)
**Priority**: Critical

**Description**: Verify patient insurance eligibility and orthodontic benefits in real-time.

**Key Capabilities**:
- Real-time eligibility checks via clearinghouse
- Batch eligibility verification for scheduled patients
- Orthodontic-specific benefit verification
- Coverage limitation checks (age, waiting period)
- Automatic benefit estimation updates

**Integration**: Clearinghouse (Tesia, Availity, etc.)

**User Roles**: Billing, Front Desk

---

### 6. Claims Submission & Tracking

**Sub-Area**: Insurance Claims (11.2)
**Priority**: Critical

**Description**: Create, submit, and track insurance claims electronically.

**Key Capabilities**:
- Generate claims from completed procedures
- Validate claims before submission (reduce denials)
- Submit via EDI 837 through clearinghouse
- Track submission status
- Batch claim submission
- Claim aging reports and follow-up

**Integration**: Clearinghouse (EDI 837)

**User Roles**: Billing

---

### 7. EOB Processing

**Sub-Area**: Insurance Claims (11.2)
**Priority**: Critical

**Description**: Process Explanation of Benefits documents efficiently.

**Key Capabilities**:
- Receive electronic EOBs (EDI 835)
- AI-powered paper EOB data extraction
- Match EOBs to claims
- Review payment and adjustment details
- Flag discrepancies for review
- Batch EOB processing

**AI Features**: Document data extraction, OCR

**User Roles**: Billing

---

### 8. Integrated Payment Processing

**Sub-Area**: Payment Processing (11.3)
**Priority**: Critical

**Description**: Modern payment gateway integration replacing traditional POS terminals.

**Key Capabilities**:
- Stripe/Square gateway integration
- Card-present transactions (chip, tap, swipe) via integrated readers
- Card-not-present (payment links, QR codes, online portal)
- Multiple payment methods (credit, debit, e-Transfer, ACH, cash, check)
- Automatic posting to patient accounts
- PCI-DSS compliance (no card data stored locally)
- Recurring billing for payment plans
- Digital receipts and refund processing
- Real-time reconciliation with gateway

**Integrations**: Stripe, Square, Stripe Terminal

**User Roles**: Front Desk, Billing, Patient (self-service)

---

### 9. Recurring Billing Engine

**Sub-Area**: Payment Processing (11.3)
**Priority**: Critical

**Description**: Automatically process scheduled payments for payment plans.

**Key Capabilities**:
- Scheduled automatic charges
- Pre-charge notifications to patients
- Failed payment handling and retry
- Grace periods
- Payment plan pause/resume
- Early payoff processing
- Dunning management

**User Roles**: Billing (setup), System (automated)

---

### 10. Collections Management

**Sub-Area**: Collections (11.4)
**Priority**: High

**Description**: Manage accounts receivable and collection workflows.

**Key Capabilities**:
- Standard aging buckets (Current, 30, 60, 90, 120+ days)
- Automated collection workflow sequences
- Multi-channel reminder delivery
- Payment promise tracking
- Collection agency integration
- Bad debt write-off management

**AI Features**: Payment prediction, priority scoring

**User Roles**: Billing, Clinic Admin

---

### 11. AI Document Processing

**Sub-Area**: Insurance Claims (11.2)
**Priority**: High

**Description**: Automatically extract data from insurance correspondence.

**Key Capabilities**:
- EOB data extraction from scanned documents
- Insurance fax/letter parsing
- Patient information reconciliation
- Intelligent data matching
- Confidence scoring
- Human review workflow for low-confidence extractions

**AI Features**: Vision AI, OCR, NLP

**User Roles**: Billing (review)

---

## Feature Dependencies

```
Patient Account Management ─────┐
         │                      │
         ▼                      │
Statement Generation            │
         │                      │
         ▼                      │
Payment Plan Builder ◀──────────┤
         │                      │
         ▼                      │
Payment Processing ◀────────────┘
         │
         ▼
Recurring Billing Engine
         │
         ▼
Collections Management
```

```
Insurance Company Database
         │
         ▼
Patient Insurance Management
         │
         ├───────────────┐
         ▼               ▼
Eligibility           Pre-Authorization
Verification
         │
         ▼
Claims Submission ────▶ Claims Tracking
         │                    │
         ▼                    ▼
EOB Processing ◀───── Denial Management
         │
         ▼
Insurance Payment Posting
```

---

## Implementation Phases

### Phase 1: Foundation
1. Patient Account Management
2. Insurance Company Database
3. Patient Insurance Management

### Phase 2: Core Billing
4. Payment Gateway Integration
5. Card-Present/Not-Present Transactions
6. Statement Generation
7. Treatment Cost Estimator

### Phase 3: Insurance
8. Eligibility Verification
9. Claims Submission & Tracking
10. EOB Processing
11. Insurance Payment Posting

### Phase 4: Advanced
12. Payment Plan Builder
13. Recurring Billing Engine
14. Collections Management
15. AI Document Processing

---

## Related Documentation

- [Area Overview](./README.md)
- [Requirements](./requirements.md)
- [Patient Billing Sub-Area](./sub-areas/patient-billing/)
- [Insurance Claims Sub-Area](./sub-areas/insurance-claims/)
- [Payment Processing Sub-Area](./sub-areas/payment-processing/)
- [Collections Sub-Area](./sub-areas/collections/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
