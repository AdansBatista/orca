# Consent Form Management

> **Sub-Area**: [Intake Forms](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Consent Form Management handles the collection of legally-binding digital signatures on required consent forms including treatment consent, HIPAA acknowledgment, financial policies, and photo releases. It ensures proper signature capture with audit trails, supports guardian signatures for minors, and tracks consent expiration for renewal.

---

## Core Requirements

- [ ] Capture digital signatures (touch, stylus, or mouse drawing)
- [ ] Support multiple signer types (patient, guardian, witness)
- [ ] Log timestamp, IP address, and device for legal validity
- [ ] Generate signed PDF documents with embedded signatures
- [ ] Track consent expiration dates and trigger renewal
- [ ] Require guardian signature for minor patients
- [ ] Integrate with Compliance & Documentation for retention

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/portal/forms/:token/sign` | Token Auth | Submit signature on portal |
| GET | `/api/patients/:id/consents` | `patient:read` | List patient consents |
| GET | `/api/patients/:id/consents/:consentId` | `patient:read` | Get consent details |
| GET | `/api/patients/:id/consents/:consentId/pdf` | `patient:read` | Download signed PDF |
| POST | `/api/patients/:id/consents/:consentId/renew` | `intake:create` | Initiate consent renewal |
| GET | `/api/consents/expiring` | `intake:read` | List expiring consents |

---

## Data Model

```prisma
model FormSignature {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  submissionId  String   @db.ObjectId

  // Signer info
  signerType    SignerType
  signerName    String
  signerRelationship String?

  // Signature data
  signatureData String   // Base64 encoded signature image
  signedAt      DateTime
  signedFromIp  String
  signedFromDevice String?

  // Consent specifics
  consentText   String?
  consentVersion String?

  // Relations
  submission    IntakeSubmission @relation(fields: [submissionId], references: [id])

  @@index([submissionId])
}

model PatientConsent {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Consent type
  consentType   ConsentType
  templateVersion String

  // Status
  status        ConsentStatus @default(PENDING)

  // Signatures
  signatures    Json     // Array of signature records

  // Document
  documentUrl   String?  // Signed PDF URL

  // Validity
  signedAt      DateTime?
  expiresAt     DateTime?
  renewedFrom   String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
  @@index([expiresAt])
}

enum SignerType {
  PATIENT
  GUARDIAN
  PARENT
  SPOUSE
  WITNESS
}

enum ConsentType {
  GENERAL_TREATMENT
  INFORMED_CONSENT
  HIPAA_ACKNOWLEDGMENT
  FINANCIAL_POLICY
  PHOTO_CONSENT
  PHOTO_MARKETING
  RECORDS_RELEASE
}

enum ConsentStatus {
  PENDING
  SIGNED
  EXPIRED
  REVOKED
}
```

---

## Business Rules

- Patients 18+ sign for themselves; minors require parent/guardian
- Some consents require both patient AND guardian signature
- HIPAA acknowledgment required before any treatment
- Treatment consent requires informed consent content to be displayed
- Signature must be drawn, not typed (legal requirement)
- PDF generated immediately after signature for tamper-proof record
- Consent expiration defaults: HIPAA = never, Treatment = per treatment
- Revoked consents logged with reason; treatment paused if critical consent revoked

---

## Dependencies

**Depends On:**
- Patient Form Portal (signature capture UI)
- Form Template Builder (consent form templates)
- PDF Generation Service (signed document creation)

**Required By:**
- Treatment Management (treatment consent required)
- Compliance & Documentation (consent records)
- Completion Tracking (consent status)
- Imaging Management (photo consent)

---

## Notes

- Consider DocuSign/HelloSign integration for enhanced legal validity
- Witness signature may be required in some jurisdictions
- Support for verbal consent documentation in emergencies
- Consent version tracking for template changes

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
