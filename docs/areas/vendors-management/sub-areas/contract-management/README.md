# Contract Management

> **Area**: [Vendors Management](../../)
>
> **Sub-Area**: 2. Contract Management
>
> **Purpose**: Manage vendor contracts, terms, renewals, pricing agreements, and service level agreements

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Medium |
| **Complexity** | Medium |
| **Parent Area** | [Vendors Management](../../) |
| **Dependencies** | Vendor Profiles |
| **Last Updated** | 2024-11-27 |

---

## Overview

Contract Management provides comprehensive vendor agreement tracking for orthodontic practices. This includes contract document storage, terms and conditions tracking, renewal management, pricing agreement monitoring, and service level agreement (SLA) compliance. The system ensures practices maintain visibility into vendor commitments, receive timely renewal notifications, and can track contract compliance.

The sub-area supports various contract types common to orthodontic practices including supply agreements, service contracts, equipment leases, maintenance agreements, and software subscriptions. Multi-location practices can manage contracts that apply to specific locations or organization-wide.

### Key Capabilities

- Centralized contract document storage
- Contract terms and conditions tracking
- Automated renewal and expiration alerts
- Pricing tier and discount management
- Service level agreement monitoring
- Contract amendment history
- Approval workflow for new contracts
- Multi-location contract assignments
- Contract compliance tracking
- HIPAA Business Associate Agreement tracking

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.1 | [Contract Creation](./functions/contract-creation.md) | Create and store vendor contracts | 📋 Planned | High |
| 2.2 | [Terms Tracking](./functions/terms-tracking.md) | Track contract terms and conditions | 📋 Planned | Medium |
| 2.3 | [Renewal Management](./functions/renewal-management.md) | Manage contract renewals and expirations | 📋 Planned | High |
| 2.4 | [Pricing Agreements](./functions/pricing-agreements.md) | Track pricing, discounts, and rebates | 📋 Planned | Medium |
| 2.5 | [SLA Monitoring](./functions/sla-monitoring.md) | Monitor service level agreements | 📋 Planned | Medium |

---

## Function Details

### 2.1 Contract Creation

**Purpose**: Create and maintain vendor contracts with document storage and version control.

**Key Capabilities**:
- Contract information entry (type, dates, value)
- Document upload and storage
- Contract categorization by type
- Multi-vendor contract support
- Location assignment
- Approval workflow integration
- Contract numbering system
- Version tracking

**Contract Types**:
| Type | Description | Common Vendors |
|------|-------------|----------------|
| Supply Agreement | Product supply contracts | Orthodontic suppliers, distributors |
| Service Agreement | Service delivery contracts | IT, maintenance, cleaning |
| Maintenance | Equipment maintenance contracts | Equipment vendors |
| Lease | Equipment or space leases | Equipment companies |
| Subscription | Software/service subscriptions | Software vendors |
| Consulting | Professional consulting | Consultants, advisors |
| NDA | Non-disclosure agreements | Various |
| BAA | Business Associate Agreements | PHI-handling vendors |
| Master Service | Master service agreements | Major vendors |
| Purchase | Major purchase agreements | Equipment purchases |

**User Stories**:
- As a **clinic admin**, I want to store vendor contracts so they're easily accessible
- As an **office manager**, I want to track contract start and end dates
- As a **billing specialist**, I want to reference contract terms for pricing questions

---

### 2.2 Terms Tracking

**Purpose**: Track and manage specific contract terms, conditions, and obligations.

**Key Capabilities**:
- Individual term entry and tracking
- Term categorization (pricing, delivery, warranty)
- Obligation tracking
- Term effective dates
- Amendment history
- Term comparison across contracts
- Key term highlighting
- Searchable term database

**Term Types**:
| Term Type | Description | Examples |
|-----------|-------------|----------|
| Pricing | Cost and discount terms | Unit pricing, volume discounts |
| Volume Discount | Quantity-based savings | 10% off orders over $1000 |
| Rebate | End-of-period refunds | Quarterly rebate on volume |
| Payment Terms | Payment conditions | NET 30, 2% 10 NET 30 |
| Delivery Terms | Shipping and delivery | Free shipping over $500 |
| Warranty | Product warranties | 1-year parts and labor |
| Liability | Liability limitations | Cap on damages |
| Exclusivity | Exclusivity clauses | Exclusive supplier for category |
| Minimum Order | Order minimums | $250 minimum order |

**User Stories**:
- As an **office manager**, I want to track pricing terms so I ensure we get contracted rates
- As a **clinic admin**, I want to see all obligations we have to vendors
- As a **purchasing staff**, I want to know minimum order requirements before ordering

---

### 2.3 Renewal Management

**Purpose**: Manage contract renewals, expirations, and termination notifications.

**Key Capabilities**:
- Expiration date tracking
- Automated renewal alerts (90/60/30 days)
- Auto-renewal clause tracking
- Termination notice requirements
- Renewal workflow management
- Non-renewal documentation
- Historical renewal tracking
- Calendar integration

**Renewal Process**:
1. Alert triggered at configured intervals
2. Review contract performance and terms
3. Decision: renew, renegotiate, or terminate
4. If renewing: update dates, document changes
5. If terminating: send notice per requirements
6. Update contract status

**Alert Schedule**:
| Days Before | Alert Type | Action Required |
|-------------|------------|-----------------|
| 90 | Initial | Review contract, begin evaluation |
| 60 | Reminder | Make renewal decision |
| 30 | Urgent | Finalize renewal or send termination |
| 0 | Expiration | Contract expires if no action |

**User Stories**:
- As a **clinic admin**, I want alerts before contracts expire so I can negotiate renewals
- As an **office manager**, I want to track auto-renewal dates to avoid unwanted renewals
- As a **finance manager**, I want to review contracts before renewal for cost optimization

---

### 2.4 Pricing Agreements

**Purpose**: Track contracted pricing, discounts, rebates, and special terms.

**Key Capabilities**:
- Product/service pricing tracking
- Volume discount tiers
- Rebate program tracking
- Price protection periods
- Price increase caps
- Special promotional pricing
- Price comparison tools
- Historical price tracking

**Pricing Elements**:
| Element | Description | Example |
|---------|-------------|---------|
| Base Price | Standard unit pricing | $50 per bracket kit |
| Volume Tier | Quantity-based pricing | $45 at 100+ units |
| Contract Discount | Negotiated discount | 15% off list price |
| Rebate | Period-end refund | 3% quarterly rebate |
| Price Protection | Price freeze period | Prices locked for 12 months |
| Increase Cap | Maximum increase allowed | Max 5% annual increase |
| Bundle Pricing | Combined product pricing | Kit pricing vs individual |

**User Stories**:
- As a **purchasing staff**, I want to see our contracted pricing when ordering
- As a **clinic admin**, I want to track volume discounts to optimize ordering
- As a **finance manager**, I want to track rebates to ensure we receive credits

---

### 2.5 SLA Monitoring

**Purpose**: Monitor and track service level agreement compliance.

**Key Capabilities**:
- SLA definition and entry
- Target metric tracking
- Compliance measurement
- Penalty/credit tracking
- SLA violation alerts
- Performance trending
- SLA reporting
- Vendor accountability

**Common SLAs**:
| SLA Type | Description | Measurement |
|----------|-------------|-------------|
| Response Time | Time to respond to inquiries | Hours |
| Resolution Time | Time to resolve issues | Hours/Days |
| Uptime | System availability | Percentage |
| Delivery Time | Order delivery timeframe | Days |
| Quality Score | Product/service quality | Score/Percentage |
| Fill Rate | Order fulfillment rate | Percentage |
| Turnaround Time | Service completion time | Days |

**Monitoring Process**:
1. Define SLA metrics per contract
2. Track actual performance
3. Calculate compliance rates
4. Alert on violations
5. Document credits/penalties
6. Report trends to management

**User Stories**:
- As a **clinic admin**, I want to monitor SLA compliance for accountability
- As an **IT manager**, I want to track uptime SLAs for software vendors
- As an **office manager**, I want to document SLA violations for contract renegotiation

---

## Data Model

```prisma
model Contract {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Contract Details
  contractNumber String  @unique
  contractType  ContractType
  title         String
  description   String?

  // Dates
  startDate     DateTime
  endDate       DateTime?
  renewalDate   DateTime?

  // Value
  totalValue    Decimal?
  currency      String   @default("USD")

  // Terms
  autoRenewal   Boolean  @default(false)
  renewalTerms  String?
  terminationNotice Int? // Days notice required

  // Status
  status        ContractStatus @default(DRAFT)
  signedAt      DateTime?
  signedBy      String?  @db.ObjectId

  // Documents
  documentUrl   String?

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String?  @db.ObjectId
  approvedBy String? @db.ObjectId
  approvedAt DateTime?

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])
  terms         ContractTerm[]
  slas          ContractSLA[]
  amendments    ContractAmendment[]

  @@index([clinicId])
  @@index([vendorId])
  @@index([contractNumber])
  @@index([status])
  @@index([endDate])
}

model ContractTerm {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  contractId    String   @db.ObjectId

  // Term Details
  termType      ContractTermType
  description   String
  value         Decimal?
  unit          String?
  effectiveDate DateTime?
  expirationDate DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  contract      Contract  @relation(fields: [contractId], references: [id])

  @@index([contractId])
  @@index([termType])
}

model ContractSLA {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  contractId    String   @db.ObjectId

  // SLA Details
  slaType       SLAType
  description   String
  targetValue   Decimal
  unit          String
  measurementPeriod String // Daily, Weekly, Monthly, Quarterly

  // Penalties/Credits
  penaltyType   String?
  penaltyValue  Decimal?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  contract      Contract  @relation(fields: [contractId], references: [id])

  @@index([contractId])
  @@index([slaType])
}

model ContractAmendment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  contractId    String   @db.ObjectId

  // Amendment Details
  amendmentNumber String
  title         String
  description   String
  effectiveDate DateTime

  // Documents
  documentUrl   String?

  // Status
  status        ContractStatus @default(DRAFT)
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  contract      Contract  @relation(fields: [contractId], references: [id])

  @@index([contractId])
}

enum ContractType {
  SUPPLY_AGREEMENT
  SERVICE_AGREEMENT
  MAINTENANCE
  LEASE
  SUBSCRIPTION
  CONSULTING
  EMPLOYMENT
  NDA
  BAA
  MASTER_SERVICE
  PURCHASE
  OTHER
}

enum ContractStatus {
  DRAFT
  PENDING_APPROVAL
  PENDING_SIGNATURE
  ACTIVE
  EXPIRED
  TERMINATED
  RENEWED
  ON_HOLD
}

enum ContractTermType {
  PRICING
  DISCOUNT
  VOLUME_DISCOUNT
  REBATE
  PAYMENT_TERMS
  DELIVERY_TERMS
  WARRANTY
  LIABILITY
  EXCLUSIVITY
  MINIMUM_ORDER
  OTHER
}

enum SLAType {
  RESPONSE_TIME
  RESOLUTION_TIME
  UPTIME
  DELIVERY_TIME
  QUALITY_SCORE
  FILL_RATE
  TURNAROUND_TIME
  AVAILABILITY
  OTHER
}
```

---

## API Endpoints

### Contracts

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/contracts` | List all contracts | `contract:read` |
| GET | `/api/vendors/:id/contracts` | Get vendor contracts | `contract:read` |
| GET | `/api/vendors/contracts/:id` | Get contract details | `contract:read` |
| POST | `/api/vendors/:vendorId/contracts` | Create contract | `contract:create` |
| PUT | `/api/vendors/contracts/:id` | Update contract | `contract:update` |
| DELETE | `/api/vendors/contracts/:id` | Delete contract | `contract:delete` |
| POST | `/api/vendors/contracts/:id/approve` | Approve contract | `contract:approve` |
| PUT | `/api/vendors/contracts/:id/status` | Update status | `contract:update` |
| GET | `/api/vendors/contracts/expiring` | List expiring contracts | `contract:read` |
| GET | `/api/vendors/contracts/search` | Search contracts | `contract:read` |

### Terms

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/contracts/:id/terms` | Get contract terms | `contract:view_terms` |
| POST | `/api/vendors/contracts/:id/terms` | Add term | `contract:update` |
| PUT | `/api/vendors/contracts/terms/:termId` | Update term | `contract:update` |
| DELETE | `/api/vendors/contracts/terms/:termId` | Delete term | `contract:update` |

### SLAs

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/contracts/:id/slas` | Get contract SLAs | `contract:read` |
| POST | `/api/vendors/contracts/:id/slas` | Add SLA | `contract:update` |
| PUT | `/api/vendors/contracts/slas/:slaId` | Update SLA | `contract:update` |
| DELETE | `/api/vendors/contracts/slas/:slaId` | Delete SLA | `contract:update` |
| GET | `/api/vendors/contracts/:id/slas/performance` | Get SLA performance | `contract:read` |

### Amendments

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/contracts/:id/amendments` | Get amendments | `contract:read` |
| POST | `/api/vendors/contracts/:id/amendments` | Add amendment | `contract:update` |
| PUT | `/api/vendors/contracts/amendments/:amendmentId` | Update amendment | `contract:update` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ContractList` | List/search contracts | `components/vendors/contracts/` |
| `ContractDetail` | Full contract view | `components/vendors/contracts/` |
| `ContractForm` | Create/edit contract | `components/vendors/contracts/` |
| `ContractCard` | Summary contract card | `components/vendors/contracts/` |
| `ContractStatusBadge` | Status indicator | `components/vendors/contracts/` |
| `ContractTimeline` | Contract lifecycle view | `components/vendors/contracts/` |
| `ContractDocumentViewer` | View contract documents | `components/vendors/contracts/` |
| `TermsList` | Display contract terms | `components/vendors/contracts/terms/` |
| `TermForm` | Add/edit term | `components/vendors/contracts/terms/` |
| `PricingTermsTable` | Pricing terms display | `components/vendors/contracts/terms/` |
| `RenewalAlert` | Renewal notification | `components/vendors/contracts/` |
| `RenewalCalendar` | Calendar of renewals | `components/vendors/contracts/` |
| `RenewalWorkflow` | Renewal process UI | `components/vendors/contracts/` |
| `SLAList` | Display SLAs | `components/vendors/contracts/slas/` |
| `SLAForm` | Add/edit SLA | `components/vendors/contracts/slas/` |
| `SLAPerformanceChart` | SLA compliance chart | `components/vendors/contracts/slas/` |
| `SLADashboard` | SLA monitoring dashboard | `components/vendors/contracts/slas/` |
| `AmendmentHistory` | Amendment timeline | `components/vendors/contracts/` |
| `ContractApprovalWorkflow` | Approval process UI | `components/vendors/contracts/` |
| `ContractComparisonTool` | Compare contracts | `components/vendors/contracts/` |

---

## Business Rules

1. **Contract Numbers**: Auto-generated with vendor code prefix (e.g., SUP-001-C001)
2. **Approval Workflow**: Contracts over threshold require management approval
3. **Document Required**: Final contracts must have document uploaded
4. **Renewal Alerts**: System alerts at 90/60/30 days before expiration
5. **Auto-Renewal Tracking**: Auto-renewal contracts flagged for review
6. **Termination Notice**: System enforces termination notice periods
7. **Amendment Tracking**: All changes after signing require amendments
8. **SLA Monitoring**: SLAs automatically tracked if metrics are available
9. **BAA Requirement**: Vendors with PHI access must have BAA on file
10. **Historical Retention**: Expired contracts retained for reference

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Vendor Profiles | Required | Vendor records for contracts |
| Document Storage | Required | Contract document storage |
| Email Service | Required | Renewal notifications |
| Calendar Integration | Optional | Renewal calendar sync |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Document Signing | Optional | E-signature integration |
| Calendar Services | Optional | External calendar sync |

---

## Related Documentation

- [Parent: Vendors Management](../../)
- [Vendor Profiles](../vendor-profiles/)
- [Order Management](../order-management/)
- [Vendor Performance](../vendor-performance/)
- [Compliance & Audit](../../../compliance-audit/) - BAA tracking

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
