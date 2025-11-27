# Billing & Insurance Management

> **Area**: Billing & Insurance
>
> **Phase**: 4 - Financial & Compliance
>
> **Purpose**: Handle patient billing, insurance claims processing, payment collection, and multi-party payment coordination

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Phase** | 4 - Financial & Compliance |
| **Dependencies** | Phase 1 (Auth, Staff), Phase 3 (CRM, Treatment) |
| **Last Updated** | 2024-11-26 |

---

## Overview

The Billing & Insurance Management area is the financial backbone of Orca, handling all aspects of revenue cycle management for orthodontic practices. This includes patient billing, insurance claims processing, payment collection through modern payment gateways, and multi-party payment coordination.

### Key Capabilities

- **Patient Billing**: Generate statements, treatment estimates, and manage patient accounts
- **Insurance Claims**: Electronic submission, tracking, denial management, and EOB processing
- **Payment Processing**: Modern payment gateway integration (Stripe/Square) replacing traditional POS terminals
- **Collections Management**: Aging reports, collection workflows, and bad debt management
- **Multi-Party Billing**: Coordinate payments between insurance, patients, family members, and third parties

### Business Value

- Maximize insurance reimbursement through optimized claims processing
- Reduce billing errors and claim denials
- Improve cash flow with modern payment options
- Decrease collection times with automated workflows
- Support flexible payment arrangements for patients

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 11.1 | [Patient Billing](./sub-areas/patient-billing/) | Patient accounts, statements, estimates | 📋 Planned | Critical |
| 11.2 | [Insurance Claims](./sub-areas/insurance-claims/) | Claims submission, tracking, EOB processing | 📋 Planned | Critical |
| 11.3 | [Payment Processing](./sub-areas/payment-processing/) | Payment gateway, card processing, reconciliation | 📋 Planned | Critical |
| 11.4 | [Collections Management](./sub-areas/collections/) | AR management, aging, collection workflows | 📋 Planned | High |

---

## Sub-Area Details

### 11.1 Patient Billing

Manage patient financial accounts, generate statements, and create treatment cost estimates.

**Functions:**
- Patient Account Management
- Statement Generation
- Treatment Cost Estimator
- Payment Plan Builder
- Family Account Management
- Credit Balance Management

**Key Features:**
- Multi-party responsibility tracking (patient, insurance, guarantor)
- Automated statement generation and delivery
- Real-time balance calculations
- Payment plan creation with flexible terms

---

### 11.2 Insurance Claims

Handle the complete insurance claims lifecycle from submission to payment posting.

**Functions:**
- Insurance Company Database
- Patient Insurance Management
- Eligibility Verification
- Pre-Authorization Management
- Claims Submission
- Claims Tracking
- Denial Management
- EOB Processing
- Insurance Payment Posting
- Coordination of Benefits

**Key Features:**
- Electronic claims submission (EDI 837)
- Real-time eligibility verification
- Automated EOB data extraction (AI-powered)
- Claims analytics and denial pattern detection

---

### 11.3 Payment Processing

Modern payment gateway integration replacing traditional POS terminals.

**Functions:**
- Payment Gateway Integration (Stripe/Square)
- Card-Present Transactions (EMV, NFC, swipe)
- Card-Not-Present Transactions (online, phone, links)
- Payment Method Management
- Recurring Billing Engine
- Refund Processing
- Payment Reconciliation
- Digital Receipts

**Key Features:**
- PCI-DSS compliance (gateway-managed)
- Multiple payment methods (credit, debit, ACH, e-Transfer, cash, check)
- Self-service payment portal
- Text-to-pay and email payment links
- Automatic reconciliation with bank deposits

---

### 11.4 Collections Management

Manage accounts receivable and collection workflows.

**Functions:**
- Aging Reports (30/60/90/120+)
- Collection Workflows
- Payment Reminders
- Late Payment Tracking
- Collection Agency Integration
- Bad Debt Management
- Write-off Processing

**Key Features:**
- Automated reminder sequences
- AI-powered collection prioritization
- Collection success prediction
- Customizable collection workflows

---

## Integration Points

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Treatment Management | Treatment costs, procedures | Link treatments to billing |
| Patient Communications | Statements, reminders | Send billing communications |
| CRM & Onboarding | Patient demographics | Initial insurance capture |
| Practice Orchestration | Checkout workflow | Payment at visit |
| Financial Management | Revenue reporting | Financial analytics |
| Compliance | Audit trails | Billing audit requirements |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| Stripe | Payment Gateway API | Card processing, ACH |
| Square | Payment Gateway API | Alternative payment processing |
| Clearinghouse | EDI 837/835 | Insurance claims submission |
| Eligibility Services | Real-time API | Insurance verification |
| Collection Agencies | Export/Import | Delinquent account handling |

---

## User Roles & Permissions

| Role | Patient Billing | Insurance Claims | Payments | Collections |
|------|-----------------|------------------|----------|-------------|
| Super Admin | Full | Full | Full | Full |
| Clinic Admin | Full | Full | Full | Full |
| Doctor | View | View | View | View |
| Clinical Staff | None | None | None | None |
| Front Desk | View | View | Edit | View |
| Billing | Full | Full | Full | Full |
| Read Only | View | View | View | View |

### Special Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `billing:create_invoice` | Create new invoices | clinic_admin, billing |
| `billing:adjust_balance` | Adjust patient balances | clinic_admin, billing |
| `billing:process_refund` | Process refunds | clinic_admin, billing |
| `billing:write_off` | Write off bad debt | clinic_admin |
| `billing:view_financial` | View financial data | clinic_admin, billing, doctor |
| `insurance:submit_claim` | Submit insurance claims | billing |
| `insurance:post_payment` | Post insurance payments | billing |
| `payment:process` | Process payments | front_desk, billing |
| `payment:void` | Void transactions | clinic_admin, billing |
| `collections:manage` | Manage collections | billing |

---

## Data Models

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Patient     │────▶│  PatientAccount │────▶│    Invoice      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               │                        ▼
                               │                ┌─────────────────┐
                               │                │  InvoiceItem    │
                               │                └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │    Payment      │────▶│ PaymentMethod   │
                        └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│InsuranceCompany │────▶│ PatientInsurance│────▶│ InsuranceClaim  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   ClaimItem     │
                                                └─────────────────┘
```

### Key Models

| Model | Description |
|-------|-------------|
| `PatientAccount` | Financial account for a patient/guarantor |
| `Invoice` | Bill for services rendered |
| `InvoiceItem` | Line items on an invoice |
| `Payment` | Payment transaction record |
| `PaymentMethod` | Stored payment method (tokenized) |
| `PaymentPlan` | Recurring payment arrangement |
| `InsuranceCompany` | Insurance company master data |
| `PatientInsurance` | Patient's insurance coverage |
| `InsuranceClaim` | Submitted insurance claim |
| `ClaimItem` | Individual procedure on a claim |
| `EOB` | Explanation of Benefits record |
| `Statement` | Generated patient statement |

---

## AI Features

| Feature | Sub-Area | Description |
|---------|----------|-------------|
| EOB Data Extraction | Insurance Claims | Auto-extract data from EOB documents |
| Insurance Fax Processing | Insurance Claims | Parse insurance correspondence |
| Claims Optimization | Insurance Claims | Suggest optimal coding for claims |
| Payment Prediction | Collections | Predict payment likelihood |
| Collection Prioritization | Collections | Prioritize collection efforts |
| Fraud Detection | Payment Processing | Identify suspicious transactions |

---

## Compliance Requirements

### HIPAA Compliance
- All financial data linked to PHI must follow PHI handling rules
- Audit logging required for all financial transactions
- Access control enforcement on financial data

### PCI-DSS Compliance
- No card data stored locally (gateway tokenization)
- Secure transmission of payment data
- Access logging for payment operations

### Billing Regulations
- Accurate procedure coding (CDT codes)
- Proper claim documentation
- Transparent pricing disclosure
- Payment plan disclosure requirements

---

## Implementation Notes

### Phase 4 Dependencies
- **Phase 1 Complete**: Auth, Staff, Resources
- **Phase 2 Complete**: Booking, Practice Orchestration
- **Phase 3 Complete**: CRM, Treatment Management

### Implementation Order
1. Patient Billing (foundation for all financial operations)
2. Payment Processing (enable payment collection)
3. Insurance Claims (claims submission and tracking)
4. Collections Management (AR management)

### Key Technical Decisions
- Use Stripe as primary payment gateway (Square as backup)
- Clearinghouse integration for claims (evaluate Tesia, Availity)
- Implement real-time eligibility verification
- Use AI for EOB/fax data extraction

---

## File Structure

```
docs/areas/billing-insurance/
├── README.md                      # This file
├── requirements.md                # Detailed requirements
├── features.md                    # Feature overview
└── sub-areas/
    ├── patient-billing/
    │   ├── README.md
    │   └── functions/
    │       ├── patient-account-management.md
    │       ├── statement-generation.md
    │       ├── treatment-cost-estimator.md
    │       ├── payment-plan-builder.md
    │       └── credit-balance-management.md
    │
    ├── insurance-claims/
    │   ├── README.md
    │   └── functions/
    │       ├── insurance-company-database.md
    │       ├── patient-insurance-management.md
    │       ├── eligibility-verification.md
    │       ├── claims-submission.md
    │       ├── claims-tracking.md
    │       ├── denial-management.md
    │       ├── eob-processing.md
    │       └── coordination-of-benefits.md
    │
    ├── payment-processing/
    │   ├── README.md
    │   └── functions/
    │       ├── payment-gateway-integration.md
    │       ├── card-present-transactions.md
    │       ├── card-not-present-transactions.md
    │       ├── recurring-billing.md
    │       ├── refund-processing.md
    │       └── payment-reconciliation.md
    │
    └── collections/
        ├── README.md
        └── functions/
            ├── aging-reports.md
            ├── collection-workflows.md
            ├── payment-reminders.md
            └── bad-debt-management.md
```

---

## Related Documentation

- [Requirements](./requirements.md) - Detailed requirements list
- [Features](./features.md) - Feature specifications
- [Financial Management](../financial-management/) - Related financial area
- [Treatment Management](../treatment-management/) - Treatment cost source
- [Patient Communications](../patient-communications/) - Statement delivery

---

## Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Planned | 📋 | Documented, not started |
| In Progress | 🔄 | Currently being implemented |
| Review | 👀 | Under review |
| Testing | 🧪 | In testing |
| Completed | ✅ | Fully implemented |
| Blocked | 🚫 | Blocked by dependency |

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
