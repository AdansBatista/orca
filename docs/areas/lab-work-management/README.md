# Lab Work Management

> **Area**: Lab Work Management
>
> **Phase**: 3 - Clinical
>
> **Purpose**: Manage lab orders, specimen collection, result ingestion, review, and reporting with strong traceability and integrations to external labs and LIS.

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Phase** | 3 - Clinical |
| **Dependencies** | Phase 1 (Auth, Staff, Resources), Phase 2 (Booking), Treatment Management, Billing & Insurance |
| **Last Updated** | 2025-11-27 |
| **Owner** | Clinical Systems Team (owner: `lab-sme@orca.example`) |

---

## Overview

Lab Work Management covers the lifecycle of laboratory testing within the practice: order creation, specimen labeling and chain-of-custody, sample tracking, ingestion of results from external labs or local LIS, clinician review and sign-off, patient notifications, and reporting for clinical and operational analytics.

This area ensures lab processes are traceable, auditable, and integrated with treatment workflows and billing. It reduces turnaround times, ensures accurate clinical decisions, and maintains compliance with PHI handling and lab regulations.

### Key Capabilities

- Order creation and routing to appropriate lab providers
- Barcode/QR-based specimen labeling and tracking
- Chain-of-custody logging for specimens
- Robust ingestion and normalization of lab results (HL7 v2 / FHIR)
- Clinician review, sign-off and versioned results
- Patient and provider notifications for critical results
- Analytics for turnaround times, volumes, and quality
- Retention, archival, and compliance features

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 4.4.1 | [Order Management](./sub-areas/order-management/) | Create and manage lab orders, routing and priorities | 📋 Planned | Critical |
| 4.4.2 | [Sample Collection & Tracking](./sub-areas/sample-collection-tracking/) | Specimen labeling, collection workflows, chain-of-custody | 📋 Planned | Critical |
| 4.4.3 | [Lab Integration & Result Ingestion](./sub-areas/lab-integration-ingestion/) | Connectors for HL7/FHIR/LIS and result parsing | 📋 Planned | Critical |
| 4.4.4 | [Result Review & Reporting](./sub-areas/result-review-reporting/) | Clinician sign-off, notifications and report generation | 📋 Planned | High |
| 4.4.5 | [Quality & Compliance](./sub-areas/quality-compliance/) | Audit logging, retention, consent and QA processes | 📋 Planned | High |

---

## Sub-Area Details

### 4.4.1 Order Management

Create, edit and route lab orders. This sub-area is the primary entry point for lab workflows and ties into specimen creation and billing.

**Functions:**
- `create-lab-order` — Create an order containing one or more `LabOrderItem`s, validate test codes, and select routing.
- `order-status-tracking` — Persist lifecycle statuses and emit events (created, collected, shipped, received, resulted, signed-off, canceled).
- `order-editing-cancellation` — Edit order items or cancel with audit trail and business rules.
- `order-priority-and-routing` — Assign priority and decide routing (internal/external) based on ruleset.

**Key Features:**
- Bulk order creation for batch referrals.
- Manual and rules-based routing with override and audit.
- Order templating for common test panels.
- Idempotent APIs for safe retries from external systems.

---

### 4.4.2 Sample Collection & Tracking

Specimen handling, labeling, chain-of-custody and physical tracking.

**Functions:**
- `specimen-labeling-barcode-generation` — Generate printable labels (ZPL/PDF) with 2D barcode and human readable fields.
- `collection-checklist` — Mobile checklist for collectors with required fields, consent capture and photo attachments.
- `chain-of-custody-log` — Append-only custody events with actor, timestamp and location.
- `sample-location-tracking` — Track specimen location and movement history (fridge, courier, lab, archive).

**Key Features:**
- Label formats for thermal printers (ZPL) and printable PDFs.
- Mobile-first collection UI with offline support.
- Temperature / storage condition recording for sensitive specimens.
- Barcode/QR scanning to reduce manual entry errors.

---

### 4.4.3 Lab Integration & Result Ingestion

Connectors and normalization pipeline for results ingestion from external labs and LIS.

**Functions:**
- `hl7-fhir-lab-result-ingest` — Ingest HL7 v2 ORU and FHIR DiagnosticReport messages, persist raw payloads and attachments.
- `lis-api-connector` — Vendor connector templates (OAuth2 polling, webhook, SFTP) with retry and backoff.
- `result-parsing-validation` — Parse attachments (PDF/Image) to structured observations, validate units and ranges.
- `result-versioning` — Maintain versions of results with sign-off and immutable history.

**Key Features:**
- Idempotency via external control IDs and deduplication strategy.
- Raw payload retention with reference to normalized records.
- Support for attachments up to large sizes via object storage.
- Dead-letter queue and web UI for manual reconciliation of failed ingests.

---

### 4.4.4 Result Review & Reporting

Clinician review, final sign-off, notification delivery and consolidated reporting.

**Functions:**
- `clinician-review-and-signoff` — UI and workflow to review normalized observations and sign final report; creates signed `ResultVersion`.
- `automated-abnormal-flagging` — Rules + ML to flag critical/abnormal results for expedited review.
- `patient-notification-delivery` — Configurable channels (portal, email, SMS) and release policies for result delivery.
- `lab-report-generation` — Consolidated PDF report generation with clinic branding and attachments.

**Key Features:**
- Configurable release policies (auto-release after X hours, delayed patient release until clinician sign-off).
- Signed reports with clinician metadata and audit trail.
- Notification templates and opt-in/opt-out handling.

---

### 4.4.5 Quality & Compliance

Audit, retention, consent, QA and regulatory compliance for lab workflows.

**Functions:**
- `qa-audit-logging` — Centralized, exportable audit logs for all lab events.
- `retention-policy-enforcement` — Configurable policies for retention and archival by test type.
- `consent-and-privacy-controls` — Consent capture and expiry for specimen and data uses.
- `proficiency-test-tracking` — QA cycles and corrective action tracking for lab processes.

**Key Features:**
- Role-based access control and fine-grained permission mapping.
- Exportable audit bundles for regulatory requests.
- Chain-of-custody reports for legal and compliance review.

---

## Integration Points (expanded)

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Treatment Management | Order triggers, test requirements | Automatically create orders for treatment milestones (e.g., pre-prosthetic or appliance delivery) |
| Imaging Management | Attach images/scans to orders | Send STL/scan references for appliance fabrication |
| Patient Communications | Notification templates, release policies | Deliver results to patients and providers consistent with clinic policies |
| Billing & Insurance | Charge capture, claim-level linking | Create lab charges and attach to claims/EOB processing |
| Practice Orchestration | Appointment triggers | Schedule collection tasks on appointment types |

### External Integrations (expanded)

| System | Integration Type | Purpose |
|--------|------------------|---------|
| External Labs / LIS | HL7 v2 (ORU), FHIR DiagnosticReport, SFTP | Ingest results, attachments and billing references |
| Reference Labs | Shipping/Tracking APIs | Track specimen courier progress and status |
| Label Printers | ZPL/PDF | Print specimen labels and manifests |
| OCR/ML Services | REST API | Extract structured observations from PDFs and images |

---

## Data Models (expanded)

### ER Diagram (overview)

```
┌───────────┐     ┌─────────────┐     ┌───────────┐
│  Patient  │────▶│  LabOrder   │────▶│ LabOrderItem│
└───────────┘     └─────────────┘     └───────────┘
                       │                     │
                       ▼                     ▼
                 ┌──────────┐         ┌─────────────┐
                 │ Specimen │────────▶│ SpecimenEvent│
                 └──────────┘         └─────────────┘
                       │
                       ▼
                 ┌──────────┐
                 │ LabResult│────▶ ResultObservation
                 └──────────┘
                       │
                       ▼
                ┌──────────────┐
                │ ResultAttachment │
                └──────────────┘
```

### Key Models (summary)

| Model | Core Fields |
|-------|-------------|
| `LabOrder` | `id`, `patientId`, `orderedBy`, `orderDate`, `status`, `externalOrderId`, `priority` |
| `LabOrderItem` | `id`, `labOrderId`, `testCode`, `name`, `collectionRequirement` |
| `Specimen` | `id`, `labOrderItemId`, `specimenType`, `labelId`, `location`, `collectedAt` |
| `SpecimenEvent` | `id`, `specimenId`, `eventType`, `actorId`, `timestamp`, `notes` |
| `LabResult` | `id`, `labOrderItemId`, `status`, `reportedAt`, `source`, `rawPayloadRef` |
| `ResultObservation` | `id`, `labResultId`, `loincCode`, `value`, `unit`, `referenceRange`, `flags` |

Fields like `createdAt`, `updatedAt`, `createdBy`, and `updatedBy` should exist on all models. Ingestion records should include `sourceMessageId`/`externalControlId` for idempotency.

---

## Implementation Notes (expanded)

1. MVP scope: `create-lab-order`, `specimen-labeling-barcode-generation`, `hl7-fhir-lab-result-ingest`, and `clinician-review-and-signoff`.
2. Use object storage (S3-compatible) for raw payloads and large attachments; store normalized observations in DB.
3. Idempotency keys and deduplication on ingestion are required to avoid duplicate results.
4. Provide DLQ and manual reconciliation UI for ingestion failures.
5. For label printing support ZPL and PDF exports; include thermal label templates.

---

## File Structure

```
docs/areas/lab-work-management/
├── README.md
├── requirements.md
├── features.md
├── integrations.md
├── data-models.md
└── sub-areas/
    ├── order-management/
    │   ├── README.md
    │   └── functions/
    │       ├── create-lab-order.md
    │       ├── order-status-tracking.md
    │       ├── order-editing-cancellation.md
    │       └── order-priority-and-routing.md
    ├── sample-collection-tracking/
    │   ├── README.md
    │   └── functions/
    │       ├── specimen-labeling-barcode-generation.md
    │       ├── collection-checklist.md
    │       ├── chain-of-custody-log.md
    │       └── sample-location-tracking.md
    ├── lab-integration-ingestion/
    │   ├── README.md
    │   └── functions/
    │       ├── hl7-fhir-lab-result-ingest.md
    │       ├── lis-api-connector.md
    │       ├── result-parsing-validation.md
    │       └── result-versioning.md
    ├── result-review-reporting/
    │   ├── README.md
    │   └── functions/
    │       ├── clinician-review-and-signoff.md
    │       ├── automated-abnormal-flagging.md
    │       ├── patient-notification-delivery.md
    │       └── lab-report-generation.md
    └── quality-compliance/
        ├── README.md
        └── functions/
            ├── qa-audit-logging.md
            ├── retention-policy-enforcement.md
            ├── consent-and-privacy-controls.md
            └── proficiency-test-tracking.md
```

---

## Related Documentation

- `docs\templates\area-template.md`
- `docs\AI-INTEGRATION.md`
- `docs\areas\imaging-management\README.md` (example style)

---

**Status**: 📋 Planned
**Last Updated**: 2025-11-27
**Owner**: Product/Development Team
