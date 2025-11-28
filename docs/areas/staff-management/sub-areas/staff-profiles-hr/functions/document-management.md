# Document Management

> **Sub-Area**: [Staff Profiles & HR](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Securely store and manage HR-related documents including employment contracts, NDAs, credential copies, performance reviews, and tax forms. Implements access control based on document type and provides version history for updated documents.

---

## Core Requirements

- [ ] Upload and store HR documents securely
- [ ] Categorize documents by type
- [ ] Implement access control based on document type
- [ ] Track document expiration dates where applicable
- [ ] Maintain version history for updated documents
- [ ] Support secure document download
- [ ] Encrypt documents at rest

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/documents` | `staff:view_hr` | List staff documents |
| POST | `/api/staff/:id/documents` | `staff:update` | Upload document |
| GET | `/api/staff/documents/:docId` | `staff:view_hr` | Download document |
| DELETE | `/api/staff/documents/:docId` | `staff:delete` | Delete document |
| GET | `/api/staff/:id/documents/:type` | `staff:view_hr` | Get documents by type |

---

## Data Model

```prisma
model StaffDocument {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  documentType  StaffDocumentType
  documentName  String
  description   String?
  fileUrl       String
  fileName      String
  fileSize      Int
  mimeType      String

  documentDate  DateTime?
  expirationDate DateTime?

  accessLevel   DocumentAccessLevel @default(HR_ONLY)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  uploadedBy    String   @db.ObjectId

  @@index([staffProfileId])
  @@index([documentType])
}

enum StaffDocumentType {
  CONTRACT
  NDA
  CREDENTIAL_COPY
  CERTIFICATION_COPY
  PERFORMANCE_REVIEW
  DISCIPLINARY
  BACKGROUND_CHECK
  I9_FORM
  W4_FORM
  DIRECT_DEPOSIT
  HANDBOOK_ACKNOWLEDGMENT
  OTHER
}

enum DocumentAccessLevel {
  PUBLIC           // Staff can view own
  HR_ONLY          // HR/Admin only
  MANAGEMENT       // Management and above
  CONFIDENTIAL     // Clinic admin only
}
```

---

## Business Rules

- Staff can view their own PUBLIC documents
- HR documents (I-9, W-4) require HR_ONLY access
- Disciplinary documents require MANAGEMENT access
- Background checks require CONFIDENTIAL access
- Documents retained per regulatory requirements (varies by type)
- All document access logged for compliance
- File size limits apply (configurable, default 10MB)
- Supported formats: PDF, DOCX, JPG, PNG

---

## Dependencies

**Depends On:**
- Employee Profiles
- Document Storage Service
- Audit Logging

**Required By:**
- Credential Management (copies)
- Certification Tracking (certificates)
- Performance Reviews (signed documents)
- Compliance audits

---

## Notes

- Consider: automated document expiration reminders
- Consider: bulk document upload for onboarding
- Documents should be encrypted at rest
- Regular backups required for compliance
