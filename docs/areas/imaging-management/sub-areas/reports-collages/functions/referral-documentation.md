# Referral Documentation

> **Sub-Area**: [Reports & Collages](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Referral Documentation creates professional referral letters and documentation with embedded images for referring dentists. The system provides referral letter templates, automatic treatment summary generation, image collage embedding, multi-channel delivery (fax, email, portal), and acknowledgment tracking for complete referral communication management.

---

## Core Requirements

- [ ] Create and manage referral letter templates
- [ ] Embed image collages in referral documents
- [ ] Auto-generate treatment summaries from clinical data
- [ ] Integrate with referring doctor database (CRM)
- [ ] Deliver via fax, email, or referrer portal
- [ ] Enable portal sharing for referring dentists
- [ ] Track acknowledgment and read receipts
- [ ] Generate progress update reports automatically
- [ ] Create final outcome letters at treatment completion
- [ ] Export high-quality PDF documents

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/referral-docs/:patientId` | `imaging:view` | List patient referral docs |
| GET | `/api/imaging/referral-docs/:id` | `imaging:view` | Get document details |
| POST | `/api/imaging/referral-docs` | `imaging:export` | Create referral document |
| PUT | `/api/imaging/referral-docs/:id` | `imaging:export` | Update document |
| DELETE | `/api/imaging/referral-docs/:id` | `imaging:export` | Delete document |
| POST | `/api/imaging/referral-docs/:id/send` | `imaging:export` | Send to provider |
| GET | `/api/imaging/referral-docs/:id/pdf` | `imaging:export` | Download PDF |
| GET | `/api/imaging/referral-docs/:id/status` | `imaging:view` | Get delivery status |
| GET | `/api/imaging/referral-templates` | `imaging:view` | List letter templates |
| POST | `/api/imaging/referral-templates` | `imaging:admin` | Create template |

---

## Data Model

```prisma
model ReferralDocument {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  patientId           String   @db.ObjectId
  referringProviderId String   @db.ObjectId
  documentType        ReferralDocType
  title               String
  status              DocumentStatus @default(DRAFT)

  // Content
  content             String           // Rich text/HTML content
  collageId           String?  @db.ObjectId  // Attached collage
  attachments         Json?            // Additional attachment references

  // Template used
  templateId          String?  @db.ObjectId

  // Generated output
  pdfUrl              String?

  // Delivery
  deliveryMethod      DeliveryMethod?
  deliveryAddress     String?          // Email, fax, or portal URL
  sentAt              DateTime?
  deliveredAt         DateTime?
  acknowledgedAt      DateTime?
  failureReason       String?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  createdBy           String   @db.ObjectId
  sentBy              String?  @db.ObjectId

  clinic              Clinic   @relation(fields: [clinicId], references: [id])
  patient             Patient  @relation(fields: [patientId], references: [id])
  @@index([clinicId])
  @@index([patientId])
  @@index([referringProviderId])
  @@index([status])
}

enum ReferralDocType {
  ACKNOWLEDGMENT     // Receipt of referral confirmation
  CONSULTATION       // Initial consultation findings
  TREATMENT_PLAN     // Proposed treatment with images
  PROGRESS_UPDATE    // Periodic progress report
  FINAL_REPORT       // Treatment completion outcome
}

enum DocumentStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  SENT
  DELIVERED
  ACKNOWLEDGED
  FAILED
}

enum DeliveryMethod {
  EMAIL
  FAX
  PORTAL
  PRINT
}

model ReferralLetterTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  documentType  ReferralDocType
  content       String           // Template with merge fields
  includeCollage Boolean @default(true)
  collageTemplateId String?  @db.ObjectId
  isDefault     Boolean @default(false)
  isActive      Boolean @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
  @@index([documentType])
}

// Merge fields: {{patient.name}}, {{provider.name}}, {{treatment.summary}}, etc.
```

---

## Business Rules

- Documents require referring provider selection from CRM
- Sent documents cannot be edited; create new version instead
- Progress updates can be scheduled for active treatments
- Final report triggers automatically at debond milestone
- Fax delivery requires configured fax service
- Portal sharing creates time-limited access link
- Acknowledgment tracking via read receipts or portal login

---

## Dependencies

**Depends On:**
- Auth & Authorization (export permissions)
- CRM & Onboarding (referral provider data)
- Progress Collage Generation (collage creation)
- Treatment Management (treatment summaries)

**Required By:**
- Referral tracking workflows
- Provider relationship management
- Treatment documentation

---

## Notes

- Integrate with fax service (eFax, Phaxio, etc.) for fax delivery
- Email delivery should use practice email domain
- Portal access should be simple (no account required, magic link)
- Consider HIPAA-compliant secure messaging for sensitive content

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
