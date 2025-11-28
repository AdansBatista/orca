# Vendors Management

> **Area**: Vendors Management
>
> **Phase**: 1 - Foundation Infrastructure
>
> **Purpose**: Manage vendor relationships, procurement, contracts, and performance tracking for orthodontic practices

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Medium |
| **Phase** | 1 - Foundation Infrastructure |
| **Dependencies** | Financial Management (for purchase orders and payments) |
| **Last Updated** | 2024-11-27 |

---

## Overview

The Vendors Management area provides comprehensive supplier relationship management for orthodontic practices. This includes vendor profiles and contact management, contract and agreement tracking, purchase order processing, and vendor performance monitoring. The system supports diverse vendor categories from orthodontic suppliers to service providers, enabling practices to optimize procurement, maintain compliance, and build strong supplier relationships.

### Key Capabilities

- **Vendor Profiles**: Complete vendor records with contact information, service categories, credentials, and tax documentation
- **Contract Management**: Contract storage, terms tracking, renewal management, and SLA monitoring
- **Order Management**: Purchase orders, requisitions, order tracking, receiving, and returns processing
- **Vendor Performance**: Performance metrics, quality tracking, delivery monitoring, and vendor scorecards

### Business Value

- Streamline procurement with centralized vendor management
- Reduce costs through vendor comparison and negotiation insights
- Ensure compliance with vendor credential and insurance tracking
- Minimize supply disruptions with proactive order management
- Improve vendor relationships through performance feedback
- Maintain audit trails for financial and regulatory compliance
- Optimize inventory with integrated order tracking

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 1 | [Vendor Profiles](./sub-areas/vendor-profiles/) | Vendor records, contact information, service categories, credentials, tax documentation | 📋 Planned | High |
| 2 | [Contract Management](./sub-areas/contract-management/) | Vendor contracts, terms, renewals, pricing agreements, service level agreements | 📋 Planned | Medium |
| 3 | [Order Management](./sub-areas/order-management/) | Purchase orders, requisitions, order tracking, receiving, returns | 📋 Planned | High |
| 4 | [Vendor Performance](./sub-areas/vendor-performance/) | Performance metrics, quality tracking, delivery tracking, vendor ratings, issue tracking | 📋 Planned | Medium |

---

## Sub-Area Details

### 1. Vendor Profiles

Comprehensive vendor profile and information management for all practice suppliers and service providers.

**Functions:**
- Vendor Profile Management
- Contact Information Management
- Service Category Assignment
- Credential & License Tracking
- Tax Documentation Management
- Vendor Status Management

**Key Features:**
- Complete vendor demographics and contact information
- Multiple contact persons per vendor with roles
- Service and product category classification
- Insurance and license verification tracking
- W-9 and tax document storage
- Preferred vendor designation
- Multi-location vendor assignments

---

### 2. Contract Management

Manage vendor contracts, agreements, pricing terms, and service level agreements.

**Functions:**
- Contract Creation & Storage
- Terms & Conditions Tracking
- Renewal Management
- Pricing Agreement Management
- SLA Monitoring
- Contract Compliance Tracking

**Key Features:**
- Centralized contract document storage
- Automated renewal reminders (90/60/30 days)
- Pricing tier and discount tracking
- Service level agreement monitoring
- Contract amendment history
- Expiration alerts and notifications
- Approval workflow for new contracts

---

### 3. Order Management

Create and manage purchase orders, track deliveries, and process returns.

**Functions:**
- Purchase Order Creation
- Requisition Management
- Order Tracking
- Receiving & Fulfillment
- Returns Processing
- Reorder Management

**Key Features:**
- Purchase order generation with approval workflow
- Requisition requests from staff
- Real-time order status tracking
- Partial delivery handling
- Back-order management
- Return merchandise authorization (RMA)
- Automatic reorder point alerts
- Integration with inventory management

---

### 4. Vendor Performance

Track and evaluate vendor performance through metrics, ratings, and issue tracking.

**Functions:**
- Performance Metric Tracking
- Quality Monitoring
- Delivery Performance Analysis
- Vendor Rating & Scoring
- Issue & Dispute Tracking
- Vendor Comparison Reports

**Key Features:**
- Automated performance scorecards
- On-time delivery tracking
- Quality issue documentation
- Price competitiveness analysis
- Vendor comparison dashboards
- Issue resolution tracking
- Performance trend analysis

---

## Vendor Categories

| Category | Description | Examples | Key Considerations |
|----------|-------------|----------|-------------------|
| **Orthodontic Supplies** | Core treatment materials | Brackets, wires, elastics, bonding materials, bands, archwires | Product catalog, lot tracking, expiration dates |
| **Lab Services** | Dental laboratory work | Retainers, appliances, models, aligners, splints | Turnaround time, prescription tracking, case management |
| **Equipment** | Clinical equipment | Chairs, X-ray machines, sterilizers, intraoral scanners, compressors | Warranty, maintenance contracts, installation |
| **Maintenance & Repair** | Equipment service | Equipment repair, preventive maintenance, calibration | Response time SLA, certifications, service history |
| **IT Services** | Technology support | Network support, software, hardware, security, backups | Data security compliance, uptime SLA, support hours |
| **Facility Services** | Building maintenance | Cleaning, HVAC, plumbing, electrical, landscaping | Schedule compliance, background checks, insurance |
| **Waste Management** | Regulated waste | Medical waste, hazardous waste, recycling, sharps disposal | Compliance certifications, pickup schedules, manifests |
| **Professional Services** | Business services | Accountants, attorneys, consultants, HR services | Credentials, confidentiality, retainer agreements |
| **Insurance & Benefits** | Employee benefits | Health insurance, malpractice, liability, workers comp | Policy terms, renewal dates, coverage verification |
| **Marketing** | Marketing services | Advertising, web design, SEO, social media, print materials | Deliverables, campaign tracking, ROI metrics |
| **Staffing** | Temporary staffing | Temp assistants, locum doctors, front desk coverage | Credentials, rates, availability, background checks |
| **Education** | Training providers | CE courses, certifications, conference organizers | CE credit tracking, accreditation, scheduling |
| **Software** | Software vendors | Practice management, imaging, communication platforms | License terms, support SLA, data ownership |
| **Office Supplies** | General supplies | Paper, printer supplies, breakroom items, forms | Pricing, delivery schedule, minimum orders |

---

## Integration Points

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Financial Management | Accounts Payable | Process vendor invoices and payments |
| Financial Management | Purchase Orders | Financial tracking of procurement |
| Resources Management | Inventory | Track inventory levels and reorder points |
| Resources Management | Equipment | Link equipment to maintenance vendors |
| Staff Management | Staffing Agencies | Temporary staff coordination |
| Practice Orchestration | Workflows | Procurement approval workflows |
| Compliance & Audit | Audit Logs | Track vendor-related activities |
| Patient Management | Lab Cases | Connect lab vendors to patient cases |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| Supplier Portals | API/EDI | Electronic order submission |
| Payment Processors | API | Electronic payments (ACH, virtual cards) |
| Insurance Verification | API | Verify vendor insurance coverage |
| Credit Check Services | API | Vendor credit assessment |
| Tax Databases | API | W-9/TIN verification |
| Shipping Carriers | API | Package tracking |
| Dental Lab Systems | API | Digital lab case submission |
| Equipment Manufacturers | API | Warranty and service requests |

---

## User Roles & Permissions

| Role | Profiles | Contracts | Orders | Performance |
|------|----------|-----------|--------|-------------|
| Super Admin | Full | Full | Full | Full |
| Clinic Admin | Full | Full | Full | Full |
| Doctor | View | View | View, Request | View |
| Clinical Staff | View Limited | View | View, Request | View |
| Front Desk | View Limited | View | View, Request | View |
| Billing | View | View | Full | View |
| Office Manager | Full | Full | Full | Full |
| Read Only | View | View | View | View |

### Special Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `vendor:create` | Add new vendors | clinic_admin, office_manager |
| `vendor:update` | Update vendor profiles | clinic_admin, office_manager |
| `vendor:delete` | Remove vendors (soft delete) | clinic_admin |
| `vendor:view_financial` | View pricing and payment info | clinic_admin, billing |
| `contract:create` | Create new contracts | clinic_admin, office_manager |
| `contract:approve` | Approve contracts | clinic_admin |
| `contract:view_terms` | View contract terms | clinic_admin, billing, office_manager |
| `order:create` | Create purchase orders | clinic_admin, office_manager, billing |
| `order:approve` | Approve purchase orders | clinic_admin, office_manager |
| `order:receive` | Receive and process deliveries | clinical_staff, office_manager |
| `order:return` | Process returns | office_manager, billing |
| `performance:rate` | Rate vendor performance | clinic_admin, office_manager |
| `performance:view_all` | View all vendor metrics | clinic_admin, office_manager |

---

## Data Models

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vendor      │────▶│ VendorContact   │     │ VendorCategory  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               ▲
        │                                               │
        ▼                                               │
┌─────────────────┐     ┌─────────────────┐            │
│VendorCredential │     │ VendorDocument  │────────────┘
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Contract     │────▶│ ContractTerm    │     │   ContractSLA   │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ PurchaseOrder   │────▶│ PurchaseOrderItem│    │ OrderReceipt    │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ VendorRating    │────▶│ PerformanceMetric│    │  VendorIssue   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Prisma Schemas

```prisma
// Vendor Profile
model Vendor {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Basic Information
  name          String
  legalName     String?
  vendorCode    String   @unique
  vendorType    VendorType
  categories    VendorCategoryType[]

  // Contact Information
  email         String?
  phone         String?
  fax           String?
  website       String?
  address       Address?

  // Business Information
  taxId         String?  // EIN/SSN
  dunsNumber    String?
  businessType  BusinessType?

  // Payment Information
  paymentTerms  PaymentTerms @default(NET_30)
  paymentMethod PreferredPaymentMethod?
  bankAccount   BankAccount?
  creditLimit   Decimal?

  // Status
  status        VendorStatus @default(ACTIVE)
  isPreferred   Boolean  @default(false)
  isApproved    Boolean  @default(false)
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // Multi-Location
  assignedClinicIds String[] @db.ObjectId

  // Notes
  notes         String?
  internalNotes String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  contacts      VendorContact[]
  credentials   VendorCredential[]
  documents     VendorDocument[]
  contracts     Contract[]
  purchaseOrders PurchaseOrder[]
  ratings       VendorRating[]
  issues        VendorIssue[]

  @@index([clinicId])
  @@index([vendorCode])
  @@index([status])
  @@index([vendorType])
  @@index([isPreferred])
}

enum VendorType {
  SUPPLIER
  SERVICE_PROVIDER
  CONTRACTOR
  CONSULTANT
  LABORATORY
  MANUFACTURER
  DISTRIBUTOR
}

enum VendorCategoryType {
  ORTHODONTIC_SUPPLIES
  LAB_SERVICES
  EQUIPMENT
  MAINTENANCE_REPAIR
  IT_SERVICES
  FACILITY_SERVICES
  WASTE_MANAGEMENT
  PROFESSIONAL_SERVICES
  INSURANCE_BENEFITS
  MARKETING
  STAFFING
  EDUCATION
  SOFTWARE
  OFFICE_SUPPLIES
  OTHER
}

enum BusinessType {
  SOLE_PROPRIETOR
  PARTNERSHIP
  CORPORATION
  LLC
  NON_PROFIT
  GOVERNMENT
}

enum VendorStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_APPROVAL
  BLOCKED
}

enum PaymentTerms {
  NET_15
  NET_30
  NET_45
  NET_60
  NET_90
  DUE_ON_RECEIPT
  PREPAID
  COD
  CUSTOM
}

enum PreferredPaymentMethod {
  CHECK
  ACH
  WIRE
  CREDIT_CARD
  VIRTUAL_CARD
}

type BankAccount {
  bankName      String
  accountType   String
  routingNumber String
  accountNumber String
}

// Vendor Contact
model VendorContact {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  vendorId      String   @db.ObjectId

  // Contact Information
  firstName     String
  lastName      String
  title         String?
  email         String?
  phone         String?
  mobile        String?
  fax           String?

  // Role
  contactType   VendorContactType @default(GENERAL)
  isPrimary     Boolean  @default(false)

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  vendor        Vendor    @relation(fields: [vendorId], references: [id])

  @@index([vendorId])
  @@index([contactType])
}

enum VendorContactType {
  GENERAL
  SALES
  SUPPORT
  BILLING
  TECHNICAL
  ACCOUNT_MANAGER
  EMERGENCY
  EXECUTIVE
}

// Vendor Credential (Licenses, Insurance)
model VendorCredential {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Credential Details
  credentialType VendorCredentialType
  credentialName String
  credentialNumber String?
  issuingAuthority String?

  // Dates
  issueDate     DateTime?
  expirationDate DateTime?

  // Coverage (for insurance)
  coverageAmount Decimal?
  coverageType  String?

  // Status
  status        CredentialStatus @default(ACTIVE)
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId

  // Documents
  documentUrl   String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([credentialType])
  @@index([expirationDate])
  @@index([status])
}

enum VendorCredentialType {
  BUSINESS_LICENSE
  PROFESSIONAL_LICENSE
  GENERAL_LIABILITY_INSURANCE
  PROFESSIONAL_LIABILITY_INSURANCE
  WORKERS_COMP_INSURANCE
  AUTO_INSURANCE
  BOND
  FDA_REGISTRATION
  DEA_LICENSE
  STATE_LICENSE
  CERTIFICATION
  W9
  COI
}

// Vendor Document
model VendorDocument {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Document Details
  documentType  VendorDocumentType
  documentName  String
  description   String?
  fileUrl       String
  fileSize      Int?
  mimeType      String?

  // Dates
  documentDate  DateTime?
  expirationDate DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([documentType])
}

enum VendorDocumentType {
  W9
  W8
  INSURANCE_CERTIFICATE
  CONTRACT
  PRICE_LIST
  PRODUCT_CATALOG
  LICENSE
  CERTIFICATION
  SDS
  SPEC_SHEET
  CORRESPONDENCE
  OTHER
}

// Contract
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

// Contract Terms (Pricing, Discounts)
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

// Contract SLA
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

// Contract Amendment
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

// Purchase Order
model PurchaseOrder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Order Details
  orderNumber   String   @unique
  orderType     PurchaseOrderType @default(STANDARD)

  // Dates
  orderDate     DateTime @default(now())
  expectedDate  DateTime?
  requiredDate  DateTime?

  // Shipping
  shipToAddress Address?
  shippingMethod String?
  shippingCost  Decimal?

  // Totals
  subtotal      Decimal
  taxAmount     Decimal  @default(0)
  discount      Decimal  @default(0)
  totalAmount   Decimal

  // Status
  status        PurchaseOrderStatus @default(DRAFT)

  // References
  requisitionId String?  @db.ObjectId
  contractId    String?  @db.ObjectId

  // Notes
  notes         String?
  vendorNotes   String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy     String?  @db.ObjectId
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])
  items         PurchaseOrderItem[]
  receipts      OrderReceipt[]

  @@index([clinicId])
  @@index([vendorId])
  @@index([orderNumber])
  @@index([status])
  @@index([orderDate])
}

enum PurchaseOrderType {
  STANDARD
  BLANKET
  PLANNED
  EMERGENCY
  RECURRING
}

enum PurchaseOrderStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SENT
  ACKNOWLEDGED
  PARTIALLY_RECEIVED
  RECEIVED
  COMPLETED
  CANCELLED
  ON_HOLD
}

// Purchase Order Item
model PurchaseOrderItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  purchaseOrderId String @db.ObjectId

  // Item Details
  itemCode      String?
  description   String
  quantity      Decimal
  unit          String   @default("EA")
  unitPrice     Decimal
  discount      Decimal  @default(0)
  taxRate       Decimal  @default(0)
  lineTotal     Decimal

  // Inventory Reference
  inventoryItemId String? @db.ObjectId

  // Received Quantities
  quantityReceived Decimal @default(0)
  quantityReturned Decimal @default(0)

  // Status
  status        OrderItemStatus @default(PENDING)

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])

  @@index([purchaseOrderId])
  @@index([itemCode])
  @@index([status])
}

enum OrderItemStatus {
  PENDING
  PARTIALLY_RECEIVED
  RECEIVED
  BACK_ORDERED
  CANCELLED
}

// Order Receipt (Receiving)
model OrderReceipt {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  purchaseOrderId String @db.ObjectId

  // Receipt Details
  receiptNumber String   @unique
  receiptDate   DateTime @default(now())
  receivedBy    String   @db.ObjectId

  // Shipping Info
  trackingNumber String?
  carrier       String?
  packingSlipNumber String?

  // Status
  status        ReceiptStatus @default(PENDING)

  // Quality Check
  inspectedBy   String?  @db.ObjectId
  inspectedAt   DateTime?
  qualityStatus QualityStatus?

  // Notes
  notes         String?

  // Documents
  documentUrl   String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  items         OrderReceiptItem[]

  @@index([clinicId])
  @@index([purchaseOrderId])
  @@index([receiptNumber])
  @@index([receiptDate])
}

enum ReceiptStatus {
  PENDING
  PROCESSING
  COMPLETED
  REJECTED
}

enum QualityStatus {
  PASSED
  FAILED
  PARTIAL_PASS
  PENDING_INSPECTION
}

// Order Receipt Item
model OrderReceiptItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  orderReceiptId String  @db.ObjectId
  purchaseOrderItemId String @db.ObjectId

  // Quantities
  quantityReceived Decimal
  quantityAccepted Decimal?
  quantityRejected Decimal?

  // Quality
  qualityStatus QualityStatus?
  rejectionReason String?

  // Lot/Serial Tracking
  lotNumber     String?
  serialNumber  String?
  expirationDate DateTime?

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  orderReceipt  OrderReceipt @relation(fields: [orderReceiptId], references: [id])

  @@index([orderReceiptId])
  @@index([purchaseOrderItemId])
}

// Vendor Rating
model VendorRating {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Rating Period
  periodStart   DateTime
  periodEnd     DateTime

  // Scores (1-5 scale)
  overallScore  Decimal
  qualityScore  Decimal?
  deliveryScore Decimal?
  priceScore    Decimal?
  serviceScore  Decimal?
  communicationScore Decimal?

  // Metrics
  onTimeDeliveryRate Decimal?
  orderAccuracyRate Decimal?
  defectRate    Decimal?
  responseTime  Decimal? // Hours

  // Statistics
  totalOrders   Int      @default(0)
  totalSpend    Decimal  @default(0)
  totalIssues   Int      @default(0)

  // Comments
  strengths     String?
  improvements  String?
  notes         String?

  // Status
  status        RatingStatus @default(DRAFT)
  reviewedBy    String?  @db.ObjectId
  reviewedAt    DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([periodStart])
  @@index([overallScore])
}

enum RatingStatus {
  DRAFT
  SUBMITTED
  REVIEWED
  PUBLISHED
}

// Vendor Issue
model VendorIssue {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Issue Details
  issueNumber   String   @unique
  issueType     VendorIssueType
  severity      IssueSeverity @default(MEDIUM)
  title         String
  description   String

  // References
  purchaseOrderId String? @db.ObjectId
  orderReceiptId String? @db.ObjectId

  // Status
  status        IssueStatus @default(OPEN)
  resolution    String?
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  // Financial Impact
  financialImpact Decimal?
  creditReceived Decimal?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([issueNumber])
  @@index([status])
  @@index([issueType])
}

enum VendorIssueType {
  LATE_DELIVERY
  WRONG_ITEM
  DAMAGED_GOODS
  QUALITY_DEFECT
  QUANTITY_DISCREPANCY
  PRICING_ERROR
  BILLING_ISSUE
  COMMUNICATION
  SERVICE_FAILURE
  CONTRACT_VIOLATION
  OTHER
}

enum IssueSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum IssueStatus {
  OPEN
  IN_PROGRESS
  PENDING_VENDOR
  RESOLVED
  CLOSED
  ESCALATED
}
```

---

## API Endpoints

### Vendor Profiles

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors` | List vendors | `vendor:read` |
| GET | `/api/vendors/:id` | Get vendor profile | `vendor:read` |
| POST | `/api/vendors` | Create vendor | `vendor:create` |
| PUT | `/api/vendors/:id` | Update vendor | `vendor:update` |
| DELETE | `/api/vendors/:id` | Delete vendor (soft) | `vendor:delete` |
| GET | `/api/vendors/:id/contacts` | Get vendor contacts | `vendor:read` |
| POST | `/api/vendors/:id/contacts` | Add contact | `vendor:update` |
| GET | `/api/vendors/:id/credentials` | Get vendor credentials | `vendor:read` |
| POST | `/api/vendors/:id/credentials` | Add credential | `vendor:update` |
| GET | `/api/vendors/:id/documents` | Get vendor documents | `vendor:read` |
| POST | `/api/vendors/:id/documents` | Upload document | `vendor:update` |

### Contracts

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/contracts` | List contracts | `contract:read` |
| GET | `/api/vendors/:id/contracts` | Get vendor contracts | `contract:read` |
| GET | `/api/vendors/contracts/:id` | Get contract details | `contract:read` |
| POST | `/api/vendors/:vendorId/contracts` | Create contract | `contract:create` |
| PUT | `/api/vendors/contracts/:id` | Update contract | `contract:update` |
| POST | `/api/vendors/contracts/:id/approve` | Approve contract | `contract:approve` |
| GET | `/api/vendors/contracts/:id/terms` | Get contract terms | `contract:view_terms` |
| POST | `/api/vendors/contracts/:id/amendments` | Add amendment | `contract:update` |
| GET | `/api/vendors/contracts/expiring` | List expiring contracts | `contract:read` |

### Purchase Orders

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/orders` | List purchase orders | `order:read` |
| GET | `/api/vendors/:id/orders` | Get vendor orders | `order:read` |
| GET | `/api/vendors/orders/:id` | Get order details | `order:read` |
| POST | `/api/vendors/:vendorId/orders` | Create order | `order:create` |
| PUT | `/api/vendors/orders/:id` | Update order | `order:update` |
| POST | `/api/vendors/orders/:id/submit` | Submit order | `order:create` |
| POST | `/api/vendors/orders/:id/approve` | Approve order | `order:approve` |
| POST | `/api/vendors/orders/:id/receive` | Receive order | `order:receive` |
| POST | `/api/vendors/orders/:id/return` | Create return | `order:return` |
| GET | `/api/vendors/orders/pending` | List pending orders | `order:read` |

### Vendor Performance

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/:id/performance` | Get vendor performance | `performance:read` |
| GET | `/api/vendors/:id/ratings` | Get vendor ratings | `performance:read` |
| POST | `/api/vendors/:id/ratings` | Create rating | `performance:rate` |
| GET | `/api/vendors/:id/issues` | Get vendor issues | `performance:read` |
| POST | `/api/vendors/:id/issues` | Create issue | `performance:create` |
| PUT | `/api/vendors/issues/:id` | Update issue | `performance:update` |
| GET | `/api/vendors/performance/comparison` | Compare vendors | `performance:view_all` |
| GET | `/api/vendors/performance/reports` | Performance reports | `performance:view_all` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `VendorList` | List/search vendors | `components/vendors/` |
| `VendorProfile` | Full vendor profile view | `components/vendors/` |
| `VendorForm` | Add/edit vendor | `components/vendors/` |
| `VendorCard` | Summary card for vendor | `components/vendors/` |
| `VendorContactList` | Display contacts | `components/vendors/contacts/` |
| `VendorContactForm` | Add/edit contact | `components/vendors/contacts/` |
| `CredentialList` | Display credentials | `components/vendors/credentials/` |
| `CredentialForm` | Add/edit credential | `components/vendors/credentials/` |
| `CredentialAlert` | Expiring credential alert | `components/vendors/credentials/` |
| `DocumentManager` | Manage vendor documents | `components/vendors/documents/` |
| `ContractList` | List contracts | `components/vendors/contracts/` |
| `ContractDetail` | View contract details | `components/vendors/contracts/` |
| `ContractForm` | Create/edit contract | `components/vendors/contracts/` |
| `ContractTerms` | Display contract terms | `components/vendors/contracts/` |
| `ContractRenewalAlert` | Renewal notification | `components/vendors/contracts/` |
| `SLAMonitor` | Monitor SLA compliance | `components/vendors/contracts/` |
| `PurchaseOrderList` | List purchase orders | `components/vendors/orders/` |
| `PurchaseOrderDetail` | View PO details | `components/vendors/orders/` |
| `PurchaseOrderForm` | Create/edit PO | `components/vendors/orders/` |
| `OrderItemTable` | Order line items | `components/vendors/orders/` |
| `ReceivingForm` | Receive deliveries | `components/vendors/orders/` |
| `ReturnForm` | Process returns | `components/vendors/orders/` |
| `OrderStatusTracker` | Track order status | `components/vendors/orders/` |
| `VendorScorecard` | Performance scorecard | `components/vendors/performance/` |
| `RatingForm` | Rate vendor performance | `components/vendors/performance/` |
| `PerformanceDashboard` | Performance overview | `components/vendors/performance/` |
| `VendorComparison` | Compare vendors | `components/vendors/performance/` |
| `IssueList` | List vendor issues | `components/vendors/issues/` |
| `IssueForm` | Create/edit issue | `components/vendors/issues/` |
| `IssueTracker` | Track issue status | `components/vendors/issues/` |
| `SpendingAnalytics` | Spending reports | `components/vendors/analytics/` |

---

## Business Rules

### Vendor Profiles
1. **Vendor Codes**: Must be unique across the organization
2. **Approval Required**: New vendors must be approved before orders can be placed
3. **Preferred Vendors**: Mark key vendors as preferred for ordering recommendations
4. **Multi-Location**: Vendors can be assigned to specific locations or all locations
5. **Inactive Vendors**: Orders cannot be placed with inactive or suspended vendors
6. **Tax Documentation**: W-9 must be on file for US vendors before payment

### Credentials & Insurance
1. **Insurance Requirements**: Vendors must maintain required insurance coverage
2. **Expiration Alerts**: System alerts 90/60/30 days before credential expiration
3. **Expired Credentials**: Flag vendors with expired required credentials
4. **Insurance Verification**: Verify insurance certificates annually
5. **Compliance Hold**: Vendors with expired critical credentials placed on hold

### Contracts
1. **Approval Workflow**: Contracts above threshold require additional approval
2. **Renewal Reminders**: Alert 90/60/30 days before contract renewal/expiration
3. **Auto-Renewal Tracking**: Flag contracts with auto-renewal clauses
4. **Amendment History**: Maintain full amendment history
5. **SLA Monitoring**: Track SLA compliance and alert on violations

### Purchase Orders
1. **Approval Thresholds**: Orders above $500 require manager approval
2. **Approved Vendors Only**: Orders only to approved vendors
3. **Budget Checking**: Validate against budget before approval
4. **Partial Receiving**: Support partial deliveries and back-orders
5. **Three-Way Match**: Match PO, receipt, and invoice before payment
6. **Order Limits**: Enforce credit limits on vendor orders

### Performance
1. **Automatic Tracking**: Auto-calculate delivery and quality metrics
2. **Issue Escalation**: Critical issues escalate automatically
3. **Rating Periods**: Ratings calculated quarterly by default
4. **Impact Analysis**: Track financial impact of vendor issues
5. **Scorecard Distribution**: Share relevant performance data with vendors

---

## Compliance Requirements

### Vendor Documentation
- W-9/W-8 tax forms for all US/foreign vendors
- Certificates of Insurance (COI) for service providers
- Business licenses and registrations
- Professional licenses for licensed services
- Background checks for on-site service providers
- HIPAA Business Associate Agreements (BAA) for PHI access

### Insurance Requirements
- General liability insurance (minimum coverage)
- Professional liability for professional services
- Workers' compensation for on-site vendors
- Auto insurance for delivery vendors
- Cyber liability for IT/software vendors

### Regulatory Compliance
- FDA registration for medical device suppliers
- State pharmacy license for pharmaceutical vendors
- EPA compliance for waste disposal vendors
- OSHA compliance for facility services
- State dental board compliance for lab services

### Financial Compliance
- 1099 reporting for applicable vendors
- Sales tax exemption documentation
- Payment terms compliance
- Anti-kickback verification
- Conflict of interest disclosure

---

## Implementation Notes

### Phase 1 Dependencies
- **Financial Management**: For accounts payable integration and payment processing

### Implementation Order
1. Vendor Profiles (foundation for vendor data)
2. Contract Management (agreements and terms)
3. Order Management (procurement workflow)
4. Vendor Performance (metrics and tracking)

### Key Technical Decisions
- Vendor codes generated automatically with prefix by category
- Soft delete for all vendor records (audit trail)
- Document storage integrated with file management system
- Three-way match validation for invoice processing
- Real-time order status tracking via vendor integrations

### Multi-Location Considerations
- Vendors can be global or location-specific
- Contracts may apply to specific locations
- Orders placed at location level
- Performance tracked organization-wide and per-location
- Pricing may vary by location per contract terms

---

## File Structure

```
docs/areas/vendors-management/
├── README.md                      # This file (area overview)
└── sub-areas/
    ├── vendor-profiles/
    │   ├── README.md
    │   └── functions/
    │       ├── vendor-profile-management.md
    │       ├── contact-management.md
    │       ├── credential-tracking.md
    │       ├── tax-documentation.md
    │       └── vendor-status.md
    │
    ├── contract-management/
    │   ├── README.md
    │   └── functions/
    │       ├── contract-creation.md
    │       ├── terms-tracking.md
    │       ├── renewal-management.md
    │       ├── pricing-agreements.md
    │       └── sla-monitoring.md
    │
    ├── order-management/
    │   ├── README.md
    │   └── functions/
    │       ├── purchase-orders.md
    │       ├── requisitions.md
    │       ├── order-tracking.md
    │       ├── receiving.md
    │       └── returns.md
    │
    └── vendor-performance/
        ├── README.md
        └── functions/
            ├── performance-metrics.md
            ├── quality-tracking.md
            ├── delivery-tracking.md
            ├── vendor-ratings.md
            └── issue-tracking.md
```

---

## Related Documentation

- [Financial Management](../financial-management/) - Accounts payable integration
- [Resources Management](../resources-management/) - Inventory integration
- [Practice Orchestration](../practice-orchestration/) - Workflow integration
- [Compliance & Audit](../compliance-audit/) - Vendor compliance tracking
- [TECH-STACK](../../guides/TECH-STACK.md) - Technical standards

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
**Last Updated**: 2024-11-27
**Owner**: Development Team
