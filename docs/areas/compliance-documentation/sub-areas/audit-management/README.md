# Audit Management

> **Area**: [Compliance & Documentation](../../)
>
> **Sub-Area**: 12.4 Audit Management
>
> **Purpose**: Maintain comprehensive audit trails, manage compliance audits, handle incident reporting, and enforce document retention

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [Compliance & Documentation](../../) |
| **Dependencies** | All Areas (audit logging is system-wide) |
| **Last Updated** | 2024-11-26 |

---

## Overview

Audit Management provides comprehensive tracking, logging, and reporting capabilities for regulatory compliance. This sub-area maintains system-wide audit trails, supports internal and external audit preparation, handles incident/deviation reporting, manages document retention policies, and generates compliance reports.

Healthcare practices like orthodontic offices must maintain detailed audit trails of all PHI (Protected Health Information) access, demonstrate compliance with HIPAA, OSHA, and state regulations, respond to regulatory audits, and properly retain and dispose of records. This system provides the tools to meet all audit and compliance requirements.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 12.4.1 | [System Audit Trail](./functions/system-audit-trail.md) | Comprehensive activity logging | 📋 Planned | Critical |
| 12.4.2 | [Compliance Self-Audit Tools](./functions/compliance-self-audit.md) | Internal audit checklists and tools | 📋 Planned | High |
| 12.4.3 | [Incident Reporting System](./functions/incident-reporting-system.md) | Report and track incidents | 📋 Planned | Critical |
| 12.4.4 | [Document Retention Management](./functions/document-retention-management.md) | Retention policies and archival | 📋 Planned | High |
| 12.4.5 | [Regulatory Reporting](./functions/regulatory-reporting.md) | Generate regulatory compliance reports | 📋 Planned | Medium |
| 12.4.6 | [Audit Preparation Workflows](./functions/audit-preparation-workflows.md) | Prepare for external audits | 📋 Planned | Medium |

---

## Function Details

### 12.4.1 System Audit Trail

**Purpose**: Maintain comprehensive, immutable audit logs of all system activity, particularly PHI access.

**Key Capabilities**:
- Automatic activity logging
- PHI access tracking
- User action recording
- System event logging
- Log immutability (append-only)
- Log search and filtering
- Log export for auditors
- Anomaly detection
- Access pattern analysis

**User Stories**:
- As a **compliance officer**, I want to see who accessed a patient's records
- As an **auditor**, I want to export all access logs for a specific time period
- As a **clinic admin**, I want alerts for unusual access patterns

**Audit Event Categories**:
| Category | Events Logged |
|----------|--------------|
| Authentication | Login, logout, failed attempts, password changes |
| Patient Records | View, create, update, delete, print, export |
| Financial Data | Payment processing, billing changes, refunds |
| Clinical Data | Treatment notes, prescriptions, imaging access |
| Consent | Consent collection, viewing, revocation |
| Admin Actions | User management, settings changes, role changes |
| System | Data exports, backups, integrations |

**HIPAA Audit Requirements**:
- Who accessed PHI (user identification)
- What PHI was accessed (patient, record type)
- When access occurred (timestamp)
- Where access occurred (IP, device)
- What action was performed (view, edit, print)
- Why access occurred (if captured - appointment context)

---

### 12.4.2 Compliance Self-Audit Tools

**Purpose**: Provide tools for internal compliance assessments and self-audits.

**Key Capabilities**:
- Self-audit checklist templates
- Audit scheduling and tracking
- Finding documentation
- Corrective action tracking
- Compliance scoring
- Gap analysis
- Trend reporting
- Benchmark comparisons

**User Stories**:
- As a **compliance officer**, I want to conduct quarterly HIPAA self-audits
- As a **clinic admin**, I want to track corrective actions from audit findings
- As an **auditor**, I want to see historical audit scores and trends

**Self-Audit Checklists**:

**HIPAA Privacy Self-Audit**:
- [ ] Notice of Privacy Practices posted and provided
- [ ] Patient rights procedures in place (access, amendment)
- [ ] Minimum necessary policies documented
- [ ] Business Associate Agreements current
- [ ] Privacy training documented for all staff
- [ ] Privacy complaints process in place
- [ ] PHI disclosure log maintained

**HIPAA Security Self-Audit**:
- [ ] Risk assessment completed within 12 months
- [ ] Security policies documented and current
- [ ] Access controls implemented and reviewed
- [ ] Audit logs enabled and reviewed
- [ ] Encryption at rest and in transit
- [ ] Workstation security controls
- [ ] Contingency plan tested
- [ ] Security training documented

**OSHA Self-Audit**:
- [ ] Exposure Control Plan current
- [ ] Hepatitis B vaccination offered
- [ ] Training records current
- [ ] Engineering controls in place
- [ ] PPE available and used
- [ ] Sharps disposal compliant
- [ ] Hazard communication program
- [ ] SDS sheets available

---

### 12.4.3 Incident Reporting System

**Purpose**: Document, track, and resolve compliance incidents, safety events, and protocol deviations.

**Key Capabilities**:
- Incident report submission
- Incident categorization
- Investigation workflow
- Corrective action assignment
- Root cause analysis
- Incident trending
- Regulatory notification triggers
- Near-miss reporting
- Anonymous reporting option

**User Stories**:
- As a **clinical staff**, I want to report a needle stick incident
- As a **clinic admin**, I want to investigate and document incident resolution
- As a **compliance officer**, I want to identify incident trends

**Incident Categories**:
| Category | Examples | Reporting Required |
|----------|----------|-------------------|
| Clinical | Patient injury, treatment error, wrong tooth | Internal + possible external |
| Safety | Needle stick, chemical exposure, slip/fall | OSHA log, possible workers comp |
| Privacy/Security | PHI breach, unauthorized access, lost device | HIPAA breach assessment |
| Equipment | Equipment failure, malfunction | Internal documentation |
| Protocol Deviation | Sterilization failure, missed safety check | Internal review |
| Patient Complaint | Service complaint, billing dispute | Internal documentation |

**Incident Severity Levels**:
| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| Critical | Serious injury, major breach | Immediate | Admin + legal |
| High | Moderate injury, potential breach | 24 hours | Admin |
| Medium | Minor injury, protocol deviation | 48 hours | Supervisor |
| Low | Near-miss, minor deviation | 1 week | Manager |

**HIPAA Breach Assessment**:
When a potential PHI breach is reported:
1. Determine if PHI was involved
2. Assess if it was acquired/accessed
3. Determine if it was unsecured (unencrypted)
4. Assess probability of compromise
5. Document breach assessment
6. Determine notification requirements
7. Report to HHS if > 500 individuals affected

---

### 12.4.4 Document Retention Management

**Purpose**: Enforce document retention policies and manage record lifecycle including archival and destruction.

**Key Capabilities**:
- Retention policy configuration
- Automatic retention period tracking
- Archive management
- Destruction scheduling
- Legal hold management
- Retention compliance reporting
- Destruction certification
- Policy exception handling

**User Stories**:
- As a **compliance officer**, I want to ensure records are retained per legal requirements
- As a **clinic admin**, I want to archive old patient records appropriately
- As a **legal counsel**, I want to place a litigation hold on relevant records

**Retention Requirements**:
| Record Type | Retention Period | Legal Basis |
|-------------|-----------------|-------------|
| Adult Patient Records | 7 years from last treatment | State law varies |
| Minor Patient Records | Age 21 + 7 years | State law varies |
| Financial Records | 7 years | IRS requirements |
| Employment Records | 7 years post-termination | Various |
| OSHA Exposure Records | 30 years | OSHA 29 CFR 1910.1020 |
| X-ray/Imaging | Same as patient records | State law |
| Insurance Claims | 7 years | Payer requirements |
| Consent Forms | Duration of treatment + 7 years | Best practice |
| Audit Logs | 7 years minimum | HIPAA |

**Retention Workflow**:
1. **Active**: Records in active use
2. **Archived**: Past retention minimum, in archive storage
3. **Pending Destruction**: Scheduled for secure destruction
4. **Destroyed**: Destruction completed and certified
5. **Legal Hold**: Exempt from destruction (litigation)

---

### 12.4.5 Regulatory Reporting

**Purpose**: Generate and submit required regulatory reports and compliance documentation.

**Key Capabilities**:
- HIPAA compliance reports
- OSHA compliance reports
- State board reports
- Breach notification reports
- Incident reports for regulators
- Exposure tracking reports
- Custom report builder
- Report scheduling and automation

**User Stories**:
- As a **compliance officer**, I want to generate annual HIPAA compliance documentation
- As a **clinic admin**, I want to submit required OSHA injury logs
- As an **office manager**, I want proof of compliance for accreditation

**Standard Reports**:
| Report | Frequency | Recipient |
|--------|-----------|-----------|
| HIPAA Risk Assessment | Annual | Internal |
| HIPAA Compliance Summary | Annual | Internal/Auditors |
| OSHA 300 Log | Annual (Feb posting) | OSHA/Internal |
| OSHA 300A Summary | Annual | Posted/OSHA |
| State Board Compliance | Per state requirements | State Board |
| Breach Notification | As needed | HHS/Patients |
| Staff Training Summary | Annual | Internal/Auditors |

---

### 12.4.6 Audit Preparation Workflows

**Purpose**: Streamline preparation for external regulatory audits and inspections.

**Key Capabilities**:
- Audit type templates (HIPAA, OSHA, state board)
- Document collection checklists
- Pre-audit readiness assessment
- Document staging area
- Auditor access provisioning
- Audit response tracking
- Post-audit action plans
- Audit history tracking

**User Stories**:
- As a **clinic admin**, I want to prepare for a scheduled state board inspection
- As a **compliance officer**, I want a checklist of documents needed for a HIPAA audit
- As a **consultant**, I want to track audit findings and corrective actions

**Audit Types**:
| Audit Type | Frequency | Scope |
|------------|-----------|-------|
| HIPAA OCR Audit | Random/complaint | Privacy, security, breach |
| State Dental Board | Periodic/random | License, facilities, records |
| OSHA Inspection | Complaint-driven | Safety, training, exposure |
| Insurance Audit | Periodic | Claims, documentation |
| Internal Compliance | Annual | All compliance areas |

**Audit Preparation Checklist**:

**General Preparation**:
- [ ] Designate audit coordinator
- [ ] Review audit scope and timeline
- [ ] Gather requested documentation
- [ ] Prepare conference room/space
- [ ] Brief staff on audit process
- [ ] Review recent incidents/findings

**Documentation Assembly**:
- [ ] Policies and procedures
- [ ] Training records
- [ ] Certification documents
- [ ] Audit logs (requested period)
- [ ] Incident reports
- [ ] Previous audit responses
- [ ] Self-audit results

---

## Data Model

```prisma
model AuditEntry {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Event identification
  eventId       String   @unique  // UUID for event tracking
  eventType     AuditEventType
  eventCategory AuditCategory
  severity      AuditSeverity @default(INFO)

  // Actor
  userId        String?  @db.ObjectId
  userName      String?
  userRole      String?
  systemActor   String?  // For automated actions

  // Action
  action        String   // e.g., "VIEW", "UPDATE", "DELETE"
  description   String

  // Target
  entityType    String?  // e.g., "Patient", "Appointment"
  entityId      String?  @db.ObjectId
  entityName    String?  // Human-readable name

  // PHI indicator
  involvesPHI   Boolean  @default(false)
  phiTypes      String[] // Types of PHI accessed

  // Context
  ipAddress     String?
  userAgent     String?
  deviceType    String?
  sessionId     String?
  requestPath   String?
  appointmentId String?  @db.ObjectId  // If action related to appointment

  // Change details (for updates)
  previousValue Json?
  newValue      Json?
  changedFields String[]

  // Result
  success       Boolean  @default(true)
  errorMessage  String?

  // Timestamp (immutable)
  timestamp     DateTime @default(now())

  // Note: No updatedAt - audit entries are immutable

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  // Indexes for common queries
  @@index([clinicId])
  @@index([userId])
  @@index([entityType, entityId])
  @@index([timestamp])
  @@index([eventType])
  @@index([eventCategory])
  @@index([involvesPHI])
}

enum AuditEventType {
  // Authentication
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PASSWORD_CHANGE
  SESSION_TIMEOUT

  // Patient records
  PATIENT_VIEW
  PATIENT_CREATE
  PATIENT_UPDATE
  PATIENT_DELETE
  PATIENT_EXPORT
  PATIENT_PRINT

  // Clinical
  TREATMENT_VIEW
  TREATMENT_UPDATE
  NOTE_CREATE
  NOTE_UPDATE
  IMAGING_VIEW
  IMAGING_UPLOAD

  // Financial
  PAYMENT_PROCESS
  REFUND_PROCESS
  BILLING_UPDATE
  STATEMENT_GENERATE

  // Consent
  CONSENT_VIEW
  CONSENT_COLLECT
  CONSENT_REVOKE

  // Admin
  USER_CREATE
  USER_UPDATE
  USER_DEACTIVATE
  ROLE_CHANGE
  SETTINGS_CHANGE
  PERMISSION_CHANGE

  // System
  DATA_EXPORT
  BACKUP_CREATE
  INTEGRATION_SYNC
  REPORT_GENERATE

  // Compliance
  INCIDENT_REPORT
  AUDIT_ACCESS
  RETENTION_ACTION
}

enum AuditCategory {
  AUTHENTICATION
  PATIENT_RECORD
  CLINICAL
  FINANCIAL
  CONSENT
  ADMINISTRATIVE
  SYSTEM
  COMPLIANCE
}

enum AuditSeverity {
  DEBUG
  INFO
  WARNING
  ERROR
  CRITICAL
}

model Incident {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Incident identification
  incidentNumber String  @unique  // e.g., "INC-2024-0001"
  category      IncidentCategory
  subcategory   String?
  severity      IncidentSeverity

  // Occurrence details
  occurredAt    DateTime
  discoveredAt  DateTime
  reportedAt    DateTime @default(now())
  location      String?

  // People involved
  reportedBy    String   @db.ObjectId
  reportedByName String
  involvedPatientId String? @db.ObjectId
  involvedStaffIds String[] @db.ObjectId
  witnessNames  String[]

  // Description
  title         String
  description   String
  immediateActions String?

  // HIPAA breach assessment (if applicable)
  isPHIInvolved Boolean  @default(false)
  isBreachConfirmed Boolean?
  breachAssessment Json?  // Detailed breach analysis
  affectedIndividuals Int?
  notificationRequired Boolean?
  notificationSentAt DateTime?

  // Investigation
  status        IncidentStatus @default(REPORTED)
  investigatorId String?  @db.ObjectId
  investigatorName String?
  investigationStarted DateTime?
  investigationNotes String?
  rootCause     String?
  rootCauseCategory String?

  // Resolution
  resolution    String?
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  // Follow-up
  correctiveActions Json?  // Array of corrective action items
  preventiveMeasures String?
  lessonLearned String?

  // External reporting
  reportedToOSHA Boolean  @default(false)
  reportedToHHS Boolean   @default(false)
  reportedToState Boolean @default(false)
  externalReportDate DateTime?
  externalReportRef String?

  // Documentation
  attachments   String[] // Document URLs
  photos        String[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  actions   IncidentAction[]

  @@index([clinicId])
  @@index([category])
  @@index([severity])
  @@index([status])
  @@index([occurredAt])
  @@index([isPHIInvolved])
}

enum IncidentCategory {
  CLINICAL
  SAFETY
  PRIVACY_SECURITY
  EQUIPMENT
  PROTOCOL_DEVIATION
  PATIENT_COMPLAINT
  STAFF_ISSUE
  OTHER
}

enum IncidentSeverity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum IncidentStatus {
  REPORTED
  UNDER_INVESTIGATION
  PENDING_CORRECTIVE_ACTION
  CORRECTIVE_ACTION_IN_PROGRESS
  RESOLVED
  CLOSED
}

model IncidentAction {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  incidentId    String   @db.ObjectId

  // Action details
  actionType    ActionType
  description   String
  priority      String   // "High", "Medium", "Low"

  // Assignment
  assignedTo    String   @db.ObjectId
  assignedToName String
  assignedBy    String   @db.ObjectId
  assignedAt    DateTime @default(now())
  dueDate       DateTime

  // Completion
  status        ActionStatus @default(PENDING)
  completedAt   DateTime?
  completedBy   String?  @db.ObjectId
  completionNotes String?

  // Verification
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId
  verificationNotes String?

  // Relations
  incident  Incident @relation(fields: [incidentId], references: [id])

  @@index([incidentId])
  @@index([assignedTo])
  @@index([status])
  @@index([dueDate])
}

enum ActionType {
  IMMEDIATE
  CORRECTIVE
  PREVENTIVE
  TRAINING
  POLICY_UPDATE
  NOTIFICATION
  DOCUMENTATION
  OTHER
}

enum ActionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  VERIFIED
  OVERDUE
  CANCELLED
}

model ComplianceAudit {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Audit identification
  auditNumber   String   @unique
  auditType     ComplianceAuditType
  auditName     String

  // Schedule
  scheduledDate DateTime
  startedAt     DateTime?
  completedAt   DateTime?

  // Scope
  scope         String   // Description of audit scope
  checklistId   String?  @db.ObjectId  // Reference to audit checklist template
  checklistItems Json    // Array of checklist items with results

  // Results
  status        ComplianceAuditStatus @default(SCHEDULED)
  overallScore  Decimal?
  passRate      Decimal?
  findings      Json?    // Array of findings
  criticalFindings Int   @default(0)
  majorFindings Int      @default(0)
  minorFindings Int      @default(0)

  // Audit team
  leadAuditorId String?  @db.ObjectId
  leadAuditorName String?
  auditorNotes  String?

  // Corrective actions
  correctiveActionPlan Json?
  capDueDate    DateTime?
  capStatus     String?

  // Documentation
  reportUrl     String?
  attachments   String[]

  // For external audits
  isExternal    Boolean  @default(false)
  externalAuditor String?
  externalOrg   String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([auditType])
  @@index([status])
  @@index([scheduledDate])
}

enum ComplianceAuditType {
  HIPAA_PRIVACY
  HIPAA_SECURITY
  OSHA
  STATE_BOARD
  INFECTION_CONTROL
  RADIATION_SAFETY
  INTERNAL_COMPREHENSIVE
  EXTERNAL_REGULATORY
  INSURANCE
  CUSTOM
}

enum ComplianceAuditStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model RetentionPolicy {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Policy definition
  name          String
  code          String   @unique
  recordType    String   // e.g., "Patient Records", "Financial Records"
  description   String?

  // Retention rules
  retentionPeriodYears Int
  retentionBasis String   // "Last Activity", "Creation Date", etc.
  specialRules  String?  // e.g., "Minor: Age 21 + 7 years"

  // Actions
  archiveAfterYears Int?
  destructionMethod String  // "Secure shred", "Digital wipe", etc.

  // Status
  isActive      Boolean  @default(true)

  // Legal basis
  legalRequirement String?
  regulatorySource String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([recordType])
}

model RetentionAction {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Action details
  actionType    RetentionActionType
  recordType    String
  recordCount   Int

  // Execution
  scheduledDate DateTime
  executedAt    DateTime?
  executedBy    String?  @db.ObjectId

  // Status
  status        RetentionActionStatus @default(PENDING)

  // For destruction
  destructionMethod String?
  destructionCertUrl String?
  witnessName   String?
  witnessSignature String?

  // Documentation
  notes         String?
  affectedRecordIds String[]

  // Legal hold check
  legalHoldCleared Boolean @default(false)
  legalHoldClearedBy String? @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([actionType])
  @@index([status])
  @@index([scheduledDate])
}

enum RetentionActionType {
  ARCHIVE
  DESTRUCTION
  LEGAL_HOLD
  RELEASE_HOLD
}

enum RetentionActionStatus {
  PENDING
  APPROVED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model LegalHold {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Hold details
  holdName      String
  holdReason    String   // e.g., "Litigation", "Regulatory investigation"
  matterReference String?  // Case number, matter ID

  // Scope
  recordTypes   String[] // Types of records on hold
  patientIds    String[] @db.ObjectId  // Specific patients if applicable
  dateRangeStart DateTime?
  dateRangeEnd  DateTime?

  // Status
  status        LegalHoldStatus @default(ACTIVE)
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId
  releasedAt    DateTime?
  releasedBy    String?  @db.ObjectId
  releaseReason String?

  // Notifications
  custodians    String[] // Staff notified of hold
  notifiedAt    DateTime?

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([status])
}

enum LegalHoldStatus {
  ACTIVE
  RELEASED
  EXPIRED
}
```

---

## API Endpoints

### Audit Trail

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/audit/logs` | Query audit logs | `audit:view_full` |
| GET | `/api/compliance/audit/logs/:entityType/:entityId` | Get entity audit history | `audit:view_full` |
| GET | `/api/compliance/audit/logs/patient/:patientId` | Get patient access history | `audit:view_full` |
| GET | `/api/compliance/audit/logs/user/:userId` | Get user activity history | `audit:view_full` |
| POST | `/api/compliance/audit/export` | Export audit logs | `audit:export` |

### Incidents

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/incidents` | List incidents | `incident:read` |
| GET | `/api/compliance/incidents/:id` | Get incident details | `incident:read` |
| POST | `/api/compliance/incidents` | Report incident | `incident:report` |
| PUT | `/api/compliance/incidents/:id` | Update incident | `incident:manage` |
| POST | `/api/compliance/incidents/:id/investigate` | Start investigation | `incident:manage` |
| POST | `/api/compliance/incidents/:id/resolve` | Resolve incident | `incident:manage` |
| POST | `/api/compliance/incidents/:id/actions` | Add corrective action | `incident:manage` |
| PUT | `/api/compliance/incidents/:id/actions/:actionId` | Update action | `incident:manage` |

### Compliance Audits

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/audits` | List audits | `audit:view_full` |
| POST | `/api/compliance/audits` | Schedule audit | `audit:manage` |
| GET | `/api/compliance/audits/:id` | Get audit details | `audit:view_full` |
| PUT | `/api/compliance/audits/:id` | Update audit | `audit:manage` |
| POST | `/api/compliance/audits/:id/start` | Start audit | `audit:manage` |
| POST | `/api/compliance/audits/:id/complete` | Complete audit | `audit:manage` |
| GET | `/api/compliance/audits/checklists` | Get audit checklists | `audit:view_full` |

### Retention

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/retention/policies` | List retention policies | `audit:view_full` |
| POST | `/api/compliance/retention/policies` | Create policy | `audit:manage` |
| GET | `/api/compliance/retention/actions` | List retention actions | `audit:view_full` |
| POST | `/api/compliance/retention/actions` | Schedule retention action | `audit:manage` |
| POST | `/api/compliance/retention/legal-holds` | Create legal hold | `audit:manage` |
| PUT | `/api/compliance/retention/legal-holds/:id` | Update legal hold | `audit:manage` |
| POST | `/api/compliance/retention/legal-holds/:id/release` | Release hold | `audit:manage` |

### Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/reports/access-summary` | PHI access summary | `audit:view_full` |
| GET | `/api/compliance/reports/incident-summary` | Incident summary report | `audit:view_full` |
| GET | `/api/compliance/reports/compliance-status` | Overall compliance status | `audit:view_full` |
| POST | `/api/compliance/reports/generate` | Generate custom report | `audit:export` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `AuditLogViewer` | Browse and search audit logs | `components/compliance/` |
| `AuditLogExporter` | Export audit logs | `components/compliance/` |
| `AuditTrailTimeline` | Timeline view of entity changes | `components/compliance/` |
| `IncidentReportForm` | Submit incident report | `components/compliance/` |
| `IncidentList` | List and filter incidents | `components/compliance/` |
| `IncidentDetail` | View incident details | `components/compliance/` |
| `IncidentInvestigation` | Investigation workflow | `components/compliance/` |
| `CorrectiveActionTracker` | Track corrective actions | `components/compliance/` |
| `ComplianceAuditScheduler` | Schedule audits | `components/compliance/` |
| `AuditChecklist` | Execute audit checklist | `components/compliance/` |
| `AuditFindingsForm` | Document audit findings | `components/compliance/` |
| `RetentionDashboard` | Retention status overview | `components/compliance/` |
| `LegalHoldManager` | Manage legal holds | `components/compliance/` |
| `ComplianceScorecard` | Overall compliance metrics | `components/compliance/` |
| `AuditPreparationWizard` | Guide audit preparation | `components/compliance/` |

---

## Business Rules

1. **Audit Immutability**: Audit log entries cannot be modified or deleted
2. **PHI Access Logging**: All PHI access must be logged with user, time, and context
3. **Incident Response**: Critical incidents require immediate response and escalation
4. **Breach Assessment**: All potential PHI breaches require formal assessment
5. **Retention Enforcement**: Records must be retained for required periods
6. **Legal Hold Priority**: Legal holds supersede retention policies
7. **Destruction Certification**: Record destruction requires documentation and witness
8. **Audit Scheduling**: Internal audits must be conducted at required intervals

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| All Areas | Integration | Audit logging integration |
| Auth & User Management | Required | User identification for logging |
| Patient Management | Required | Patient record identification |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Log Storage | Required | Immutable log storage |
| Document Storage | Required | Audit documentation |
| Notification Service | Required | Incident alerts |

---

## Security Requirements

### Access Control
- **View audit logs**: clinic_admin, super_admin, compliance officer
- **Export audit logs**: clinic_admin, super_admin
- **Report incidents**: All staff
- **Manage incidents**: clinic_admin, compliance officer
- **Manage retention**: clinic_admin, super_admin

### Audit Requirements
- Audit logs must be immutable (append-only)
- Audit access must itself be logged
- Export operations must be tracked
- Incident reports cannot be deleted

### Data Protection
- Audit logs encrypted at rest
- Long-term log retention (7+ years)
- Secure backup of audit data
- Tamper-evident storage

---

## Related Documentation

- [Parent: Compliance & Documentation](../../)
- [Consent Forms](../consent-forms/)
- [Clinical Protocols](../clinical-protocols/)
- [Staff Training](../staff-training/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
