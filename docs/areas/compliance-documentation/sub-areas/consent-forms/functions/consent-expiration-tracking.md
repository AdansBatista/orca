# Consent Expiration Tracking

> **Sub-Area**: [Consent Forms](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Consent Expiration Tracking monitors the validity period of patient consents and triggers renewal workflows when consents approach expiration or require periodic re-acknowledgment. The system supports configurable expiration periods by consent type, automatic alerts at 30/60/90 day intervals, and integration with appointment scheduling to prompt renewals at upcoming visits.

---

## Core Requirements

- [ ] Configure expiration periods by consent type (annual, treatment duration, per-session)
- [ ] Generate automatic expiration alerts at configurable intervals (30/60/90 days)
- [ ] Support bulk renewal campaigns for expiring consents
- [ ] Display expiration dashboard for administrative review
- [ ] Trigger re-consent when form templates are updated
- [ ] Integrate with appointment scheduling to flag renewals needed
- [ ] Track renewal history and consent chains
- [ ] Support grace periods for operational flexibility

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/consents/expiring` | `consent:read` | List consents expiring within period |
| GET | `/api/patients/:id/consents/expiring` | `consent:read` | Get patient's expiring consents |
| POST | `/api/compliance/consents/:id/renew` | `consent:collect` | Initiate consent renewal |
| POST | `/api/compliance/consents/bulk-renewal` | `consent:collect` | Send bulk renewal requests |
| GET | `/api/compliance/consents/expiration-dashboard` | `consent:read` | Get expiration statistics |
| PUT | `/api/compliance/consent-templates/:id/expiration` | `consent:create` | Update expiration settings |

---

## Data Model

```prisma
model PatientConsent {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  templateId    String   @db.ObjectId
  versionId     String   @db.ObjectId

  // Consent status
  status        ConsentStatus @default(PENDING)

  // Expiration tracking
  signedAt      DateTime?
  expiresAt     DateTime?
  renewedFromId String?  @db.ObjectId  // Previous consent if renewal

  // Alert tracking
  alertsSent    Json?    // Array of alert dates and types sent
  lastAlertAt   DateTime?
  renewalRequested Boolean @default(false)
  renewalRequestedAt DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic       Clinic @relation(fields: [clinicId], references: [id])
  patient      Patient @relation(fields: [patientId], references: [id])
  renewedFrom  PatientConsent? @relation("ConsentRenewal")
  renewals     PatientConsent[] @relation("ConsentRenewal")

  @@index([clinicId])
  @@index([expiresAt])
  @@index([status])
}

enum ConsentStatus {
  PENDING       // Awaiting signature
  SENT          // Sent for remote signature
  SIGNED        // Fully signed
  EXPIRED       // Past expiration date
  REVOKED       // Patient revoked consent
  SUPERSEDED    // Replaced by renewed consent
}
```

---

## Business Rules

- Expiration rules by consent type:
  - Treatment Consent: Duration of treatment or phase change
  - HIPAA Privacy Notice: Annual (12 months from signature)
  - Photo Release: Annual or treatment duration
  - Financial Agreement: Duration of payment plan
  - X-Ray Consent: Per imaging session
- Expired consents prevent associated activities (e.g., expired photo release blocks photo capture)
- Renewal creates new consent record, marks old as SUPERSEDED
- Bulk renewals respect patient communication preferences
- Grace period (configurable, default 14 days) allows temporary continuation

---

## Dependencies

**Depends On:**
- Digital Signature Capture (provides signature dates)
- Patient Communications (delivers renewal notifications)
- Appointment Management (triggers renewal at appointments)

**Required By:**
- Consent Analytics (reports on expiration rates)
- Treatment Management (checks consent validity before procedures)
- Imaging Management (verifies imaging consent before capture)

---

## Notes

- Expiration dashboard should show: expiring this week, this month, this quarter
- Consider appointment-based reminders: "This patient has 2 consents expiring, collect at next visit"
- Renewal links should pre-populate patient information from previous consent
- HIPAA notices often require annual re-acknowledgment per compliance best practices

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
