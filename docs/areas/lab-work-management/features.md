# Lab Work Management — Features

## Feature Overview

This document lists prominent features and capabilities for the Lab Work Management area.

### Core Features

- Order Management: create, edit, cancel, and route orders to external labs
- Specimen Labeling: generate barcodes/QR and printable labels
- Collection Workflow: mobile checklist-driven specimen collection
- Result Ingestion: HL7 v2 and FHIR ingestion pipeline with attachments
- Result Normalization: map observations to LOINC and standardized types
- Clinician Review: review, comment, and sign-off on results with versioning
- Notifications: configurable patient/provider notifications for results
- Reporting & Analytics: turnaround times, volumes, abnormal rates

### Operational Features

- Retry and dead-letter for failed ingestion messages
- Manual result reconciliation UI for ambiguous or multi-part reports
- Export (PDF/CSV) of results and lab report bundles

### AI Features

- Result Triage / Flagging: score results for potential critical findings
- Result Parsing: OCR and ML to extract observations from PDFs
- Predictive Turnaround Estimation: TAT predictions per lab/test
- Smart Sample Routing: recommend labs based on TAT, cost and capability

---

## Prioritization

- MVP: Order creation, label generation, basic ingestion (HL7/FHIR), result view
- M2: Clinician sign-off, notifications, basic analytics
- M3: AI triage, advanced normalization, full QA/compliance automation
# Lab Work Management - Features

## Feature List

### 1. Lab Vendor Directory
Comprehensive database of lab vendors with capabilities and performance tracking.
- [Details](./features/lab-vendor-directory.md)

**Key Capabilities**:
- Vendor contact information and specialties
- Turnaround time tracking per vendor
- Quality ratings and performance history
- Cost comparison across vendors
- Preferred vendor designation

### 2. Lab Order Creator
Streamlined lab work order creation and submission system.
- [Details](./features/lab-order-creator.md)

**Key Capabilities**:
- Quick order templates for common items (retainers, appliances, aligners)
- Digital prescription forms per vendor
- Attachment of diagnostic images and photos
- Rush order processing
- Integration with treatment plans

### 3. Order Tracking Dashboard
Real-time visibility into all lab work orders and status.
- [Details](./features/order-tracking-dashboard.md)

**Key Capabilities**:
- Track orders from submission through delivery
- Status notifications (submitted, in production, shipped, delivered)
- Expected delivery date tracking
- Delayed order alerts
- Shipping tracking integration

### 4. Quality Control System
Quality inspection and acceptance workflow for received lab work.
- [Details](./features/quality-control-system.md)

**Key Capabilities**:
- Quality inspection checklists per item type
- Photo documentation of received items
- Acceptance or rejection workflow
- Remake/redo request management
- Quality trend tracking per vendor

### 5. Lab Work Calendar
Integration with practice calendar for lab work delivery scheduling.
- [Details](./features/lab-work-calendar.md)

**Key Capabilities**:
- Expected delivery dates on calendar
- Automatic appointment scheduling when lab work arrives
- Patient notifications of lab work readiness
- Delivery date conflict detection

### 6. Treatment Plan Integration
Automated lab order triggering based on treatment milestones.
- [Details](./features/treatment-plan-integration.md)

**Key Capabilities**:
- Automatic order suggestions based on treatment phase
- Pre-planned order sequences
- Link lab work to treatment records
- Cost posting to treatment plan

### 7. Lab Work Analytics
Performance metrics and reporting for lab work operations.
- [Details](./features/lab-work-analytics.md)

**Key Capabilities**:
- Vendor performance comparison
- Turnaround time analysis
- Quality acceptance rates
- Cost analysis by vendor and item type
- Remake rate tracking

---

**Note**: Click on individual feature links for detailed specifications.
