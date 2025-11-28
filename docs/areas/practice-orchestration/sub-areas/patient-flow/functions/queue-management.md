# Queue Management

> **Sub-Area**: [Patient Flow Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Queue Management manages the waiting room queue and patient flow ordering. It handles priority queue ordering based on appointment time and urgency, walk-in processing, queue reordering, waiting room display integration, and communication of estimated wait times to patients.

---

## Core Requirements

- [ ] Maintain ordered queue of waiting patients
- [ ] Support priority-based ordering (appointment time, urgency, VIP)
- [ ] Handle walk-in patients appropriately
- [ ] Enable manual queue reordering by staff
- [ ] Integrate with waiting room display system
- [ ] Calculate and communicate estimated wait times
- [ ] Track queue position for each patient
- [ ] Alert on patients waiting beyond threshold
- [ ] Support multiple queues (by provider or area)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/flow/queue` | `ops:view_dashboard` | Get waiting queue |
| PUT | `/api/v1/ops/flow/queue/reorder` | `ops:manage_flow` | Reorder queue |
| GET | `/api/v1/ops/flow/queue/position/:appointmentId` | `ops:view_dashboard` | Get queue position |
| GET | `/api/v1/ops/flow/queue/estimate/:appointmentId` | `ops:view_dashboard` | Get wait estimate |
| GET | `/api/v1/waiting-room/display` | Public | Waiting room display data |

---

## Data Model

Queue tracking on `PatientFlowState`:

```prisma
model PatientFlowState {
  // ... existing fields ...

  // Queue tracking
  queuePosition     Int?
  queueEnteredAt    DateTime?
  priority          FlowPriority @default(NORMAL)
  isWalkIn          Boolean      @default(false)
  estimatedWait     Int?         // Minutes
}

enum FlowPriority {
  LOW       // Flexible, willing to wait
  NORMAL    // Standard appointment
  HIGH      // Running late, urgent
  URGENT    // Emergency, needs immediate attention
}
```

---

## Business Rules

- Default queue order: scheduled time, then arrival time, then priority
- Walk-ins added behind scheduled patients unless urgent
- High priority bumps up but doesn't displace already-waiting patients
- Estimated wait = average chair time × queue position
- Queue position recalculates when patient called back
- Maximum 3 manual reorders per patient per visit
- Display shows first name + last initial only (HIPAA)

---

## Dependencies

**Depends On:**
- [Patient Check-In](./patient-check-in.md) - Adds to queue
- [Call-to-Chair](./call-to-chair.md) - Removes from queue

**Required By:**
- [Wait Time Monitoring](./wait-time-monitoring.md) - Queue metrics
- [Board View](../../operations-dashboard/functions/board-view.md) - Kanban display

---

## Notes

- Consider SMS notification when queue position is 2
- Waiting room display configurable by clinic
- Track queue abandonment (patients who leave without being seen)
- Analytics on queue times by day/time for scheduling optimization

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
