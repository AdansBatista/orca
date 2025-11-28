# Referral Source Attribution

> **Sub-Area**: [Referral Tracking](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Referral Source Attribution tracks the origin of every patient entering the practice, linking them to the referring provider, existing patient, or marketing source responsible for the referral. This data is essential for measuring referral relationship value, sending appropriate acknowledgments, and understanding patient acquisition patterns.

---

## Core Requirements

- [ ] Capture referral source at patient/lead creation
- [ ] Link referrals to specific referring providers or patients
- [ ] Support multiple referral types (doctor, patient, self, marketing)
- [ ] Track referral date and associate with consultation/treatment
- [ ] Calculate referral conversion and value metrics
- [ ] Enable referral source updates before treatment start
- [ ] Integrate with lead management for pre-conversion attribution

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/referrals` | `referral:read` | List referrals with filters |
| GET | `/api/referrals/:id` | `referral:read` | Get referral details |
| POST | `/api/referrals` | `referral:create` | Create referral record |
| PUT | `/api/referrals/:id` | `referral:update` | Update referral |
| GET | `/api/patients/:id/referral` | `referral:read` | Get patient's referral source |
| PUT | `/api/patients/:id/referral` | `referral:update` | Update patient's referral |

---

## Data Model

```prisma
model Referral {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Referral type
  referralType  ReferralType

  // Who was referred
  patientId     String?  @db.ObjectId
  leadId        String?  @db.ObjectId

  // Referrer (one of these)
  referringProviderId String?  @db.ObjectId
  referringPatientId  String?  @db.ObjectId
  marketingSourceId   String?  @db.ObjectId

  // Details
  referralDate  DateTime @default(now())
  referralNotes String?

  // Outcome tracking
  consultationDate    DateTime?
  treatmentStarted    Boolean  @default(false)
  treatmentStartDate  DateTime?
  treatmentValue      Decimal?

  // Acknowledgment
  acknowledgmentSent    Boolean  @default(false)
  acknowledgmentDate    DateTime?
  acknowledgmentMethod  CommunicationMethod?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient? @relation(fields: [patientId], references: [id])
  referringProvider ReferringProvider? @relation(fields: [referringProviderId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([referringProviderId])
  @@index([referralType])
}

enum ReferralType {
  DOCTOR_REFERRAL
  PATIENT_REFERRAL
  FAMILY_REFERRAL
  SELF_REFERRAL
  MARKETING
  UNKNOWN
}
```

---

## Business Rules

- Every patient must have a referral source (UNKNOWN if truly unknown)
- Referral type determines which ID field is populated
- Doctor referrals must link to ReferringProvider record
- Patient referrals should link to existing patient when possible
- Referral can be updated until treatment starts, then locked
- Treatment value populated when treatment plan accepted
- Acknowledgment tracking prevents duplicate thank-you letters
- Lead referral source transfers to patient on conversion

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)
- Referring Provider Directory (provider linking)
- Lead Management (lead referral capture)

**Required By:**
- Acknowledgment Letters (trigger on referral creation)
- Referral Analytics (performance metrics)
- Lead Source Tracking (doctor referral category)

---

## Notes

- Consider multi-touch attribution for complex acquisition paths
- Family referrals should track which family member referred
- Referral value helps calculate provider relationship ROI
- Front desk prompt: "How did you hear about us?" at registration

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
