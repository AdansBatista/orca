# Family Account Management

> **Sub-Area**: [Patient Billing](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Family Account Management links and manages accounts for family members with shared financial responsibility. This is common in orthodontics where parents have multiple children in treatment simultaneously. The function enables combined statements, shared payment plans, credit transfers between family members, and consolidated family balance views.

---

## Core Requirements

- [ ] Create family account groups linking related patients
- [ ] Designate primary guarantor responsible for family balance
- [ ] Option to split or combine statements for family
- [ ] Transfer credits between family member accounts
- [ ] Track total family balance across all members
- [ ] Coordinate payment plans across family members
- [ ] Support different guarantors for different family members
- [ ] Family discount application for multiple patients in treatment

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/billing/family-groups` | `billing:read` | List family groups |
| GET | `/api/billing/family-groups/:id` | `billing:read` | Get family group details |
| POST | `/api/billing/family-groups` | `billing:create` | Create family group |
| PUT | `/api/billing/family-groups/:id` | `billing:update` | Update family group |
| POST | `/api/billing/family-groups/:id/add-member` | `billing:update` | Add member to group |
| POST | `/api/billing/family-groups/:id/remove-member` | `billing:update` | Remove member from group |
| POST | `/api/billing/family-groups/:id/transfer-credit` | `billing:adjust_balance` | Transfer credit between members |
| GET | `/api/billing/family-groups/:id/balance` | `billing:read` | Get combined family balance |

---

## Data Model

```prisma
model FamilyGroup {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Group details
  groupName     String?  // e.g., "Smith Family"
  primaryGuarantorId String @db.ObjectId

  // Statement preferences
  combinedStatements Boolean @default(true)
  singlePaymentPlan  Boolean @default(false)

  // Computed balances (cached)
  totalBalance       Decimal @default(0)
  totalInsuranceBalance Decimal @default(0)
  totalPatientBalance   Decimal @default(0)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  members   FamilyGroupMember[]

  @@index([clinicId])
  @@index([primaryGuarantorId])
}

model FamilyGroupMember {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  familyGroupId String   @db.ObjectId
  accountId     String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Member details
  relationship  FamilyRelationship
  isPrimaryGuarantor Boolean @default(false)

  // Timestamps
  addedAt DateTime @default(now())
  addedBy String?  @db.ObjectId

  // Relations
  familyGroup FamilyGroup @relation(fields: [familyGroupId], references: [id])

  @@index([familyGroupId])
  @@index([accountId])
}

enum FamilyRelationship {
  SELF
  SPOUSE
  CHILD
  PARENT
  SIBLING
  OTHER
}
```

---

## Business Rules

- Family group must have exactly one primary guarantor
- Guarantor must be an adult patient (18+ or special designation)
- Credit transfers require audit logging
- Combined statements show all family member balances
- Family discounts applied based on number of concurrent treatments
- Removing a member recalculates family balance
- Member can only belong to one family group

---

## Dependencies

**Depends On:**
- Patient Account Management (individual accounts)
- CRM & Onboarding (patient relationships)

**Required By:**
- Statement Generation (combined statements)
- Payment Plan Builder (family payment plans)
- Collections Management (family collection coordination)

---

## Notes

- Family group creation can be triggered automatically from patient relationship data
- Consider supporting multiple guarantors (e.g., divorced parents)
- Track historical family membership for audit purposes
- Family balance view should be accessible from any family member's account

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
