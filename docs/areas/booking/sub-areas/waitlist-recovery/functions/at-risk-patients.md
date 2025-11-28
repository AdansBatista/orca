# At-Risk Patient Identification

> **Sub-Area**: [Waitlist & Recovery](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

At-Risk Patient Identification uses appointment behavior patterns to identify patients at risk of dropping out of treatment. This function calculates risk scores, flags patients needing intervention, and provides recommended actions to prevent patient loss and ensure treatment completion.

---

## Core Requirements

- [ ] Flag patients with multiple missed appointments
- [ ] Analyze appointment frequency trends
- [ ] Correlate with treatment progress milestones
- [ ] Calculate risk scores using weighted factors
- [ ] Generate alerts for at-risk patients
- [ ] Provide recommended interventions
- [ ] Match historical dropout patterns
- [ ] AI-powered prediction models
- [ ] Dashboard for at-risk patient review
- [ ] Track intervention outcomes

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/at-risk` | `booking:view_analytics` | List at-risk patients |
| GET | `/api/booking/at-risk/:patientId` | `booking:view_analytics` | Get risk details |
| POST | `/api/booking/at-risk/:patientId/review` | `booking:view_analytics` | Mark as reviewed |
| POST | `/api/booking/at-risk/:patientId/intervene` | `booking:view_analytics` | Log intervention |
| GET | `/api/booking/at-risk/calculate` | `booking:view_analytics` | Trigger risk recalculation |
| GET | `/api/booking/at-risk/summary` | `booking:view_analytics` | Risk summary stats |
| GET | `/api/booking/at-risk/export` | `booking:view_analytics` | Export at-risk list |

---

## Data Model

```prisma
model PatientRiskScore {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Risk assessment
  riskScore     Float    // 0-100, higher = more at risk
  riskLevel     RiskLevel
  calculatedAt  DateTime @default(now())

  // Risk factors
  riskFactors   RiskFactor[]

  // Recommendations
  recommendedActions String[]

  // Status
  status        RiskStatus @default(ACTIVE)
  reviewedAt    DateTime?
  reviewedBy    String?  @db.ObjectId
  reviewNotes   String?

  // Intervention
  interventionStatus  InterventionStatus?
  interventionAt      DateTime?
  interventionBy      String?  @db.ObjectId
  interventionNotes   String?

  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([riskLevel])
  @@index([status])
}

enum RiskLevel {
  LOW        // Score 0-25
  MEDIUM     // Score 26-50
  HIGH       // Score 51-75
  CRITICAL   // Score 76-100
}

enum RiskStatus {
  ACTIVE
  REVIEWED
  RESOLVED
  DROPPED_OUT
}

enum InterventionStatus {
  PENDING
  IN_PROGRESS
  SUCCESSFUL
  UNSUCCESSFUL
}

type RiskFactor {
  factor       String
  weight       Float
  description  String
  value        String?
}
```

### Risk Factors and Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| Consecutive no-shows | 30 | 2+ consecutive no-shows |
| Decreasing frequency | 20 | Appointments spacing increasing |
| Multiple reschedules | 15 | 3+ reschedules in 90 days |
| Long appointment gap | 15 | Over 60 days since last visit |
| Incomplete milestones | 10 | Behind on treatment plan |
| Payment issues | 5 | Outstanding balance > 90 days |
| Non-responsive | 5 | No response to 3+ contacts |

---

## Business Rules

- Risk scores recalculated weekly or after each appointment event
- Patients with 2+ no-shows in 90 days automatically flagged HIGH risk
- Critical risk patients trigger immediate notification to treatment coordinator
- Risk status RESOLVED when patient attends appointment post-intervention
- Risk status DROPPED_OUT after 180 days with no appointments
- Only active treatment patients included in risk calculations
- Historical dropout patterns inform prediction model training

---

## Dependencies

**Depends On:**
- [Failed Appointment Recovery](./failed-appointment-recovery.md) - No-show data
- [Cancellation Tracking](./cancellation-tracking.md) - Cancellation patterns
- [Treatment Management](../../../../treatment-management/) - Treatment progress (optional)
- [Billing & Insurance](../../../../billing-insurance/) - Payment status (optional)

**Required By:**
- [Re-engagement Campaigns](./re-engagement-campaigns.md) - Targeting criteria
- Treatment Coordinator workflows

---

## Notes

- Consider machine learning model for improved prediction
- Show risk trends over time, not just current score
- Provide actionable next steps, not just risk levels
- Privacy: risk scores are internal, never shown to patients

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
