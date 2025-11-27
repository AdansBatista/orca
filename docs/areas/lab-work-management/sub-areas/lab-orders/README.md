# Lab Orders

> **Area**: [Lab Work Management](../../)
>
> **Sub-Area**: 3.4.1 Lab Orders
>
> **Purpose**: Create and submit orthodontic lab orders with digital case files, prescriptions, and treatment specifications

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Lab Work Management](../../) |
| **Dependencies** | Auth, Treatment Management, Imaging Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Lab Orders is the primary interface for creating and submitting orthodontic lab cases. It provides digital prescription forms for appliances, retainers, and aligners, with the ability to attach STL files, photos, and detailed specifications. Orders integrate with treatment plans to automatically suggest when lab work is needed.

This sub-area replaces paper lab prescription forms with a streamlined digital workflow. Clinicians can select products, configure specifications, attach digital files from the imaging system, and submit directly to lab portals—all from within the patient record.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.4.1.1 | [Lab Order Creation](./functions/lab-order-creation.md) | Create new lab orders for patients | 📋 Planned | Critical |
| 3.4.1.2 | [Case Prescription Builder](./functions/case-prescription-builder.md) | Configure appliance specifications | 📋 Planned | Critical |
| 3.4.1.3 | [Digital File Attachment](./functions/digital-file-attachment.md) | Attach STL files, photos, documents | 📋 Planned | High |
| 3.4.1.4 | [Order Templates](./functions/order-templates.md) | Reusable templates for common orders | 📋 Planned | Medium |
| 3.4.1.5 | [Rush Order Management](./functions/rush-order-management.md) | Handle expedited orders | 📋 Planned | Medium |
| 3.4.1.6 | [Batch Order Submission](./functions/batch-order-submission.md) | Submit multiple orders at once | 📋 Planned | Low |

---

## Function Details

### 3.4.1.1 Lab Order Creation

**Purpose**: Create new lab orders associated with patients and treatment plans.

**Key Capabilities**:
- Create order from patient record or treatment plan
- Select lab vendor (or use preferred lab rules)
- Add one or multiple items to single order
- Set required date based on patient appointment
- Link to treatment milestone
- Auto-populate patient demographics
- Calculate estimated cost from fee schedule
- Save as draft or submit immediately

**Order Creation Flow**:
1. Select patient (or start from patient record)
2. Choose product category (retainer, appliance, aligner)
3. Select specific product
4. Configure prescription details
5. Attach digital files
6. Select lab vendor
7. Set due date and priority
8. Review and submit

**User Stories**:
- As a **doctor**, I want to order a retainer for a patient who just got braces off
- As a **clinical staff**, I want to create an appliance order with detailed specifications
- As a **doctor**, I want to see the estimated cost before submitting the order

---

### 3.4.1.2 Case Prescription Builder

**Purpose**: Configure detailed specifications for orthodontic appliances and retainers.

**Key Capabilities**:
- Product-specific prescription forms
- Wire type/size selection
- Expansion parameters (for RPE, quad helix)
- Acrylic color/design choices
- Tooth selection diagrams
- Band size specifications
- Special instructions field
- Reference to treatment plan goals

**Prescription Types**:

| Product Category | Key Specifications |
|------------------|-------------------|
| **Hawley Retainer** | Wire type, clasps, acrylic color, labial bow design |
| **Clear Retainer** | Material thickness, coverage, pontics if needed |
| **RPE/Expander** | Expansion type (Hyrax/Haas), activation schedule, band sizes |
| **Herbst** | Telescopic type, advancement, band/crown design |
| **Quad Helix** | Wire size, expansion amount, activation bends |
| **Space Maintainer** | Type (band & loop, Nance), tooth numbers |
| **Indirect Bonding** | Bracket system, wire sequence, setup instructions |
| **Custom Archwires** | Wire type, dimensions, specific bends |

**User Stories**:
- As a **doctor**, I want to specify exact expansion settings for an RPE
- As a **clinical staff**, I want to select acrylic colors for a Hawley retainer
- As a **doctor**, I want to include special instructions for a complex appliance

---

### 3.4.1.3 Digital File Attachment

**Purpose**: Attach STL scans, photos, and documents to lab orders.

**Key Capabilities**:
- Pull STL files from Imaging Management
- Attach photos (intraoral, shade reference)
- Upload documents (previous Rx, special instructions)
- iTero scan integration
- 3Shape file import
- File preview before submission
- Automatic file compression for transmission
- Version tracking for updated files

**Supported File Types**:
| Type | Formats | Source |
|------|---------|--------|
| **3D Scans** | STL, PLY, OBJ | iTero, 3Shape, Medit |
| **Photos** | JPG, PNG | Imaging Management, upload |
| **X-rays** | JPG, PNG, DICOM export | Imaging Management |
| **Documents** | PDF | Upload |

**User Stories**:
- As a **clinical staff**, I want to attach the patient's iTero scan to the retainer order
- As a **doctor**, I want to include intraoral photos for shade matching
- As a **clinical staff**, I want to pull existing scans from the patient's imaging gallery

---

### 3.4.1.4 Order Templates

**Purpose**: Create and use reusable templates for frequently ordered items.

**Key Capabilities**:
- Save order configuration as template
- Clinic-wide and personal templates
- Template categories by product type
- Quick-apply template to new order
- Override template defaults
- Template versioning
- Import/export templates

**Common Templates**:
| Template | Description |
|----------|-------------|
| **Standard Hawley** | Basic Hawley retainer with common settings |
| **Clear Essix Upper/Lower** | Standard clear retainer |
| **Hyrax RPE - Child** | Pediatric RPE with standard settings |
| **Hyrax RPE - Adult** | Adult RPE with bone-borne option |
| **Indirect Bonding Setup** | Standard IDB tray order |
| **Vivera Set** | Invisalign Vivera retainer set |

**User Stories**:
- As a **doctor**, I want to use my standard retainer template to speed up ordering
- As a **clinic admin**, I want to create templates that all staff can use
- As a **clinical staff**, I want to modify a template for a specific patient need

---

### 3.4.1.5 Rush Order Management

**Purpose**: Handle expedited orders with appropriate tracking and upcharges.

**Key Capabilities**:
- Flag order as rush/expedite
- Select rush level (next day, 2-3 day, standard rush)
- Automatic upcharge calculation
- Rush reason documentation
- Priority queue visibility
- Rush order reporting
- Lab notification of rush status

**Rush Levels**:
| Level | Typical Turnaround | Upcharge |
|-------|-------------------|----------|
| **Emergency** | Same day / Next day | 100-200% |
| **Rush** | 2-3 business days | 50-75% |
| **Priority** | 3-5 business days | 25-50% |
| **Standard** | Normal turnaround | None |

**User Stories**:
- As a **doctor**, I want to order a rush retainer for a patient who lost theirs before vacation
- As a **clinical staff**, I want to see the upcharge before marking an order as rush
- As a **billing**, I want to track rush charges for accurate patient billing

---

### 3.4.1.6 Batch Order Submission

**Purpose**: Submit multiple orders to the same lab efficiently.

**Key Capabilities**:
- Select multiple draft orders for submission
- Batch submission to single lab
- Combined shipping option
- Batch status tracking
- Submission confirmation for all items
- Error handling for individual failures

**User Stories**:
- As a **clinical staff**, I want to submit all pending orders to our main lab at end of day
- As a **clinical staff**, I want to combine orders for shipping efficiency
- As a **office manager**, I want to see how many orders are pending submission

---

## Data Model

```prisma
model LabOrder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Order identification
  orderNumber   String   @unique  // Clinic-generated order number
  externalOrderId String? // Lab's order number after submission

  // Vendor
  vendorId      String   @db.ObjectId

  // Status
  status        LabOrderStatus @default(DRAFT)
  priority      OrderPriority @default(STANDARD)
  isRush        Boolean  @default(false)
  rushLevel     RushLevel?
  rushReason    String?

  // Dates
  orderDate     DateTime @default(now())
  submittedAt   DateTime?
  neededByDate  DateTime?        // When we need it
  estimatedDelivery DateTime?    // Lab's estimate
  actualDelivery DateTime?

  // Treatment link
  treatmentId   String?  @db.ObjectId
  milestoneId   String?  @db.ObjectId
  appointmentId String?  @db.ObjectId  // Appointment it's needed for

  // Financials
  subtotal      Decimal  @default(0)
  rushUpcharge  Decimal  @default(0)
  shippingCost  Decimal  @default(0)
  totalCost     Decimal  @default(0)

  // Notes
  clinicNotes   String?          // Internal notes
  labNotes      String?          // Notes for lab

  // Template
  templateId    String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Audit
  createdBy     String   @db.ObjectId
  submittedBy   String?  @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  patient       Patient   @relation(fields: [patientId], references: [id])
  vendor        LabVendor @relation(fields: [vendorId], references: [id])
  items         LabOrderItem[]
  attachments   LabOrderAttachment[]
  statusHistory LabOrderStatusLog[]
  shipments     LabShipment[]

  @@index([clinicId])
  @@index([patientId])
  @@index([vendorId])
  @@index([status])
  @@index([orderNumber])
  @@index([neededByDate])
}

enum LabOrderStatus {
  DRAFT
  SUBMITTED
  ACKNOWLEDGED
  IN_PROGRESS
  COMPLETED
  SHIPPED
  DELIVERED
  RECEIVED
  PATIENT_PICKUP
  PICKED_UP
  CANCELLED
  REMAKE_REQUESTED
  ON_HOLD
}

enum OrderPriority {
  LOW
  STANDARD
  HIGH
  URGENT
}

enum RushLevel {
  EMERGENCY
  RUSH
  PRIORITY
}

model LabOrderItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  labOrderId    String   @db.ObjectId

  // Product
  productId     String   @db.ObjectId
  productName   String           // Denormalized for display
  category      LabProductCategory
  quantity      Int      @default(1)

  // Prescription details (JSON for flexibility)
  prescription  Json             // Product-specific configuration

  // Arch/Tooth specification
  arch          Arch?            // UPPER, LOWER, BOTH
  toothNumbers  String[]         // Specific teeth if applicable

  // Pricing
  unitPrice     Decimal
  totalPrice    Decimal

  // Status (can differ from order status)
  itemStatus    LabOrderItemStatus @default(PENDING)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  labOrder      LabOrder   @relation(fields: [labOrderId], references: [id])
  product       LabProduct @relation(fields: [productId], references: [id])

  @@index([labOrderId])
  @@index([productId])
}

enum LabProductCategory {
  RETAINER
  APPLIANCE
  ALIGNER
  INDIRECT_BONDING
  ARCHWIRE
  MODEL
  SURGICAL
  OTHER
}

enum Arch {
  UPPER
  LOWER
  BOTH
}

enum LabOrderItemStatus {
  PENDING
  IN_FABRICATION
  COMPLETED
  SHIPPED
  RECEIVED
  REJECTED
}

model LabOrderAttachment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  labOrderId    String   @db.ObjectId

  // File info
  fileName      String
  fileType      AttachmentType
  mimeType      String
  fileSize      Int              // Bytes
  storageKey    String           // Cloud storage reference

  // Source
  imageId       String?  @db.ObjectId  // If from Imaging Management
  sourceType    AttachmentSource

  // Description
  description   String?
  category      String?          // e.g., "Upper Scan", "Shade Photo"

  // Timestamps
  createdAt     DateTime @default(now())
  uploadedBy    String   @db.ObjectId

  // Relations
  labOrder      LabOrder @relation(fields: [labOrderId], references: [id])

  @@index([labOrderId])
}

enum AttachmentType {
  STL_SCAN
  PHOTO
  XRAY
  DOCUMENT
  OTHER
}

enum AttachmentSource {
  IMAGING_SYSTEM
  ITERO_SYNC
  MANUAL_UPLOAD
}

model LabOrderTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  description   String?
  category      LabProductCategory
  isClinicWide  Boolean  @default(true)
  createdByUserId String? @db.ObjectId  // Personal templates

  // Template content
  productId     String   @db.ObjectId
  prescription  Json             // Default prescription values
  defaultNotes  String?

  // Usage
  usageCount    Int      @default(0)
  lastUsedAt    DateTime?

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([category])
  @@index([isActive])
}

model LabOrderStatusLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  labOrderId    String   @db.ObjectId

  // Status change
  fromStatus    LabOrderStatus?
  toStatus      LabOrderStatus
  notes         String?

  // Timestamps
  changedAt     DateTime @default(now())
  changedBy     String?  @db.ObjectId  // Null if system/lab

  // Source
  source        StatusChangeSource @default(SYSTEM)

  // Relations
  labOrder      LabOrder @relation(fields: [labOrderId], references: [id])

  @@index([labOrderId])
  @@index([changedAt])
}

enum StatusChangeSource {
  USER
  LAB
  SYSTEM
  SHIPPING
}
```

---

## API Endpoints

### Lab Orders

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/orders` | List lab orders | `lab:track` |
| GET | `/api/lab/orders/:id` | Get order details | `lab:track` |
| POST | `/api/lab/orders` | Create new order | `lab:create_order` |
| PUT | `/api/lab/orders/:id` | Update draft order | `lab:create_order` |
| POST | `/api/lab/orders/:id/submit` | Submit order to lab | `lab:submit_order` |
| POST | `/api/lab/orders/:id/cancel` | Cancel order | `lab:create_order` |
| GET | `/api/lab/orders/patient/:patientId` | Get patient's orders | `lab:track` |

### Order Items

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/lab/orders/:id/items` | Add item to order | `lab:create_order` |
| PUT | `/api/lab/orders/:orderId/items/:itemId` | Update item | `lab:create_order` |
| DELETE | `/api/lab/orders/:orderId/items/:itemId` | Remove item | `lab:create_order` |

### Attachments

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/lab/orders/:id/attachments` | Upload attachment | `lab:create_order` |
| DELETE | `/api/lab/orders/:orderId/attachments/:attachmentId` | Remove attachment | `lab:create_order` |
| POST | `/api/lab/orders/:id/attachments/from-imaging` | Attach from imaging | `lab:create_order` |

### Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/templates` | List templates | `lab:create_order` |
| GET | `/api/lab/templates/:id` | Get template | `lab:create_order` |
| POST | `/api/lab/templates` | Create template | `lab:create_order` |
| PUT | `/api/lab/templates/:id` | Update template | `lab:create_order` |
| DELETE | `/api/lab/templates/:id` | Delete template | `lab:admin` |
| POST | `/api/lab/orders/:id/apply-template` | Apply template to order | `lab:create_order` |

### Batch Operations

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/lab/orders/batch/submit` | Submit multiple orders | `lab:submit_order` |
| GET | `/api/lab/orders/pending` | Get pending submissions | `lab:track` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `LabOrderWizard` | Step-by-step order creation | `components/lab/` |
| `LabOrderForm` | Order creation/edit form | `components/lab/` |
| `PrescriptionBuilder` | Product-specific Rx form | `components/lab/` |
| `ProductSelector` | Choose product from catalog | `components/lab/` |
| `FileAttachmentPanel` | Manage order attachments | `components/lab/` |
| `ScanSelector` | Select scans from imaging | `components/lab/` |
| `TemplateSelector` | Choose/apply templates | `components/lab/` |
| `RushOrderDialog` | Configure rush options | `components/lab/` |
| `OrderSummary` | Review before submission | `components/lab/` |
| `BatchSubmitDialog` | Submit multiple orders | `components/lab/` |
| `ToothSelector` | Visual tooth selection | `components/lab/` |

---

## Business Rules

1. **Patient Required**: Every order must be associated with a patient
2. **Vendor Required**: Order cannot be submitted without vendor selection
3. **Files for Digital Products**: STL files required for clear retainers, IDB trays
4. **Draft Editing**: Orders can only be edited in DRAFT status
5. **Rush Upcharge**: Rush orders automatically calculate upcharge
6. **Due Date Validation**: Due date cannot be before estimated turnaround
7. **Template Ownership**: Personal templates only visible to creator
8. **Submission Audit**: All submissions logged with user and timestamp

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Imaging Management | Required | STL files and photos |
| Treatment Management | Optional | Treatment plan linking |
| Lab Vendor Management | Required | Vendor and product catalog |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Cloud Storage | Required | Attachment storage |
| Lab Portal APIs | Optional | Direct submission |

---

## Related Documentation

- [Parent: Lab Work Management](../../)
- [Lab Vendor Management](../lab-vendor-management/)
- [Order Tracking](../order-tracking/)
- [Quality & Remakes](../quality-remakes/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
