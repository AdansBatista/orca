# Eligibility Verification

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Eligibility Verification verifies patient insurance eligibility and orthodontic benefits in real-time via clearinghouse integration. This function confirms coverage is active, retrieves orthodontic-specific benefits (lifetime maximum, coverage percentage, age limits), and updates the patient's insurance record. Verification before service prevents claim denials and improves patient financial counseling.

---

## Core Requirements

- [ ] Real-time eligibility checks via clearinghouse API
- [ ] Batch eligibility verification for scheduled patients
- [ ] Orthodontic-specific benefit retrieval (lifetime max, used, remaining)
- [ ] Coverage limitation checks (age, waiting period)
- [ ] Automatic update of patient insurance record
- [ ] Verification history tracking
- [ ] Manual verification entry for phone-verified benefits
- [ ] Scheduled pre-appointment verification runs

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/insurance/eligibility/check` | `insurance:verify` | Single eligibility check |
| POST | `/api/insurance/eligibility/batch` | `insurance:verify` | Batch check for multiple patients |
| GET | `/api/insurance/eligibility/history/:patientInsuranceId` | `insurance:read` | Get verification history |
| POST | `/api/insurance/eligibility/manual` | `insurance:verify` | Record manual verification |
| GET | `/api/insurance/eligibility/pending` | `insurance:read` | List patients needing verification |

---

## Data Model

```prisma
model EligibilityCheck {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId
  patientInsuranceId String  @db.ObjectId

  // Check details
  checkDate         DateTime @default(now())
  serviceDate       DateTime
  status            EligibilityStatus
  checkType         EligibilityCheckType @default(ELECTRONIC)

  // Results
  isEligible        Boolean?
  eligibilityData   Json?     // Full response data

  // Ortho-specific results
  hasOrthoBenefit   Boolean?
  orthoLifetimeMax  Decimal?
  orthoUsed         Decimal?
  orthoRemaining    Decimal?
  orthoCoverage     Decimal?  // percentage
  orthoDeductible   Decimal?
  orthoDeductibleMet Decimal?
  orthoAgeLimit     Int?
  orthoWaitingPeriodMet Boolean?

  // Error handling
  errorCode         String?
  errorMessage      String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  checkedBy String?  @db.ObjectId

  // Relations
  clinic           Clinic           @relation(fields: [clinicId], references: [id])
  patientInsurance PatientInsurance @relation(fields: [patientInsuranceId], references: [id])

  @@index([clinicId])
  @@index([patientInsuranceId])
  @@index([checkDate])
  @@index([status])
}

enum EligibilityStatus {
  PENDING
  SUCCESS
  FAILED
  NO_RESPONSE
  MANUAL
}

enum EligibilityCheckType {
  ELECTRONIC
  PORTAL
  PHONE
  MANUAL
}
```

---

## Business Rules

- Verify eligibility within 30 days of service date
- Batch verification runs automatically for next-day appointments
- Failed verifications flagged for manual follow-up
- Ortho benefits update patient insurance record on success
- Eligibility valid for 30 days (configurable)
- Track verification source (electronic, phone, portal)
- Multiple verifications on same day allowed (recheck)

---

## Dependencies

**Depends On:**
- Patient Insurance Management (insurance to verify)
- Insurance Company Database (payer routing)
- Clearinghouse Integration (eligibility API)

**Required By:**
- Treatment Cost Estimator (benefit estimation)
- Claims Submission (pre-submission validation)
- Pre-Authorization (benefit confirmation)

---

## Notes

- Parse EDI 271 response for structured benefit data
- Handle payer-specific response variations
- Consider caching recent verifications to reduce API calls
- Implement retry logic for transient failures
- Alert front desk to verification failures before appointment

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
