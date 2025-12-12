# Orca Master Index

> **Single source of truth for the entire Orca project**
>
> This document provides navigation, status tracking, and context for all development work.

---

## For LLMs: Quick Status

| Attribute                 | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| **Current Phase**         | Phase 3 - Clinical (Nearing Completion)                                                    |
| **In Progress**           | Phase 4 Planning (Billing & Insurance next target)                                         |
| **Implementation Status** | ✅ Auth, 🔄 Staff (~75%), ✅ Resources, ✅ Booking, ✅ Practice Orchestration (88%), 🔄 Patient Comms (~75%), ✅ CRM & Onboarding (~95%), ✅ Imaging (~90%), ✅ Treatment (~90%), ✅ Lab Work (~90%) |

### What to Work On

1. **Completed**: Auth & Authorization - Full RBAC implemented
2. **Partial (~75%)**: Staff Management - Scheduling 100%, Profiles 90%, Roles 40%, Performance 50%
3. **Completed**: Resources Management - All 4 sub-areas implemented (Equipment, Rooms, Inventory, Sterilization)
4. **Completed**: Booking & Scheduling - Phase 2 Complete (UI Styling Standardized, PatientSearchCombobox added)
5. **Completed (88%)**: Practice Orchestration - 3/4 sub-areas complete; AI Manager deferred
6. **In Progress (~75%)**: Patient Communications - Messaging 80%, Portal 75%, Campaigns 85%, Content 70%
7. **Completed (~95%)**: CRM & Onboarding - Lead Management, Intake Forms, Referral Tracking, Records Requests
8. **Completed (~90%)**: Lab Work Management - Vendors, Products, Orders, Tracking all implemented

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
[████████████████████] 80% Complete

Phase 1: Foundation    [████░] Auth ✅, Staff ~75%, Resources ✅
Phase 2: Operations    [████░] Booking ✅, Orchestration 88%, Patient Comms ~75%
Phase 3: Clinical      [█████] CRM ~95%, Imaging ~90%, Treatment ~90%, Lab Work ~90% ✅
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
| 1.2 | [Staff Management](./areas/staff-management/)         | 🔄 In Progress (~75%)   | Critical | Auth ✅        |
| 1.3 | [Resources Management](./areas/resources-management/) | ✅ Complete             | High     | Auth ✅        |

### Phase 2: Core Operations

_Core daily operations_

| #   | Area                   | Status                      | Priority | Dependencies     |
| --- | ---------------------- | --------------------------- | -------- | ---------------- |
| 2.1 | Booking & Scheduling   | ✅ Phase 2 Complete         | Critical | Phase 1          |
| 2.2 | Practice Orchestration | ✅ Complete (88%)           | High     | Phase 1, Booking |
| 2.3 | Patient Communications | 🔄 In Progress (~75%)       | High     | Phase 1          |

### Phase 3: Clinical

_Patient care and treatment_

| #   | Area                 | Status                | Priority | Dependencies |
| --- | -------------------- | --------------------- | -------- | ------------ |
| 3.1 | CRM & Onboarding     | ✅ Complete (~95%)    | High     | Phase 2      |
| 3.2 | Treatment Management | ✅ Complete (~90%)    | Critical | Phase 2, CRM |
| 3.3 | Imaging Management   | ✅ Complete (~90%)    | High     | Treatment    |
| 3.4 | Lab Work Management  | ✅ Complete (~90%)    | Medium   | Treatment ✅ |

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
| [Booking & Scheduling](./areas/booking/)                        | ✅ Phase 2 Done | 4         | 24         | [View](./areas/booking/)                  |
| [Treatment Management](./areas/treatment-management/)           | ✅ Complete (~90%) | 4         | 24 impl    | [View](./areas/treatment-management/)     |
| [Imaging Management](./areas/imaging-management/)               | ✅ Complete (~90%) | 4         | 24 impl    | [View](./areas/imaging-management/)       |
| [Lab Work Management](./areas/lab-work-management/)             | ✅ Complete (~90%) | 4         | 24 impl    | [View](./areas/lab-work-management/)      |
| [Practice Orchestration](./areas/practice-orchestration/)       | ✅ Complete (88%) | 4         | 34         | [View](./areas/practice-orchestration/)   |
| [Staff Management](./areas/staff-management/)                   | 🔄 ~75%         | 4         | ~18/24 impl | [View](./areas/staff-management/)        |
| [Resources Management](./areas/resources-management/)           | ✅ Complete     | 4         | 24 impl    | [View](./areas/resources-management/)     |
| [CRM & Onboarding](./areas/crm-onboarding/)                     | ✅ Complete (~95%) | 4         | 24 impl    | [View](./areas/crm-onboarding/)           |
| [Patient Communications](./areas/patient-communications/)       | 🔄 ~75%         | 4         | ~16/21 impl | [View](./areas/patient-communications/) |
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

**Documentation**: [Full Area Documentation](./areas/treatment-management/)

**Overall Status**: ✅ **Complete (~90%)**

**Sub-Areas:**

- 2.1 [Treatment Planning](./areas/treatment-management/sub-areas/treatment-planning/) - `✅ Complete`
  - ✅ Treatment plans CRUD, options, presentations, acceptances, modifications
  - ✅ Phase management, milestone tracking, plan versioning
- 2.2 [Clinical Documentation](./areas/treatment-management/sub-areas/clinical-documentation/) - `✅ Complete`
  - ✅ Progress notes (SOAP format), procedures, findings, measurements
  - ✅ Note templates, visit records, provider signatures
- 2.3 [Appliance Management](./areas/treatment-management/sub-areas/appliance-management/) - `✅ Complete`
  - ✅ Brackets, wires, aligners, retainers, elastics, activations
  - ✅ Wire sequence tracking, aligner delivery records
- 2.4 [Treatment Tracking](./areas/treatment-management/sub-areas/treatment-tracking/) - `✅ Complete`
  - ✅ Progress monitoring, debond readiness, retention protocols
  - ✅ Outcome assessment, treatment timelines

**What's Implemented:**
- 56 pages covering all sub-areas
- 26 React components
- 18+ API routes with full CRUD operations
- 30+ Prisma models
- ~1800 lines of Zod validation schemas
- Sidebar navigation configured

**What's Not Yet Implemented:**
- ⚠️ External integrations (Invisalign/iTero, ClearCorrect, SureSmile) - deferred
- ⚠️ Voice-to-text note entry - deferred
- ⚠️ Advanced treatment analytics dashboard - deferred

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Treatment Planning | 6 functions ✅ |
| Clinical Documentation | 6 functions ✅ |
| Appliance Management | 6 functions ✅ |
| Treatment Tracking | 6 functions ✅ |

---

### 3. Imaging Management

_Capture, view, organize, and report on patient diagnostic imaging including photos, X-rays, 3D scans, and CBCT_

**Documentation**: [Full Area Documentation](./areas/imaging-management/)

**Overall Status**: ✅ **Complete (~90%)**

**Sub-Areas:**

- 3.3.1 [Image Capture & Upload](./areas/imaging-management/sub-areas/image-capture-upload/) - `✅ Complete (~85%)`
  - ✅ ImageUploader, batch upload, drag-drop, photo protocols UI
  - ✅ API endpoints for upload, protocols CRUD
  - ⚠️ Device integration (cameras, scanners) deferred - hardware-dependent
- 3.3.2 [Image Viewing & Tools](./areas/imaging-management/sub-areas/image-viewing-tools/) - `✅ Complete (~95%)`
  - ✅ ImageViewer with zoom/pan/rotate, ImageAdjustments (brightness/contrast/saturation)
  - ✅ BeforeAfterSlider, ImageComparison (side-by-side, grid, slider modes)
  - ✅ AnnotationCanvas/Toolbar (freehand, line, arrow, shapes, text)
  - ✅ MeasurementCanvas/Toolbar (linear, angle, area with calibration)
  - ✅ CephAnalysis with 30+ landmarks, multiple analysis presets
  - ✅ Model3DViewer for STL/OBJ/PLY, DicomViewer for X-rays
- 3.3.3 [Image Organization](./areas/imaging-management/sub-areas/image-organization/) - `✅ Complete (~95%)`
  - ✅ ImageGallery with filtering, PatientImage model, ImageTag system
  - ✅ TreatmentPhaseSelector, TreatmentPhaseBadge components
  - ✅ Retention policies, archive management, legal hold system
  - ✅ Full API for tags, retention policies, archive/restore
- 3.3.4 [Reports & Collages](./areas/imaging-management/sub-areas/reports-collages/) - `✅ Complete (~90%)`
  - ✅ CollageEditor with templates, CollagePreview, TemplateSelector
  - ✅ ReportBuilder with sections, ReportTemplateSelector
  - ✅ PresentationBuilder, PresentationViewer, BeforeAfterPairSelector
  - ✅ Progress report templates, AI analysis panels
  - ⚠️ Presentation API endpoint missing

**What's Implemented:**
- 40+ React components across all sub-areas
- 11 pages (dashboard, gallery, viewer, protocols, ceph, 3D, DICOM, compare, collages, presentations, retention)
- 30+ API endpoints covering full CRUD operations
- Prisma models: PatientImage, PhotoProtocol, ImageTag, ImageAnnotation, ImageMeasurement, ImageRetentionPolicy, etc.
- AI analysis panels (quality, categorization, ceph landmarks, progress comparison)
- Full retention/archival system with legal holds and compliance tracking

**What's Not Yet Implemented:**
- ⚠️ Device integration (DSLR tethered capture, intraoral cameras, scanner sync) - requires hardware
- ⚠️ Presentation API endpoint
- ⚠️ iTero/3Shape cloud API integration

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Image Capture & Upload | 6 functions (~85% impl) |
| Image Viewing & Tools | 6 functions (✅ 95% impl) |
| Image Organization | 6 functions (✅ 95% impl) |
| Reports & Collages | 6 functions (~90% impl) |

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

- DSLR Cameras (USB tethered, memory card import) - ⚠️ Deferred
- Intraoral Cameras (device SDK integration) - ⚠️ Deferred
- X-ray Systems (DICOM import/export) - ✅ Implemented
- CBCT Systems (DICOM volumes) - ✅ Implemented
- iTero (cloud API sync) - ⚠️ Deferred
- 3Shape (file import) - ✅ STL/OBJ/PLY import implemented
- Local Filesystem Storage - ✅ Implemented (on-premises only, no cloud)

**AI Features:**

- Image quality scoring (focus, lighting, positioning) - ✅ UI ready
- Automatic image categorization - ✅ UI ready
- Smart image selection for collages - ✅ UI ready
- AI-assisted cephalometric landmark detection - ✅ UI ready
- Before/after image matching - ✅ UI ready
- Auto-captioning for reports - ✅ UI ready
- Photo positioning guidance during capture - ⚠️ Deferred

---

### 4. Lab Work Management

_Manage orthodontic lab orders, vendor relationships, order tracking, and quality control for appliances, retainers, aligners, and other lab-fabricated items_

**Documentation**: [Full Area Documentation](./areas/lab-work-management/)

**Overall Status**: ✅ **Complete (~90%)**

**Sub-Areas:**

- 3.4.1 [Lab Orders](./areas/lab-work-management/sub-areas/lab-orders/) - `✅ Complete`
  - ✅ Lab Order CRUD, multi-item orders, patient/treatment linking
  - ✅ Order status workflow (pending → submitted → in_production → shipped → delivered)
  - ✅ Rush orders, due date tracking, digital file attachments
- 3.4.2 [Lab Vendor Management](./areas/lab-work-management/sub-areas/lab-vendor-management/) - `✅ Complete`
  - ✅ Vendor CRUD, contacts, capabilities, status management
  - ✅ Products catalog with categories, turnaround times, pricing
  - ✅ Fee schedules, contracts, preference rules
  - ✅ Vendor messaging hub (inbound/outbound communications)
- 3.4.3 [Order Tracking](./areas/lab-work-management/sub-areas/order-tracking/) - `✅ Complete`
  - ✅ Order dashboard with status filtering, search, pagination
  - ✅ Shipment tracking (carrier, tracking number, dates)
  - ✅ Order detail view with timeline, items, vendor info
- 3.4.4 [Quality & Remakes](./areas/lab-work-management/sub-areas/quality-remakes/) - `✅ Complete (~85%)`
  - ✅ Quality issues reporting with categories and severity
  - ✅ Remake request workflow with status tracking
  - ⚠️ Warranty tracking not implemented
  - ⚠️ Quality analytics dashboard deferred

**What's Implemented:**
- 15+ pages (dashboard, orders list/detail/new, vendors list/detail/new, products list/detail/new, messages, settings)
- 20+ React components (forms, lists, detail views, dialogs)
- 25+ API routes covering full CRUD operations
- Prisma models: LabVendor, LabVendorContact, LabVendorContract, LabProduct, LabFeeSchedule, LabOrder, LabOrderItem, LabShipment, LabMessage, LabPreferenceRule, LabQualityIssue
- ~800 lines of Zod validation schemas
- Sidebar navigation configured

**What's Not Yet Implemented:**
- ⚠️ Warranty tracking system
- ⚠️ Quality analytics dashboard
- ⚠️ External integrations (iTero, 3Shape, Invisalign portals) - deferred
- ⚠️ Shipping carrier API integration (FedEx, UPS) - deferred

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Lab Orders | 6 functions ✅ |
| Lab Vendor Management | 6 functions ✅ |
| Order Tracking | 6 functions ✅ |
| Quality & Remakes | 6 functions (~85%) |

**Orthodontic Lab Products:**

- Retainers (Hawley, Essix, bonded, Vivera)
- Appliances (RPE, Herbst, quad helix, space maintainers)
- Aligners (Invisalign, in-house, third-party)
- Indirect bonding trays
- Custom archwires
- Study models and surgical splints

**External Integrations:**

- iTero (cloud API for scans) - ⚠️ Deferred
- 3Shape (file import) - ⚠️ Deferred
- Invisalign Doctor Site (case submission) - ⚠️ Deferred
- Lab Portals (order submission, status) - ⚠️ Deferred
- Shipping Carriers (FedEx, UPS tracking) - ⚠️ Deferred
- In-House 3D Printers - ⚠️ Deferred

**AI Features:**

- Auto-order generation from treatment milestones - ⚠️ Deferred
- Vendor recommendation based on product/quality/turnaround - ⚠️ Deferred
- Due date prediction from historical data - ⚠️ Deferred
- Quality prediction for at-risk orders - ⚠️ Deferred
- Smart reorder reminders for retainer programs - ⚠️ Deferred

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

**Documentation**: [Full Area Documentation](./areas/staff-management/)

**Overall Status**: 🔄 **In Progress (~75%)**

**Sub-Areas:**

- 6.1 **Staff Profiles & HR** - `🔄 ~90%`
  - ✅ Employee profiles CRUD, credentials, certifications, emergency contacts, employment records
  - ⚠️ Credential expiration alerts not implemented
  - ⚠️ State database verification not implemented
- 6.2 **Scheduling & Time Management** - `✅ Complete (100%)`
  - ✅ Shift scheduling, time-off management, availability management
  - ✅ Coverage management, overtime tracking
  - ✅ Blackout dates, PTO tracking, month view, bulk shift creation
- 6.3 **Roles & Permissions** - `🔄 ~40%`
  - ✅ Basic role CRUD, permission assignment
  - ⚠️ Role hierarchy enforcement not implemented
  - ⚠️ Role templates UI incomplete
  - ⚠️ Permission inheritance calculation missing
  - ⚠️ Access audit dashboard not built
- 6.4 **Performance & Training** - `🔄 ~50%`
  - ✅ Performance goals and reviews API
  - ⚠️ Performance visualization/charts missing
  - ⚠️ Review cycle scheduling workflow incomplete
  - ⚠️ Training compliance enforcement missing
  - ⚠️ CE credit expiration notifications missing

**What's Implemented:**
- Staff profile CRUD with clinic isolation
- Credential & certification management
- Emergency contacts & employment history
- Complete shift scheduling with calendar integration
- Time-off request workflow
- Coverage gap detection
- Overtime calculation and tracking
- Basic role CRUD and permission assignment

**What's Not Yet Implemented:**
- Credential expiration alert system
- Role hierarchy enforcement
- Role templates UI
- Permission inheritance calculation
- Access audit dashboard
- Performance visualization/charts
- Review cycle scheduling
- Training compliance alerts

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

**Overall Status**: ✅ **Complete (~95%)**

**Sub-Areas:**

- 8.1 [Lead Management](./areas/crm-onboarding/sub-areas/lead-management/) - `✅ Complete`
  - ✅ Lead CRUD, Pipeline Board, Lead Detail with Activities/Tasks
  - ✅ Source Tracking, Stage Management, Coordinator Assignment
  - ✅ Lead Conversion to Patient, Analytics API
- 8.2 [Intake Forms](./areas/crm-onboarding/sub-areas/intake-forms/) - `✅ Complete`
  - ✅ Form Template Builder UI, Form Template CRUD
  - ✅ Public Intake Form Portal (`/intake/[token]`)
  - ✅ Intake Token Management, Multi-form Completion Tracking
- 8.3 [Referral Tracking](./areas/crm-onboarding/sub-areas/referral-tracking/) - `✅ Complete`
  - ✅ Referring Provider Directory CRUD
  - ✅ Referrer Detail Page with Stats & Referral History
  - ✅ Referral Letter Sending, Source Attribution
- 8.4 [Records Requests](./areas/crm-onboarding/sub-areas/records-requests/) - `✅ Complete`
  - ✅ Records Request CRUD, List with Filters
  - ✅ New Request Form with Patient/Lead Search
  - ✅ Incoming/Outgoing, Status Tracking, Authorization

**What's Implemented:**
- Lead management with full pipeline visualization (Kanban board)
- Lead activities and tasks tracking
- Lead conversion to patient workflow
- Form template builder with 14 field types
- Public intake form portal for patient submissions
- Referring provider management with statistics
- Records request management with status workflow

**What's Not Yet Implemented:**
- ⚠️ Lead scoring (AI feature - deferred)
- ⚠️ Form conditional logic execution
- ⚠️ E-signature integration (DocuSign/HelloSign)
- ⚠️ Records request detail page

**Key Functions (24 total):**
| Sub-Area | Functions |
|----------|-----------|
| Lead Management | 6 functions ✅ |
| Intake Forms | 6 functions ✅ |
| Referral Tracking | 6 functions ✅ |
| Records Requests | 6 functions ✅ |

**External Integrations:**

- Twilio (SMS communications for leads and forms)
- SendGrid/SES (Email delivery)
- DocuSign/HelloSign (E-signatures for intake forms) - ⚠️ Not yet integrated
- Web Forms/Landing Pages (Lead capture)
- Fax Services (Referral letters and records transfer)

**AI Features (Deferred):**

- Lead scoring and conversion prediction
- Optimal contact time suggestions
- Form completion prediction
- Insurance card OCR data extraction
- Referral relationship insights
- Records completeness verification

---

### 9. Patient Communications

_Messaging, portal, and campaigns_

**Documentation**: [Full Area Documentation](./areas/patient-communications/)

**Overall Status**: 🔄 **In Progress (~75%)**

**Sub-Areas:**

- 9.1 **Messaging Hub** - `🔄 ~80%`
  - ✅ SMS delivery (Twilio), Email delivery (SendGrid), In-App notifications
  - ✅ Message routing, history, template management
  - ⚠️ Two-way SMS threading not implemented
  - ⚠️ Unified inbox UI not built
- 9.2 **Patient Portal** - `🔄 ~75%`
  - ✅ Portal authentication (password, magic link, email verification)
  - ✅ Profile management, appointment self-service
  - 🚫 Payment & Billing blocked by Billing & Insurance area
  - 🚫 Treatment photos blocked by Imaging Management area
- 9.3 **Automated Campaigns** - `✅ ~85%`
  - ✅ Campaign execution engine, workflow builder UI
  - ✅ Appointment reminders, follow-up sequences
  - ⚠️ Survey form builder UI not implemented
  - ⚠️ A/B testing not implemented
- 9.4 **Educational Content Library** - `🔄 ~70%`
  - ✅ Content delivery automation, personalization
  - ⚠️ Rich text editor staff UI not built
  - ⚠️ FAQ management staff UI not built

**Blocked Features:**
- Payment & Billing Self-Service → Blocked by **Billing & Insurance** area
- Treatment Progress Photos → Blocked by **Imaging Management** area

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
| 2025-12-12 | Lab Work Management ~90% complete: 15+ pages, 20+ components, 25+ APIs, full vendor/order/tracking system | Claude |
| 2024-12-10 | Imaging Management ~90% complete: 40+ components, 11 pages, 30+ APIs, full retention system | Claude |
| 2024-12-10 | CRM & Onboarding ~95% complete: Lead Management, Intake Forms, Referral Tracking, Records Requests all implemented | Claude |
| 2024-12-09 | Documentation review: Updated implementation status across all areas to match actual code | Claude |
| 2024-12-09 | Patient Communications ~75% complete: Messaging 80%, Portal 75%, Campaigns 85%, Content 70% | Claude |
| 2024-12-09 | Staff Management corrected to ~75%: Scheduling 100%, Profiles 90%, Roles 40%, Performance 50% | Claude |
| 2025-12-06 | Practice Orchestration 88% complete: 3/4 sub-areas (Operations Dashboard, Patient Flow, Resource Coordination) | Claude |
| 2024-11-30 | Staff Management marked complete (later corrected in 2024-12-09 review)                  | Claude |
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
**Last Updated**: 2025-12-12
**Last Area Updated**: Lab Work Management (~90% complete)
**Owner**: Development Team
