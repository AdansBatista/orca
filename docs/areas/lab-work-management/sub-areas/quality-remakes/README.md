# Quality & Remakes

> **Area**: [Lab Work Management](../../)
>
> **Sub-Area**: 3.4.4 Quality & Remakes
>
> **Purpose**: Manage receiving inspection, quality issues, remake requests, warranty tracking, and lab performance feedback

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Medium |
| **Complexity** | Medium |
| **Parent Area** | [Lab Work Management](../../) |
| **Dependencies** | Auth, Lab Orders, Lab Vendor Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Quality & Remakes handles the quality assurance process for received lab items, from initial inspection through remake requests and warranty claims. Every lab item should be inspected before being used on a patient, and any quality issues need to be documented and addressed through a structured remake process.

This sub-area ensures quality accountability with labs, tracks warranty periods for covered repairs, and provides data for vendor performance analysis. It protects the practice from using substandard appliances while maintaining professional relationships with lab partners.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.4.4.1 | [Receiving Inspection](./functions/receiving-inspection.md) | Inspect items upon arrival | 📋 Planned | Critical |
| 3.4.4.2 | [Remake Request Management](./functions/remake-request-management.md) | Request and track remakes | 📋 Planned | Critical |
| 3.4.4.3 | [Warranty Tracking](./functions/warranty-tracking.md) | Track warranty coverage | 📋 Planned | High |
| 3.4.4.4 | [Quality Issue Logging](./functions/quality-issue-logging.md) | Document quality problems | 📋 Planned | High |
| 3.4.4.5 | [Lab Feedback System](./functions/lab-feedback-system.md) | Communicate issues to labs | 📋 Planned | Medium |
| 3.4.4.6 | [Quality Analytics](./functions/quality-analytics.md) | Analyze quality trends | 📋 Planned | Medium |

---

## Function Details

### 3.4.4.1 Receiving Inspection

**Purpose**: Inspect lab items upon delivery to verify quality before patient use.

**Key Capabilities**:
- Inspection checklist by product type
- Pass/fail criteria
- Photo documentation of issues
- Inspector assignment
- Inspection timestamp logging
- Bulk inspection for multi-item orders
- Conditional acceptance (minor issues)
- Inspection history

**Inspection Checklist by Product Type**:

| Product | Inspection Points |
|---------|------------------|
| **Hawley Retainer** | Fit on model, wire position, acrylic smoothness, clasps, color match |
| **Clear Retainer** | Material clarity, fit, trimlines, no bubbles/defects |
| **RPE/Expander** | Screw function, band fit, solder joints, activation |
| **Herbst** | Telescopic movement, band fit, attachments secure |
| **IDB Trays** | Bracket position accuracy, tray fit, bracket bonding |
| **Aligners** | Staging accuracy, material quality, trimlines, labeling |

**Inspection Outcomes**:
| Outcome | Description | Next Action |
|---------|-------------|-------------|
| **Pass** | Meets all quality criteria | Mark ready for patient |
| **Pass with Notes** | Minor issues documented | Mark ready, note for future |
| **Fail - Remake** | Does not meet criteria | Initiate remake request |
| **Fail - Adjustment** | Needs minor fix in-office | Adjust and use |

**User Stories**:
- As a **clinical staff**, I want to inspect a retainer before giving it to the patient
- As a **doctor**, I want to see photos of quality issues identified during inspection
- As a **clinical staff**, I want a checklist to ensure I inspect all aspects of an appliance

---

### 3.4.4.2 Remake Request Management

**Purpose**: Request remakes for items that don't meet quality standards.

**Key Capabilities**:
- Initiate remake from failed inspection
- Reason/issue documentation
- Photo attachment
- Lab communication workflow
- Remake tracking (separate from original)
- Cost tracking (warranty vs. billable)
- Approval workflow for non-warranty remakes
- Rush remake option

**Remake Reasons**:
| Category | Examples |
|----------|----------|
| **Fit Issues** | Doesn't fit model, too tight/loose, wrong arch |
| **Design Issues** | Wrong wire type, incorrect expansion, missing features |
| **Material Defects** | Bubbles, discoloration, cracks, rough surfaces |
| **Damage** | Broken during shipping, bent wires, cracked acrylic |
| **Wrong Patient** | Labeled incorrectly, wrong patient's item |
| **Specification Error** | Lab error on prescription |

**Remake Workflow**:
1. Inspection fails, remake requested
2. Photos and description documented
3. Lab notified with details
4. Lab confirms receipt and estimated delivery
5. Original item returned (if required)
6. Remake received and inspected
7. Remake closed

**User Stories**:
- As a **clinical staff**, I want to request a remake when an appliance doesn't fit
- As a **doctor**, I want to approve remakes that aren't covered by warranty
- As a **office manager**, I want to track how many remakes we have with each lab

---

### 3.4.4.3 Warranty Tracking

**Purpose**: Track warranty coverage for lab items and manage warranty claims.

**Key Capabilities**:
- Warranty period by product type
- Warranty start date (delivery date)
- Warranty expiration alerts
- Claim eligibility check
- Warranty terms by vendor
- Claim history
- Cost avoidance tracking

**Standard Warranty Periods**:
| Product | Typical Warranty |
|---------|-----------------|
| **Hawley Retainer** | 90 days - 1 year |
| **Clear Retainer** | 30-90 days |
| **Fixed Retainer** | 1 year |
| **Appliances (RPE, Herbst)** | 90 days - 1 year |
| **Aligners (Invisalign)** | Per Invisalign policy |
| **IDB Trays** | 30 days |

**Warranty Claim Types**:
| Type | Coverage |
|------|----------|
| **Manufacturing Defect** | Full replacement |
| **Material Failure** | Full replacement |
| **Fit Issue (Lab Error)** | Full replacement |
| **Patient Damage** | NOT covered |
| **Lost Item** | NOT covered |
| **Normal Wear** | NOT covered |

**User Stories**:
- As a **clinical staff**, I want to know if a broken retainer is still under warranty
- As a **billing staff**, I want to track warranty claims to avoid charging patients
- As a **office manager**, I want to see how much we've saved through warranty claims

---

### 3.4.4.4 Quality Issue Logging

**Purpose**: Document and categorize all quality issues for trend analysis.

**Key Capabilities**:
- Structured issue reporting
- Issue categorization
- Severity levels
- Photo documentation
- Linked to order and product
- Resolution tracking
- Issue history by lab
- Exportable reports

**Issue Categories**:
| Category | Subcategories |
|----------|---------------|
| **Fit** | Too tight, too loose, wrong arch, doesn't seat |
| **Appearance** | Color mismatch, rough surface, bubbles, scratches |
| **Function** | Screw doesn't turn, wire bent, clasps loose |
| **Material** | Wrong material, material defect, discoloration |
| **Design** | Wrong design, missing component, incorrect spec |
| **Labeling** | Wrong patient, wrong case number, no label |
| **Shipping** | Damaged in transit, missing items |

**Severity Levels**:
| Level | Description | Action |
|-------|-------------|--------|
| **Critical** | Cannot use, safety concern | Immediate remake, escalate |
| **Major** | Significant issue, unusable | Remake required |
| **Minor** | Small issue, usable with notes | Document, optional remake |
| **Cosmetic** | Appearance only, functional | Document for feedback |

**User Stories**:
- As a **clinical staff**, I want to log a quality issue with photos and description
- As a **doctor**, I want to see the history of issues with a specific lab
- As a **clinic admin**, I want to categorize issues to identify patterns

---

### 3.4.4.5 Lab Feedback System

**Purpose**: Communicate quality feedback to labs constructively.

**Key Capabilities**:
- Send feedback with documentation
- Feedback categories (praise, issue, suggestion)
- Lab response tracking
- Feedback history
- Aggregate feedback reports
- Scheduled feedback summaries
- Constructive communication templates

**Feedback Types**:
| Type | Use Case |
|------|----------|
| **Issue Report** | Quality problem requiring attention |
| **Positive Feedback** | Excellent work recognition |
| **Suggestion** | Process improvement idea |
| **Question** | Clarification needed |

**User Stories**:
- As a **doctor**, I want to send feedback to the lab about a quality issue
- As a **clinic admin**, I want to send a summary of issues to our lab partner monthly
- As a **clinical staff**, I want to give positive feedback when work is excellent

---

### 3.4.4.6 Quality Analytics

**Purpose**: Analyze quality trends to improve lab selection and processes.

**Key Capabilities**:
- Quality metrics by lab
- Quality metrics by product type
- Trend analysis over time
- Comparison across labs
- Remake rate calculations
- Cost of quality (remake costs)
- Quality scorecards
- Exportable reports

**Quality Metrics**:
| Metric | Description | Target |
|--------|-------------|--------|
| **Remake Rate** | % of orders requiring remake | < 3% |
| **First-Pass Rate** | % passing initial inspection | > 97% |
| **Issue Severity Mix** | Distribution of issue severity | Mostly minor |
| **Time to Resolution** | Days to resolve quality issues | < 7 days |
| **Warranty Claim Rate** | % of orders with warranty claims | < 2% |
| **Cost of Quality** | Total remake and adjustment costs | Minimize |

**Analytics Views**:
- Lab comparison dashboard
- Product quality trends
- Monthly/quarterly reports
- Issue category analysis
- Cost analysis

**User Stories**:
- As a **clinic admin**, I want to compare quality metrics across our labs
- As a **office manager**, I want to see our remake rate trending over time
- As a **doctor**, I want to identify which products have the most quality issues

---

## Data Model

```prisma
model LabInspection {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId
  labOrderItemId String  @db.ObjectId

  // Inspection info
  inspectedAt   DateTime @default(now())
  inspectedBy   String   @db.ObjectId

  // Result
  result        InspectionResult
  notes         String?

  // Checklist (stored as JSON for flexibility)
  checklist     Json?            // Array of {item, passed, notes}

  // Photos
  photos        InspectionPhoto[]

  // Follow-up
  remakeRequestId String? @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  labOrder      LabOrder @relation(fields: [labOrderId], references: [id])

  @@index([clinicId])
  @@index([labOrderId])
  @@index([labOrderItemId])
  @@index([result])
}

enum InspectionResult {
  PASS
  PASS_WITH_NOTES
  FAIL_REMAKE
  FAIL_ADJUSTMENT
  PENDING
}

model InspectionPhoto {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  inspectionId  String   @db.ObjectId

  // Photo info
  storageKey    String
  fileName      String
  description   String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  inspection    LabInspection @relation(fields: [inspectionId], references: [id])

  @@index([inspectionId])
}

model RemakeRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId
  labOrderItemId String  @db.ObjectId
  vendorId      String   @db.ObjectId

  // Request info
  requestNumber String   @unique
  status        RemakeStatus @default(REQUESTED)

  // Reason
  reason        RemakeReason
  reasonDetail  String
  photos        String[]         // Photo storage keys

  // Warranty
  isWarrantyClaim Boolean @default(false)
  warrantyApproved Boolean?

  // Cost
  estimatedCost Decimal?
  actualCost    Decimal?
  costResponsibility CostResponsibility @default(LAB)

  // Approval
  approvalRequired Boolean @default(false)
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // Dates
  requestedAt   DateTime @default(now())
  acknowledgedAt DateTime?
  estimatedDelivery DateTime?
  completedAt   DateTime?

  // Remake order
  remakeOrderId String?  @db.ObjectId

  // Lab communication
  labNotes      String?
  labResponse   String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  requestedBy   String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([labOrderId])
  @@index([vendorId])
  @@index([status])
  @@index([requestNumber])
}

enum RemakeStatus {
  REQUESTED
  ACKNOWLEDGED
  IN_PROGRESS
  SHIPPED
  RECEIVED
  INSPECTED
  COMPLETED
  CANCELLED
}

enum RemakeReason {
  FIT_ISSUE
  DESIGN_ISSUE
  MATERIAL_DEFECT
  SHIPPING_DAMAGE
  WRONG_PATIENT
  SPECIFICATION_ERROR
  OTHER
}

enum CostResponsibility {
  LAB
  CLINIC
  PATIENT
  WARRANTY
}

model LabWarranty {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderItemId String  @db.ObjectId
  patientId     String   @db.ObjectId

  // Product info
  productId     String   @db.ObjectId
  productName   String

  // Warranty period
  startDate     DateTime
  endDate       DateTime
  warrantyMonths Int

  // Status
  status        WarrantyStatus @default(ACTIVE)

  // Claims
  claims        WarrantyClaim[]

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([labOrderItemId])
  @@index([patientId])
  @@index([endDate])
  @@index([status])
}

enum WarrantyStatus {
  ACTIVE
  EXPIRED
  CLAIMED
  VOIDED
}

model WarrantyClaim {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  warrantyId    String   @db.ObjectId
  remakeRequestId String @db.ObjectId

  // Claim info
  claimDate     DateTime @default(now())
  reason        String
  approved      Boolean?
  approvalNotes String?

  // Value
  claimValue    Decimal?

  // Relations
  warranty      LabWarranty @relation(fields: [warrantyId], references: [id])

  @@index([warrantyId])
}

model QualityIssue {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId
  labOrderItemId String  @db.ObjectId
  vendorId      String   @db.ObjectId

  // Issue details
  category      QualityCategory
  subcategory   String?
  severity      IssueSeverity
  description   String

  // Documentation
  photos        String[]         // Storage keys

  // Resolution
  status        IssueStatus @default(OPEN)
  resolution    String?
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  // Link to remake
  remakeRequestId String? @db.ObjectId

  // Feedback sent
  feedbackSent  Boolean  @default(false)
  feedbackSentAt DateTime?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  reportedBy    String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([labOrderId])
  @@index([vendorId])
  @@index([category])
  @@index([severity])
  @@index([status])
}

enum QualityCategory {
  FIT
  APPEARANCE
  FUNCTION
  MATERIAL
  DESIGN
  LABELING
  SHIPPING
}

enum IssueSeverity {
  CRITICAL
  MAJOR
  MINOR
  COSMETIC
}

enum IssueStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model LabFeedback {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId
  labOrderId    String?  @db.ObjectId  // Optional order link

  // Feedback info
  feedbackType  FeedbackType
  subject       String
  message       String
  attachments   String[]

  // Related issues
  qualityIssueIds String[] @db.ObjectId

  // Lab response
  labResponse   String?
  respondedAt   DateTime?

  // Status
  status        FeedbackStatus @default(SENT)

  // Timestamps
  createdAt     DateTime @default(now())
  sentAt        DateTime @default(now())
  sentBy        String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([status])
}

enum FeedbackType {
  ISSUE_REPORT
  POSITIVE_FEEDBACK
  SUGGESTION
  QUESTION
}

enum FeedbackStatus {
  DRAFT
  SENT
  ACKNOWLEDGED
  RESPONDED
  CLOSED
}
```

---

## API Endpoints

### Inspection

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/inspections` | List inspections | `lab:track` |
| GET | `/api/lab/inspections/:id` | Get inspection details | `lab:track` |
| POST | `/api/lab/orders/:orderId/items/:itemId/inspect` | Create inspection | `lab:track` |
| PUT | `/api/lab/inspections/:id` | Update inspection | `lab:track` |
| POST | `/api/lab/inspections/:id/photos` | Upload photos | `lab:track` |

### Remakes

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/remakes` | List remake requests | `lab:track` |
| GET | `/api/lab/remakes/:id` | Get remake details | `lab:track` |
| POST | `/api/lab/remakes` | Create remake request | `lab:request_remake` |
| PUT | `/api/lab/remakes/:id` | Update remake | `lab:request_remake` |
| POST | `/api/lab/remakes/:id/approve` | Approve remake | `lab:approve_remake` |
| PUT | `/api/lab/remakes/:id/status` | Update status | `lab:track` |

### Warranty

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/warranties` | List warranties | `lab:track` |
| GET | `/api/lab/warranties/:id` | Get warranty details | `lab:track` |
| GET | `/api/lab/warranties/check/:orderItemId` | Check warranty eligibility | `lab:track` |
| POST | `/api/lab/warranties/:id/claim` | File warranty claim | `lab:request_remake` |

### Quality Issues

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/quality-issues` | List issues | `lab:track` |
| POST | `/api/lab/quality-issues` | Log issue | `lab:track` |
| PUT | `/api/lab/quality-issues/:id` | Update issue | `lab:track` |
| PUT | `/api/lab/quality-issues/:id/resolve` | Resolve issue | `lab:track` |

### Feedback

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/feedback` | List feedback | `lab:track` |
| POST | `/api/lab/feedback` | Send feedback | `lab:create_order` |
| PUT | `/api/lab/feedback/:id` | Update feedback | `lab:create_order` |

### Analytics

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/quality/analytics` | Quality analytics | `lab:manage_vendors` |
| GET | `/api/lab/quality/analytics/vendor/:vendorId` | Vendor quality | `lab:manage_vendors` |
| GET | `/api/lab/quality/analytics/trends` | Quality trends | `lab:manage_vendors` |
| GET | `/api/lab/quality/report` | Generate report | `lab:manage_vendors` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `InspectionForm` | Record inspection results | `components/lab/` |
| `InspectionChecklist` | Product-specific checklist | `components/lab/` |
| `PhotoCapture` | Take/upload inspection photos | `components/lab/` |
| `RemakeRequestForm` | Create remake request | `components/lab/` |
| `RemakeTracker` | Track remake status | `components/lab/` |
| `WarrantyChecker` | Check warranty status | `components/lab/` |
| `QualityIssueForm` | Log quality issue | `components/lab/` |
| `QualityIssueList` | List and filter issues | `components/lab/` |
| `LabFeedbackComposer` | Write feedback to lab | `components/lab/` |
| `QualityDashboard` | Analytics overview | `components/lab/` |
| `VendorQualityCard` | Vendor quality summary | `components/lab/` |
| `QualityTrendChart` | Trend visualization | `components/lab/` |

---

## Business Rules

1. **Inspection Required**: Items should be inspected before use on patient
2. **Photo Required for Fail**: Failed inspections must include photos
3. **Warranty Auto-Create**: Warranty record created when item passes inspection
4. **Approval Thresholds**: Non-warranty remakes over threshold require approval
5. **Issue Categorization**: All issues must be categorized for analytics
6. **Feedback Association**: Feedback should link to quality issues when applicable
7. **Metrics Calculation**: Quality metrics calculated nightly

---

## Related Documentation

- [Parent: Lab Work Management](../../)
- [Lab Orders](../lab-orders/)
- [Lab Vendor Management](../lab-vendor-management/)
- [Order Tracking](../order-tracking/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
