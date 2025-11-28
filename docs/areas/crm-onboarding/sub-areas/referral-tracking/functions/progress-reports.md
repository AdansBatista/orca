# Progress Reports

> **Sub-Area**: [Referral Tracking](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Progress Reports keeps referring dentists informed about their referred patients' orthodontic treatment progress. Regular updates strengthen referral relationships by demonstrating professional communication and giving referring providers confidence in the care their patients receive, encouraging continued referrals.

---

## Core Requirements

- [ ] Generate progress reports at treatment milestones (start, mid, complete)
- [ ] Support scheduled reports (quarterly, annually)
- [ ] Include treatment phase, progress, and estimated completion
- [ ] Optionally include clinical photos (with patient consent)
- [ ] Deliver via provider's preferred method
- [ ] Allow provider opt-out from reports
- [ ] Track report delivery and viewing

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/progress-reports` | `referral:read` | List reports with filters |
| GET | `/api/progress-reports/:id` | `referral:read` | Get report details |
| POST | `/api/progress-reports` | `referral:send_letters` | Create progress report |
| PUT | `/api/progress-reports/:id` | `referral:send_letters` | Edit report content |
| POST | `/api/progress-reports/:id/send` | `referral:send_letters` | Send report |
| POST | `/api/progress-reports/batch` | `referral:admin` | Generate batch reports |
| GET | `/api/progress-reports/due` | `referral:read` | Get reports due for generation |

---

## Data Model

```prisma
model ProgressReport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Recipients
  referringProviderId String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Report details
  reportType    ProgressReportType
  reportDate    DateTime @default(now())

  // Content
  treatmentPhase    String
  treatmentProgress String
  nextSteps         String?
  estimatedCompletion DateTime?
  doctorNotes       String?

  // Images (optional)
  includeImages     Boolean @default(false)
  imageUrls         String[]

  // Delivery
  deliveryMethod    CommunicationMethod
  status            LetterStatus @default(PENDING)
  sentAt            DateTime?

  // Document
  documentUrl       String?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  referringProvider ReferringProvider @relation(fields: [referringProviderId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([referringProviderId])
  @@index([patientId])
}

enum ProgressReportType {
  TREATMENT_STARTED
  MID_TREATMENT
  TREATMENT_COMPLETE
  QUARTERLY_UPDATE
  ANNUAL_UPDATE
  CUSTOM
}
```

---

## Business Rules

- Reports only sent if provider has reportsOptedIn = true
- Patient must have photo consent for images to be included
- Milestone reports auto-triggered by treatment phase changes
- Scheduled reports (quarterly/annual) generated in batch
- Provider report frequency setting determines scheduled cadence
- Report content should be clinically appropriate (no PHI beyond necessary)
- Doctors can add custom notes before sending
- VIP providers may receive more frequent updates

---

## Dependencies

**Depends On:**
- Referring Provider Directory (recipient settings)
- Referral Source Attribution (patient-provider link)
- Treatment Management (treatment phase data)
- Imaging Management (clinical photos)
- Patient Communications (delivery infrastructure)

**Required By:**
- Referral Analytics (report delivery metrics)

---

## Notes

- Consider secure portal for providers to view all their referrals' progress
- Batch generation should be schedulable (monthly job)
- Photo inclusion requires explicit consent check
- Report templates should be customizable per clinic

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
