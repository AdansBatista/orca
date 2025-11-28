# Vendor Profiles

> **Area**: [Vendors Management](../../)
>
> **Sub-Area**: 1. Vendor Profiles
>
> **Purpose**: Manage vendor records, contact information, service categories, credentials, and tax documentation

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Vendors Management](../../) |
| **Dependencies** | None |
| **Last Updated** | 2024-11-27 |

---

## Overview

Vendor Profiles provides comprehensive vendor information management for orthodontic practices. This includes complete vendor records with contact information, service categorization, credential and insurance tracking, and tax documentation management. The system supports diverse vendor types from orthodontic supply companies to professional service providers, enabling practices to maintain organized supplier relationships and ensure compliance.

The sub-area supports the unique vendor requirements of orthodontic practices, including orthodontic supply distributors, dental laboratories, equipment manufacturers, and various service providers. Multi-location practices can manage vendor assignments across clinics while maintaining centralized vendor information.

### Key Capabilities

- Complete vendor demographics and business information
- Multiple contact persons per vendor with roles
- Service and product category classification
- Insurance certificate and license tracking
- W-9/W-8 tax documentation management
- Preferred vendor designation
- Multi-location vendor assignments
- Vendor status management and approval workflows
- Credential expiration notifications

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 1.1 | [Vendor Profile Management](./functions/vendor-profile-management.md) | Create and manage vendor profiles | 📋 Planned | Critical |
| 1.2 | [Contact Management](./functions/contact-management.md) | Manage vendor contact persons | 📋 Planned | High |
| 1.3 | [Credential Tracking](./functions/credential-tracking.md) | Track vendor licenses and insurance | 📋 Planned | High |
| 1.4 | [Tax Documentation](./functions/tax-documentation.md) | Manage W-9 and tax documents | 📋 Planned | High |
| 1.5 | [Vendor Status](./functions/vendor-status.md) | Manage vendor status and approval | 📋 Planned | Medium |

---

## Function Details

### 1.1 Vendor Profile Management

**Purpose**: Create and maintain comprehensive vendor profiles with business information, payment terms, and assignments.

**Key Capabilities**:
- Business information management (name, legal name, tax ID)
- Address and primary contact information
- Payment terms configuration (NET 30, COD, etc.)
- Preferred payment method settings
- Bank account information for payments
- Credit limit management
- Multi-location assignments
- Preferred vendor designation
- Internal notes and documentation

**Vendor Types**:
| Type | Description | Examples |
|------|-------------|----------|
| Supplier | Product vendors | Orthodontic supplies, office supplies |
| Service Provider | Service vendors | IT, cleaning, maintenance |
| Contractor | Contract workers | Temporary staff, consultants |
| Laboratory | Dental lab services | Retainers, aligners, appliances |
| Manufacturer | Equipment manufacturers | Chairs, X-ray machines |
| Distributor | Supply distributors | Multi-brand distributors |

**User Stories**:
- As a **clinic admin**, I want to create vendor profiles so we can track supplier relationships
- As an **office manager**, I want to update vendor payment terms so invoices are processed correctly
- As a **billing specialist**, I want to view vendor bank details so I can set up payments

---

### 1.2 Contact Management

**Purpose**: Manage multiple contact persons per vendor with roles and communication preferences.

**Key Capabilities**:
- Multiple contacts per vendor
- Contact roles (sales, support, billing, account manager)
- Primary contact designation
- Direct contact information (email, phone, mobile)
- Contact notes and preferences
- Communication history tracking

**Contact Types**:
- **General**: General inquiries and communications
- **Sales**: Sales representatives for ordering
- **Support**: Technical or product support
- **Billing**: Invoice and payment inquiries
- **Technical**: Technical support contacts
- **Account Manager**: Dedicated account representatives
- **Emergency**: After-hours emergency contacts
- **Executive**: Executive contacts for escalations

**User Stories**:
- As an **office manager**, I want to add multiple contacts per vendor so I can reach the right person
- As a **front desk**, I want to quickly find vendor contact info when supplies arrive
- As a **clinical staff**, I want to contact vendor support when equipment needs service

---

### 1.3 Credential Tracking

**Purpose**: Track and monitor vendor credentials including business licenses, insurance certificates, and professional certifications.

**Key Capabilities**:
- Business license tracking
- Insurance certificate management (liability, workers comp)
- Professional license verification
- Expiration date tracking with alerts
- Document storage for credential copies
- Verification workflow and status
- FDA registration tracking (for medical suppliers)
- Coverage amount and type tracking

**Credential Types**:
| Credential | Description | Typical Vendors |
|------------|-------------|-----------------|
| Business License | State/local business license | All vendors |
| General Liability Insurance | Liability coverage | All on-site vendors |
| Professional Liability | Professional errors coverage | Consultants, professionals |
| Workers Compensation | Employee injury coverage | Service providers |
| Auto Insurance | Vehicle coverage | Delivery vendors |
| FDA Registration | Medical device registration | Supply vendors |
| State License | Professional state license | Labs, professionals |
| Bond | Surety bond | Contractors |
| Certificate of Insurance (COI) | Proof of coverage | All vendors |

**Compliance Alerts**:
- 90 days before expiration: Initial alert
- 60 days before expiration: Reminder alert
- 30 days before expiration: Urgent alert
- Expired: Critical alert with vendor hold

**User Stories**:
- As a **clinic admin**, I want to track vendor insurance so we maintain compliance
- As a **compliance officer**, I want alerts before credentials expire
- As an **office manager**, I want to verify vendors have proper coverage before contracting

---

### 1.4 Tax Documentation

**Purpose**: Manage W-9, W-8, and other tax-related documentation for vendor compliance.

**Key Capabilities**:
- W-9 form collection and storage
- W-8 form management for foreign vendors
- Tax ID (EIN/SSN) tracking
- 1099 eligibility determination
- Document expiration tracking
- Annual verification workflows
- Tax exempt certificate tracking

**Tax Document Types**:
- **W-9**: Request for Taxpayer Identification Number
- **W-8BEN**: Certificate of Foreign Status (individual)
- **W-8BEN-E**: Certificate of Foreign Status (entity)
- **Tax Exempt Certificate**: State tax exemption documentation
- **Resale Certificate**: Wholesale purchase authorization

**Business Rules**:
1. W-9 required before first payment to US vendors
2. W-8 required for foreign vendors
3. Documents should be refreshed annually
4. TIN must match vendor legal name
5. 1099 reporting for payments over $600/year

**User Stories**:
- As a **billing specialist**, I want to collect W-9 forms before paying vendors
- As an **accountant**, I want to verify tax IDs for 1099 reporting
- As a **clinic admin**, I want to track which vendors need tax document updates

---

### 1.5 Vendor Status

**Purpose**: Manage vendor lifecycle status including approval workflows, holds, and deactivation.

**Key Capabilities**:
- New vendor approval workflow
- Status transitions (pending, active, suspended, blocked)
- Preferred vendor management
- Vendor hold functionality
- Deactivation with history retention
- Reactivation workflows
- Audit trail of status changes

**Vendor Statuses**:
| Status | Description | Can Order? |
|--------|-------------|------------|
| Pending Approval | New vendor awaiting approval | No |
| Active | Approved and operational | Yes |
| Inactive | Temporarily not in use | No |
| Suspended | On hold pending resolution | No |
| Blocked | Permanently blocked | No |

**Approval Requirements**:
1. Complete business information
2. At least one contact person
3. W-9/W-8 on file (for payment)
4. Required insurance documentation
5. Admin approval for high-value vendors

**User Stories**:
- As a **clinic admin**, I want to approve new vendors before orders are placed
- As an **office manager**, I want to suspend vendors with compliance issues
- As a **staff member**, I want to see which vendors are approved for ordering

---

## Data Model

```prisma
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

  @@index([clinicId])
  @@index([vendorCode])
  @@index([status])
  @@index([vendorType])
  @@index([isPreferred])
}

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

enum CredentialStatus {
  ACTIVE
  EXPIRED
  PENDING_RENEWAL
  SUSPENDED
  REVOKED
  PENDING_VERIFICATION
}

type Address {
  street1   String
  street2   String?
  city      String
  state     String
  zipCode   String
  country   String @default("US")
}

type BankAccount {
  bankName      String
  accountType   String
  routingNumber String
  accountNumber String
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
| POST | `/api/vendors/:id/approve` | Approve vendor | `vendor:approve` |
| PUT | `/api/vendors/:id/status` | Update vendor status | `vendor:update` |
| GET | `/api/vendors/search` | Search vendors | `vendor:read` |
| GET | `/api/vendors/categories/:category` | Get vendors by category | `vendor:read` |

### Contacts

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/:id/contacts` | List vendor contacts | `vendor:read` |
| POST | `/api/vendors/:id/contacts` | Add contact | `vendor:update` |
| PUT | `/api/vendors/contacts/:contactId` | Update contact | `vendor:update` |
| DELETE | `/api/vendors/contacts/:contactId` | Delete contact | `vendor:update` |
| PUT | `/api/vendors/contacts/:contactId/primary` | Set as primary | `vendor:update` |

### Credentials

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/:id/credentials` | List credentials | `vendor:read` |
| POST | `/api/vendors/:id/credentials` | Add credential | `vendor:update` |
| PUT | `/api/vendors/credentials/:credentialId` | Update credential | `vendor:update` |
| DELETE | `/api/vendors/credentials/:credentialId` | Delete credential | `vendor:update` |
| POST | `/api/vendors/credentials/:credentialId/verify` | Verify credential | `vendor:update` |
| GET | `/api/vendors/credentials/expiring` | Get expiring credentials | `vendor:read` |

### Documents

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/:id/documents` | List documents | `vendor:read` |
| POST | `/api/vendors/:id/documents` | Upload document | `vendor:update` |
| GET | `/api/vendors/documents/:docId` | Download document | `vendor:read` |
| DELETE | `/api/vendors/documents/:docId` | Delete document | `vendor:update` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `VendorList` | List/search vendors with filters | `components/vendors/` |
| `VendorProfile` | Full vendor profile view | `components/vendors/` |
| `VendorForm` | Create/edit vendor profile | `components/vendors/` |
| `VendorCard` | Summary card for vendor | `components/vendors/` |
| `VendorQuickAdd` | Quick add vendor dialog | `components/vendors/` |
| `VendorSearch` | Vendor search component | `components/vendors/` |
| `VendorCategoryFilter` | Filter by category | `components/vendors/` |
| `VendorStatusBadge` | Status indicator | `components/vendors/` |
| `ContactList` | Display vendor contacts | `components/vendors/contacts/` |
| `ContactForm` | Add/edit contact | `components/vendors/contacts/` |
| `ContactCard` | Contact info card | `components/vendors/contacts/` |
| `CredentialList` | Display credentials with status | `components/vendors/credentials/` |
| `CredentialForm` | Add/edit credential | `components/vendors/credentials/` |
| `CredentialExpirationAlert` | Expiring credential alerts | `components/vendors/credentials/` |
| `InsuranceCertificateView` | View insurance details | `components/vendors/credentials/` |
| `DocumentUploader` | Upload vendor documents | `components/vendors/documents/` |
| `DocumentList` | List/download documents | `components/vendors/documents/` |
| `W9Manager` | W-9 collection and tracking | `components/vendors/documents/` |
| `VendorApprovalWorkflow` | Approval process UI | `components/vendors/` |

---

## Business Rules

1. **Vendor Codes**: Auto-generated with category prefix (e.g., SUP-001, LAB-001)
2. **Unique Names**: Vendor names must be unique within the organization
3. **Approval Required**: New vendors must be approved before orders can be placed
4. **W-9 Requirement**: W-9 must be on file before any payments over $600
5. **Insurance Verification**: Service providers must have valid insurance before on-site work
6. **Credential Expiration**: System alerts at 90/60/30 days before credential expiration
7. **Primary Contact**: Each vendor should have one primary contact designated
8. **Soft Delete**: Vendor records retained with deletedAt timestamp
9. **Multi-Location**: Vendors can be assigned to specific locations or all locations
10. **Status Restrictions**: Orders cannot be placed with suspended or blocked vendors

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Document Storage | Required | Secure file storage for documents |
| Email Service | Required | Expiration notifications |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Tax ID Verification | Optional | TIN/EIN validation service |
| Insurance Verification | Optional | Insurance certificate verification |
| Business License Lookup | Optional | License verification services |

---

## Related Documentation

- [Parent: Vendors Management](../../)
- [Contract Management](../contract-management/)
- [Order Management](../order-management/)
- [Vendor Performance](../vendor-performance/)
- [Financial Management](../../../financial-management/) - Payments integration

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
