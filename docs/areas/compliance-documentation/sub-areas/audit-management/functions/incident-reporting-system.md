# Incident Reporting System

> **Sub-Area**: [Audit Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

The Incident Reporting System provides structured capture, investigation, and resolution tracking for compliance incidents, safety events, and protocol deviations. It supports categorization by incident type (clinical, safety, privacy, equipment), severity-based escalation, root cause analysis, corrective action management, and regulatory notification triggers for reportable events.

---

## Core Requirements

- [ ] Capture incident reports with standardized categorization
- [ ] Classify incidents by severity (critical, high, medium, low)
- [ ] Implement investigation workflows with assignment tracking
- [ ] Track corrective and preventive actions to completion
- [ ] Support root cause analysis documentation
- [ ] Trigger regulatory notifications for reportable events
- [ ] Provide trend analysis for incident patterns
- [ ] Support anonymous reporting option

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/incidents` | `incident:read` | List incidents |
| GET | `/api/compliance/incidents/:id` | `incident:read` | Get incident details |
| POST | `/api/compliance/incidents` | `incident:report` | Report new incident |
| PUT | `/api/compliance/incidents/:id` | `incident:manage` | Update incident |
| POST | `/api/compliance/incidents/:id/investigate` | `incident:manage` | Start investigation |
| POST | `/api/compliance/incidents/:id/resolve` | `incident:manage` | Resolve incident |
| GET | `/api/compliance/incidents/:id/actions` | `incident:read` | Get corrective actions |
| POST | `/api/compliance/incidents/:id/actions` | `incident:manage` | Add corrective action |
| PUT | `/api/compliance/incidents/:id/actions/:actionId` | `incident:manage` | Update action |
| POST | `/api/compliance/incidents/anonymous` | Public | Submit anonymous report |

---

## Data Model

```prisma
model Incident {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Identification
  incidentNumber String  @unique  // e.g., "INC-2024-0001"
  category      IncidentCategory
  subcategory   String?
  severity      IncidentSeverity

  // Occurrence
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
  isAnonymous   Boolean  @default(false)

  // Description
  title         String
  description   String
  immediateActions String?

  // HIPAA breach assessment
  isPHIInvolved Boolean  @default(false)
  isBreachConfirmed Boolean?
  breachAssessment Json?
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
  preventiveMeasures String?
  lessonLearned String?

  // External reporting
  reportedToOSHA Boolean  @default(false)
  reportedToHHS Boolean   @default(false)
  reportedToState Boolean @default(false)
  externalReportDate DateTime?
  externalReportRef String?

  // Documentation
  attachments   String[]
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

  // Relations
  incident  Incident @relation(fields: [incidentId], references: [id])

  @@index([incidentId])
  @@index([assignedTo])
  @@index([status])
  @@index([dueDate])
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
```

---

## Business Rules

- Incident categories and reporting requirements:
  - Clinical: Patient injury, treatment error → internal review, possible state board
  - Safety: Needle stick, exposure → OSHA log, workers comp
  - Privacy/Security: PHI breach → HIPAA breach assessment, possible HHS
  - Equipment: Failure, malfunction → internal documentation, manufacturer report
- Severity response times:
  - Critical: Immediate response, escalate to admin/legal
  - High: 24-hour response
  - Medium: 48-hour response
  - Low: 1-week response
- HIPAA breach assessment required for all privacy incidents
- Incidents cannot be deleted, only closed
- Anonymous reports permitted but limit investigation capability

---

## Dependencies

**Depends On:**
- Auth & User Management (user identification)
- Staff Management (involved staff records)
- Patient Management (involved patient records)

**Required By:**
- Regulatory Reporting (incident summaries)
- Compliance Self-Audit Tools (incident history for audits)
- Training Program Administration (training actions from incidents)

---

## Notes

- HIPAA breach determination follows four-factor assessment
- OSHA 300 log integration for workplace injuries
- Consider integration with incident notification services
- Root cause analysis categories: human error, process gap, training, equipment, communication
- Near-miss reporting encouraged for proactive safety culture

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
