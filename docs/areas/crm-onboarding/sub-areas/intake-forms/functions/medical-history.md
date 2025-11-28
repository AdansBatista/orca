# Medical History Collection

> **Sub-Area**: [Intake Forms](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Medical History Collection captures comprehensive health information relevant to orthodontic treatment, including general health conditions, medications, allergies, and for pediatric patients, growth and development history. This data integrates directly into the patient's medical record and alerts clinical staff to important health considerations.

---

## Core Requirements

- [ ] Collect structured medical history via standardized questionnaire
- [ ] Capture current medications with dosages and frequencies
- [ ] Document allergies with severity levels (especially latex and metals)
- [ ] Track previous hospitalizations and surgeries
- [ ] Capture pediatric growth and development information for minors
- [ ] Integrate submitted data into patient medical record
- [ ] Flag critical health conditions for clinical alerts

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/patients/:id/medical-history` | `patient:read` | Get current medical history |
| PUT | `/api/patients/:id/medical-history` | `patient:update` | Update medical history |
| GET | `/api/patients/:id/medical-history/versions` | `patient:read` | List history versions |
| POST | `/api/patients/:id/medical-history/alerts` | `patient:update` | Add clinical alert |
| GET | `/api/patients/:id/allergies` | `patient:read` | Get patient allergies |

---

## Data Model

```prisma
model MedicalHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Version tracking
  version       Int      @default(1)
  isActive      Boolean  @default(true)

  // General health
  generalHealth       String?  // Excellent, Good, Fair, Poor
  underPhysicianCare  Boolean  @default(false)
  physicianName       String?
  physicianPhone      String?
  lastPhysicalExam    DateTime?

  // Conditions (stored as JSON for flexibility)
  conditions          Json
  conditionNotes      String?

  // Medications
  medications         Medication[]

  // Allergies
  allergies           Allergy[]
  hasLatexAllergy     Boolean  @default(false)
  hasMetalAllergy     Boolean  @default(false)

  // Hospitalizations
  hospitalizations    Hospitalization[]

  // For minors
  birthComplications  String?
  developmentalConcerns String?
  currentGrowthStage  String?

  // Source submission
  submissionId        String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
}
```

---

## Business Rules

- Medical history required before first clinical appointment
- Latex allergy triggers glove protocol alert at check-in
- Metal allergy (nickel) flags for bracket selection consideration
- Medical history expires after 12 months; renewal reminder sent
- Updates create new version; previous versions retained for audit
- Certain conditions auto-generate clinical alerts (e.g., heart murmur, bleeding disorders)
- Pediatric fields only displayed for patients under 18
- Physician contact captured for medical consultation if needed

---

## Dependencies

**Depends On:**
- Patient Form Portal (data entry interface)
- Form Template Builder (medical history form template)
- Auth (patient record access)

**Required By:**
- Patient Flow (check-in alerts)
- Treatment Management (treatment planning considerations)
- Compliance & Documentation (health record documentation)

---

## Notes

- Consider integration with pharmacy databases for medication lookup
- Drug interaction checking would enhance safety
- Support free-text "other conditions" with structured categorization
- Annual update reminder workflow for multi-year treatments

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
