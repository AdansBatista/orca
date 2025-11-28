# Regulatory Reporting

> **Sub-Area**: [Audit Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Regulatory Reporting generates and manages required compliance reports for regulatory bodies and internal governance. It produces HIPAA compliance documentation, OSHA injury and illness logs, state board compliance reports, breach notification reports, and custom compliance reports, with scheduling and automation capabilities for recurring reporting requirements.

---

## Core Requirements

- [ ] Generate HIPAA risk assessment and compliance reports
- [ ] Create OSHA 300/300A injury and illness logs
- [ ] Produce state dental board compliance documentation
- [ ] Generate breach notification reports when required
- [ ] Support custom report builder for specific needs
- [ ] Schedule recurring report generation
- [ ] Track report submission to regulatory bodies
- [ ] Maintain report history and audit trail

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/reports` | `audit:view_full` | List all reports |
| GET | `/api/compliance/reports/:id` | `audit:view_full` | Get report details |
| POST | `/api/compliance/reports/generate` | `audit:export` | Generate new report |
| GET | `/api/compliance/reports/templates` | `audit:view_full` | List report templates |
| POST | `/api/compliance/reports/schedule` | `audit:manage` | Schedule recurring report |
| GET | `/api/compliance/reports/hipaa` | `audit:view_full` | Get HIPAA compliance report |
| GET | `/api/compliance/reports/osha-300` | `audit:view_full` | Get OSHA 300 log |
| POST | `/api/compliance/reports/:id/submit` | `audit:manage` | Mark as submitted |

---

## Data Model

```prisma
model ComplianceReport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Report identification
  reportType    ReportType
  reportName    String
  reportPeriod  String   // "2024", "2024-Q1", etc.

  // Generation
  generatedAt   DateTime @default(now())
  generatedBy   String   @db.ObjectId
  parameters    Json?    // Report parameters used

  // Content
  reportData    Json     // Report data/results
  documentUrl   String?  // Generated PDF/document

  // Status
  status        ReportStatus @default(GENERATED)

  // Submission tracking
  submittedTo   String?  // "HHS", "OSHA", "State Board"
  submittedAt   DateTime?
  submittedBy   String?  @db.ObjectId
  confirmationNumber String?

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([reportType])
  @@index([generatedAt])
}

model ReportSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Schedule info
  reportType    ReportType
  frequency     ReportFrequency
  nextRunDate   DateTime
  lastRunDate   DateTime?

  // Delivery
  autoGenerate  Boolean  @default(true)
  recipients    String[] // Email addresses

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([nextRunDate])
}

enum ReportType {
  HIPAA_RISK_ASSESSMENT
  HIPAA_COMPLIANCE_SUMMARY
  OSHA_300_LOG
  OSHA_300A_SUMMARY
  STATE_BOARD_COMPLIANCE
  BREACH_NOTIFICATION
  TRAINING_SUMMARY
  CERTIFICATION_STATUS
  INCIDENT_SUMMARY
  AUDIT_SUMMARY
  CUSTOM
}

enum ReportStatus {
  GENERATED
  REVIEWED
  SUBMITTED
  ARCHIVED
}

enum ReportFrequency {
  MONTHLY
  QUARTERLY
  ANNUAL
  ON_DEMAND
}
```

---

## Business Rules

- Standard regulatory reports:
  - HIPAA Risk Assessment: Annual minimum
  - HIPAA Compliance Summary: Annual for internal/audit use
  - OSHA 300 Log: Maintained year-round, posted Feb 1-April 30
  - OSHA 300A Summary: Annual summary, posted with 300 Log
  - State Board Compliance: Per state requirements
  - Breach Notification: Within 60 days of breach discovery (HIPAA)
- OSHA 300 Log requirements:
  - Records work-related injuries and illnesses
  - Must be maintained for 5 years following year of record
  - 300A Summary must be posted February 1 - April 30
- Breach notification requirements:
  - Individual notification within 60 days
  - HHS notification: annually if < 500, within 60 days if ≥ 500
  - Media notification if ≥ 500 in a state/jurisdiction
- Reports must be retained per document retention policies

---

## Dependencies

**Depends On:**
- System Audit Trail (audit data for reports)
- Incident Reporting System (incident data for OSHA logs)
- Compliance Self-Audit Tools (audit scores and findings)
- Staff Training (training data for compliance reports)
- All compliance sub-areas (comprehensive data)

**Required By:**
- Audit Preparation Workflows (provides report documentation)

---

## Notes

- HIPAA risk assessment format should follow OCR guidance
- OSHA 300 Log available in standard format from OSHA website
- Consider integration with state dental board reporting systems
- Custom report builder for specific compliance needs
- Report templates should be reviewable before generation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
