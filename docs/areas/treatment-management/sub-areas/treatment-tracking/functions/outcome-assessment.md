# Outcome Assessment

> **Sub-Area**: [Treatment Tracking](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Outcome Assessment documents comprehensive treatment outcomes at completion, comparing initial and final measurements, evaluating objective achievement, recording complications, and capturing patient satisfaction. The function supports before/after image documentation and generates outcome reports for quality improvement and practice analytics.

---

## Core Requirements

- [ ] Record treatment outcome rating
- [ ] Compare initial and final measurements
- [ ] Document objectives achieved vs. planned
- [ ] Calculate treatment duration and visit statistics
- [ ] Record complications encountered
- [ ] Capture patient satisfaction score and feedback
- [ ] Store before/after images
- [ ] Generate outcome reports for analytics

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/outcome` | `outcome:read` | Get treatment outcome |
| POST | `/api/treatment-plans/:id/outcome` | `outcome:assess` | Create outcome record |
| PUT | `/api/outcomes/:id` | `outcome:assess` | Update outcome |
| GET | `/api/outcomes/analytics` | `outcome:read` | Outcome analytics |
| GET | `/api/outcomes/by-provider/:providerId` | `outcome:read` | Provider outcomes |
| GET | `/api/outcomes/by-treatment-type` | `outcome:read` | Outcomes by type |

---

## Data Model

```prisma
model TreatmentOutcome {
  id                        String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId                  String   @db.ObjectId
  treatmentPlanId           String   @db.ObjectId @unique

  // Assessment
  assessmentDate            DateTime
  assessedBy                String   @db.ObjectId

  // Overall Rating
  overallOutcome            OutcomeRating

  // Objectives
  objectivesAchieved        Int
  totalObjectives           Int

  // Measurements Comparison
  initialMeasurements       Json?
  finalMeasurements         Json?

  // Duration Statistics
  plannedDuration           Int?     // months
  actualDuration            Int?     // months
  plannedVisits             Int?
  actualVisits              Int?

  // Complications
  complications             String[]

  // Patient Satisfaction
  patientSatisfactionScore  Int?     // 1-10
  patientFeedback           String?

  // Clinical Assessment Scores (1-10)
  alignmentScore            Int?
  occlusionScore            Int?
  estheticsScore            Int?

  // Images
  beforeImageIds            String[] @db.ObjectId
  afterImageIds             String[] @db.ObjectId

  // Notes
  clinicalNotes             String?
  lessonsLearned            String?

  // Timestamps
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  @@index([clinicId])
  @@index([treatmentPlanId])
}

enum OutcomeRating {
  EXCELLENT      // All objectives exceeded
  GOOD           // All objectives met
  SATISFACTORY   // Minor compromises
  FAIR           // Significant compromises
  POOR           // Goals not achieved
  INCOMPLETE     // Treatment not finished
}
```

---

## Business Rules

- Outcome assessment required at treatment completion
- Before images from initial records, after from debond
- Measurement comparison shows quantitative improvement
- Duration accuracy = actual / planned duration
- Patient satisfaction captured via survey or verbal
- Complications documented for learning and reporting

---

## Dependencies

**Depends On:**
- Treatment Planning (treatment goals, estimates)
- Clinical Measurements (initial/final data)
- Imaging Management (before/after images)
- Debond Scheduling (treatment completion)

**Required By:**
- Reporting & Analytics (outcome statistics)
- Quality Improvement (practice analytics)

---

## Notes

- Outcome data valuable for practice marketing (with consent)
- Consider standardized outcome grading (e.g., ABO criteria)
- Lessons learned improve future case management
- Provider-level outcomes useful for peer review

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
