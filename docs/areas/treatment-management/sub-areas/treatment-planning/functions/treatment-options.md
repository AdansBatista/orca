# Treatment Options

> **Sub-Area**: [Treatment Planning](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Treatment Options enables creation of multiple treatment alternatives within a treatment plan, allowing patients to compare different appliance systems, durations, and costs. Each option defines a specific approach (e.g., traditional braces vs. Invisalign) with associated fees and recommendations, supporting informed patient decision-making during case presentation.

---

## Core Requirements

- [ ] Create multiple treatment options per plan
- [ ] Specify appliance system type for each option
- [ ] Set estimated duration and visit count per option
- [ ] Define fee structure including insurance estimates
- [ ] Mark one option as recommended with reasoning
- [ ] Track patient's selected option
- [ ] Support option comparison view
- [ ] Calculate complexity level per option

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/options` | `treatment:read` | List treatment options |
| POST | `/api/treatment-plans/:id/options` | `treatment:create` | Add treatment option |
| PUT | `/api/treatment-options/:optionId` | `treatment:update` | Update treatment option |
| DELETE | `/api/treatment-options/:optionId` | `treatment:update` | Remove treatment option |
| POST | `/api/treatment-options/:optionId/select` | `treatment:update` | Select treatment option |
| POST | `/api/treatment-options/:optionId/recommend` | `treatment:update` | Mark as recommended |

---

## Data Model

```prisma
model TreatmentOption {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  treatmentPlanId     String   @db.ObjectId

  // Option Details
  optionNumber        Int
  optionName          String
  description         String?

  // Appliance Type
  applianceType       ApplianceSystemType
  applianceDetails    Json?

  // Treatment Estimates
  estimatedDuration   Int?     // months
  estimatedVisits     Int?
  complexity          ComplexityLevel @default(MODERATE)

  // Financial
  totalFee            Decimal
  insuranceEstimate   Decimal?
  patientEstimate     Decimal?

  // Recommendation
  isRecommended       Boolean  @default(false)
  recommendationReason String?

  // Selection
  isSelected          Boolean  @default(false)
  selectedDate        DateTime?
  selectedBy          String?  @db.ObjectId

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([clinicId])
  @@index([treatmentPlanId])
}

enum ApplianceSystemType {
  TRADITIONAL_METAL
  CERAMIC_CLEAR
  SELF_LIGATING_DAMON
  LINGUAL_INCOGNITO
  INVISALIGN
  CLEAR_CORRECT
  FUNCTIONAL_APPLIANCE
  EXPANDER
}

enum ComplexityLevel {
  SIMPLE
  MODERATE
  COMPLEX
  SEVERE
}
```

---

## Business Rules

- Treatment plan must have at least one option before presentation
- Only one option can be marked as recommended per plan
- Only one option can be selected per plan
- Selected option links to case acceptance and financial setup
- Fee changes after selection require patient notification
- Option deletion not allowed after selection

---

## Dependencies

**Depends On:**
- Treatment Plan Creation (parent plan)
- Financial Management (fee integration)

**Required By:**
- Case Presentation (option display)
- Case Acceptance (selected option)

---

## Notes

- Consider provider-specific default options for common case types
- Appliance details JSON stores system-specific configuration (prescription, bracket type)
- Complexity level affects scheduling recommendations

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
