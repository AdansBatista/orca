# Orca Master Index

> **Single source of truth for the entire Orca project**
>
> This document provides navigation, status tracking, and context for all development work.

---

## For LLMs: Quick Status

| Attribute                 | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| **Current Phase**         | Phase 1 - Foundation Infrastructure                                                        |
| **In Progress**           | Staff Management (100% core complete - 24/24 functions)                                    |
| **Implementation Status** | ✅ Auth complete, ✅ Staff complete (Profiles ✅, Scheduling ✅, Roles ✅, Performance ✅) |

### What to Work On

1. **Completed**: Staff Management - All core functions implemented
2. **Next**: Resources Management
3. **Phase 2+**: Blocked until Phase 1 complete

### Finding Documentation

| Need                | Location                                           |
| ------------------- | -------------------------------------------------- |
| Project overview    | You're here (MASTER-INDEX.md)                      |
| What to work on now | [CURRENT-FOCUS.md](CURRENT-FOCUS.md)               |
| Quick patterns      | [QUICK-REFERENCE.md](QUICK-REFERENCE.md)           |
| Coding standards    | [guides/TECH-STACK.md](guides/TECH-STACK.md)       |
| UI standards        | [guides/STYLING-GUIDE.md](guides/STYLING-GUIDE.md) |
| Auth architecture   | [areas/auth/](areas/auth/)                         |
| Auth code patterns  | [guides/AUTH-PATTERNS.md](guides/AUTH-PATTERNS.md) |
| Specific area       | `areas/{area-name}/README.md`                      |

---

## Quick Stats

| Metric                    | Count    |
| ------------------------- | -------- |
| **Total Areas**           | 14       |
| **Implementation Phases** | 5        |
| **Status**                | Planning |

### Progress Overview

```
[████░░░░░░░░░░░░░░░░] 15% Complete

Phase 1: Foundation    [████░] 2/3 Complete (Auth ✅, Staff ✅)
Phase 2: Operations    [░░░░░] Not Started
Phase 3: Clinical      [░░░░░] Not Started
Phase 4: Financial     [░░░░░] Not Started
Phase 5: Support       [░░░░░] Not Started
```

---

## Technical Foundation Documents

Before implementing any feature, consult these guides:

| Guide              | Purpose                                          | Location                                        |
| ------------------ | ------------------------------------------------ | ----------------------------------------------- |
| **Tech Stack**     | Technology choices, coding patterns, conventions | [TECH-STACK.md](./guides/TECH-STACK.md)         |
| **Styling Guide**  | Design system, UI components, accessibility      | [STYLING-GUIDE.md](./guides/STYLING-GUIDE.md)   |
| **Auth Patterns**  | Auth code patterns (withAuth, PermissionGate)    | [AUTH-PATTERNS.md](./guides/AUTH-PATTERNS.md)   |
| **AI Integration** | AI capabilities and implementation               | [AI-INTEGRATION.md](./guides/AI-INTEGRATION.md) |

---

## Implementation Phases

### Phase 1: Foundation

_Must build first - required by all other phases_

| #   | Area                                                  | Status                  | Priority | Dependencies   |
| --- | ----------------------------------------------------- | ----------------------- | -------- | -------------- |
| 1.1 | [Auth & Authorization](./areas/auth/)                 | ✅ Complete             | Critical | None           |
| 1.2 | [Staff Management](./areas/staff-management/)         | ✅ Complete (24/24)     | Critical | Auth ✅        |
| 1.3 | [Resources Management](./areas/resources-management/) | 📋 Planned              | High     | Auth ✅, Staff ✅ |

### Phase 2: Core Operations

_Core daily operations_

| #   | Area                   | Status     | Priority | Dependencies     |
| --- | ---------------------- | ---------- | -------- | ---------------- |
| 2.1 | Booking & Scheduling   | 📋 Planned | Critical | Phase 1          |
| 2.2 | Practice Orchestration | 📋 Planned | High     | Phase 1, Booking |
| 2.3 | Patient Communications | 📋 Planned | High     | Phase 1          |

### Phase 3: Clinical

_Patient care and treatment_

| #   | Area                 | Status     | Priority | Dependencies |
| --- | -------------------- | ---------- | -------- | ------------ |
| 3.1 | CRM & Onboarding     | 📋 Planned | High     | Phase 2      |
| 3.2 | Treatment Management | 📋 Planned | Critical | Phase 2, CRM |
| 3.3 | Imaging Management   | 📋 Planned | High     | Treatment    |
| 3.4 | Lab Work Management  | 📋 Planned | Medium   | Treatment    |

### Phase 4: Financial & Compliance

_Revenue and regulatory_

| #   | Area                       | Status     | Priority | Dependencies |
| --- | -------------------------- | ---------- | -------- | ------------ |
| 4.1 | Billing & Insurance        | 📋 Planned | Critical | Phase 3      |
| 4.2 | Financial Management       | 📋 Planned | High     | Billing      |
| 4.3 | Compliance & Documentation | 📋 Planned | High     | All clinical |

### Phase 5: Support

_Supporting systems_

| #   | Area               | Status     | Priority | Dependencies |
| --- | ------------------ | ---------- | -------- | ------------ |
| 5.1 | Vendors Management | 📋 Planned | Medium   | Phase 1      |

---

## Areas Index

### All Areas Overview

| Area                                                            | Status          | Sub-Areas | Functions  | Documentation                             |
| --------------------------------------------------------------- | --------------- | --------- | ---------- | ----------------------------------------- |
| [Auth & Authorization](./areas/auth/)                           | ✅ Complete     | 5         | 24         | [View](./areas/auth/)                     |
| [Booking & Scheduling](./areas/booking/)                        | 📋 Planned      | 4         | 24         | [View](./areas/booking/)                  |
| [Treatment Management](./areas/treatment-management/)           | 📋 Planned      | TBD       | TBD        | [View](./areas/treatment-management/)     |
| [Imaging Management](./areas/imaging-management/)               | 📋 Planned      | 4         | 24         | [View](./areas/imaging-management/)       |
| [Lab Work Management](./areas/lab-work-management/)             | 📋 Planned      | 4         | 24         | [View](./areas/lab-work-management/)      |
| [Practice Orchestration](./areas/practice-orchestration/)       | 📋 Planned      | TBD       | TBD        | [View](./areas/practice-orchestration/)   |
| [Staff Management](./areas/staff-management/)                   | ✅ Complete     | 4         | 24/24 impl | [View](./areas/staff-management/)         |
| [Resources Management](./areas/resources-management/)           | 📋 Planned      | TBD       | TBD        | [View](./areas/resources-management/)     |
| [CRM & Onboarding](./areas/crm-onboarding/)                     | 📋 Planned      | 4         | 24         | [View](./areas/crm-onboarding/)           |
| [Patient Communications](./areas/patient-communications/)       | 📋 Planned      | 4         | 20         | [View](./areas/patient-communications/)   |
| [Financial Management](./areas/financial-management/)           | 📋 Planned      | 4         | 24         | [View](./areas/financial-management/)     |
| [Billing & Insurance](./areas/billing-insurance/)               | 📋 Planned      | 4         | 31         | [View](./areas/billing-insurance/)        |
| [Compliance & Documentation](./areas/compliance-documentation/) | 📋 Planned      | 4         | 24         | [View](./areas/compliance-documentation/) |
| [Vendors Management](./areas/vendors-management/)               | 📋 Planned      | TBD       | TBD        | [View](./areas/vendors-management/)       |

---

## Detailed Area Breakdown

### 0. Auth & Authorization

_System-level authentication, authorization, and security infrastructure_

**Documentation**: [Full Area Documentation](./areas/auth/)

**Sub-Areas:**

- 1 [Authentication](./areas/auth/sub-areas/authentication/) - `✅ Complete`
  - User Login, Session Management, Password Policy, Token Handling, MFA (future)
- 2 [Role System](./areas/auth/sub-areas/role-system/) - `✅ Complete`
  - 7 User Roles, Role Hierarchy, Scope Definitions, Default Behaviors
- 3 [Permissions](./areas/auth/sub-areas/permissions/) - `✅ Complete`
  - Permission Codes, Permission Groups, Role-to-Permission Matrix
- 4 [Data Isolation](./areas/auth/sub-areas/data-isolation/) - `✅ Complete`
  - Multi-Clinic Security, clinicId Enforcement, Query Patterns
- 5 [Audit & Compliance](./areas/auth/sub-areas/audit-compliance/) - `✅ Complete`
  - Audit Logging, PHI Access Tracking, HIPAA/PIPEDA Compliance

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Authentication | 6 functions |
| Role System | 4 functions |
| Permissions | 5 functions |
| Data Isolation | 4 functions |
| Audit & Compliance | 5 functions |

**Code Patterns**: See [AUTH-PATTERNS.md](./guides/AUTH-PATTERNS.md) for withAuth wrapper, PermissionGate, usePermissions hook.

---

### 1. Booking & Scheduling

_Core appointment management and calendar operations_

**Documentation**: [Full Area Documentation](./areas/booking/)

**Sub-Areas:**

- 2.1.1 [Calendar Management](./areas/booking/sub-areas/calendar-management/) - `📋 Planned`
  - Multi-Provider Calendar, Schedule Template Builder, Template Application
  - Calendar Views (Day/Week/Month), Resource Calendar, Template Analytics
- 2.1.2 [Appointment Management](./areas/booking/sub-areas/appointment-management/) - `📋 Planned`
  - Appointment Booking, Appointment Type Configuration, Recurring Appointments
  - Appointment Status Management, Resource Scheduling, Scheduling Intelligence
- 2.1.3 [Waitlist & Recovery](./areas/booking/sub-areas/waitlist-recovery/) - `📋 Planned`
  - Waitlist Management, Opening Notifications, Failed Appointment Recovery
  - Cancellation Tracking, At-Risk Patient Identification, Re-engagement Campaigns
- 2.1.4 [Emergency & Reminders](./areas/booking/sub-areas/emergency-reminders/) - `📋 Planned`
  - Emergency Appointments, On-Call Management, Appointment Reminders
  - Confirmation System, After-Hours Handling, Emergency Protocols

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Calendar Management | 6 functions |
| Appointment Management | 6 functions |
| Waitlist & Recovery | 6 functions |
| Emergency & Reminders | 6 functions |

**External Integrations:**

- Twilio (SMS reminders and confirmations)
- SendGrid/SES (Email reminders)
- Google Calendar / Apple Calendar (Patient calendar sync)
- Answering Service (After-hours handling)

**AI Features:**

- Template optimization suggestions based on usage patterns
- Smart slot recommendations for scheduling
- No-show prediction and prevention
- Waitlist prioritization
- Reminder timing optimization

---

### 2. Treatment Management

_Patient treatment lifecycle from planning to completion_

**Sub-Areas:**

- 2.1 Treatment Plans - `📋 Planned`
- 2.2 Procedures - `📋 Planned`
- 2.3 Progress Tracking - `📋 Planned`
- 2.4 Clinical Notes - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 3. Imaging Management

_Capture, view, organize, and report on patient diagnostic imaging including photos, X-rays, 3D scans, and CBCT_

**Documentation**: [Full Area Documentation](./areas/imaging-management/)

**Sub-Areas:**

- 3.3.1 [Image Capture & Upload](./areas/imaging-management/sub-areas/image-capture-upload/) - `📋 Planned`
  - Intraoral Camera Integration, DSLR/Camera Import, X-ray Integration (DICOM)
  - 3D Scanner Integration (iTero/3Shape), Photo Protocol Management, Batch Upload
- 3.3.2 [Image Viewing & Tools](./areas/imaging-management/sub-areas/image-viewing-tools/) - `📋 Planned`
  - Advanced Image Viewer, Measurement & Calibration Tools, Annotation System
  - Comparison Views, Cephalometric Analysis, 3D Model Viewer
- 3.3.3 [Image Organization](./areas/imaging-management/sub-areas/image-organization/) - `📋 Planned`
  - Patient Image Gallery, Image Categorization, Tagging & Metadata
  - Search & Filtering, Treatment Phase Linking, Retention & Archival
- 3.3.4 [Reports & Collages](./areas/imaging-management/sub-areas/reports-collages/) - `📋 Planned`
  - Collage Template Builder, Progress Collage Generation, Before/After Presentations
  - Case Presentation Builder, Referral Documentation, Treatment Simulation Exports

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Image Capture & Upload | 6 functions |
| Image Viewing & Tools | 6 functions |
| Image Organization | 6 functions |
| Reports & Collages | 6 functions |

**Orthodontic-Specific Features:**

- Standard photo series (8-12 photos: extraoral, intraoral, occlusal)
- Cephalometric analysis with landmark tracing and measurements
- Panoramic and cephalometric X-ray support (DICOM)
- CBCT 3D imaging and cross-sectional views
- iTero/3Shape scanner integration for digital impressions
- Progress comparison (start vs. current vs. projected)
- Treatment simulation visualization
- Photo consistency guides (lighting, positioning, backgrounds)

**External Integrations:**

- DSLR Cameras (USB tethered, memory card import)
- Intraoral Cameras (device SDK integration)
- X-ray Systems (DICOM import/export)
- CBCT Systems (DICOM volumes)
- iTero (cloud API sync)
- 3Shape (file import)
- Cloud Storage (S3-compatible)

**AI Features:**

- Image quality scoring (focus, lighting, positioning)
- Automatic image categorization
- Smart image selection for collages
- AI-assisted cephalometric landmark detection
- Before/after image matching
- Auto-captioning for reports
- Photo positioning guidance during capture

---

### 4. Lab Work Management

_Manage orthodontic lab orders, vendor relationships, order tracking, and quality control for appliances, retainers, aligners, and other lab-fabricated items_

**Documentation**: [Full Area Documentation](./areas/lab-work-management/)

**Sub-Areas:**

- 3.4.1 [Lab Orders](./areas/lab-work-management/sub-areas/lab-orders/) - `📋 Planned`
  - Lab Order Creation, Case Prescription Builder, Digital File Attachment
  - Order Templates, Rush Order Management, Batch Order Submission
- 3.4.2 [Lab Vendor Management](./areas/lab-work-management/sub-areas/lab-vendor-management/) - `📋 Planned`
  - Lab Directory Management, Pricing & Fee Schedules, Contract Management
  - Lab Preference Rules, Performance Metrics, Communication Hub
- 3.4.3 [Order Tracking](./areas/lab-work-management/sub-areas/order-tracking/) - `📋 Planned`
  - Order Status Dashboard, Shipment Tracking, Due Date Management
  - Delivery Coordination, Patient Pickup Tracking, Reorder Reminders
- 3.4.4 [Quality & Remakes](./areas/lab-work-management/sub-areas/quality-remakes/) - `📋 Planned`
  - Receiving Inspection, Remake Request Management, Warranty Tracking
  - Quality Issue Logging, Lab Feedback System, Quality Analytics

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Lab Orders | 6 functions |
| Lab Vendor Management | 6 functions |
| Order Tracking | 6 functions |
| Quality & Remakes | 6 functions |

**Orthodontic Lab Products:**

- Retainers (Hawley, Essix, bonded, Vivera)
- Appliances (RPE, Herbst, quad helix, space maintainers)
- Aligners (Invisalign, in-house, third-party)
- Indirect bonding trays
- Custom archwires
- Study models and surgical splints

**External Integrations:**

- iTero (cloud API for scans)
- 3Shape (file import)
- Invisalign Doctor Site (case submission)
- Lab Portals (order submission, status)
- Shipping Carriers (FedEx, UPS tracking)
- In-House 3D Printers

**AI Features:**

- Auto-order generation from treatment milestones
- Vendor recommendation based on product/quality/turnaround
- Due date prediction from historical data
- Quality prediction for at-risk orders
- Smart reorder reminders for retainer programs

---

### 5. Practice Orchestration

_Real-time operations dashboard and patient flow_

**Sub-Areas:**

- 5.1 Daily Dashboard - `📋 Planned`
- 5.2 Patient Flow - `📋 Planned`
- 5.3 Status Tracking - `📋 Planned`
- 5.4 Alerts & Notifications - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 6. Staff Management

_Team coordination, scheduling, and assignments_

**Documentation**: [Full Area Documentation](./areas/staff-management/) | **Backlog**: [BACKLOG-IMPLEMENTATION.md](./areas/staff-management/BACKLOG-IMPLEMENTATION.md)

**Overall Status**: ✅ **Complete** (24 of 24 functions implemented)

**Sub-Areas:**

- 6.1 **Staff Profiles & HR** - `✅ Complete (6/6)`
  - ✅ Employee profiles CRUD, credentials, certifications, emergency contacts, employment records, document management
  - **Bonuses**: Compensation tracking, verification API, document versioning
- 6.2 **Scheduling & Time Management** - `✅ Complete (6/6)`
  - ✅ Shift scheduling, time-off management, availability management, schedule templates
  - ✅ Coverage management, overtime tracking
  - **Bonuses**: Blackout dates, PTO tracking, month view, bulk shift creation
- 6.3 **Roles & Permissions** - `✅ Complete (6/6)`
  - ✅ Role CRUD, permission assignment, PermissionMatrix UI
  - ✅ Role hierarchy, role templates, access audit
  - ✅ Role clone, validation, history, export/import
- 6.4 **Performance & Training** - `✅ Complete (6/6)`
  - ✅ Performance metrics, goal tracking, review cycles
  - ✅ Training records, CE credits, recognition/kudos

**Key Implemented Functions (24/24):**

- Staff profile CRUD with compensation tracking
- Credential & certification management with expiration tracking
- Emergency contacts & employment history
- Document management with versioning & access levels
- Shift scheduling with templates, blackout dates, bulk operations
- Time-off requests with PTO balance tracking
- Staff availability management
- Coverage management with gap detection
- Overtime tracking with approval workflow
- Role management with hierarchy, clone, validate, history
- Role templates with industry-standard library
- Access audit with compliance dashboards
- Performance metrics tracking
- Goal setting and progress tracking
- Performance review cycles
- Training record management
- CE credit tracking with verification
- Recognition and kudos system

**Remaining Work**: Only UX enhancements (drag-drop scheduling) and deferred items remain. See [BACKLOG-IMPLEMENTATION.md](./areas/staff-management/BACKLOG-IMPLEMENTATION.md)

---

### 7. Resources Management

_Physical resources: chairs, rooms, equipment_

**Sub-Areas:**

- 7.1 Chair Management - `📋 Planned`
- 7.2 Room Management - `📋 Planned`
- 7.3 Equipment Tracking - `📋 Planned`
- 7.4 Inventory Management - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 8. CRM & Onboarding

_Patient acquisition, intake process, and referral management for orthodontic practices_

**Documentation**: [Full Area Documentation](./areas/crm-onboarding/)

**Sub-Areas:**

- 8.1 [Lead Management](./areas/crm-onboarding/sub-areas/lead-management/) - `📋 Planned`
  - Lead Capture & Entry, Lead Source Tracking, Conversion Pipeline
  - Coordinator Assignment, Follow-up Management, Lead Analytics
- 8.2 [Intake Forms](./areas/crm-onboarding/sub-areas/intake-forms/) - `📋 Planned`
  - Form Template Builder, Patient Form Portal, Medical History Collection
  - Insurance Information Capture, Consent Form Management, Completion Tracking
- 8.3 [Referral Tracking](./areas/crm-onboarding/sub-areas/referral-tracking/) - `📋 Planned`
  - Referring Provider Directory, Referral Source Attribution, Acknowledgment Letters
  - Progress Reports, Referral Analytics, Specialist Network
- 8.4 [Records Requests](./areas/crm-onboarding/sub-areas/records-requests/) - `📋 Planned`
  - Incoming Records Management, Outgoing Records Preparation, Authorization Verification
  - Transfer Status Tracking, Fee Management, Compliance Monitoring

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Lead Management | 6 functions |
| Intake Forms | 6 functions |
| Referral Tracking | 6 functions |
| Records Requests | 6 functions |

**External Integrations:**

- Twilio (SMS communications for leads and forms)
- SendGrid/SES (Email delivery)
- DocuSign/HelloSign (E-signatures for intake forms)
- Web Forms/Landing Pages (Lead capture)
- Fax Services (Referral letters and records transfer)

**AI Features:**

- Lead scoring and conversion prediction
- Optimal contact time suggestions
- Form completion prediction
- Insurance card OCR data extraction
- Referral relationship insights
- Records completeness verification

---

### 9. Patient Communications

_Messaging, portal, and campaigns_

**Sub-Areas:**

- 9.1 Messaging Hub - `📋 Planned`
- 9.2 Patient Portal - `📋 Planned`
- 9.3 Campaigns - `📋 Planned`
- 9.4 Education Materials - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

### 10. Financial Management

_Comprehensive financial oversight including revenue tracking, expense management, reporting, and analytics for orthodontic practices_

**Documentation**: [Full Area Documentation](./areas/financial-management/)

**Sub-Areas:**

- 10.1 [Revenue Tracking](./areas/financial-management/sub-areas/revenue-tracking/) - `📋 Planned`
  - Day Sheet & Daily Reconciliation, Production Tracking, Collections Tracking
  - Deferred Revenue Management, Production vs Collection Analysis, Revenue Recognition Scheduling
- 10.2 [Expense Management](./areas/financial-management/sub-areas/expense-management/) - `📋 Planned`
  - Vendor Payment Tracking, Overhead Cost Management, Payroll Integration
  - Supply & Inventory Costs, Lab Fee Tracking, Expense Categorization
- 10.3 [Financial Reports](./areas/financial-management/sub-areas/financial-reports/) - `📋 Planned`
  - Profit & Loss Statements, Balance Sheet, Cash Flow Statements
  - AR Aging Reports (Orthodontic-Specific), Write-off & Adjustment Reports, Custom Report Builder
- 10.4 [Analytics Dashboard](./areas/financial-management/sub-areas/analytics-dashboard/) - `📋 Planned`
  - KPI Dashboard, Trend Analysis, Benchmarking
  - New Patient ROI, Case Profitability, Predictive Analytics

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Revenue Tracking | 6 functions |
| Expense Management | 6 functions |
| Financial Reports | 6 functions |
| Analytics Dashboard | 6 functions |

**Orthodontic-Specific Features:**

- Deferred revenue management for 18-24 month treatment contracts
- Production vs collection gap analysis
- Provider-level production tracking
- Seasonal trend analysis (back-to-school, summer starts)
- Case profitability by treatment type
- Lab fee impact on case margins

**External Integrations:**

- QuickBooks/Xero (Accounting sync)
- ADP/Gusto (Payroll integration)
- Bank Feeds (Deposit reconciliation)
- Stripe/Square (Payment gateway reconciliation)

**AI Features:**

- Anomaly detection in financial patterns
- Revenue and collection forecasting
- Expense categorization automation
- Cash flow prediction
- Seasonal trend adjustment
- Benchmark insights and recommendations

---

### 11. Billing & Insurance

_Revenue cycle, claims processing, and payment collection_

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

_Regulatory compliance, consent management, and audit trails_

**Documentation**: [Full Area Documentation](./areas/compliance-documentation/)

**Sub-Areas:**

- 12.1 [Consent Forms](./areas/compliance-documentation/sub-areas/consent-forms/) - `📋 Planned`
  - Consent Form Builder, Digital Signature Capture, Form Version Management
  - Consent Expiration Tracking, Minor/Guardian Consent, Consent Analytics
- 12.2 [Clinical Protocols](./areas/compliance-documentation/sub-areas/clinical-protocols/) - `📋 Planned`
  - Protocol Library Management, Daily Operational Checklists, Sterilization Logs
  - Equipment Safety Monitoring, Radiation Safety Compliance, Emergency Preparedness
- 12.3 [Staff Training](./areas/compliance-documentation/sub-areas/staff-training/) - `📋 Planned`
  - Certification Management, Training Program Administration, Expiration Alerts
  - Continuing Education Tracking, Onboarding Checklists, Training Compliance Reporting
- 12.4 [Audit Management](./areas/compliance-documentation/sub-areas/audit-management/) - `📋 Planned`
  - System Audit Trail, Compliance Self-Audit Tools, Incident Reporting System
  - Document Retention Management, Regulatory Reporting, Audit Preparation Workflows

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Consent Forms | 6 functions |
| Clinical Protocols | 6 functions |
| Staff Training | 6 functions |
| Audit Management | 6 functions |

**Regulatory Coverage:**

- HIPAA (Privacy Rule, Security Rule, Breach Notification)
- PIPEDA (Canadian privacy compliance)
- OSHA (Bloodborne pathogens, Hazard communication)
- State Dental Board requirements
- CDC Infection Control guidelines

**External Integrations:**

- E-Signature Provider (DocuSign/HelloSign)
- Document Storage (secure cloud storage)
- LMS Integration (CE tracking)
- License Verification APIs

**AI Features:**

- Consent completeness verification
- Expiration prediction and alerts
- Compliance risk scoring
- Anomaly detection in audit logs
- Training recommendations based on role

---

### 13. Vendors Management

_Supplier relationships and procurement_

**Sub-Areas:**

- 13.1 Vendor Directory - `📋 Planned`
- 13.2 Contracts Management - `📋 Planned`
- 13.3 Purchase Orders - `📋 Planned`
- 13.4 Vendor Payments - `📋 Planned`

**Key Functions:** TBD after sub-area planning

---

## Status Legend

| Status      | Icon | Description                           |
| ----------- | ---- | ------------------------------------- |
| Planned     | 📋   | Documented, not started               |
| In Progress | 🔄   | Currently being implemented           |
| Review      | 👀   | Implementation complete, under review |
| Testing     | 🧪   | In testing phase                      |
| Completed   | ✅   | Fully implemented and tested          |
| Blocked     | 🚫   | Blocked by dependency or issue        |

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

| Date       | Change                                                                                   | Author |
| ---------- | ---------------------------------------------------------------------------------------- | ------ |
| 2024-11-30 | Staff Management 100% complete: All 4 sub-areas fully implemented (24/24 functions)     | Claude |
| 2024-11-30 | Staff Management - Performance & Training sub-area complete (6 models, APIs, UIs)        | Claude |
| 2024-11-30 | Staff Management - Roles & Permissions sub-area complete (hierarchy, templates, audit)   | Claude |
| 2024-11-30 | Staff Management - Scheduling & Time Management sub-area complete                        | Claude |
| 2024-11-30 | Staff Management - Staff Profiles & HR sub-area complete                                 | Claude |
| 2024-11-29 | Auth & Authorization area implementation complete (Phase 1 scope)                        | Claude |
| 2024-11-26 | Initial creation                                                                         | Claude |
| 2024-11-26 | Added detailed Billing & Insurance area documentation (4 sub-areas, 31 functions)        | Claude |
| 2024-11-26 | Added detailed Booking & Scheduling area documentation (4 sub-areas, 24 functions)       | Claude |
| 2024-11-26 | Added detailed Compliance & Documentation area documentation (4 sub-areas, 24 functions) | Claude |
| 2024-11-26 | Added detailed CRM & Onboarding area documentation (4 sub-areas, 24 functions)           | Claude |
| 2024-11-26 | Added detailed Financial Management area documentation (4 sub-areas, 24 functions)       | Claude |
| 2024-11-26 | Added detailed Imaging Management area documentation (4 sub-areas, 24 functions)         | Claude |
| 2024-11-27 | Rewrote Lab Work Management for orthodontic dental labs (4 sub-areas, 24 functions)      | Claude |

---

**Status**: Active
**Last Updated**: 2024-11-30
**Owner**: Development Team
