# Authorization Verification

> **Sub-Area**: [Records Requests](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Authorization Verification ensures proper patient consent exists before releasing any protected health information. It validates authorization form completeness, verifies signatures, checks expiration dates, and confirms the requesting party matches the authorization, maintaining HIPAA compliance and protecting patient privacy.

---

## Core Requirements

- [ ] Validate authorization form completeness against requirements
- [ ] Verify patient or guardian signature presence
- [ ] Check authorization expiration date
- [ ] Confirm requesting party matches authorized recipient
- [ ] Support guardian authorization for minor patients
- [ ] Document verification in audit trail
- [ ] Handle authorization revocation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/records-authorizations` | `records:read` | List authorizations |
| GET | `/api/records-authorizations/:id` | `records:read` | Get authorization details |
| POST | `/api/records-authorizations` | `records:create` | Create authorization |
| POST | `/api/records-authorizations/:id/verify` | `records:authorize` | Verify authorization |
| POST | `/api/records-authorizations/:id/revoke` | `records:authorize` | Revoke authorization |
| GET | `/api/patients/:id/authorizations` | `records:read` | Get patient's authorizations |
| GET | `/api/records-authorizations/expiring` | `records:compliance` | Get expiring authorizations |

---

## Data Model

```prisma
model RecordsAuthorization {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Authorization details
  authorizationType   AuthorizationType
  authorizedRecords   String[]
  authorizedRecipient String
  recipientType       RecipientType

  // Purpose
  purpose       String?

  // Signatures
  patientSignature      String?
  patientSignedDate     DateTime?
  guardianSignature     String?
  guardianName          String?
  guardianRelationship  String?
  guardianSignedDate    DateTime?

  // Validity
  effectiveDate     DateTime @default(now())
  expirationDate    DateTime?
  expirationEvent   String?

  // Revocation
  revoked           Boolean  @default(false)
  revokedDate       DateTime?
  revocationReason  String?

  // Verification
  isValid           Boolean  @default(true)
  verifiedAt        DateTime?
  verifiedBy        String?  @db.ObjectId
  verificationNotes String?

  // Document
  documentUrl       String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([isValid])
  @@index([expirationDate])
}

enum AuthorizationType {
  RELEASE_TO_PROVIDER
  RELEASE_TO_PATIENT
  RELEASE_TO_THIRD_PARTY
  INCOMING_REQUEST
}

enum RecipientType {
  HEALTHCARE_PROVIDER
  PATIENT_SELF
  INSURANCE_COMPANY
  LEGAL_REPRESENTATIVE
  FAMILY_MEMBER
  OTHER
}
```

---

## Business Rules

- All outgoing records require valid, verified authorization
- Minor patients (under 18) require guardian signature
- Authorization must include: signature, date, scope, recipient, expiration
- Verification checklist must be completed before marking valid
- Expired authorizations cannot be used; require new authorization
- Revoked authorizations immediately invalidate pending releases
- Authorization scope must cover requested records (minimum necessary)
- Patient copy requests may have different requirements by state

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)
- Intake Forms (authorization form submission)

**Required By:**
- Incoming Records Management (authorization for requests)
- Outgoing Records Preparation (release authorization)
- Compliance Monitoring (authorization compliance)

---

## Notes

- HIPAA-compliant authorization form template provided
- Consider electronic authorization via patient portal
- OCR extraction for uploaded paper authorizations
- State-specific requirements may vary

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
