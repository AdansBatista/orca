# Orca Master Index

> **Single source of truth for the entire Orca project**
>
> This document provides navigation, status tracking, and context for all development work.

---

## Quick Stats

| Metric | Count |
|--------|-------|
| **Total Areas** | 13 |
| **Implementation Phases** | 5 |
| **Status** | Planning |

### Progress Overview

```
[░░░░░░░░░░░░░░░░░░░░] 0% Complete

Phase 1: Foundation    [░░░░░] Not Started
Phase 2: Operations    [░░░░░] Not Started
Phase 3: Clinical      [░░░░░] Not Started
Phase 4: Financial     [░░░░░] Not Started
Phase 5: Support       [░░░░░] Not Started
```

---

## Technical Foundation Documents

Before implementing any feature, consult these guides:

| Guide | Purpose | Location |
|-------|---------|----------|
| **Tech Stack** | Technology choices, coding patterns, conventions | [TECH-STACK.md](./guides/TECH-STACK.md) |
| **Styling Guide** | Design system, UI components, accessibility | [STYLING-GUIDE.md](./guides/STYLING-GUIDE.md) |
| **Auth Guide** | Authentication, authorization, permissions | [AUTH-GUIDE.md](./guides/AUTH-GUIDE.md) |
| **AI Integration** | AI capabilities and implementation | [AI-INTEGRATION.md](./guides/AI-INTEGRATION.md) |

---

## Implementation Phases

### Phase 1: Foundation
*Must build first - required by all other phases*

| # | Area | Status | Priority | Dependencies |
|---|------|--------|----------|--------------|
| 1.1 | Auth & User Management | 📋 Planned | Critical | None |
| 1.2 | Staff Management | 📋 Planned | Critical | Auth |
| 1.3 | Resources Management | 📋 Planned | High | Auth, Staff |

### Phase 2: Core Operations
*Core daily operations*

| # | Area | Status | Priority | Dependencies |
|---|------|--------|----------|--------------|
| 2.1 | Booking & Scheduling | 📋 Planned | Critical | Phase 1 |
| 2.2 | Practice Orchestration | 📋 Planned | High | Phase 1, Booking |
| 2.3 | Patient Communications | 📋 Planned | High | Phase 1 |

### Phase 3: Clinical
*Patient care and treatment*

| # | Area | Status | Priority | Dependencies |
|---|------|--------|----------|--------------|
| 3.1 | CRM & Onboarding | 📋 Planned | High | Phase 2 |
| 3.2 | Treatment Management | 📋 Planned | Critical | Phase 2, CRM |
| 3.3 | Imaging Management | 📋 Planned | High | Treatment |
| 3.4 | Lab Work Management | 📋 Planned | Medium | Treatment |

### Phase 4: Financial & Compliance
*Revenue and regulatory*

| # | Area | Status | Priority | Dependencies |
|---|------|--------|----------|--------------|
| 4.1 | Billing & Insurance | 📋 Planned | Critical | Phase 3 |
| 4.2 | Financial Management | 📋 Planned | High | Billing |
| 4.3 | Compliance & Documentation | 📋 Planned | High | All clinical |

### Phase 5: Support
*Supporting systems*

| # | Area | Status | Priority | Dependencies |
|---|------|--------|----------|--------------|
| 5.1 | Vendors Management | 📋 Planned | Medium | Phase 1 |

---

## Areas Index

### All Areas Overview

| Area | Status | Sub-Areas | Functions | Documentation |
|------|--------|-----------|-----------|---------------|
| [Booking & Scheduling](./areas/booking/) | 📋 Planned | TBD | TBD | [View](./areas/booking/) |
| [Treatment Management](./areas/treatment-management/) | 📋 Planned | TBD | TBD | [View](./areas/treatment-management/) |
| [Imaging Management](./areas/imaging-management/) | 📋 Planned | TBD | TBD | [View](./areas/imaging-management/) |
| [Lab Work Management](./areas/lab-work-management/) | 📋 Planned | TBD | TBD | [View](./areas/lab-work-management/) |
| [Practice Orchestration](./areas/practice-orchestration/) | 📋 Planned | TBD | TBD | [View](./areas/practice-orchestration/) |
| [Staff Management](./areas/staff-management/) | 📋 Planned | TBD | TBD | [View](./areas/staff-management/) |
| [Resources Management](./areas/resources-management/) | 📋 Planned | TBD | TBD | [View](./areas/resources-management/) |
| [CRM & Onboarding](./areas/crm-onboarding/) | 📋 Planned | TBD | TBD | [View](./areas/crm-onboarding/) |
| [Patient Communications](./areas/patient-communications/) | 📋 Planned | TBD | TBD | [View](./areas/patient-communications/) |
| [Financial Management](./areas/financial-management/) | 📋 Planned | TBD | TBD | [View](./areas/financial-management/) |
| [Billing & Insurance](./areas/billing-insurance/) | 📋 Planned | 4 | 31 | [View](./areas/billing-insurance/) |
| [Compliance & Documentation](./areas/compliance-documentation/) | 📋 Planned | TBD | TBD | [View](./areas/compliance-documentation/) |
| [Vendors Management](./areas/vendors-management/) | 📋 Planned | TBD | TBD | [View](./areas/vendors-management/) |

---

## Detailed Area Breakdown

### 1. Booking & Scheduling
*Core appointment management and calendar operations*

**Sub-Areas:**
- 1.1 Calendar Management - `📋 Planned`
- 1.2 Appointment Management - `📋 Planned`
- 1.3 Waitlist Management - `📋 Planned`
- 1.4 Appointment Reminders - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 2. Treatment Management
*Patient treatment lifecycle from planning to completion*

**Sub-Areas:**
- 2.1 Treatment Plans - `📋 Planned`
- 2.2 Procedures - `📋 Planned`
- 2.3 Progress Tracking - `📋 Planned`
- 2.4 Clinical Notes - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 3. Imaging Management
*Diagnostic images, X-rays, and progress photos*

**Sub-Areas:**
- 3.1 Image Capture & Upload - `📋 Planned`
- 3.2 Image Viewing & Tools - `📋 Planned`
- 3.3 Image Organization - `📋 Planned`
- 3.4 Reports & Collages - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 4. Lab Work Management
*External lab coordination and order tracking*

**Sub-Areas:**
- 4.1 Lab Orders - `📋 Planned`
- 4.2 Vendor Management - `📋 Planned`
- 4.3 Order Tracking - `📋 Planned`
- 4.4 Quality Control - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 5. Practice Orchestration
*Real-time operations dashboard and patient flow*

**Sub-Areas:**
- 5.1 Daily Dashboard - `📋 Planned`
- 5.2 Patient Flow - `📋 Planned`
- 5.3 Status Tracking - `📋 Planned`
- 5.4 Alerts & Notifications - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 6. Staff Management
*Team coordination, scheduling, and assignments*

**Sub-Areas:**
- 6.1 Staff Profiles - `📋 Planned`
- 6.2 Staff Scheduling - `📋 Planned`
- 6.3 Role Assignments - `📋 Planned`
- 6.4 Performance Tracking - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 7. Resources Management
*Physical resources: chairs, rooms, equipment*

**Sub-Areas:**
- 7.1 Chair Management - `📋 Planned`
- 7.2 Room Management - `📋 Planned`
- 7.3 Equipment Tracking - `📋 Planned`
- 7.4 Inventory Management - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 8. CRM & Onboarding
*Patient acquisition and intake process*

**Sub-Areas:**
- 8.1 Lead Management - `📋 Planned`
- 8.2 Intake Forms - `📋 Planned`
- 8.3 Referral Tracking - `📋 Planned`
- 8.4 Records Requests - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 9. Patient Communications
*Messaging, portal, and campaigns*

**Sub-Areas:**
- 9.1 Messaging Hub - `📋 Planned`
- 9.2 Patient Portal - `📋 Planned`
- 9.3 Campaigns - `📋 Planned`
- 9.4 Education Materials - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 10. Financial Management
*Practice finances and reporting*

**Sub-Areas:**
- 10.1 Revenue Tracking - `📋 Planned`
- 10.2 Expense Management - `📋 Planned`
- 10.3 Financial Reports - `📋 Planned`
- 10.4 Analytics Dashboard - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 11. Billing & Insurance
*Revenue cycle, claims processing, and payment collection*

**Documentation**: [Full Area Documentation](./areas/billing-insurance/)

**Sub-Areas:**
- 11.1 [Patient Billing](./areas/billing-insurance/sub-areas/patient-billing/) - `📋 Planned`
  - Patient Account Management, Statement Generation, Treatment Cost Estimator
  - Payment Plan Builder, Family Accounts, Credit Balance Management
- 11.2 [Insurance Claims](./areas/billing-insurance/sub-areas/insurance-claims/) - `📋 Planned`
  - Insurance Company Database, Patient Insurance, Eligibility Verification
  - Claims Submission, Claims Tracking, Denial Management, EOB Processing
- 11.3 [Payment Processing](./areas/billing-insurance/sub-areas/payment-processing/) - `📋 Planned`
  - Payment Gateway (Stripe/Square), Card-Present & Card-Not-Present Transactions
  - Recurring Billing Engine, Refund Processing, Payment Reconciliation
- 11.4 [Collections Management](./areas/billing-insurance/sub-areas/collections/) - `📋 Planned`
  - Aging Reports, Collection Workflows, Payment Reminders
  - Collection Agency Integration, Bad Debt Management

**Key Functions (31 total):**
| Sub-Area | Functions |
|----------|-----------|
| Patient Billing | 6 functions |
| Insurance Claims | 10 functions |
| Payment Processing | 8 functions |
| Collections | 7 functions |

**External Integrations:**
- Stripe / Square (Payment Gateway)
- Stripe Terminal / Square Reader (Card Readers)
- Clearinghouse (EDI 837/835 for claims)
- Collection Agencies

**AI Features:**
- EOB data extraction from scanned documents
- Insurance fax/letter parsing
- Payment prediction and collection prioritization
- Claims optimization suggestions

---

### 12. Compliance & Documentation
*Regulatory compliance and safety*

**Sub-Areas:**
- 12.1 Consent Forms - `📋 Planned`
- 12.2 Clinical Protocols - `📋 Planned`
- 12.3 Staff Training - `📋 Planned`
- 12.4 Audit Management - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 13. Vendors Management
*Supplier relationships and procurement*

**Sub-Areas:**
- 13.1 Vendor Directory - `📋 Planned`
- 13.2 Contracts Management - `📋 Planned`
- 13.3 Purchase Orders - `📋 Planned`
- 13.4 Vendor Payments - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

## Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Planned | 📋 | Documented, not started |
| In Progress | 🔄 | Currently being implemented |
| Review | 👀 | Implementation complete, under review |
| Testing | 🧪 | In testing phase |
| Completed | ✅ | Fully implemented and tested |
| Blocked | 🚫 | Blocked by dependency or issue |

---

## How to Use This Document

### For Development
1. Check this index before starting any work
2. Verify dependencies are completed
3. Consult relevant guides in `docs/guides/`
4. Update status after completing work

### For Planning
1. Use area breakdown to plan sub-areas
2. Create function documentation for each sub-area
3. Update this index with new sub-areas/functions
4. Track progress using status indicators

### For Context (Claude Code)
1. Read this document at the start of each session
2. Understand current project status
3. Check which areas are ready for implementation
4. Consult guides for technical standards

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2024-11-26 | Initial creation | Claude |
| 2024-11-26 | Added detailed Billing & Insurance area documentation (4 sub-areas, 31 functions) | Claude |

---

**Status**: Active
**Last Updated**: 2024-11-26
**Owner**: Development Team
