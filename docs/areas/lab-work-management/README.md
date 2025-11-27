# Lab Work Management

> **Area**: Lab Work Management
>
> **Phase**: 3 - Clinical
>
> **Purpose**: Manage orthodontic lab orders, vendor relationships, order tracking, and quality control for appliances, retainers, aligners, and other lab-fabricated items

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Medium |
| **Phase** | 3 - Clinical |
| **Dependencies** | Phase 1 (Auth, Staff), Treatment Management, Imaging Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Lab Work Management handles the complete lifecycle of orthodontic lab orders—from initial case submission to delivery and quality verification. This includes ordering retainers, appliances, aligners, indirect bonding trays, and custom archwires from external dental laboratories.

Orthodontic practices work with multiple specialized labs for different products. This area streamlines case submission with digital workflows (STL files, photos, prescriptions), tracks orders through fabrication and shipping, manages vendor relationships and pricing, and handles remakes and warranty claims.

### Key Capabilities

- **Lab Orders**: Create and submit digital case orders with STL files, photos, and prescriptions
- **Lab Vendor Management**: Maintain lab directory, pricing, contracts, and performance metrics
- **Order Tracking**: Monitor order status, shipping, due dates, and delivery coordination
- **Quality & Remakes**: Inspection workflows, remake requests, and warranty tracking

### Business Value

- Streamlined digital case submission eliminates paper Rx forms
- Real-time order tracking reduces phone calls to labs
- Vendor performance metrics inform lab selection decisions
- Integrated remake tracking improves quality accountability
- Automatic reorder reminders for retainer programs
- Cost tracking enables accurate case profitability analysis

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.4.1 | [Lab Orders](./sub-areas/lab-orders/) | Create and submit lab case orders | 📋 Planned | Critical |
| 3.4.2 | [Lab Vendor Management](./sub-areas/lab-vendor-management/) | Lab directory, pricing, and contracts | 📋 Planned | High |
| 3.4.3 | [Order Tracking](./sub-areas/order-tracking/) | Status monitoring and delivery coordination | 📋 Planned | High |
| 3.4.4 | [Quality & Remakes](./sub-areas/quality-remakes/) | Inspection, remakes, and warranty | 📋 Planned | Medium |

---

## Sub-Area Details

### 3.4.1 Lab Orders

Create and submit orthodontic lab orders with digital case files and prescriptions.

**Functions:**
- Lab Order Creation
- Case Prescription Builder
- Digital File Attachment (STL, Photos)
- Order Templates
- Rush Order Management
- Batch Order Submission

**Key Features:**
- Digital Rx forms for each appliance type
- STL file upload from iTero/3Shape scans
- Photo attachment for shade matching and references
- Order templates for common appliances
- Rush/expedite flagging with upcharge tracking
- Integration with treatment plans for automatic orders

---

### 3.4.2 Lab Vendor Management

Maintain relationships with orthodontic labs including pricing, contracts, and performance.

**Functions:**
- Lab Directory Management
- Pricing & Fee Schedules
- Contract Management
- Lab Preference Rules
- Performance Metrics
- Communication Hub

**Key Features:**
- Multi-lab support with preferred lab by product type
- Fee schedule management with effective dates
- Contract terms and discount tracking
- Performance scorecards (turnaround, quality, remakes)
- Direct messaging with lab technicians
- Lab capability matrix (what each lab produces)

---

### 3.4.3 Order Tracking

Monitor order status from submission through delivery with proactive alerts.

**Functions:**
- Order Status Dashboard
- Shipment Tracking
- Due Date Management
- Delivery Coordination
- Patient Pickup Tracking
- Reorder Reminders

**Key Features:**
- Real-time status updates from lab portals
- Shipping integration (FedEx, UPS tracking)
- Due date alerts for upcoming appointments
- Patient notification when items arrive
- Inventory of items awaiting patient pickup
- Automatic reorder for retainer programs

---

### 3.4.4 Quality & Remakes

Manage quality inspection, remake requests, and warranty claims.

**Functions:**
- Receiving Inspection
- Remake Request Management
- Warranty Tracking
- Quality Issue Logging
- Lab Feedback System
- Quality Analytics

**Key Features:**
- Inspection checklist by product type
- Photo documentation of quality issues
- Remake request workflow with lab communication
- Warranty period tracking by product
- Quality metrics by lab and product type
- Corrective action tracking

---

## Orthodontic Lab Products

### Retainers

| Product | Description | Typical Turnaround |
|---------|-------------|-------------------|
| **Hawley Retainer** | Acrylic with wire clasps | 5-7 days |
| **Essix/Clear Retainer** | Vacuum-formed clear plastic | 3-5 days |
| **Bonded/Fixed Retainer** | Wire bonded to lingual | 3-5 days |
| **Vivera Retainers** | Invisalign clear retainers (set of 4) | 2-3 weeks |
| **Spring Retainer** | Active retainer with springs | 7-10 days |

### Appliances

| Product | Description | Typical Turnaround |
|---------|-------------|-------------------|
| **Rapid Palatal Expander (RPE)** | Hyrax, Haas, bonded | 7-10 days |
| **Herbst Appliance** | Class II corrector | 10-14 days |
| **Pendulum/Pendex** | Molar distalization | 10-14 days |
| **Quad Helix** | Arch expansion | 5-7 days |
| **Nance Holding Arch** | Space maintainer | 5-7 days |
| **Lower Lingual Holding Arch** | Space maintainer | 5-7 days |
| **Bite Plate** | Anterior or posterior | 5-7 days |
| **Habit Appliance** | Tongue crib, thumb guard | 7-10 days |
| **Space Maintainer** | Band and loop, distal shoe | 5-7 days |
| **Headgear** | Facebow with attachments | 3-5 days |

### Aligners

| Product | Description | Typical Turnaround |
|---------|-------------|-------------------|
| **Invisalign** | Full, Lite, Express, First | 2-3 weeks |
| **In-House Aligners** | 3D printed in office | Same day - 3 days |
| **Third-Party Aligners** | SureSmile, Spark, uLab | 2-3 weeks |

### Other Lab Items

| Product | Description | Typical Turnaround |
|---------|-------------|-------------------|
| **Indirect Bonding Trays** | Custom bracket placement trays | 5-7 days |
| **Custom Archwires** | Robot-bent or custom-formed | 3-5 days |
| **Study Models** | Stone or digital prints | 3-5 days |
| **Surgical Splints** | Orthognathic surgery guides | 7-14 days |
| **TMJ Splints** | Occlusal splints | 7-10 days |
| **Mouth Guards** | Sports protection | 3-5 days |

---

## Integration Points

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Treatment Management | Treatment plans, milestones | Auto-generate orders at treatment phases |
| Imaging Management | STL files, photos | Attach digital files to lab orders |
| Booking & Scheduling | Appointments | Coordinate delivery with patient appointments |
| Billing & Insurance | Lab fees | Track lab costs for case profitability |
| Financial Management | Expense tracking | Lab expense reporting |
| Patient Communications | Notifications | Alert patients when items are ready |
| Practice Orchestration | Daily workflow | Show pending lab items on dashboard |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| iTero | Cloud API | Pull scans for case submission |
| 3Shape | File Export | Import STL files |
| Invisalign Doctor Site | Web/API | Submit and track Invisalign cases |
| Lab Portals | Web/API | Submit orders, check status |
| Shipping Carriers | API (FedEx, UPS) | Track shipments |
| In-House 3D Printers | Local/Network | Print aligners, models |

---

## User Roles & Permissions

| Role | Create Orders | Track | Manage Vendors | Remakes | Admin |
|------|---------------|-------|----------------|---------|-------|
| Super Admin | Full | Full | Full | Full | Full |
| Clinic Admin | Full | Full | Full | Full | Full |
| Doctor | Full | Full | View | Full | None |
| Clinical Staff | Create | Full | View | Create | None |
| Front Desk | None | View | None | None | None |
| Billing | View | View | View Pricing | None | None |
| Read Only | None | View | None | None | None |

### Special Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `lab:create_order` | Create lab orders | doctor, clinical_staff |
| `lab:submit_order` | Submit orders to lab | doctor, clinical_staff |
| `lab:track` | View order status | all clinical roles |
| `lab:manage_vendors` | Edit lab directory | clinic_admin |
| `lab:view_pricing` | View lab pricing | clinic_admin, billing |
| `lab:request_remake` | Request remakes | doctor, clinical_staff |
| `lab:approve_remake` | Approve remake costs | clinic_admin, doctor |
| `lab:admin` | Full lab administration | clinic_admin |

---

## Data Models

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Patient     │────▶│    LabOrder     │────▶│  LabOrderItem   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               │                        ▼
                               │                ┌─────────────────┐
                               ▼                │   LabProduct    │
                        ┌─────────────────┐     └─────────────────┘
                        │    LabVendor    │
                        └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  LabFeeSchedule │     │  RemakeRequest  │
                        └─────────────────┘     └─────────────────┘
```

### Key Models

| Model | Description |
|-------|-------------|
| `LabOrder` | Order header with patient, vendor, dates, status |
| `LabOrderItem` | Individual item on order (appliance, retainer) |
| `LabProduct` | Product catalog (retainer types, appliances) |
| `LabVendor` | Lab company with contact, capabilities |
| `LabFeeSchedule` | Pricing by product and vendor |
| `LabPrescription` | Rx details for appliance (expansion amount, wire type) |
| `LabOrderAttachment` | STL files, photos, documents |
| `LabShipment` | Shipping/tracking information |
| `RemakeRequest` | Remake/adjustment request with reason |
| `LabOrderStatus` | Status history log |

---

## Workflow: Lab Order Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   CREATED    │────▶│  SUBMITTED   │────▶│ IN_PROGRESS  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  DELIVERED   │◀────│   SHIPPED    │◀────│  COMPLETED   │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│   RECEIVED   │────▶│   PATIENT    │
│  (Inspected) │     │   PICKUP     │
└──────────────┘     └──────────────┘
```

### Status Definitions

| Status | Description |
|--------|-------------|
| `DRAFT` | Order started but not submitted |
| `SUBMITTED` | Sent to lab |
| `ACKNOWLEDGED` | Lab confirmed receipt |
| `IN_PROGRESS` | Lab is fabricating |
| `COMPLETED` | Fabrication complete |
| `SHIPPED` | In transit to clinic |
| `DELIVERED` | Arrived at clinic |
| `RECEIVED` | Inspected and accepted |
| `PATIENT_PICKUP` | Ready for patient |
| `PICKED_UP` | Patient received item |
| `CANCELLED` | Order cancelled |
| `REMAKE_REQUESTED` | Quality issue, remake needed |

---

## AI Features

| Feature | Sub-Area | Description |
|---------|----------|-------------|
| Auto-Order Generation | Lab Orders | Suggest orders based on treatment milestones |
| Vendor Recommendation | Vendor Management | Recommend lab based on product, turnaround, quality |
| Due Date Prediction | Order Tracking | Predict actual delivery based on historical data |
| Quality Prediction | Quality & Remakes | Flag orders at risk of quality issues |
| Reorder Reminder | Order Tracking | Smart reminders for retainer replacement |
| Cost Optimization | Vendor Management | Suggest cost-saving vendor alternatives |

---

## Compliance Requirements

### HIPAA Compliance
- Lab orders contain PHI and require access controls
- Audit logging for all order access and modifications
- Secure transmission to external labs
- Vendor BAAs required for lab partners

### Data Retention
- Lab orders retained per state dental board requirements
- STL files and photos stored securely
- Prescription records maintained with patient record

### Quality Documentation
- Inspection records maintained for liability
- Remake history documented for warranty claims
- Lab performance data for vendor evaluation

---

## Implementation Notes

### Phase 3 Dependencies
- **Treatment Management**: For linking orders to treatment plans
- **Imaging Management**: For STL files and photos
- **Billing & Insurance**: For lab fee tracking

### Implementation Order
1. Lab Vendor Management (set up labs and products first)
2. Lab Orders (create and submit orders)
3. Order Tracking (monitor status and delivery)
4. Quality & Remakes (handle quality issues)

### Key Technical Decisions
- Store STL files in cloud storage with signed URLs
- Use webhooks or polling for lab portal integration
- Implement order templates as JSON schemas
- Track shipping via carrier APIs (FedEx, UPS)

---

## File Structure

```
docs/areas/lab-work-management/
├── README.md                      # This file
├── requirements.md                # Detailed requirements
├── features.md                    # Feature overview
└── sub-areas/
    ├── lab-orders/
    │   ├── README.md
    │   └── functions/
    │       ├── lab-order-creation.md
    │       ├── case-prescription-builder.md
    │       ├── digital-file-attachment.md
    │       ├── order-templates.md
    │       ├── rush-order-management.md
    │       └── batch-order-submission.md
    │
    ├── lab-vendor-management/
    │   ├── README.md
    │   └── functions/
    │       ├── lab-directory-management.md
    │       ├── pricing-fee-schedules.md
    │       ├── contract-management.md
    │       ├── lab-preference-rules.md
    │       ├── performance-metrics.md
    │       └── communication-hub.md
    │
    ├── order-tracking/
    │   ├── README.md
    │   └── functions/
    │       ├── order-status-dashboard.md
    │       ├── shipment-tracking.md
    │       ├── due-date-management.md
    │       ├── delivery-coordination.md
    │       ├── patient-pickup-tracking.md
    │       └── reorder-reminders.md
    │
    └── quality-remakes/
        ├── README.md
        └── functions/
            ├── receiving-inspection.md
            ├── remake-request-management.md
            ├── warranty-tracking.md
            ├── quality-issue-logging.md
            ├── lab-feedback-system.md
            └── quality-analytics.md
```

---

## Related Documentation

- [Requirements](./requirements.md) - Detailed requirements list
- [Features](./features.md) - Feature specifications
- [Treatment Management](../treatment-management/) - Treatment plan integration
- [Imaging Management](../imaging-management/) - Digital files source
- [Financial Management](../financial-management/) - Lab expense tracking

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
