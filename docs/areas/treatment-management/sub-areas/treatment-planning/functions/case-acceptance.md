# Case Acceptance

> **Sub-Area**: [Treatment Planning](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Case Acceptance captures patient treatment acceptance with proper informed consent, financial agreements, and digital signatures. This function ensures all required consents are obtained before treatment begins, documents the selected treatment option, and integrates with financial management for payment setup. Compliance with electronic signature regulations (ESIGN/UETA) is maintained throughout.

---

## Core Requirements

- [ ] Record selected treatment option
- [ ] Capture patient/guardian digital signatures
- [ ] Obtain informed consent acknowledgment
- [ ] Document financial agreement with terms
- [ ] Verify insurance coverage status
- [ ] Generate treatment contracts
- [ ] Track HIPAA acknowledgment
- [ ] Support minor consent requirements
- [ ] Integrate with financial management for payment setup

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/acceptance` | `treatment:read` | Get case acceptance |
| POST | `/api/treatment-plans/:id/accept` | `treatment:update` | Accept treatment |
| PUT | `/api/case-acceptance/:id` | `treatment:update` | Update acceptance details |
| POST | `/api/case-acceptance/:id/sign` | `treatment:update` | Record signature |
| GET | `/api/case-acceptance/:id/contract` | `treatment:read` | Generate contract PDF |

---

## Data Model

```prisma
model CaseAcceptance {
  id                              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId                        String   @db.ObjectId
  treatmentPlanId                 String   @db.ObjectId @unique

  // Acceptance Details
  acceptedDate                    DateTime
  acceptedOptionId                String   @db.ObjectId

  // Signatures (encrypted)
  patientSignature                String?
  patientSignedAt                 DateTime?
  responsiblePartySignature       String?
  responsiblePartySignedAt        DateTime?

  // Consents
  informedConsentSigned           Boolean  @default(false)
  financialAgreementSigned        Boolean  @default(false)
  hipaaAcknowledged               Boolean  @default(false)

  // Financial Agreement
  totalFee                        Decimal
  downPayment                     Decimal?
  monthlyPayment                  Decimal?
  paymentTerms                    Int?     // months

  // Insurance
  insuranceVerified               Boolean  @default(false)
  estimatedInsurance              Decimal?
  estimatedPatientResponsibility  Decimal?

  // Documents
  contractUrl                     String?

  // Timestamps & Audit
  createdAt                       DateTime @default(now())
  updatedAt                       DateTime @updatedAt
  processedBy                     String   @db.ObjectId

  @@index([clinicId])
  @@index([treatmentPlanId])
}
```

---

## Business Rules

- All required consents must be signed before treatment can start
- Responsible party signature required for minor patients
- Financial agreement must be signed before payment processing
- Selected option becomes locked after acceptance
- Treatment plan status changes to ACCEPTED upon completion
- Contract generation requires all signatures
- Insurance verification should precede acceptance when applicable

---

## Dependencies

**Depends On:**
- Treatment Plan Creation (parent plan)
- Treatment Options (selected option)
- Case Presentation (presentation precedes acceptance)
- Financial Management (payment setup)

**Required By:**
- Treatment Tracking (treatment start)
- Billing & Insurance (claim initiation)

---

## Notes

- Digital signatures stored encrypted per security requirements
- Contract PDF generated from template with acceptance data
- Consider e-signature service integration for compliance
- Support multiple signature capture methods (touch, typed)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
