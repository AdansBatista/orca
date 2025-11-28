# System Audit Trail

> **Sub-Area**: [Audit Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

The System Audit Trail maintains comprehensive, immutable logs of all system activity with particular focus on PHI (Protected Health Information) access as required by HIPAA. It automatically captures who accessed what data, when, from where, and what actions were performed, providing the foundation for security monitoring, compliance auditing, and forensic investigation.

---

## Core Requirements

- [ ] Automatically log all system activity with user identification
- [ ] Track all PHI access with detailed metadata
- [ ] Maintain immutable (append-only) audit records
- [ ] Support log search and filtering by multiple criteria
- [ ] Export audit logs for external auditors
- [ ] Detect anomalous access patterns
- [ ] Meet HIPAA audit trail requirements
- [ ] Provide entity-specific audit history views

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/audit/logs` | `audit:view_full` | Query audit logs |
| GET | `/api/compliance/audit/logs/:entityType/:entityId` | `audit:view_full` | Get entity audit history |
| GET | `/api/compliance/audit/logs/patient/:patientId` | `audit:view_full` | Get patient access history |
| GET | `/api/compliance/audit/logs/user/:userId` | `audit:view_full` | Get user activity history |
| POST | `/api/compliance/audit/export` | `audit:export` | Export audit logs |
| GET | `/api/compliance/audit/anomalies` | `audit:view_full` | Get detected anomalies |
| GET | `/api/compliance/audit/statistics` | `audit:view_full` | Get audit statistics |

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

  // Actor (who)
  userId        String?  @db.ObjectId
  userName      String?
  userRole      String?
  systemActor   String?  // For automated actions

  // Action (what)
  action        String   // "VIEW", "UPDATE", "DELETE", etc.
  description   String

  // Target (what was affected)
  entityType    String?  // "Patient", "Appointment", etc.
  entityId      String?  @db.ObjectId
  entityName    String?  // Human-readable name

  // PHI indicator
  involvesPHI   Boolean  @default(false)
  phiTypes      String[] // Types of PHI accessed

  // Context (where/how)
  ipAddress     String?
  userAgent     String?
  deviceType    String?
  sessionId     String?
  requestPath   String?
  appointmentId String?  @db.ObjectId  // Context if related to appointment

  // Change details (for updates)
  previousValue Json?
  newValue      Json?
  changedFields String[]

  // Result
  success       Boolean  @default(true)
  errorMessage  String?

  // Timestamp (immutable, no updatedAt)
  timestamp     DateTime @default(now())

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

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
```

---

## Business Rules

- HIPAA audit requirements captured:
  - Who: User identification (userId, userName, userRole)
  - What: Entity type and ID, action performed
  - When: Timestamp (server time, not modifiable)
  - Where: IP address, device type, user agent
  - Why: Appointment context when applicable
- Audit entries are immutable - no updates or deletes permitted
- PHI access logged with involvesPHI flag and phiTypes array
- Failed actions logged with success=false and errorMessage
- Bulk operations create individual audit entries per record
- Audit log access itself is logged (AUDIT_ACCESS event type)
- Minimum retention: 7 years per HIPAA requirements

---

## Dependencies

**Depends On:**
- Auth & User Management (user identification)
- All system areas (provide audit events)

**Required By:**
- Compliance Self-Audit Tools (audit log analysis)
- Incident Reporting System (incident investigation)
- Regulatory Reporting (audit reports)
- Audit Preparation Workflows (auditor access)

---

## Notes

- Implementation should use append-only data structure or write-once storage
- Consider separate audit log database for performance and security
- Log rotation and archival strategy needed for long-term retention
- Real-time streaming to SIEM (Security Information and Event Management) optional
- Anomaly detection rules: unusual access times, high volume access, access to terminated patient records

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
