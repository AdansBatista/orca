# Timeline Visualization

> **Sub-Area**: [Treatment Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Timeline Visualization provides an interactive visual representation of treatment progress from start to estimated completion. The timeline displays treatment phases, milestone markers, appointment history, and current position relative to expected progress. This enables quick assessment of treatment status and effective patient communication about their treatment journey.

---

## Core Requirements

- [ ] Display treatment timeline from start to estimated end
- [ ] Show treatment phases with durations
- [ ] Plot milestone markers on timeline
- [ ] Indicate current position in treatment
- [ ] Highlight delays or ahead-of-schedule status
- [ ] Support interactive timeline exploration
- [ ] Filter by date ranges
- [ ] Export timeline for patient communication

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/timeline` | `treatment:read` | Get treatment timeline |
| GET | `/api/treatment-plans/:id/timeline/export` | `treatment:read` | Export timeline |
| GET | `/api/treatment-plans/:id/timeline/appointments` | `treatment:read` | Timeline with appointments |

---

## Data Model

```prisma
// Timeline is computed from existing models, no dedicated storage
// Combines: TreatmentPlan, TreatmentPhase, TreatmentMilestone, Appointments

// Timeline response structure (computed)
type TimelineResponse = {
  treatmentPlanId: string
  patientId: string

  // Dates
  startDate: DateTime
  estimatedEndDate: DateTime
  currentDate: DateTime

  // Progress
  daysElapsed: number
  daysRemaining: number
  progressPercent: number

  // Status
  status: 'ahead' | 'on_track' | 'behind' | 'significantly_behind'

  // Elements
  phases: TimelinePhase[]
  milestones: TimelineMilestone[]
  appointments: TimelineAppointment[]
}

type TimelinePhase = {
  phaseId: string
  phaseName: string
  startDate: DateTime
  endDate: DateTime
  status: PhaseStatus
  progressPercent: number
}

type TimelineMilestone = {
  milestoneId: string
  milestoneName: string
  targetDate: DateTime
  achievedDate?: DateTime
  status: MilestoneStatus
}

type TimelineAppointment = {
  appointmentId: string
  date: DateTime
  type: string
  completed: boolean
}
```

---

## Business Rules

- Timeline starts from treatment start date (bonding/first aligner)
- Estimated end date from treatment plan or phase calculations
- Phase segments sized proportionally to duration
- Milestones positioned by target date
- Current date line shows today's position
- Status calculated from expected vs. actual progress

---

## Dependencies

**Depends On:**
- Treatment Planning (plan dates, phases)
- Milestone Tracking (milestone data)
- Scheduling (appointment history)
- Progress Monitoring (progress calculations)

**Required By:**
- Patient Portal (patient view)
- Practice Orchestration (overview displays)

---

## Notes

- Consider mobile-responsive timeline design
- Export options: PDF, image, shareable link
- Interactive zoom for detailed date exploration
- Color coding for phase/milestone status

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
