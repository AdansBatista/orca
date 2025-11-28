# Digital Signature Capture

> **Sub-Area**: [Consent Forms](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Digital Signature Capture provides legally compliant electronic signature collection for patient consent forms both in-office and remotely. It supports multiple capture methods including signature pads, touchscreen devices, and remote signing via email/SMS links, with complete audit trails including timestamps, IP addresses, and device information for E-SIGN Act compliance.

---

## Core Requirements

- [ ] Capture signatures via in-office signature pads and touchscreen devices
- [ ] Support remote signature collection via secure email links
- [ ] Enable SMS-based signature request delivery
- [ ] Log complete signature metadata (timestamp, IP, device, user agent)
- [ ] Generate tamper-evident signature hashes for verification
- [ ] Support witness signature collection when required by form
- [ ] Create signed PDF documents with embedded signatures
- [ ] Verify signer identity for remote signing sessions

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/compliance/consents/:id/sign` | `consent:collect` | Submit signature for consent |
| POST | `/api/compliance/consents/:id/send` | `consent:collect` | Send consent for remote signing |
| GET | `/api/compliance/consents/:id/signing-link` | `consent:collect` | Generate signing URL |
| POST | `/api/compliance/signing/:token/verify` | Public | Verify remote signer identity |
| POST | `/api/compliance/signing/:token/complete` | Public | Complete remote signing |
| GET | `/api/compliance/consents/:id/pdf` | `consent:read` | Download signed consent PDF |
| POST | `/api/compliance/consents/:id/witness` | `consent:collect` | Add witness signature |

---

## Data Model

```prisma
model ConsentSignature {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  consentId     String   @db.ObjectId

  // Signer info
  signerType    SignerType
  signerName    String
  signerEmail   String?
  signerPhone   String?
  relationship  String?   // For guardians: "Mother", "Father", etc.

  // Signature data
  signatureData String    // Base64 encoded signature image
  signatureHash String    // SHA-256 hash for tamper detection

  // Verification metadata
  signedAt      DateTime
  ipAddress     String?
  userAgent     String?
  deviceType    String?   // "iPad", "Desktop", "Mobile", "Signature Pad"
  geoLocation   Json?     // Approximate location if available

  // Remote signing verification
  verificationMethod String?  // "email_link", "sms_code", "portal_auth"
  verificationCode   String?
  verifiedAt         DateTime?

  // Relations
  consent    PatientConsent @relation(fields: [consentId], references: [id])

  @@index([consentId])
  @@index([signerType])
  @@index([signedAt])
}

enum SignerType {
  PATIENT
  GUARDIAN
  PARENT
  LEGAL_REPRESENTATIVE
  WITNESS
  STAFF
}
```

---

## Business Rules

- All signatures must include timestamp and signer identification
- Remote signing links expire after 72 hours (configurable)
- SMS verification code required for remote signing sessions
- Signature hash must be verified before marking consent as signed
- Witness signatures required for templates that specify witness requirement
- Signed consent PDFs are generated immediately and stored securely
- Re-signing invalidates previous signatures and creates new consent record

---

## Dependencies

**Depends On:**
- Consent Form Builder (provides consent templates)
- Patient Communications (delivers remote signing requests)
- PDF Generation service (creates signed documents)

**Required By:**
- Consent Expiration Tracking (tracks signed consent dates)
- Consent Analytics (reports on signature collection methods)
- Minor/Guardian Consent (collects guardian signatures)

---

## Notes

- E-SIGN Act compliance requires: consent to electronic signatures, ability to withdraw consent, access to paper copies on request
- Consider DocuSign/HelloSign integration for advanced remote signing features
- Signature pad support requires device-specific integration libraries
- Mobile-responsive signature capture UI essential for in-office tablets

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
