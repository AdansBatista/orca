# Specialist Network

> **Sub-Area**: [Referral Tracking](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Specialist Network manages outbound referrals from the orthodontic practice to specialists such as oral surgeons, periodontists, and TMJ specialists. It tracks the referral lifecycle from creation through appointment completion and report receipt, ensuring patients receive timely specialist care and documentation returns to the practice.

---

## Core Requirements

- [ ] Maintain directory of specialists by specialty type
- [ ] Create outbound referral with reason and clinical notes
- [ ] Generate referral letters with patient information
- [ ] Track referral status (sent, scheduled, completed)
- [ ] Log receipt of specialist reports and notes
- [ ] Send reminders for outstanding specialist appointments
- [ ] Document referral outcomes in patient record

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/specialist-referrals` | `referral:read` | List outbound referrals |
| GET | `/api/specialist-referrals/:id` | `referral:read` | Get referral details |
| POST | `/api/specialist-referrals` | `referral:create` | Create specialist referral |
| PUT | `/api/specialist-referrals/:id` | `referral:update` | Update referral status |
| POST | `/api/specialist-referrals/:id/generate-letter` | `referral:send_letters` | Generate referral letter |
| POST | `/api/specialist-referrals/:id/upload-report` | `referral:update` | Upload specialist report |
| GET | `/api/specialist-referrals/pending` | `referral:read` | Get pending referrals |

---

## Data Model

```prisma
model SpecialistReferral {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Patient being referred
  patientId     String   @db.ObjectId

  // Specialist
  specialistId  String   @db.ObjectId  // ReferringProvider with specialist type

  // Referral details
  referralReason    String
  urgency           ReferralUrgency @default(ROUTINE)
  preferredDate     DateTime?
  clinicalNotes     String?

  // Status tracking
  status            SpecialistReferralStatus @default(CREATED)
  referralLetterSent DateTime?
  appointmentScheduled DateTime?
  appointmentDate   DateTime?
  appointmentCompleted DateTime?

  // Results
  specialistNotes   String?
  reportReceived    DateTime?
  reportUrl         String?
  outcome           String?

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])
  specialist    ReferringProvider @relation(fields: [specialistId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}

enum ReferralUrgency {
  ROUTINE
  SOON
  URGENT
}

enum SpecialistReferralStatus {
  CREATED
  LETTER_SENT
  APPOINTMENT_SCHEDULED
  APPOINTMENT_COMPLETED
  REPORT_RECEIVED
  CLOSED
  CANCELLED
}
```

---

## Business Rules

- Specialist selection limited to providers with specialist type in directory
- Urgent referrals flagged for same-day letter generation
- Alert if appointment not scheduled within 2 weeks of referral
- Alert if report not received within 2 weeks of appointment
- Referral letter includes relevant clinical information and X-rays
- Report upload links to patient document management
- Closed status requires outcome documentation
- Patient notifications for pending specialist appointments

---

## Dependencies

**Depends On:**
- Referring Provider Directory (specialist records)
- Patient Communications (letter delivery, reminders)
- Document Management (report storage)
- Imaging Management (X-ray inclusion in letters)

**Required By:**
- Treatment Management (treatment plan dependencies)
- Patient Flow (appointment tracking)

---

## Notes

- Common specialist types: oral surgeon, periodontist, endodontist, TMJ, ENT
- Consider integration with specialist scheduling systems
- Track specialist response times for quality assessment
- Support for expedited referrals in urgent cases

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
