# Lead Capture & Entry

> **Sub-Area**: [Lead Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Lead Capture & Entry provides multi-channel lead acquisition capabilities, capturing prospect information from web forms, phone inquiries, walk-ins, referrals, and social media. This is the entry point for all potential patients into the CRM pipeline, enabling treatment coordinators to begin the conversion process.

---

## Core Requirements

- [ ] Capture leads from web form submissions via webhook integration
- [ ] Enable quick phone call lead entry with minimal required fields
- [ ] Support walk-in registration at front desk with full detail capture
- [ ] Link referral leads to referring providers or existing patients
- [ ] Detect and warn on duplicate leads (matching phone, email, or name)
- [ ] Auto-assign leads to treatment coordinators based on rules
- [ ] Trigger initial follow-up task creation on lead capture

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/leads` | `lead:read` | List leads with filtering and pagination |
| GET | `/api/leads/:id` | `lead:read` | Get single lead details |
| POST | `/api/leads` | `lead:create` | Create new lead manually |
| POST | `/api/leads/webhook` | `webhook:lead` | Create lead from web form webhook |
| PUT | `/api/leads/:id` | `lead:update` | Update lead information |
| POST | `/api/leads/check-duplicate` | `lead:create` | Check for duplicate before creation |

---

## Data Model

```prisma
model Lead {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Lead status
  status        LeadStatus @default(NEW)
  pipelineStage String     @default("new_lead")

  // Patient information (who needs treatment)
  patientFirstName    String
  patientLastName     String
  patientDob          DateTime?
  patientRelationship PatientRelationship @default(SELF)

  // Contact information (responsible party)
  firstName     String
  lastName      String
  email         String?
  phone         String?
  phoneAlt      String?
  preferredContact PreferredContact @default(PHONE)
  preferredTime    String?

  // Source tracking
  sourceId      String   @db.ObjectId
  sourceCampaign String?
  sourceDetail  String?

  // Treatment interest
  treatmentInterest   TreatmentInterest[]
  notes               String?

  // Assignment
  assignedToId  String?  @db.ObjectId
  assignedAt    DateTime?

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  createdBy     String?  @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([status])
  @@index([phone])
  @@index([email])
}
```

---

## Business Rules

- All leads must have at least phone OR email for contact
- Phone leads require patient name and phone; other fields optional for speed
- Web form leads must include source tracking parameters
- Duplicate detection triggers on phone number match (fuzzy) or exact email match
- New leads auto-create "Initial Contact" task due within 5 minutes during business hours
- Lead data treated as potential PHI from creation

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)
- Lead Source Tracking (source selection)
- Coordinator Assignment (auto-assignment rules)

**Required By:**
- Conversion Pipeline (leads enter pipeline)
- Follow-up Management (initial tasks)
- Lead Analytics (capture metrics)

---

## Notes

- Speed-to-lead is critical: web form leads should be contactable within 5 minutes
- Consider caller ID integration for phone call pre-population
- Web form webhook should validate origin and include rate limiting
- Support bulk import for event/screening lead capture

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
