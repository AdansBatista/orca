# Patient Flow Management

> **Sub-Area**: Patient Flow Management
>
> **Area**: Practice Orchestration (2.3)
>
> **Purpose**: Track and manage patient journey through the clinic from check-in to departure with queue management and wait time optimization

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | High |
| **Functions** | 6 |

---

## Overview

Patient Flow Management tracks each patient's journey through the clinic, from arrival to departure. It provides real-time queue visibility, wait time monitoring, and flow optimization to ensure efficient operations and good patient experience.

### Key Capabilities

- Self-service and staff-assisted check-in
- Real-time queue management
- Stage-based patient tracking
- Wait time monitoring and alerts
- SMS notifications to patients
- Flow analytics and bottleneck detection

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Patient Check-In](./functions/patient-check-in.md) | Handle patient arrival | Critical |
| 2 | [Queue Management](./functions/queue-management.md) | Manage waiting queue | Critical |
| 3 | [Call-to-Chair](./functions/call-to-chair.md) | Call patients back | Critical |
| 4 | [Patient Journey Tracking](./functions/patient-journey-tracking.md) | Track through stages | High |
| 5 | [Wait Time Monitoring](./functions/wait-time-monitoring.md) | Monitor and alert on waits | High |
| 6 | [Check-Out Processing](./functions/check-out-processing.md) | Complete patient visit | Critical |

---

## Function Details

### Patient Check-In

Handle patient arrival and initiate flow tracking.

**Key Features:**
- Staff check-in at front desk
- Self-service kiosk support
- Mobile check-in option
- Verify/update patient info
- Insurance verification trigger
- Form completion status
- Alert for special needs

---

### Queue Management

Manage the waiting room queue and flow.

**Key Features:**
- Priority queue ordering
- Appointment time vs. arrival time
- Walk-in handling
- Queue reordering
- Waiting room display integration
- Estimated wait communication

---

### Call-to-Chair

Manage calling patients back for treatment.

**Key Features:**
- One-click call to chair
- Chair/room assignment
- Provider assignment
- SMS notification option
- Pager integration
- Call history tracking

---

### Patient Journey Tracking

Track patient through all stages.

**Key Features:**
- Stage transition logging
- Time-in-stage tracking
- Provider handoffs
- Notes and alerts
- Journey visualization
- Historical patterns

---

### Wait Time Monitoring

Monitor and manage wait times.

**Key Features:**
- Real-time wait calculations
- Target wait thresholds
- Alert on excessive waits
- Average wait dashboards
- Wait time predictions
- Trend analysis

---

### Check-Out Processing

Complete the patient visit.

**Key Features:**
- Treatment completion confirmation
- Next appointment scheduling
- Payment processing
- Instructions delivery
- Survey trigger
- Flow completion

---

## Data Model

### Prisma Schema

```prisma
model PatientFlowState {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  appointmentId   String            @db.ObjectId
  patientId       String            @db.ObjectId

  // Current state
  stage           FlowStage
  chairId         String?           @db.ObjectId
  providerId      String?           @db.ObjectId

  // Timestamps
  scheduledAt     DateTime
  arrivedAt       DateTime?
  checkedInAt     DateTime?
  calledAt        DateTime?
  seatedAt        DateTime?
  completedAt     DateTime?
  checkedOutAt    DateTime?
  departedAt      DateTime?

  // Queue info
  queuePosition   Int?
  priority        FlowPriority      @default(NORMAL)
  isWalkIn        Boolean           @default(false)

  // Notes
  notes           String?
  alerts          String[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  appointment     Appointment       @relation(fields: [appointmentId], references: [id])
  patient         Patient           @relation(fields: [patientId], references: [id])
  chair           Resource?         @relation(fields: [chairId], references: [id])
  stageHistory    FlowStageHistory[]

  @@unique([clinicId, appointmentId])
  @@index([clinicId, stage])
  @@index([clinicId, scheduledAt])
}

enum FlowStage {
  SCHEDULED
  ARRIVED
  CHECKED_IN
  WAITING
  CALLED
  IN_CHAIR
  COMPLETED
  CHECKED_OUT
  DEPARTED
  NO_SHOW
  CANCELLED
}

enum FlowPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ops/flow` | Get current flow state |
| GET | `/api/v1/ops/flow/queue` | Get waiting queue |
| POST | `/api/v1/ops/flow/:appointmentId/check-in` | Check in patient |
| POST | `/api/v1/ops/flow/:appointmentId/call` | Call patient |
| POST | `/api/v1/ops/flow/:appointmentId/seat` | Seat in chair |
| POST | `/api/v1/ops/flow/:appointmentId/complete` | Mark complete |
| POST | `/api/v1/ops/flow/:appointmentId/check-out` | Check out |
| POST | `/api/v1/ops/flow/:appointmentId/no-show` | Mark no-show |
| GET | `/api/v1/ops/flow/:appointmentId/history` | Get stage history |

---

## UI Components

| Component | Description |
|-----------|-------------|
| `CheckInPanel` | Staff check-in interface |
| `KioskCheckIn` | Self-service kiosk UI |
| `WaitingQueue` | Queue display and management |
| `QueueCard` | Individual patient in queue |
| `CallToChairButton` | Action button to call patient |
| `ChairAssignmentDialog` | Assign chair/provider |
| `PatientJourneyTimeline` | Visual journey tracker |
| `WaitTimeIndicator` | Wait time display |
| `CheckOutPanel` | Checkout interface |
| `FlowAlertsBanner` | Excessive wait alerts |

---

## Patient Flow States

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PATIENT FLOW                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │SCHEDULED │───▶│ ARRIVED  │───▶│CHECKED_IN│───▶│ WAITING  │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                        │             │
│                                                        ▼             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ DEPARTED │◀───│CHECKED_OUT│◀───│COMPLETED │◀───│ IN_CHAIR │◀─────│
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                        ▲             │
│                                                   ┌────┴────┐        │
│                                                   │ CALLED  │        │
│                                                   └─────────┘        │
│                                                                      │
│  ┌──────────┐    ┌──────────┐                                       │
│  │ NO_SHOW  │    │CANCELLED │  (Terminal states)                    │
│  └──────────┘    └──────────┘                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Wait Time Thresholds

| Stage | Target | Warning | Critical |
|-------|--------|---------|----------|
| Waiting → Called | 10 min | 15 min | 20 min |
| Called → In Chair | 5 min | 10 min | 15 min |
| Total Wait | 15 min | 20 min | 30 min |

*Thresholds are configurable per clinic*

---

## Business Rules

1. **Check-In First**: Patients must check in before being called
2. **Chair Required**: Must assign chair before seating patient
3. **Provider Required**: Must assign provider for treatment
4. **Auto No-Show**: Mark no-show if 30 min past time (configurable)
5. **Walk-In Priority**: Walk-ins added to queue behind scheduled
6. **Queue Order**: By scheduled time, then arrival time, then priority
7. **Checkout Required**: All visits must complete checkout flow

---

## Dependencies

- **Booking & Scheduling**: Appointment data
- **Patient Communications**: SMS notifications
- **Billing & Insurance**: Checkout payment integration
- **Resources Management**: Chair availability

---

## Related Documentation

- [Practice Orchestration Overview](../../README.md)
- [Operations Dashboard](../operations-dashboard/)
- [Resource Coordination](../resource-coordination/)
