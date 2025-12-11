# CRM & Patient Onboarding

> **Area**: CRM & Onboarding
>
> **Phase**: 3 - Clinical
>
> **Purpose**: Manage the complete patient acquisition journey from initial inquiry through treatment start, including lead tracking, intake forms, referral management, and records coordination

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete (~95%) |
| **Priority** | High |
| **Phase** | 3 - Clinical |
| **Dependencies** | Phase 1 (Auth, Staff), Phase 2 (Booking, Communications) |
| **Last Updated** | 2024-12-10 |

---

## Implementation Status Summary

| Sub-Area | Status | Completion | Notes |
|----------|--------|------------|-------|
| Lead Management | ✅ Complete | ~95% | Full pipeline, activities, conversion |
| Intake Forms | ✅ Complete | ~90% | Templates, submissions, public portal |
| Referral Tracking | ✅ Complete | ~95% | Provider directory, letters, stats |
| Records Requests | ✅ Complete | ~95% | Incoming/outgoing, status tracking |

### What's Implemented

**Lead Management:**
- ✅ Lead CRUD with clinic isolation (`/api/leads`)
- ✅ Pipeline board view (`/crm/pipeline`)
- ✅ Lead detail page with activities & tasks (`/crm/leads/[id]`)
- ✅ Lead source tracking (enum: WEBSITE, PHONE_CALL, WALK_IN, REFERRAL, etc.)
- ✅ Lead stage management (INQUIRY → CONTACTED → SCHEDULED → CONSULTED → PENDING → ACCEPTED)
- ✅ Treatment coordinator assignment
- ✅ Lead conversion to patient (`/api/leads/[id]/convert`)
- ✅ Lead analytics API (`/api/leads/analytics`)
- ✅ Lead activities logging (`/api/leads/[id]/activities`)
- ✅ Lead tasks management (`/api/leads/[id]/tasks`)

**Patient Pages (Supporting):**
- ✅ Patient list page with search, pagination, PHI protection (`/patients`)
- ✅ Patient detail page with quick actions (`/patients/[id]`)
- ✅ Patient image gallery (`/patients/[id]/images`)
- ✅ Patient image upload (`/patients/[id]/images/upload`)

**Intake Forms:**
- ✅ Form template CRUD (`/api/forms/templates`)
- ✅ Form template builder UI (`/crm/forms/builder`)
- ✅ Form submission capture (`/api/forms/submissions`)
- ✅ Public intake form portal (`/intake/[token]`)
- ✅ Intake token management (`/api/forms/intake-tokens`, `/api/intake/[token]`)
- ✅ Multi-form completion tracking
- ✅ Form field types: text, textarea, number, email, phone, date, select, multi_select, checkbox, radio, signature, file, section_header, paragraph

**Referral Tracking:**
- ✅ Referring provider CRUD (`/api/referrers`)
- ✅ Referrer list page with filters (`/crm/referrers`)
- ✅ Referrer detail page with stats (`/crm/referrers/[id]`)
- ✅ New referrer form (`/crm/referrers/new`)
- ✅ Referral history per provider (`/api/referrers/[id]/referrals`)
- ✅ Referral letter sending (`/api/referrers/[id]/letters`)
- ✅ Referral source attribution on leads

**Records Requests:**
- ✅ Records request CRUD (`/api/records-requests`)
- ✅ Records list page with filters (`/crm/records`)
- ✅ New records request form (`/crm/records/new`)
- ✅ Incoming/outgoing direction support
- ✅ Status tracking (PENDING → SENT → RECEIVED → COMPLETED → CANCELLED)
- ✅ Record types: X-RAYS, PHOTOS, TREATMENT_RECORDS, MEDICAL_HISTORY, BILLING_RECORDS, ALL
- ✅ Authorization signed tracking
- ✅ Due date management
- ✅ Patient/Lead search and association

### What's Not Yet Implemented
- ⚠️ Lead scoring (AI feature - deferred)
- ⚠️ Form conditional logic execution
- ⚠️ E-signature integration (DocuSign/HelloSign)
- ⚠️ Referral letter templates UI
- ⚠️ Records request fee management
- ⚠️ Records request detail page (`/crm/records/[id]`)

### File Structure (Implemented)

```
src/app/
├── (app)/crm/
│   ├── page.tsx                    # CRM Dashboard
│   ├── leads/
│   │   ├── page.tsx                # Lead list
│   │   ├── new/page.tsx            # Create lead
│   │   └── [id]/page.tsx           # Lead detail
│   ├── pipeline/
│   │   └── page.tsx                # Kanban pipeline
│   ├── referrers/
│   │   ├── page.tsx                # Referrer list
│   │   ├── referrers-list.tsx      # List component (Suspense)
│   │   ├── new/page.tsx            # Add referrer
│   │   └── [id]/page.tsx           # Referrer detail
│   ├── forms/
│   │   ├── page.tsx                # Form templates list
│   │   └── builder/page.tsx        # Form builder
│   └── records/
│       ├── page.tsx                # Records requests list
│       ├── records-requests-list.tsx # List component (Suspense)
│       └── new/
│           ├── page.tsx            # New request page
│           └── new-records-request-form.tsx
├── (app)/patients/
│   ├── page.tsx                    # Patient list with search/pagination
│   └── [id]/
│       ├── page.tsx                # Patient detail page
│       └── images/
│           ├── page.tsx            # Patient image gallery
│           └── upload/page.tsx     # Image upload page
├── intake/
│   └── [token]/page.tsx            # Public intake form
└── api/
    ├── leads/
    │   ├── route.ts
    │   ├── [id]/route.ts
    │   ├── [id]/activities/route.ts
    │   ├── [id]/tasks/route.ts
    │   ├── [id]/convert/route.ts
    │   ├── pipeline/route.ts
    │   └── analytics/route.ts
    ├── referrers/
    │   ├── route.ts
    │   ├── [id]/route.ts
    │   ├── [id]/letters/route.ts
    │   └── [id]/referrals/route.ts
    ├── forms/
    │   ├── templates/route.ts
    │   ├── templates/[id]/route.ts
    │   ├── submissions/route.ts
    │   ├── submissions/[id]/route.ts
    │   ├── submit/route.ts
    │   └── intake-tokens/route.ts
    ├── intake/
    │   └── [token]/route.ts
    └── records-requests/
        ├── route.ts
        └── [id]/route.ts
```

---

## Overview

The CRM & Patient Onboarding area manages the complete patient acquisition and onboarding journey for orthodontic practices. Unlike general dental offices with short sales cycles, orthodontic practices face unique challenges:

- **Extended Sales Cycle**: Consultations to treatment start can span weeks or months
- **Multi-Decision Makers**: Parents typically pay for children's treatment, requiring coordination with multiple stakeholders
- **Referral-Based Growth**: Strong relationships with general dentists drive patient volume
- **Complex Intake Process**: Medical/dental history, imaging, insurance verification, and financial consultation all occur before treatment begins

This area provides tools for treatment coordinators, front desk staff, and practice administrators to efficiently convert leads into patients and ensure a smooth onboarding experience.

### Key Capabilities

- **Lead Management**: Track prospects from initial inquiry through conversion with pipeline visualization
- **Intake Forms**: Digital collection of patient information, medical history, and consent
- **Referral Tracking**: Manage relationships with referring dentists and track referral sources
- **Records Requests**: Coordinate incoming and outgoing patient records with other providers
- **Treatment Coordinator Workflows**: Support the consultation-to-start process

### Business Value

- Increase consultation-to-start conversion rates
- Reduce time-to-treatment-start through streamlined onboarding
- Strengthen referring dentist relationships with professional communication
- Eliminate paper intake forms and manual data entry
- Track marketing ROI through lead source attribution
- Improve patient experience with organized, professional intake process

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 1 | [Lead Management](./sub-areas/lead-management/) | Prospect tracking, pipeline management, conversion workflows | ✅ Complete | High |
| 2 | [Intake Forms](./sub-areas/intake-forms/) | Digital forms, medical history, consent collection | ✅ Complete | Critical |
| 3 | [Referral Tracking](./sub-areas/referral-tracking/) | Referral sources, dentist relationships, acknowledgments | ✅ Complete | High |
| 4 | [Records Requests](./sub-areas/records-requests/) | Incoming/outgoing records, transfer management | ✅ Complete | Medium |

---

## Sub-Area Details

### 1. Lead Management

Track and nurture prospects from initial contact through treatment acceptance.

**Functions:**
- Lead Capture & Entry
- Lead Source Tracking
- Conversion Pipeline Management
- Treatment Coordinator Assignment
- Follow-up Task Management
- Lead Analytics & Reporting

**Key Features:**
- Multi-channel lead capture (web forms, phone calls, walk-ins, referrals)
- Visual pipeline with customizable stages
- Automated follow-up reminders
- Conversion rate tracking by source and coordinator
- Integration with consultation scheduling

---

### 2. Intake Forms

Digital patient intake replacing paper forms with smart data collection.

**Functions:**
- Form Template Builder
- Patient Form Portal
- Medical History Collection
- Insurance Information Capture
- Consent Form Management
- Form Completion Tracking

**Key Features:**
- Mobile-friendly form completion before appointments
- Pre-population from previous submissions
- Conditional logic for smart forms
- Integration with patient records
- Automatic form expiration and renewal prompts

---

### 3. Referral Tracking

Manage referral relationships and track patient sources.

**Functions:**
- Referring Provider Directory
- Referral Source Attribution
- Referral Acknowledgment Letters
- Progress Reports to Referrers
- Referral Analytics
- Specialist Network Management

**Key Features:**
- Automatic thank-you letters to referring dentists
- Treatment progress updates for referrers
- Referral conversion tracking
- Relationship strength scoring
- Top referrer identification and recognition

---

### 4. Records Requests

Handle incoming and outgoing patient records transfers.

**Functions:**
- Incoming Records Request Management
- Outgoing Records Preparation
- Authorization Verification
- Transfer Status Tracking
- Fee Management
- Compliance Monitoring

**Key Features:**
- Request tracking with status visibility
- Patient authorization verification workflow
- Secure transfer methods (encrypted email, portal, mail)
- Compliance with state timing regulations
- Fee tracking and billing integration

---

## Integration Points

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Booking & Scheduling | Consultation scheduling | Book new patient exams from leads |
| Patient Communications | Follow-up automation | Send nurture sequences to leads |
| Billing & Insurance | Insurance verification | Verify coverage during onboarding |
| Treatment Management | Treatment plans | Link accepted plans to onboarded patients |
| Imaging Management | Initial imaging | Capture consult photos and X-rays |
| Compliance & Documentation | Consent forms | Track signed consents |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| Web Forms | API/Webhook | Capture website leads |
| Twilio | SMS API | Lead follow-up texting |
| SendGrid/SES | Email API | Automated communications |
| DocuSign/HelloSign | E-Signature | Digital consent signing |
| Dental Referral Networks | API | Referral coordination |

---

## User Roles & Permissions

| Role | Lead Management | Intake Forms | Referrals | Records |
|------|-----------------|--------------|-----------|---------|
| Super Admin | Full | Full | Full | Full |
| Clinic Admin | Full | Full | Full | Full |
| Doctor | View | View | View | View |
| Clinical Staff | View | View | View | View |
| Front Desk | Edit | Full | Edit | Edit |
| Treatment Coordinator | Full | Full | Edit | View |
| Billing | View | View | View | View |
| Read Only | View | View | View | View |

### Special Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `lead:create` | Create new leads | front_desk, treatment_coordinator |
| `lead:assign` | Assign leads to coordinators | clinic_admin, treatment_coordinator |
| `lead:convert` | Convert lead to patient | treatment_coordinator, front_desk |
| `intake:configure` | Configure intake forms | clinic_admin |
| `intake:view_submissions` | View form submissions | all clinical roles |
| `referral:manage_providers` | Manage referring provider directory | clinic_admin |
| `referral:send_letters` | Send acknowledgment letters | front_desk, treatment_coordinator |
| `records:authorize` | Authorize records release | clinic_admin, doctor |
| `records:prepare` | Prepare outgoing records | front_desk |

---

## Data Models

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      Lead       │────▶│    LeadSource   │     │  LeadActivity   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               ▲
        │                                               │
        ▼                                               │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Prospect     │────▶│  Consultation   │────▶│    Patient      │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ ReferringProvider│────▶│    Referral    │────▶│    Patient      │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  IntakeFormTemplate│──▶│IntakeSubmission│────▶│    Patient      │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ RecordsRequest  │────▶│    Patient      │
└─────────────────┘     └─────────────────┘
```

### Key Models

| Model | Description |
|-------|-------------|
| `Lead` | Potential patient before conversion |
| `LeadSource` | Marketing channel or referral source |
| `LeadActivity` | Follow-up actions and communications |
| `ReferringProvider` | Dentist or specialist who refers patients |
| `Referral` | Individual patient referral record |
| `IntakeFormTemplate` | Reusable form template definitions |
| `IntakeSubmission` | Patient's completed form data |
| `RecordsRequest` | Incoming or outgoing records transfer |
| `PatientConsent` | Signed consent records |

---

## AI Features

| Feature | Sub-Area | Description |
|---------|----------|-------------|
| Lead Scoring | Lead Management | Predict conversion likelihood based on lead attributes |
| Optimal Contact Time | Lead Management | Suggest best times to follow up with leads |
| Form Completion Prediction | Intake Forms | Identify at-risk incomplete submissions |
| Referral Relationship Insights | Referral Tracking | Identify referral patterns and opportunities |
| OCR Records Extraction | Records Requests | Extract data from incoming paper records |
| Sentiment Analysis | Lead Management | Analyze lead communications for urgency/interest |

---

## Orthodontic-Specific Workflows

### Treatment Coordinator Journey

The treatment coordinator is central to converting consultations to active treatment:

```
Lead Created → Consultation Scheduled → New Patient Exam → Treatment Presentation
    ↓                   ↓                      ↓                    ↓
Phone/Web      Forms Sent Digitally    Imaging/Photos      Financial Options
Follow-up       Insurance Verified     Doctor Consult      Contract Signing
                Records Requested                          Payment Plan Setup
```

### New Patient Onboarding Checklist

1. **Pre-Consultation**
   - Lead captured and assigned
   - Consultation scheduled
   - Digital intake forms sent
   - Insurance verification initiated
   - Records requested from previous provider

2. **Consultation Day**
   - Forms completed/verified
   - Initial photos and X-rays
   - Doctor examination
   - Treatment options presented
   - Insurance benefits reviewed

3. **Treatment Presentation**
   - Treatment plan finalized
   - Cost estimate provided
   - Payment options presented
   - Financial agreement signed
   - First appointment scheduled

4. **Treatment Start**
   - All consents signed
   - Insurance pre-authorization (if needed)
   - Records from other providers received
   - Initial payment collected
   - Welcome materials provided

---

## Compliance Requirements

### HIPAA Compliance
- All lead and patient data treated as PHI
- Audit logging for all data access
- Secure transmission of intake forms
- Minimum necessary access principle

### Records Retention
- State-specific retention requirements for records
- Proper disposal procedures for declined patients
- Documentation of records transfer compliance

### Consent Requirements
- Age-appropriate consent (minors require guardian consent)
- Treatment consent separate from general consent
- Photo/imaging consent for marketing use
- Financial agreement requirements

---

## Implementation Notes

### Phase 3 Dependencies
- **Phase 1 Complete**: Auth, Staff, Resources
- **Phase 2 Complete**: Booking, Practice Orchestration, Patient Communications

### Implementation Order
1. Intake Forms (foundation for patient data collection)
2. Lead Management (track prospects entering the system)
3. Referral Tracking (capture referral source data)
4. Records Requests (complete the onboarding picture)

### Key Technical Decisions
- Use form builder with JSON schema for flexible intake forms
- Implement lead scoring with rule-based engine (AI enhancement later)
- Integrate with DocuSign for legally-binding e-signatures
- Build referral letter templates with merge fields

---

## File Structure

```
docs/areas/crm-onboarding/
├── README.md                      # This file (area overview)
└── sub-areas/
    ├── lead-management/
    │   ├── README.md
    │   └── functions/
    │       ├── lead-capture.md
    │       ├── lead-source-tracking.md
    │       ├── conversion-pipeline.md
    │       ├── coordinator-assignment.md
    │       ├── follow-up-management.md
    │       └── lead-analytics.md
    │
    ├── intake-forms/
    │   ├── README.md
    │   └── functions/
    │       ├── form-template-builder.md
    │       ├── patient-form-portal.md
    │       ├── medical-history.md
    │       ├── insurance-capture.md
    │       ├── consent-collection.md
    │       └── completion-tracking.md
    │
    ├── referral-tracking/
    │   ├── README.md
    │   └── functions/
    │       ├── provider-directory.md
    │       ├── referral-attribution.md
    │       ├── acknowledgment-letters.md
    │       ├── progress-reports.md
    │       ├── referral-analytics.md
    │       └── specialist-network.md
    │
    └── records-requests/
        ├── README.md
        └── functions/
            ├── incoming-requests.md
            ├── outgoing-preparation.md
            ├── authorization-verification.md
            ├── transfer-tracking.md
            ├── fee-management.md
            └── compliance-monitoring.md
```

---

## Related Documentation

- [Booking & Scheduling](../booking/) - Consultation scheduling
- [Patient Communications](../patient-communications/) - Lead nurture communications
- [Billing & Insurance](../billing-insurance/) - Financial onboarding
- [Treatment Management](../treatment-management/) - Treatment plan acceptance

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

**Status**: ✅ Complete (~95%)
**Last Updated**: 2024-12-10
**Owner**: Development Team
