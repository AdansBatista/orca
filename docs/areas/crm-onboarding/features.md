# CRM & Patient Onboarding - Features

> **Area**: CRM & Onboarding
>
> **Purpose**: Comprehensive feature list for patient acquisition and onboarding

---

## Feature Overview

| Sub-Area | Functions | Status |
|----------|-----------|--------|
| Lead Management | 6 | 📋 Planned |
| Intake Forms | 6 | 📋 Planned |
| Referral Tracking | 6 | 📋 Planned |
| Records Requests | 6 | 📋 Planned |
| **Total** | **24** | |

---

## 8.1 Lead Management

Manage the patient acquisition pipeline from initial inquiry through conversion.

### 8.1.1 Lead Capture & Entry
Capture lead information from all acquisition channels into a unified system.

**Features:**
- Web form integration with automatic lead creation
- Phone call logging with caller ID integration
- Walk-in quick registration
- Referral entry with source attribution
- Social media lead import
- Manual entry for events/business cards
- Duplicate detection and merging

**Details:** [Lead Capture](./sub-areas/lead-management/functions/lead-capture.md)

---

### 8.1.2 Lead Source Tracking
Track where leads come from to measure marketing effectiveness.

**Features:**
- Customizable lead source categories
- Source attribution at lead creation
- Multi-touch attribution support
- Cost tracking per source for ROI calculation
- Campaign tracking integration
- Source performance comparison

**Details:** [Lead Source Tracking](./sub-areas/lead-management/functions/lead-source-tracking.md)

---

### 8.1.3 Conversion Pipeline
Visualize and manage leads through conversion stages to treatment start.

**Features:**
- Visual Kanban-style pipeline board
- Customizable pipeline stages
- Stage-based automation triggers
- Time-in-stage tracking
- Bottleneck identification
- Stage conversion rate analytics
- Lost reason tracking

**Details:** [Conversion Pipeline](./sub-areas/lead-management/functions/conversion-pipeline.md)

---

### 8.1.4 Coordinator Assignment
Assign leads to treatment coordinators and balance workload.

**Features:**
- Manual and automatic assignment
- Round-robin distribution
- Capacity-based assignment
- Workload visibility dashboard
- Reassignment with history
- Out-of-office handling

**Details:** [Coordinator Assignment](./sub-areas/lead-management/functions/coordinator-assignment.md)

---

### 8.1.5 Follow-up Management
Ensure timely follow-up with leads through task management and automation.

**Features:**
- Follow-up task creation with due dates
- Automated task generation by stage
- Multi-channel reminders (in-app, email, SMS)
- Task templates for common follow-ups
- Overdue task escalation
- Comprehensive activity logging

**Details:** [Follow-up Management](./sub-areas/lead-management/functions/follow-up-management.md)

---

### 8.1.6 Lead Analytics
Measure and analyze lead performance for business optimization.

**Features:**
- Conversion funnel visualization
- Source performance comparison
- Coordinator performance metrics
- Time-to-conversion analysis
- Lead velocity tracking
- Lost reason analysis
- Marketing ROI reports

**Details:** [Lead Analytics](./sub-areas/lead-management/functions/lead-analytics.md)

---

## 8.2 Intake Forms

Digital patient intake replacing paper forms with smart data collection.

### 8.2.1 Form Template Builder
Create and customize intake form templates for different patient scenarios.

**Features:**
- Drag-and-drop form builder
- Multiple field types (text, select, date, signature, upload)
- Conditional logic (show/hide based on answers)
- Form sections with progress indicators
- Template versioning with change tracking
- Clone and modify existing templates
- Preview mode for testing

**Details:** [Form Template Builder](./sub-areas/intake-forms/functions/form-template-builder.md)

---

### 8.2.2 Patient Form Portal
Secure, user-friendly interface for patients/parents to complete intake forms.

**Features:**
- Mobile-responsive design
- Secure access via unique link or portal login
- Save progress and continue later
- Real-time validation with clear errors
- Multi-language support (English, French, Spanish)
- Accessibility compliance (WCAG 2.1 AA)
- Confirmation and receipt after completion

**Details:** [Patient Form Portal](./sub-areas/intake-forms/functions/patient-form-portal.md)

---

### 8.2.3 Medical History Collection
Capture comprehensive medical and dental history relevant to orthodontic treatment.

**Features:**
- Structured medical history questionnaire
- Dental history specific to orthodontics
- Medication list with dosages
- Allergy documentation with severity levels
- Previous orthodontic treatment history
- Family dental history
- Growth/development history for minors

**Details:** [Medical History](./sub-areas/intake-forms/functions/medical-history.md)

---

### 8.2.4 Insurance Information Capture
Collect insurance information and documentation for verification and billing.

**Features:**
- Subscriber and patient information fields
- Insurance card image upload (front and back)
- Primary and secondary insurance support
- Employer information for group plans
- OCR extraction from card images
- Integration with eligibility verification

**Details:** [Insurance Capture](./sub-areas/intake-forms/functions/insurance-capture.md)

---

### 8.2.5 Consent Form Management
Collect legally-binding digital signatures on required consent forms.

**Features:**
- Digital signature capture (finger, stylus, mouse)
- Multiple signature types (patient, guardian, witness)
- Timestamp and IP logging for legal validity
- PDF generation with embedded signatures
- Consent expiration tracking
- Re-consent workflows for expiring consents
- Minor/guardian consent handling

**Details:** [Consent Collection](./sub-areas/intake-forms/functions/consent-collection.md)

---

### 8.2.6 Completion Tracking
Monitor form completion status and ensure all required forms are complete.

**Features:**
- Dashboard of pending/incomplete forms
- Automatic reminders (email and SMS)
- Completion status by patient and form type
- Due date tracking relative to appointments
- Escalation for incomplete forms
- Batch reminder sending
- Integration with appointment workflow

**Details:** [Completion Tracking](./sub-areas/intake-forms/functions/completion-tracking.md)

---

## 8.3 Referral Tracking

Manage referral relationships and track patient sources.

### 8.3.1 Referring Provider Directory
Maintain a comprehensive database of referring dental providers and specialists.

**Features:**
- Provider profile management
- Practice and contact information
- Relationship history and notes
- Communication preferences
- Portal access management
- Import from dental directories

**Details:** [Provider Directory](./sub-areas/referral-tracking/functions/provider-directory.md)

---

### 8.3.2 Referral Source Attribution
Track the referral source for every new patient for accurate attribution.

**Features:**
- Referral source capture at patient creation
- Link to specific provider or patient
- Multiple referral type support
- First-touch vs. last-touch attribution
- Unknown/walk-in handling
- Lead-to-patient referral continuity

**Details:** [Referral Attribution](./sub-areas/referral-tracking/functions/referral-attribution.md)

---

### 8.3.3 Acknowledgment Letters
Automatically generate and send thank-you letters to referral sources.

**Features:**
- Template-based letter generation
- Automatic trigger on new patient referral
- Personalization with merge fields
- Multiple delivery methods (print, email, fax, portal)
- Letter queue management
- Batch printing for mailing
- Letter history tracking

**Details:** [Acknowledgment Letters](./sub-areas/referral-tracking/functions/acknowledgment-letters.md)

---

### 8.3.4 Progress Reports
Keep referring dentists informed about their referred patients' treatment progress.

**Features:**
- Scheduled progress reports (quarterly, annually)
- Milestone-triggered reports
- Customizable report templates
- Optional clinical images inclusion
- Multiple delivery methods
- Opt-out management for providers
- Batch report generation

**Details:** [Progress Reports](./sub-areas/referral-tracking/functions/progress-reports.md)

---

### 8.3.5 Referral Analytics
Measure referral performance and identify opportunities for growth.

**Features:**
- Referral volume tracking by source
- Conversion rate by referrer
- Referral value calculation
- Top referrer rankings
- Trend analysis
- New and dormant referrer detection
- Executive reporting

**Details:** [Referral Analytics](./sub-areas/referral-tracking/functions/referral-analytics.md)

---

### 8.3.6 Specialist Network
Manage outbound referrals to specialists and track their outcomes.

**Features:**
- Specialist directory management
- Referral letter generation
- Outbound referral tracking
- Appointment status tracking
- Report/note receipt logging
- Outcome documentation
- Specialist feedback collection

**Details:** [Specialist Network](./sub-areas/referral-tracking/functions/specialist-network.md)

---

## 8.4 Records Requests

Handle incoming and outgoing patient records transfers.

### 8.4.1 Incoming Records Management
Request and receive patient records from previous providers for new patients.

**Features:**
- Records request creation
- Standardized request letter generation
- Request status tracking
- Follow-up reminder system
- Receipt logging
- Integration with patient documents
- Provider directory integration

**Details:** [Incoming Requests](./sub-areas/records-requests/functions/incoming-requests.md)

---

### 8.4.2 Outgoing Records Preparation
Compile and prepare patient records for release to other providers.

**Features:**
- Request intake and logging
- Document identification and compilation
- Quality review workflow
- Preparation time tracking
- Multiple delivery methods
- Package tracking

**Details:** [Outgoing Preparation](./sub-areas/records-requests/functions/outgoing-preparation.md)

---

### 8.4.3 Authorization Verification
Verify proper patient consent before releasing any protected health information.

**Features:**
- Authorization form validation
- Signature verification
- Expiration checking
- Requesting party verification
- Audit trail documentation
- Minor patient authorization handling
- Revocation tracking

**Details:** [Authorization Verification](./sub-areas/records-requests/functions/authorization-verification.md)

---

### 8.4.4 Transfer Status Tracking
Track the complete lifecycle of records requests from initiation to completion.

**Features:**
- Visual dashboard of active requests
- Status tracking with timestamps
- Automatic status updates
- Reminder and escalation system
- Request history per patient
- Performance metrics

**Details:** [Transfer Tracking](./sub-areas/records-requests/functions/transfer-tracking.md)

---

### 8.4.5 Fee Management
Handle billing and collection of records preparation fees where applicable.

**Features:**
- Configurable fee schedule
- Fee calculation based on record type/volume
- Fee invoice generation
- Payment status tracking
- Fee waiver handling
- State regulation compliance
- Billing integration

**Details:** [Fee Management](./sub-areas/records-requests/functions/fee-management.md)

---

### 8.4.6 Compliance Monitoring
Ensure all records requests comply with applicable regulations.

**Features:**
- State-specific timing requirements
- HIPAA minimum necessary standard
- Authorization expiration monitoring
- Audit trail maintenance
- Compliance reporting
- Deadline alerts
- Breach prevention

**Details:** [Compliance Monitoring](./sub-areas/records-requests/functions/compliance-monitoring.md)

---

## Integration Points

### Internal Integrations

| Area | Integration | Features Affected |
|------|-------------|-------------------|
| Booking & Scheduling | Consultation scheduling | Lead Management |
| Patient Communications | Automated follow-ups | Lead Management, Intake Forms |
| Billing & Insurance | Verification, fees | Intake Forms, Records Requests |
| Treatment Management | Plan acceptance | Lead Management |
| Imaging Management | Initial imaging | Intake Forms |
| Compliance | Consent tracking | Intake Forms, Records Requests |

### External Integrations

| System | Integration | Features Affected |
|--------|-------------|-------------------|
| Web Forms | Lead capture | Lead Management |
| Twilio | SMS communications | All sub-areas |
| SendGrid/SES | Email delivery | All sub-areas |
| DocuSign/HelloSign | E-signatures | Intake Forms |
| Fax Services | Letter/records delivery | Referral Tracking, Records Requests |

---

## AI Features

| Feature | Sub-Area | Purpose |
|---------|----------|---------|
| Lead Scoring | Lead Management | Predict conversion likelihood |
| Optimal Contact Time | Lead Management | Suggest best follow-up times |
| Form Completion Prediction | Intake Forms | Identify at-risk submissions |
| Insurance Card OCR | Intake Forms | Extract card data |
| Referral Relationship Insights | Referral Tracking | Identify patterns and opportunities |
| Records Completeness Check | Records Requests | Verify package contents |

---

## Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Planned | 📋 | Documented, not started |
| In Progress | 🔄 | Currently being implemented |
| Review | 👀 | Under review |
| Testing | �� | In testing |
| Completed | ✅ | Fully implemented |

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Total Functions**: 24
