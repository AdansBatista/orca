# Lead Source Tracking

> **Sub-Area**: [Lead Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Lead Source Tracking manages the catalog of marketing channels and referral sources, enabling accurate attribution of where leads originate. This provides the foundation for marketing ROI analysis by tracking source at lead creation and measuring conversion rates and costs per source.

---

## Core Requirements

- [ ] Define and manage lead source categories (referral, web, advertising, etc.)
- [ ] Create custom sources within categories with descriptive names
- [ ] Track monthly cost per source for ROI calculation
- [ ] Associate every lead with a source at creation
- [ ] Support campaign tracking within sources (e.g., "Google Ads - Summer 2024")
- [ ] Activate/deactivate sources without deletion for historical integrity
- [ ] Provide source performance metrics and comparison

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lead-sources` | `lead:read` | List all lead sources |
| GET | `/api/lead-sources/:id` | `lead:read` | Get single source details |
| POST | `/api/lead-sources` | `lead:configure` | Create new lead source |
| PUT | `/api/lead-sources/:id` | `lead:configure` | Update lead source |
| DELETE | `/api/lead-sources/:id` | `lead:configure` | Deactivate lead source |
| GET | `/api/lead-sources/:id/stats` | `lead:analytics` | Get source performance metrics |

---

## Data Model

```prisma
model LeadSource {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Source definition
  name          String
  category      LeadSourceCategory
  description   String?

  // Tracking
  isActive      Boolean  @default(true)

  // Cost tracking (for ROI)
  monthlyCost   Decimal?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  leads         Lead[]

  @@unique([clinicId, name])
  @@index([clinicId])
}

enum LeadSourceCategory {
  DOCTOR_REFERRAL
  PATIENT_REFERRAL
  WEB_ORGANIC
  WEB_PAID
  WEB_SOCIAL
  PRINT_AD
  COMMUNITY_EVENT
  SCHOOL_SCREENING
  WALK_IN
  OTHER
}
```

---

## Business Rules

- Source name must be unique within a clinic
- Deactivated sources remain for historical reporting but cannot be assigned to new leads
- Cost tracking is optional but recommended for paid sources
- Default sources should be seeded on clinic creation
- "How did you hear about us?" dropdown uses active sources
- Doctor referral category should link to ReferringProvider when selected

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)
- Referral Tracking (doctor/patient referral linking)

**Required By:**
- Lead Capture (source selection)
- Lead Analytics (source performance reports)

---

## Notes

- Consider multi-touch attribution in future (first touch vs. last touch)
- Campaign field allows granular tracking within a source
- Seed standard sources on clinic setup to ensure consistency
- Source categories should not be clinic-configurable (system-defined)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
