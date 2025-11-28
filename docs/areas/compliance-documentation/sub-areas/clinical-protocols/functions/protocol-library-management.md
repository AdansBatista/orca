# Protocol Library Management

> **Sub-Area**: [Clinical Protocols](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Protocol Library Management provides a centralized repository for creating, organizing, and maintaining all clinical protocols, procedure documentation, and standard operating procedures. It enables clinics to document standardized procedures, track protocol acknowledgments by staff, manage scheduled reviews, and ensure consistent clinical practices across the organization.

---

## Core Requirements

- [ ] Create and edit protocol documents with rich text formatting
- [ ] Categorize protocols (clinical procedures, infection control, imaging, emergency, safety)
- [ ] Track protocol versions with change history
- [ ] Schedule periodic protocol reviews (monthly, quarterly, annual)
- [ ] Require staff acknowledgment of new/updated protocols
- [ ] Provide quick search and access during procedures
- [ ] Support attachments (images, videos, reference documents)
- [ ] Generate print-friendly protocol formats

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/protocols` | `protocol:read` | List all protocols |
| GET | `/api/compliance/protocols/:id` | `protocol:read` | Get protocol details |
| POST | `/api/compliance/protocols` | `protocol:create` | Create new protocol |
| PUT | `/api/compliance/protocols/:id` | `protocol:create` | Update protocol |
| DELETE | `/api/compliance/protocols/:id` | `protocol:create` | Archive protocol |
| POST | `/api/compliance/protocols/:id/acknowledge` | `protocol:execute` | Acknowledge protocol |
| GET | `/api/compliance/protocols/:id/acknowledgments` | `protocol:read` | Get acknowledgment status |
| GET | `/api/compliance/protocols/search` | `protocol:read` | Search protocols |

---

## Data Model

```prisma
model Protocol {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Protocol info
  name          String
  code          String   @unique  // e.g., "STERILIZATION_AUTOCLAVE"
  category      ProtocolCategory
  description   String?

  // Content
  content       String   // Rich text content
  steps         Json     // Ordered steps array
  attachments   String[] // Document/image URLs

  // Review settings
  reviewFrequency  ReviewFrequency @default(ANNUAL)
  lastReviewDate   DateTime?
  nextReviewDate   DateTime?
  reviewedBy       String?  @db.ObjectId

  // Acknowledgment settings
  requiresAcknowledgment Boolean @default(true)
  requiredForRoles       String[] // Roles that must acknowledge

  // Versioning
  version       Int      @default(1)
  isActive      Boolean  @default(true)

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic            Clinic @relation(fields: [clinicId], references: [id])
  versions          ProtocolVersion[]
  acknowledgments   ProtocolAcknowledgment[]

  @@index([clinicId])
  @@index([category])
  @@index([code])
  @@index([isActive])
}

enum ProtocolCategory {
  CLINICAL_PROCEDURE
  INFECTION_CONTROL
  STERILIZATION
  IMAGING
  EMERGENCY
  SAFETY
  ADMINISTRATIVE
  EQUIPMENT
}

enum ReviewFrequency {
  MONTHLY
  QUARTERLY
  SEMI_ANNUAL
  ANNUAL
  BIENNIAL
}
```

---

## Business Rules

- Protocol codes must be unique for clear identification
- Updates to active protocols create new versions automatically
- Staff must acknowledge updated protocols before next shift
- Review due dates generate alerts to designated reviewers
- Protocols cannot be hard-deleted, only archived
- Required roles must acknowledge within 7 days of update (configurable)
- Quick access shortcuts available for frequently used protocols

---

## Dependencies

**Depends On:**
- Auth & User Management (staff roles for acknowledgment requirements)
- Staff Management (staff assignments for acknowledgment tracking)

**Required By:**
- Daily Operational Checklists (references protocol procedures)
- Sterilization & Infection Control (specialized protocol category)
- Equipment Safety Monitoring (references equipment protocols)

---

## Notes

- Protocol categories for orthodontics: new patient exam, bonding, adjustments, debond, retention, imaging series
- Consider workflow integration: link protocols to appointment types for easy access
- Mobile-friendly protocol viewer essential for chairside reference
- Version comparison should highlight changed sections clearly

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
