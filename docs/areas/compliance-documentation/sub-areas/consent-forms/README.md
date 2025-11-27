# Consent Forms

> **Area**: [Compliance & Documentation](../../)
>
> **Sub-Area**: 12.1 Consent Forms
>
> **Purpose**: Manage patient consent documentation with digital signatures, version control, and compliance tracking

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Compliance & Documentation](../../) |
| **Dependencies** | Auth, Patient Management, Treatment Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

Consent Forms management is the foundation of patient documentation compliance in orthodontic practices. This sub-area handles all aspects of obtaining, storing, and tracking patient consent including treatment consents, HIPAA acknowledgments, photo releases, and financial agreements.

Orthodontic treatment presents unique consent challenges: treatments span months or years, involve minors requiring guardian consent, include radiation exposure from imaging, and require financial commitments through payment plans. This system ensures all required consents are properly collected, stored, and renewed as needed.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 12.1.1 | [Consent Form Builder](./functions/consent-form-builder.md) | Create and customize consent form templates | 📋 Planned | Critical |
| 12.1.2 | [Digital Signature Capture](./functions/digital-signature-capture.md) | Collect electronic signatures in-office and remotely | 📋 Planned | Critical |
| 12.1.3 | [Form Version Management](./functions/form-version-management.md) | Track form versions and updates | 📋 Planned | High |
| 12.1.4 | [Consent Expiration Tracking](./functions/consent-expiration-tracking.md) | Monitor consent validity and trigger renewals | 📋 Planned | High |
| 12.1.5 | [Minor/Guardian Consent Management](./functions/minor-guardian-consent.md) | Handle consent for minor patients | 📋 Planned | Critical |
| 12.1.6 | [Consent Analytics & Reporting](./functions/consent-analytics.md) | Track consent completion and compliance | 📋 Planned | Medium |

---

## Function Details

### 12.1.1 Consent Form Builder

**Purpose**: Create customizable consent form templates for different treatment types and requirements.

**Key Capabilities**:
- Template builder with drag-and-drop fields
- Pre-built templates for common orthodontic consents
- Rich text formatting for consent language
- Conditional logic for dynamic forms
- Multi-language support
- Template categorization (treatment, HIPAA, financial, imaging)
- Preview and testing before deployment

**User Stories**:
- As a **clinic admin**, I want to customize consent form language so that it reflects our practice policies
- As a **clinic admin**, I want to create treatment-specific consent forms for braces vs. Invisalign
- As a **compliance officer**, I want to ensure all required HIPAA language is included in privacy notices

**Orthodontic-Specific Templates**:
- General Treatment Consent (comprehensive orthodontic care)
- Braces-Specific Consent (brackets, wires, elastics risks)
- Clear Aligner Consent (Invisalign/ClearCorrect specific)
- Retention Consent (post-treatment retention phase)
- X-Ray/Imaging Consent (radiation exposure acknowledgment)
- Photo/Video Release (progress photos, social media, marketing)
- Financial Responsibility Agreement
- HIPAA Privacy Notice Acknowledgment
- Emergency Contact Authorization
- Minor Treatment Authorization

---

### 12.1.2 Digital Signature Capture

**Purpose**: Collect legally binding electronic signatures in-office and remotely.

**Key Capabilities**:
- In-office signature pad integration
- Touchscreen signature capture (iPad/tablet)
- Remote signature via email link
- SMS-based signature requests
- Patient portal signature collection
- Signature verification and audit trail
- Witness signature support
- IP address and timestamp logging

**User Stories**:
- As a **front desk staff**, I want patients to sign consent forms on a tablet so that we go paperless
- As a **patient**, I want to sign consent forms from home before my appointment
- As a **treatment coordinator**, I want to verify that all required signatures are collected before starting treatment

**Compliance Requirements**:
- E-SIGN Act compliance for electronic signatures
- Tamper-evident signature storage
- Complete audit trail (who signed, when, where, device)
- Signature authentication for remote signing
- Ability to print signed documents

---

### 12.1.3 Form Version Management

**Purpose**: Track consent form versions, manage updates, and maintain historical records.

**Key Capabilities**:
- Automatic version numbering
- Change tracking between versions
- Effective date management
- Grandfather existing consents when form changes
- Side-by-side version comparison
- Archive inactive versions
- Rollback capability

**User Stories**:
- As a **compliance officer**, I want to update our HIPAA notice and have new patients sign the updated version
- As a **clinic admin**, I want to see what changed between consent form versions
- As an **auditor**, I want to see which version of the consent form a patient signed

**Version Control Rules**:
- Active forms are versioned automatically on save
- Changes to forms create new versions, don't modify existing
- Patient signatures linked to specific form version
- Historical versions retained indefinitely
- Version effective dates control which version is presented

---

### 12.1.4 Consent Expiration Tracking

**Purpose**: Monitor consent validity and trigger renewal workflows when consents expire.

**Key Capabilities**:
- Configurable expiration periods by consent type
- Automatic expiration alerts (30/60/90 days)
- Renewal workflow automation
- Bulk renewal campaigns
- Expiration dashboard
- Re-consent requirement triggers (form updates, annual renewal)
- Integration with appointment scheduling

**User Stories**:
- As a **front desk staff**, I want to see which patients need consent renewals at their next appointment
- As a **clinic admin**, I want annual HIPAA acknowledgments to expire and be renewed
- As a **patient**, I want to be notified when I need to renew my consent forms

**Expiration Rules**:
| Consent Type | Typical Expiration | Renewal Trigger |
|--------------|-------------------|-----------------|
| Treatment Consent | Duration of treatment | Treatment phase change |
| HIPAA Privacy Notice | Annual | 12 months from signature |
| Photo Release | Annual or treatment duration | Annual review |
| Financial Agreement | Duration of payment plan | Plan modification |
| X-Ray Consent | Per imaging session | Each imaging appointment |
| Emergency Contact | Annual | 12 months from signature |

---

### 12.1.5 Minor/Guardian Consent Management

**Purpose**: Handle the complex consent requirements for minor patients including guardian authorization and custody considerations.

**Key Capabilities**:
- Guardian/parent consent collection
- Custody documentation upload
- Multi-guardian consent (divorced parents)
- Minor assent forms (age-appropriate acknowledgment)
- Age of majority transition handling
- Emergency treatment authorization
- Guardian relationship verification
- Delegation of consent authority

**User Stories**:
- As a **front desk staff**, I want to collect consent from the parent bringing the child in
- As a **clinic admin**, I want to document custody arrangements that affect who can consent
- As a **treatment coordinator**, I want to transition consent responsibility when a minor turns 18

**Minor Consent Rules**:
- All treatment for minors requires guardian consent
- Practice should document primary guardian for consent
- Custody documents should be on file when applicable
- Minor assent recommended for patients 12+ (not legally required)
- At age 18, patient assumes consent responsibility
- Emergency treatment may proceed with any present guardian

**Custody Scenarios**:
| Scenario | Consent Requirement |
|----------|---------------------|
| Married parents | Either parent can consent |
| Divorced - joint custody | Either parent can consent |
| Divorced - sole custody | Custodial parent required |
| Legal guardian | Guardian consent required |
| Foster care | Agency authorization required |
| Grandparent/other | Delegation of authority document |

---

### 12.1.6 Consent Analytics & Reporting

**Purpose**: Track consent completion rates, identify compliance gaps, and generate reports for audits.

**Key Capabilities**:
- Consent completion dashboard
- Missing consent alerts
- Compliance rate metrics
- Consent aging reports
- Audit-ready reports
- Patient consent history
- Staff performance metrics (consent collection rates)
- Expiration forecasting

**User Stories**:
- As a **clinic admin**, I want to see which patients are missing required consents
- As a **compliance officer**, I want to generate a report of all consent activity for an audit
- As a **clinic admin**, I want to track consent collection rates by staff member

**Key Metrics**:
- Consent completion rate (by type, by patient)
- Average time to collect consent
- Expiration rate and renewal compliance
- Missing consent by treatment phase
- Remote vs. in-office signature ratio
- Consent version distribution

---

## Data Model

```prisma
model ConsentTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  code          String   @unique  // e.g., "TREATMENT_CONSENT_BRACES"
  category      ConsentCategory
  description   String?

  // Content
  content       String   // Rich text/HTML content
  fields        Json     // Dynamic form fields configuration

  // Settings
  requiresWitness     Boolean @default(false)
  requiresGuardian    Boolean @default(false)  // For minors
  expirationDays      Int?    // null = never expires
  renewalRequired     Boolean @default(false)

  // Versioning
  version       Int      @default(1)
  effectiveDate DateTime @default(now())
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic       Clinic @relation(fields: [clinicId], references: [id])
  consents     PatientConsent[]
  versions     ConsentTemplateVersion[]

  @@index([clinicId])
  @@index([category])
  @@index([isActive])
  @@index([code])
}

enum ConsentCategory {
  TREATMENT           // Treatment consent forms
  HIPAA               // HIPAA privacy notices
  FINANCIAL           // Financial agreements
  IMAGING             // X-ray/photo consent
  MARKETING           // Marketing/social media
  EMERGENCY           // Emergency authorization
  MINOR               // Minor-specific consents
  OTHER
}

model ConsentTemplateVersion {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  templateId    String   @db.ObjectId

  // Version info
  version       Int
  content       String
  fields        Json
  changeNotes   String?

  // Effective period
  effectiveFrom DateTime
  effectiveTo   DateTime?  // null = current version

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String?  @db.ObjectId

  // Relations
  template  ConsentTemplate @relation(fields: [templateId], references: [id])
  consents  PatientConsent[]

  @@index([templateId])
  @@index([version])
}

model PatientConsent {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  templateId    String   @db.ObjectId
  versionId     String   @db.ObjectId

  // Consent details
  status        ConsentStatus @default(PENDING)

  // Form data (if dynamic fields)
  formData      Json?

  // Expiration
  signedAt      DateTime?
  expiresAt     DateTime?
  renewedFromId String?  @db.ObjectId  // Previous consent if renewal

  // Context
  treatmentPlanId String?  @db.ObjectId
  appointmentId   String?  @db.ObjectId

  // Delivery method
  deliveryMethod  ConsentDeliveryMethod @default(IN_OFFICE)
  sentAt          DateTime?
  sentTo          String?   // Email or phone if sent remotely

  // Document storage
  documentUrl     String?   // Signed PDF storage URL

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic       Clinic @relation(fields: [clinicId], references: [id])
  patient      Patient @relation(fields: [patientId], references: [id])
  template     ConsentTemplate @relation(fields: [templateId], references: [id])
  version      ConsentTemplateVersion @relation(fields: [versionId], references: [id])
  signatures   ConsentSignature[]
  renewedFrom  PatientConsent? @relation("ConsentRenewal", fields: [renewedFromId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  renewals     PatientConsent[] @relation("ConsentRenewal")

  @@index([clinicId])
  @@index([patientId])
  @@index([templateId])
  @@index([status])
  @@index([expiresAt])
  @@index([signedAt])
}

enum ConsentStatus {
  PENDING       // Awaiting signature
  SENT          // Sent for remote signature
  SIGNED        // Fully signed
  EXPIRED       // Past expiration date
  REVOKED       // Patient revoked consent
  SUPERSEDED    // Replaced by newer consent
}

enum ConsentDeliveryMethod {
  IN_OFFICE     // Signed on-site
  EMAIL         // Sent via email
  SMS           // Sent via SMS link
  PORTAL        // Patient portal
  PAPER         // Physical paper (scanned)
}

model ConsentSignature {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  consentId     String   @db.ObjectId

  // Signer info
  signerType    SignerType
  signerName    String
  signerEmail   String?
  signerPhone   String?
  relationship  String?   // For guardians: "Mother", "Father", "Legal Guardian"

  // Signature data
  signatureData String    // Base64 encoded signature image
  signatureHash String    // Hash for tamper detection

  // Verification
  signedAt      DateTime
  ipAddress     String?
  userAgent     String?
  deviceType    String?   // "iPad", "Desktop", "Mobile"
  geoLocation   Json?     // Approximate location if available

  // For remote signing
  verificationMethod String?  // "email_link", "sms_code", "portal_auth"
  verificationCode   String?

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

model GuardianConsent {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId  // Minor patient
  guardianId    String   @db.ObjectId  // Guardian patient/contact record

  // Relationship
  relationship  GuardianRelationship
  isPrimary     Boolean  @default(false)  // Primary consent authority

  // Legal documentation
  custodyType   CustodyType?
  custodyDocumentUrl String?
  courtOrderNumber   String?

  // Authorization scope
  canConsentTreatment   Boolean @default(true)
  canConsentFinancial   Boolean @default(true)
  canConsentImaging     Boolean @default(true)
  canPickUp             Boolean @default(true)
  canAccessRecords      Boolean @default(true)

  // Verification
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic     Clinic  @relation(fields: [clinicId], references: [id])
  patient    Patient @relation("MinorPatient", fields: [patientId], references: [id])
  guardian   Patient @relation("Guardian", fields: [guardianId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([guardianId])
}

enum GuardianRelationship {
  MOTHER
  FATHER
  STEPMOTHER
  STEPFATHER
  GRANDMOTHER
  GRANDFATHER
  LEGAL_GUARDIAN
  FOSTER_PARENT
  AUNT
  UNCLE
  SIBLING
  OTHER
}

enum CustodyType {
  JOINT_CUSTODY
  SOLE_CUSTODY
  LEGAL_GUARDIAN
  FOSTER_CARE
  OTHER
}
```

---

## API Endpoints

### Consent Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/consent-templates` | List consent templates | `consent:read` |
| GET | `/api/compliance/consent-templates/:id` | Get template details | `consent:read` |
| POST | `/api/compliance/consent-templates` | Create template | `consent:create` |
| PUT | `/api/compliance/consent-templates/:id` | Update template | `consent:create` |
| GET | `/api/compliance/consent-templates/:id/versions` | Get version history | `consent:read` |

### Patient Consents

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/consents` | List patient consents | `consent:read` |
| GET | `/api/compliance/consents/:id` | Get consent details | `consent:read` |
| POST | `/api/compliance/consents` | Create consent request | `consent:collect` |
| POST | `/api/compliance/consents/:id/send` | Send for remote signature | `consent:collect` |
| POST | `/api/compliance/consents/:id/sign` | Submit signature | `consent:collect` |
| GET | `/api/compliance/consents/:id/pdf` | Download signed PDF | `consent:read` |
| POST | `/api/compliance/consents/:id/revoke` | Revoke consent | `consent:collect` |

### Patient Consent Summary

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/patients/:id/consents` | Get patient's consent status | `consent:read` |
| GET | `/api/patients/:id/consents/missing` | Get missing required consents | `consent:read` |
| GET | `/api/patients/:id/consents/expiring` | Get expiring consents | `consent:read` |

### Guardian Management

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/patients/:id/guardians` | List patient's guardians | `consent:read` |
| POST | `/api/patients/:id/guardians` | Add guardian relationship | `consent:collect` |
| PUT | `/api/patients/:id/guardians/:guardianId` | Update guardian | `consent:collect` |
| DELETE | `/api/patients/:id/guardians/:guardianId` | Remove guardian | `consent:collect` |

### Consent Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/compliance/consents/report/completion` | Completion rate report | `audit:view_full` |
| GET | `/api/compliance/consents/report/expiring` | Expiring consents report | `consent:read` |
| GET | `/api/compliance/consents/report/missing` | Missing consents report | `consent:read` |
| GET | `/api/compliance/consents/report/audit` | Audit trail report | `audit:view_full` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ConsentTemplateBuilder` | Create/edit consent templates | `components/compliance/` |
| `ConsentTemplateList` | List available templates | `components/compliance/` |
| `ConsentForm` | Display consent for signing | `components/compliance/` |
| `SignaturePad` | Capture digital signatures | `components/compliance/` |
| `ConsentStatusBadge` | Show consent status | `components/compliance/` |
| `PatientConsentSummary` | Patient's consent overview | `components/compliance/` |
| `MissingConsentAlert` | Alert for missing consents | `components/compliance/` |
| `ConsentExpirationAlert` | Alert for expiring consents | `components/compliance/` |
| `GuardianManager` | Manage guardian relationships | `components/compliance/` |
| `ConsentComplianceDashboard` | Compliance metrics | `components/compliance/` |
| `ConsentHistoryTimeline` | Consent history view | `components/compliance/` |
| `RemoteSigningModal` | Send consent for remote signing | `components/compliance/` |

---

## Business Rules

1. **Required Consents**: Treatment cannot begin without required consents (treatment, HIPAA)
2. **Minor Patients**: All consents for patients under 18 require guardian signature
3. **Version Binding**: Patient signatures are permanently linked to the form version signed
4. **Expiration Enforcement**: Expired consents trigger renewal workflows automatically
5. **Signature Validity**: Electronic signatures must include timestamp, IP, and device info
6. **Consent Hierarchy**: Some consents (e.g., treatment) require specific other consents first
7. **Revocation**: Patients can revoke non-treatment consents; treatment revocation requires withdrawal
8. **Audit Immutability**: Consent records cannot be modified after signing, only superseded

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Patient Management | Required | Patient demographic data |
| Treatment Management | Required | Treatment plan linking |
| Appointment Management | Required | Appointment-triggered consents |
| Patient Communications | Required | Remote consent delivery |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| E-Signature Provider | Optional | DocuSign/HelloSign for advanced signatures |
| PDF Generation | Required | Generate signed consent PDFs |
| Cloud Storage | Required | Secure document storage |
| Email/SMS Service | Required | Remote consent delivery |

---

## Security Requirements

### Access Control
- **View consents**: clinical staff, billing, front_desk
- **Collect signatures**: clinical staff, front_desk
- **Create templates**: clinic_admin only
- **View audit trail**: clinic_admin, super_admin

### Audit Requirements
- Log all consent views and access
- Track signature collection with full metadata
- Record consent delivery and status changes
- Maintain immutable audit trail

### Data Protection
- Consent documents encrypted at rest
- Signatures stored with tamper-evident hashing
- PHI in consent forms protected per HIPAA
- Secure transmission for remote signing

---

## Related Documentation

- [Parent: Compliance & Documentation](../../)
- [Clinical Protocols](../clinical-protocols/)
- [Staff Training](../staff-training/)
- [Audit Management](../audit-management/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
