# Acknowledgment Letters

> **Sub-Area**: [Referral Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Acknowledgment Letters automates the generation and sending of thank-you letters to referring providers and patients when they refer new patients. This maintains professional relationships, encourages continued referrals, and ensures timely acknowledgment of referral sources through templates with merge fields and multiple delivery methods.

---

## Core Requirements

- [ ] Auto-generate thank-you letters when referrals start treatment
- [ ] Support customizable letter templates with merge fields
- [ ] Enable multiple delivery methods (fax, email, mail, portal)
- [ ] Provide letter preview and editing before sending
- [ ] Track letter generation, sending, and delivery status
- [ ] Support batch printing for mailed letters
- [ ] Maintain letter history per referral source

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/referral-letters` | `referral:read` | List letters with filters |
| GET | `/api/referral-letters/:id` | `referral:read` | Get letter details |
| POST | `/api/referral-letters` | `referral:send_letters` | Create/generate letter |
| PUT | `/api/referral-letters/:id` | `referral:send_letters` | Edit letter content |
| POST | `/api/referral-letters/:id/send` | `referral:send_letters` | Send letter |
| GET | `/api/referral-letters/:id/preview` | `referral:read` | Preview rendered letter |
| GET | `/api/referral-letters/:id/pdf` | `referral:read` | Download PDF |
| GET | `/api/referral-letters/queue` | `referral:read` | Get pending letters |

---

## Data Model

```prisma
model ReferralLetter {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Letter type and recipient
  letterType    LetterType
  recipientType RecipientType
  referringProviderId String?  @db.ObjectId
  referringPatientId  String?  @db.ObjectId

  // Associated patient
  patientId     String?  @db.ObjectId

  // Letter content
  templateId    String?  @db.ObjectId
  subject       String?
  body          String
  mergeData     Json?

  // Delivery
  deliveryMethod CommunicationMethod
  deliveryAddress String?
  status         LetterStatus @default(PENDING)

  // Tracking
  generatedAt   DateTime @default(now())
  sentAt        DateTime?
  deliveredAt   DateTime?
  viewedAt      DateTime?
  errorMessage  String?

  // Document
  documentUrl   String?

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?  @db.ObjectId
  sentBy        String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([referringProviderId])
  @@index([status])
}

enum LetterType {
  NEW_PATIENT_THANK_YOU
  CONSULTATION_THANK_YOU
  TREATMENT_COMPLETE
  GENERAL_APPRECIATION
  PROGRESS_UPDATE
  CUSTOM
}

enum LetterStatus {
  DRAFT
  PENDING
  QUEUED
  SENT
  DELIVERED
  FAILED
  CANCELLED
}
```

---

## Business Rules

- Auto-generate "New Patient Thank You" when treatment starts
- Letters sent within 24-48 hours of treatment start (configurable)
- Use provider's preferred communication method
- Prevent duplicate letters for same patient/provider combination
- Optional approval workflow before sending (clinic configurable)
- Failed deliveries retry with alternate method if available
- Patient referral letters use different template tone
- Track acknowledgmentSent on Referral record to prevent duplicates

---

## Dependencies

**Depends On:**
- Referring Provider Directory (recipient details)
- Referral Source Attribution (trigger events)
- Patient Communications (delivery infrastructure)
- PDF Generation Service (letter documents)

**Required By:**
- Referral Analytics (acknowledgment metrics)

---

## Notes

- Merge fields: provider name, patient name, treatment type, doctor name
- Consider seasonal appreciation letters for top referrers
- Support for digital signature on letters
- Fax delivery should include cover sheet

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
