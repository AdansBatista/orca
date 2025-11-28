# Compliance Reporting

> **Sub-Area**: [Sterilization & Compliance](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Compliance Reporting generates comprehensive reports for regulatory compliance, inspections, and internal audits. The system produces sterilization logs, biological monitoring summaries, instrument tracking reports, and equipment validation documentation. Reports support state dental board inspections, OSHA requirements, and internal quality assurance programs. All reports include required compliance fields and maintain proper audit trails.

---

## Core Requirements

- [ ] Generate sterilization logs by date range
- [ ] Create biological monitoring summaries
- [ ] Produce instrument tracking reports
- [ ] Export reports in multiple formats (PDF, CSV)
- [ ] Support custom date ranges
- [ ] Include required compliance fields
- [ ] Generate audit trail reports
- [ ] Create equipment validation summaries
- [ ] Track compliance status dashboard
- [ ] Support multi-location reporting for super admins

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/sterilization/compliance/report` | `sterilization:report` | Generate report |
| GET | `/api/resources/sterilization/compliance/status` | `sterilization:read` | Compliance status |
| GET | `/api/resources/sterilization/compliance/audit-log` | `sterilization:report` | Audit trail |
| GET | `/api/resources/sterilization/compliance/daily-log` | `sterilization:report` | Daily log |
| GET | `/api/resources/sterilization/compliance/biological-summary` | `sterilization:report` | Bio monitoring |
| GET | `/api/resources/sterilization/compliance/instrument-report` | `sterilization:report` | Instrument tracking |
| POST | `/api/resources/sterilization/compliance/export` | `sterilization:report` | Export reports |

---

## Data Model

```prisma
model ComplianceReport {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  // Report details
  reportType      ComplianceReportType
  reportName      String
  dateRangeStart  DateTime
  dateRangeEnd    DateTime

  // Generation
  generatedAt     DateTime @default(now())
  generatedBy     String   @db.ObjectId
  format          ReportFormat

  // Content
  reportData      Json?    // Report data snapshot
  fileUrl         String?  // Generated file URL

  // Status
  status          ReportStatus @default(GENERATING)

  // Metadata
  parameters      Json?    // Report parameters used

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([reportType])
  @@index([generatedAt])
}

enum ComplianceReportType {
  DAILY_STERILIZATION_LOG
  WEEKLY_BIOLOGICAL_SUMMARY
  MONTHLY_COMPLIANCE_SUMMARY
  INSTRUMENT_SET_INVENTORY
  EQUIPMENT_VALIDATION
  FAILURE_INVESTIGATION
  AUDIT_TRAIL
  CUSTOM
}

enum ReportFormat {
  PDF
  CSV
  EXCEL
  HTML
}

enum ReportStatus {
  GENERATING
  COMPLETED
  FAILED
}

model ComplianceStatus {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  // Status date
  statusDate      DateTime @default(now())

  // Metrics
  biologicalTestingCompliant Boolean
  lastBiologicalTest        DateTime?
  daysSinceLastTest         Int?

  cycleDocumentationComplete Boolean
  cyclesThisPeriod          Int
  cyclesWithIssues          Int

  instrumentTrackingCurrent Boolean
  setsInService             Int
  setsInQuarantine          Int

  equipmentValidationCurrent Boolean
  equipmentDueValidation    Int

  // Overall
  overallCompliant          Boolean
  complianceScore           Decimal? // Percentage

  // Issues
  openIssues                Json?    // List of compliance issues

  // Timestamps
  calculatedAt DateTime @default(now())

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([statusDate])
}
```

---

## Business Rules

- Daily sterilization log includes all cycles, operators, parameters, and results
- Weekly biological summary shows testing compliance (tested/not tested)
- Monthly summary aggregates cycle counts, failure rates, biological compliance
- Reports include all required fields per state dental board requirements
- Audit trail reports show all changes with timestamps and user identification
- Failed cycles and positive biological tests highlighted in reports
- Report data stored for historical comparison
- Reports available within 24 hours of request (regulatory requirement)

---

## Dependencies

**Depends On:**
- Cycle Logging (cycle documentation)
- Instrument Tracking (set records)
- Biological Monitoring (test results)
- Equipment Validation (validation records)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Inspection readiness
- Internal quality assurance
- Regulatory compliance documentation

---

## Notes

- Dashboard shows real-time compliance status at a glance
- Color-coded indicators: green (compliant), yellow (attention), red (non-compliant)
- Scheduled report generation (e.g., weekly summary every Monday)
- Email delivery option for scheduled reports
- Print-friendly formats for physical binders if required
- Report templates customizable per state requirements
- Historical reports retained per retention requirements (typically 3+ years)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
