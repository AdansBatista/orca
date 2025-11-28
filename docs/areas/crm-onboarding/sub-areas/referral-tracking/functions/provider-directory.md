# Referring Provider Directory

> **Sub-Area**: [Referral Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Referring Provider Directory maintains a comprehensive database of general dentists, specialists, and other healthcare providers who refer patients to the orthodontic practice. It stores contact information, communication preferences, relationship history, and provides the foundation for referral attribution and professional communication.

---

## Core Requirements

- [ ] Create and manage referring provider profiles with full contact details
- [ ] Track provider practice information (name, address, staff contacts)
- [ ] Record communication preferences (fax, email, portal)
- [ ] Maintain relationship notes and strength ratings
- [ ] Support provider search and filtering
- [ ] Track provider portal access credentials
- [ ] Enable bulk import from dental directories

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/referring-providers` | `referral:read` | List providers with filters |
| GET | `/api/referring-providers/:id` | `referral:read` | Get provider details |
| POST | `/api/referring-providers` | `referral:manage_providers` | Create provider |
| PUT | `/api/referring-providers/:id` | `referral:manage_providers` | Update provider |
| DELETE | `/api/referring-providers/:id` | `referral:manage_providers` | Deactivate provider |
| GET | `/api/referring-providers/:id/referrals` | `referral:read` | Get provider's referrals |
| POST | `/api/referring-providers/import` | `referral:manage_providers` | Bulk import providers |

---

## Data Model

```prisma
model ReferringProvider {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Provider info
  providerType  ProviderType
  firstName     String
  lastName      String
  credentials   String?  // DDS, DMD, etc.
  specialty     String?

  // Practice info
  practiceName  String?
  npi           String?

  // Contact info
  addressLine1  String?
  addressLine2  String?
  city          String?
  state         String?
  postalCode    String?
  phone         String?
  fax           String?
  email         String?
  website       String?

  // Office contacts
  officeManager String?
  referralCoordinator String?
  preferredContact String?

  // Communication preferences
  preferredMethod CommunicationMethod @default(FAX)
  reportsOptedIn  Boolean @default(true)
  reportFrequency ReportFrequency @default(MILESTONE)

  // Relationship tracking
  relationshipStart DateTime?
  relationshipStrength RelationshipStrength @default(MODERATE)
  notes             String?

  // Portal access
  portalEnabled     Boolean @default(false)
  portalEmail       String?

  // Status
  isActive      Boolean  @default(true)

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([lastName])
  @@index([practiceName])
}

enum ProviderType {
  GENERAL_DENTIST
  PEDIATRIC_DENTIST
  ORAL_SURGEON
  PERIODONTIST
  ENDODONTIST
  TMJ_SPECIALIST
  ENT
  OTHER_SPECIALIST
}

enum RelationshipStrength {
  NEW
  DEVELOPING
  MODERATE
  STRONG
  VIP
}
```

---

## Business Rules

- Provider names should be unique within a clinic (fuzzy matching on create)
- Deactivated providers retain history but excluded from selection dropdowns
- Relationship strength manually set or calculated from referral volume
- VIP providers get priority handling for letters and reports
- Portal access requires valid email address
- NPI validation if provided (10-digit format)
- Provider type determines available in specialist referral selection

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)

**Required By:**
- Referral Source Attribution (provider selection)
- Acknowledgment Letters (recipient details)
- Progress Reports (recipient details)
- Specialist Network (specialist selection)

---

## Notes

- Consider integration with NPI registry for provider validation
- Support for provider merge if duplicates discovered
- Provider relationship history visualization (timeline)
- Bulk import should handle duplicates gracefully

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
