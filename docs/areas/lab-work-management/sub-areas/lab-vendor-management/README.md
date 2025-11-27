# Lab Vendor Management

> **Area**: [Lab Work Management](../../)
>
> **Sub-Area**: 3.4.2 Lab Vendor Management
>
> **Purpose**: Maintain orthodontic lab directory, pricing, contracts, capabilities, and performance metrics

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Lab Work Management](../../) |
| **Dependencies** | Auth |
| **Last Updated** | 2024-11-27 |

---

## Overview

Lab Vendor Management provides a central directory of orthodontic labs with their product catalogs, pricing, capabilities, and performance history. Most practices work with multiple labs—one for appliances, another for retainers, perhaps a third for aligners. This sub-area helps practices manage these relationships effectively.

Beyond basic directory functionality, this sub-area tracks pricing with effective dates, manages contracts and discount terms, establishes rules for automatic lab selection, monitors performance metrics (turnaround time, quality, remakes), and provides a communication channel with lab technicians.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.4.2.1 | [Lab Directory Management](./functions/lab-directory-management.md) | Manage lab contacts and capabilities | 📋 Planned | Critical |
| 3.4.2.2 | [Pricing & Fee Schedules](./functions/pricing-fee-schedules.md) | Maintain product pricing by vendor | 📋 Planned | Critical |
| 3.4.2.3 | [Contract Management](./functions/contract-management.md) | Track contracts and terms | 📋 Planned | Medium |
| 3.4.2.4 | [Lab Preference Rules](./functions/lab-preference-rules.md) | Auto-select labs by criteria | 📋 Planned | Medium |
| 3.4.2.5 | [Performance Metrics](./functions/performance-metrics.md) | Track lab performance | 📋 Planned | Medium |
| 3.4.2.6 | [Communication Hub](./functions/communication-hub.md) | Message labs about orders | 📋 Planned | Low |

---

## Function Details

### 3.4.2.1 Lab Directory Management

**Purpose**: Maintain comprehensive information about orthodontic lab partners.

**Key Capabilities**:
- Add/edit lab company profiles
- Contact information (main, billing, technical)
- Lab capabilities matrix (what they produce)
- Shipping preferences and addresses
- Portal/integration credentials (encrypted)
- Active/inactive status management
- Multi-location lab support
- Preferred submission method (portal, email, API)

**Lab Profile Information**:
| Section | Fields |
|---------|--------|
| **Basic Info** | Name, address, phone, website |
| **Contacts** | Primary contact, billing contact, technician contacts |
| **Capabilities** | Products offered, specialties |
| **Logistics** | Shipping carrier preference, pickup schedule |
| **Integration** | Portal URL, API endpoints, credentials |
| **Billing** | Account number, payment terms, tax ID |

**User Stories**:
- As a **clinic admin**, I want to add a new lab to our directory with all their details
- As a **clinical staff**, I want to see which labs can make a specific appliance type
- As a **clinic admin**, I want to store our lab portal login credentials securely

---

### 3.4.2.2 Pricing & Fee Schedules

**Purpose**: Maintain product pricing by vendor with effective dates and history.

**Key Capabilities**:
- Fee schedule by lab and product
- Effective dates for pricing changes
- Rush/expedite upcharge rates
- Volume discount tiers
- Price history tracking
- Price comparison across labs
- Bulk price import/export
- Price alert notifications

**Fee Schedule Structure**:
| Field | Description |
|-------|-------------|
| **Product** | Lab product (Hawley retainer, RPE, etc.) |
| **Base Price** | Standard price |
| **Rush Upcharge** | Percentage or flat fee |
| **Effective Date** | When price takes effect |
| **End Date** | When price expires (optional) |
| **Volume Discount** | Tiered pricing (10+ orders = 5% off) |
| **Notes** | Special pricing conditions |

**User Stories**:
- As a **clinic admin**, I want to update lab pricing when we get a new fee schedule
- As a **billing staff**, I want to see the correct price for a lab order
- As a **clinic admin**, I want to compare retainer prices across our labs

---

### 3.4.2.3 Contract Management

**Purpose**: Track contracts, terms, and agreements with lab vendors.

**Key Capabilities**:
- Contract document storage
- Term dates and renewal reminders
- Discount terms and minimums
- Service level agreements (SLA)
- Contract status tracking
- Renewal workflow
- Amendment tracking

**Contract Information**:
| Field | Description |
|-------|-------------|
| **Start Date** | Contract effective date |
| **End Date** | Contract expiration |
| **Auto-Renew** | Automatic renewal flag |
| **Discount %** | Negotiated discount |
| **Minimum Volume** | Required order volume |
| **SLA Terms** | Turnaround commitments |
| **Document** | PDF of signed contract |

**User Stories**:
- As a **clinic admin**, I want to receive reminders before lab contracts expire
- As a **office manager**, I want to see our negotiated discount with each lab
- As a **clinic admin**, I want to store our lab contracts in the system

---

### 3.4.2.4 Lab Preference Rules

**Purpose**: Automatically select the appropriate lab based on configurable rules.

**Key Capabilities**:
- Default lab by product category
- Rules by product type
- Geographic routing (closest lab)
- Cost-based routing (cheapest)
- Performance-based routing (best quality)
- Rush order routing
- Override capability

**Rule Examples**:
| Rule | Condition | Action |
|------|-----------|--------|
| **Default Retainers** | Product = Retainer | Select "ABC Retainer Lab" |
| **Appliances** | Product = Appliance | Select "XYZ Orthodontic Lab" |
| **Rush Orders** | Priority = Rush | Select "Quick Turnaround Lab" |
| **Aligners** | Product = Aligner | Select "Invisalign" or "uLab" |
| **Cost Savings** | Amount > $500 | Select cheapest option |

**User Stories**:
- As a **clinic admin**, I want retainer orders to automatically go to our preferred retainer lab
- As a **doctor**, I want to override the default lab selection when needed
- As a **clinic admin**, I want rush orders routed to the lab with fastest turnaround

---

### 3.4.2.5 Performance Metrics

**Purpose**: Track and analyze lab performance for informed vendor decisions.

**Key Capabilities**:
- Average turnaround time by product
- On-time delivery rate
- Remake/adjustment rate
- Quality score calculation
- Trend analysis over time
- Comparison across labs
- Performance alerts
- Vendor scorecards

**Performance Metrics**:
| Metric | Description | Target |
|--------|-------------|--------|
| **Avg Turnaround** | Days from submission to delivery | Per product type |
| **On-Time Rate** | % delivered by promised date | > 95% |
| **Remake Rate** | % of orders requiring remake | < 3% |
| **Quality Score** | Composite quality rating | > 4.5/5 |
| **Response Time** | Avg time to acknowledge orders | < 24 hours |

**User Stories**:
- As a **clinic admin**, I want to see which lab has the best on-time delivery
- As a **doctor**, I want to know our remake rate with each lab
- As a **clinic admin**, I want to receive alerts if a lab's quality is declining

---

### 3.4.2.6 Communication Hub

**Purpose**: Centralize communication with labs about orders and cases.

**Key Capabilities**:
- Message thread per order
- Direct messaging with lab contacts
- Attachment support
- Read receipts
- Message history
- Template responses
- Integration with lab portals
- Notification preferences

**Communication Types**:
| Type | Use Case |
|------|----------|
| **Order Inquiry** | Questions about existing order |
| **Clarification Request** | Lab needs more info |
| **Status Update** | Lab provides update |
| **Remake Discussion** | Quality issue conversation |
| **General Inquiry** | Non-order specific question |

**User Stories**:
- As a **clinical staff**, I want to message the lab about an order question
- As a **doctor**, I want to see all communication history for an order
- As a **clinical staff**, I want to be notified when the lab responds to my message

---

## Data Model

```prisma
model LabVendor {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Basic info
  name          String
  legalName     String?
  taxId         String?
  website       String?
  accountNumber String?          // Our account with them

  // Status
  status        VendorStatus @default(ACTIVE)
  isPreferred   Boolean  @default(false)

  // Contact info
  address       Json             // Street, city, state, zip
  phone         String?
  fax           String?
  email         String?

  // Contacts
  contacts      LabVendorContact[]

  // Capabilities
  capabilities  LabProductCategory[]
  specialties   String[]         // e.g., "Custom appliances", "Same-day retainers"

  // Logistics
  shippingCarrier String?        // Preferred carrier
  shippingAccountNumber String?
  pickupSchedule String?         // e.g., "Daily 4pm"

  // Integration
  portalUrl     String?
  apiEndpoint   String?
  credentials   Json?            // Encrypted

  // Billing
  paymentTerms  String?          // e.g., "Net 30"
  billingEmail  String?

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Audit
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  feeSchedules  LabFeeSchedule[]
  contracts     LabContract[]
  orders        LabOrder[]
  products      LabProduct[]
  messages      LabMessage[]

  @@index([clinicId])
  @@index([status])
  @@index([name])
}

enum VendorStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING
}

model LabVendorContact {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  vendorId      String   @db.ObjectId

  // Contact info
  name          String
  title         String?
  role          ContactRole @default(PRIMARY)
  phone         String?
  email         String?
  notes         String?

  // Status
  isActive      Boolean  @default(true)

  // Relations
  vendor        LabVendor @relation(fields: [vendorId], references: [id])

  @@index([vendorId])
}

enum ContactRole {
  PRIMARY
  BILLING
  TECHNICAL
  SHIPPING
  EMERGENCY
}

model LabProduct {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String?  @db.ObjectId  // Null for global products

  // Product info
  name          String
  description   String?
  category      LabProductCategory
  sku           String?          // Lab's product code

  // Configuration
  prescriptionSchema Json?       // JSON schema for Rx fields
  defaultPrescription Json?      // Default values

  // Turnaround
  standardTurnaround Int?        // Days
  rushTurnaround Int?            // Days for rush

  // Status
  isActive      Boolean  @default(true)
  isCustom      Boolean  @default(false)  // Clinic-specific product

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        LabVendor? @relation(fields: [vendorId], references: [id])
  feeSchedules  LabFeeSchedule[]
  orderItems    LabOrderItem[]

  @@index([clinicId])
  @@index([vendorId])
  @@index([category])
  @@index([isActive])
}

model LabFeeSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId
  productId     String   @db.ObjectId

  // Pricing
  basePrice     Decimal
  rushUpchargePercent Decimal?   // e.g., 50 for 50%
  rushUpchargeFlat Decimal?      // Flat fee alternative

  // Effective dates
  effectiveDate DateTime
  endDate       DateTime?

  // Volume discounts
  volumeDiscounts Json?          // Array of {minQty, discountPercent}

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        LabVendor @relation(fields: [vendorId], references: [id])
  product       LabProduct @relation(fields: [productId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([productId])
  @@index([effectiveDate])
}

model LabContract {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Contract info
  contractNumber String?
  name          String
  status        ContractStatus @default(ACTIVE)

  // Dates
  startDate     DateTime
  endDate       DateTime?
  autoRenew     Boolean  @default(false)
  renewalNotice Int?             // Days before expiry to notify

  // Terms
  discountPercent Decimal?
  minimumVolume Int?             // Minimum orders per period
  volumePeriod  String?          // "monthly", "quarterly", "annual"
  slaTerms      String?          // Service level agreement description

  // Document
  documentUrl   String?          // Stored contract PDF

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        LabVendor @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([status])
  @@index([endDate])
}

enum ContractStatus {
  DRAFT
  ACTIVE
  EXPIRED
  TERMINATED
}

model LabPreferenceRule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Rule info
  name          String
  description   String?
  priority      Int      @default(0)  // Higher = evaluated first
  isActive      Boolean  @default(true)

  // Conditions (JSON for flexibility)
  conditions    Json
  // Example: { "category": "RETAINER", "priority": "RUSH" }

  // Action
  vendorId      String   @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([isActive])
  @@index([priority])
}

model LabVendorMetrics {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Period
  periodType    MetricPeriod  // MONTHLY, QUARTERLY, ANNUAL
  periodStart   DateTime
  periodEnd     DateTime

  // Volume metrics
  totalOrders   Int      @default(0)
  totalItems    Int      @default(0)
  totalSpend    Decimal  @default(0)

  // Turnaround metrics
  avgTurnaroundDays Float?
  onTimeCount   Int      @default(0)
  lateCount     Int      @default(0)
  onTimeRate    Float?           // Calculated percentage

  // Quality metrics
  remakeCount   Int      @default(0)
  remakeRate    Float?           // Calculated percentage
  qualityScore  Float?           // 1-5 rating

  // Timestamps
  calculatedAt  DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([periodStart])
}

enum MetricPeriod {
  MONTHLY
  QUARTERLY
  ANNUAL
}

model LabMessage {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId
  orderId       String?  @db.ObjectId  // Optional order link

  // Message
  threadId      String?          // For threading
  direction     MessageDirection
  subject       String?
  body          String

  // Attachments
  attachments   Json?            // Array of attachment references

  // Status
  isRead        Boolean  @default(false)
  readAt        DateTime?

  // Timestamps
  createdAt     DateTime @default(now())
  sentBy        String?  @db.ObjectId  // User or null if from lab

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        LabVendor @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([orderId])
  @@index([threadId])
}

enum MessageDirection {
  OUTBOUND
  INBOUND
}
```

---

## API Endpoints

### Lab Vendors

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/vendors` | List lab vendors | `lab:track` |
| GET | `/api/lab/vendors/:id` | Get vendor details | `lab:track` |
| POST | `/api/lab/vendors` | Create vendor | `lab:manage_vendors` |
| PUT | `/api/lab/vendors/:id` | Update vendor | `lab:manage_vendors` |
| DELETE | `/api/lab/vendors/:id` | Deactivate vendor | `lab:manage_vendors` |

### Products & Pricing

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/products` | List products | `lab:track` |
| GET | `/api/lab/products/:id` | Get product details | `lab:track` |
| GET | `/api/lab/vendors/:vendorId/products` | Vendor's products | `lab:track` |
| GET | `/api/lab/vendors/:vendorId/pricing` | Vendor pricing | `lab:view_pricing` |
| PUT | `/api/lab/vendors/:vendorId/pricing` | Update pricing | `lab:manage_vendors` |

### Contracts

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/contracts` | List contracts | `lab:manage_vendors` |
| GET | `/api/lab/contracts/:id` | Get contract | `lab:manage_vendors` |
| POST | `/api/lab/contracts` | Create contract | `lab:manage_vendors` |
| PUT | `/api/lab/contracts/:id` | Update contract | `lab:manage_vendors` |

### Preference Rules

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/preference-rules` | List rules | `lab:manage_vendors` |
| POST | `/api/lab/preference-rules` | Create rule | `lab:manage_vendors` |
| PUT | `/api/lab/preference-rules/:id` | Update rule | `lab:manage_vendors` |
| DELETE | `/api/lab/preference-rules/:id` | Delete rule | `lab:manage_vendors` |
| POST | `/api/lab/preference-rules/evaluate` | Test rule evaluation | `lab:manage_vendors` |

### Metrics

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/vendors/:id/metrics` | Get vendor metrics | `lab:manage_vendors` |
| GET | `/api/lab/metrics/comparison` | Compare vendors | `lab:manage_vendors` |
| POST | `/api/lab/metrics/calculate` | Recalculate metrics | `lab:admin` |

### Messages

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/messages` | List messages | `lab:track` |
| GET | `/api/lab/messages/:orderId` | Order messages | `lab:track` |
| POST | `/api/lab/messages` | Send message | `lab:create_order` |
| PUT | `/api/lab/messages/:id/read` | Mark as read | `lab:track` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `LabVendorList` | List of lab vendors | `components/lab/` |
| `LabVendorForm` | Create/edit vendor | `components/lab/` |
| `LabVendorCard` | Vendor summary card | `components/lab/` |
| `ProductCatalog` | Browse products | `components/lab/` |
| `FeeScheduleEditor` | Edit pricing | `components/lab/` |
| `PriceComparison` | Compare lab prices | `components/lab/` |
| `ContractManager` | Contract CRUD | `components/lab/` |
| `PreferenceRuleBuilder` | Configure rules | `components/lab/` |
| `VendorScorecard` | Performance dashboard | `components/lab/` |
| `LabMessageThread` | Communication view | `components/lab/` |
| `CapabilityMatrix` | Lab capabilities grid | `components/lab/` |

---

## Business Rules

1. **Active Vendor Required**: Orders can only be submitted to active vendors
2. **Pricing Required**: Products must have fee schedule to be orderable
3. **Rule Priority**: Preference rules evaluated in priority order, first match wins
4. **Metrics Calculation**: Metrics calculated nightly or on-demand
5. **Contract Alerts**: Notifications sent based on renewal notice period
6. **Credential Security**: Portal credentials encrypted at rest
7. **Price History**: Previous pricing preserved for historical orders

---

## Related Documentation

- [Parent: Lab Work Management](../../)
- [Lab Orders](../lab-orders/)
- [Order Tracking](../order-tracking/)
- [Quality & Remakes](../quality-remakes/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
