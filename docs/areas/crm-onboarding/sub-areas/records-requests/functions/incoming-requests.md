# Incoming Records Management

> **Sub-Area**: [Records Requests](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Incoming Records Management handles the process of requesting and receiving patient records from previous healthcare providers for new patients. It enables staff to create standardized request letters, track request status, follow up on outstanding requests, and log receipt of records for integration into the patient's chart.

---

## Core Requirements

- [ ] Create records request for new patients with previous provider details
- [ ] Generate standardized request letters with patient authorization
- [ ] Track request status through complete lifecycle
- [ ] Send request via fax, email, or portal
- [ ] Schedule and log follow-up attempts
- [ ] Log receipt of records with date and method
- [ ] Integrate received records into patient document management

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/records-requests` | `records:read` | List requests with filters |
| GET | `/api/records-requests/:id` | `records:read` | Get request details |
| POST | `/api/records-requests` | `records:create` | Create incoming request |
| PUT | `/api/records-requests/:id` | `records:update` | Update request details |
| POST | `/api/records-requests/:id/send` | `records:send` | Send request letter |
| POST | `/api/records-requests/:id/receive` | `records:update` | Log records receipt |
| GET | `/api/records-requests/outstanding` | `records:read` | Get outstanding requests |

---

## Data Model

```prisma
model RecordsRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Request type
  direction     RequestDirection  // INCOMING
  requestType   RecordsRequestType

  // Patient
  patientId     String   @db.ObjectId

  // External provider
  externalProviderName    String
  externalProviderAddress String?
  externalProviderPhone   String?
  externalProviderFax     String?
  externalProviderEmail   String?
  contactPerson           String?

  // Request details
  recordsRequested    String[]  // Types of records needed
  dateRangeStart      DateTime?
  dateRangeEnd        DateTime?
  purpose             String?
  urgency             RequestUrgency @default(ROUTINE)
  notes               String?

  // Authorization
  authorizationId     String?  @db.ObjectId
  authorizationVerified Boolean @default(false)

  // Status tracking
  status              RecordsRequestStatus @default(CREATED)

  // Timing
  requestDate         DateTime @default(now())
  sentDate            DateTime?
  dueDate             DateTime?
  completedDate       DateTime?

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
  @@index([dueDate])
}

enum RecordsRequestType {
  FULL_RECORDS
  TREATMENT_SUMMARY
  XRAYS_ONLY
  PHOTOS_ONLY
  SPECIFIC_DOCUMENTS
  TRANSFER_PACKAGE
}
```

---

## Business Rules

- Authorization must be verified before sending request
- Due date calculated based on state regulations (typically 30 days from send)
- Follow-up scheduled at 7, 14, 21 days if no response
- Urgent requests flagged for expedited handling
- Records types help external provider understand scope needed
- Previous provider contact info captured for correspondence
- Receipt logging triggers document integration workflow
- Outstanding requests visible on daily operations dashboard

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)
- Authorization Verification (valid consent required)
- Patient Communications (request delivery)
- Document Management (received records storage)

**Required By:**
- Transfer Status Tracking (request lifecycle)
- Compliance Monitoring (timing compliance)
- Patient Flow (records readiness for appointments)

---

## Notes

- Consider integration with eFax services for automated sending
- Support for re-request if records incomplete
- Track multiple requests to same provider if needed
- Identify common referring providers for relationship building

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
