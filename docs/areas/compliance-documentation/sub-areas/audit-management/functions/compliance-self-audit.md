# Compliance Self-Audit Tools

> **Sub-Area**: [Audit Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Compliance Self-Audit Tools provide structured checklists and workflows for conducting internal compliance assessments. These tools help clinics proactively identify compliance gaps through HIPAA privacy/security self-audits, OSHA compliance reviews, and state board requirement checks, with finding documentation and corrective action tracking.

---

## Core Requirements

- [ ] Provide self-audit checklist templates (HIPAA, OSHA, state board)
- [ ] Schedule and track internal audit completion
- [ ] Document findings with severity classification
- [ ] Track corrective actions from findings to resolution
- [ ] Calculate compliance scores by audit area
- [ ] Generate gap analysis identifying deficiencies
- [ ] Support trend reporting across audit cycles
- [ ] Create audit evidence documentation packages

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/audits` | `audit:view_full` | List all audits |
| POST | `/api/compliance/audits` | `audit:manage` | Schedule new audit |
| GET | `/api/compliance/audits/:id` | `audit:view_full` | Get audit details |
| PUT | `/api/compliance/audits/:id` | `audit:manage` | Update audit |
| POST | `/api/compliance/audits/:id/start` | `audit:manage` | Start audit execution |
| POST | `/api/compliance/audits/:id/complete` | `audit:manage` | Complete audit |
| GET | `/api/compliance/audits/:id/findings` | `audit:view_full` | Get audit findings |
| POST | `/api/compliance/audits/:id/findings` | `audit:manage` | Add finding |
| GET | `/api/compliance/audits/checklists` | `audit:view_full` | Get checklist templates |
| GET | `/api/compliance/audits/scores` | `audit:view_full` | Get compliance scores |

---

## Data Model

```prisma
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
  checklistId   String?  @db.ObjectId
  checklistItems Json    // Array of items with results

  // Results
  status        ComplianceAuditStatus @default(SCHEDULED)
  overallScore  Decimal?  // Percentage
  passRate      Decimal?  // Items passed / total
  findings      Json?     // Array of findings

  // Finding counts
  criticalFindings Int   @default(0)
  majorFindings Int      @default(0)
  minorFindings Int      @default(0)
  observations  Int      @default(0)

  // Audit team
  leadAuditorId String?  @db.ObjectId
  leadAuditorName String?
  auditorNotes  String?

  // Corrective action plan
  correctiveActionPlan Json?
  capDueDate    DateTime?
  capStatus     String?

  // Documentation
  reportUrl     String?
  attachments   String[]

  // External audit fields
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
```

---

## Business Rules

- Self-audit checklist categories:
  - HIPAA Privacy: Notice of privacy practices, patient rights, BAAs, training
  - HIPAA Security: Risk assessment, policies, access controls, encryption
  - OSHA: Exposure control plan, training, PPE, sharps disposal
  - State Board: License verification, facility requirements, record keeping
- Finding severity levels:
  - Critical: Immediate regulatory risk, must address within 24 hours
  - Major: Significant compliance gap, address within 30 days
  - Minor: Low-risk deficiency, address within 90 days
  - Observation: Improvement opportunity, no deadline
- Corrective actions required for critical and major findings
- Compliance score calculation: (Passed items / Total items) * 100
- Trend reporting requires minimum 3 audit cycles

---

## Dependencies

**Depends On:**
- System Audit Trail (audit log evidence)
- All compliance sub-areas (provide audit evidence)

**Required By:**
- Regulatory Reporting (compliance status reports)
- Audit Preparation Workflows (self-audit results for external audits)

---

## Notes

- HIPAA requires annual risk assessment minimum
- Self-audits should precede external audits by 30-60 days
- Consider importing standard checklist templates from compliance organizations
- Evidence attachment capability for documenting compliance items
- Corrective action tracking should include verification step

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
