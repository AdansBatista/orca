# Patient Form Portal

> **Sub-Area**: [Intake Forms](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Patient Form Portal provides a secure, mobile-friendly interface for patients and parents to complete intake forms before their appointments. It supports multiple access methods, progress saving, and multi-language support to ensure a smooth pre-visit experience that reduces chair time and improves data quality.

---

## Core Requirements

- [ ] Render forms from template schema with responsive mobile design
- [ ] Support secure access via unique token link (no login required)
- [ ] Enable save and continue later functionality
- [ ] Validate required fields with clear error messaging
- [ ] Support multiple languages (English, French, Spanish)
- [ ] Ensure WCAG 2.1 AA accessibility compliance
- [ ] Send confirmation and receipt after successful submission

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/portal/forms/:token` | Token Auth | Load form by access token |
| POST | `/api/portal/forms/:token/save` | Token Auth | Save progress (partial) |
| POST | `/api/portal/forms/:token/submit` | Token Auth | Submit completed form |
| POST | `/api/portal/forms/:token/sign` | Token Auth | Submit signature |
| GET | `/api/portal/forms/:token/status` | Token Auth | Check completion status |
| POST | `/api/portal/forms/:token/upload` | Token Auth | Upload file/image |

---

## Data Model

```prisma
model IntakeSubmission {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  templateId    String   @db.ObjectId
  patientId     String?  @db.ObjectId
  leadId        String?  @db.ObjectId

  // Submission status
  status        SubmissionStatus @default(NOT_STARTED)

  // Form data (encrypted JSON)
  formData      Json
  partialData   Json?

  // Access token for secure link
  accessToken   String   @unique
  accessTokenExpires DateTime

  // Submission details
  startedAt     DateTime?
  submittedAt   DateTime?
  submittedByIp String?
  submittedByDevice String?

  // Language
  language      String   @default("en")

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  template      IntakeFormTemplate @relation(fields: [templateId], references: [id])

  @@index([clinicId])
  @@index([accessToken])
  @@index([status])
}

enum SubmissionStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  NEEDS_REVIEW
  APPROVED
  EXPIRED
  SUPERSEDED
}
```

---

## Business Rules

- Access tokens expire after 7 days by default
- Progress auto-saves every 60 seconds while form is active
- Session timeout after 30 minutes of inactivity with warning
- Form data encrypted at rest and in transit
- File uploads limited to 10MB per file, images compressed
- IP and device logged for audit trail
- Language detection from browser with manual override
- Forms requiring signature cannot be submitted until signed

---

## Dependencies

**Depends On:**
- Form Template Builder (template schemas)
- Patient Communications (send form links)

**Required By:**
- Medical History Collection (submission data)
- Insurance Information Capture (submission data)
- Consent Form Management (signature capture)
- Completion Tracking (submission status)

---

## Notes

- Consider progressive web app (PWA) for offline capability
- QR code generation for in-office tablet access
- Pre-population from previous submissions for returning patients
- Real-time validation to prevent submission errors
- Kiosk mode for in-office tablets (no URL bar, auto-reset)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
