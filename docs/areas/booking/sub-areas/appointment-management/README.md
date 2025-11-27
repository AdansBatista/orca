# Appointment Management

> **Area**: [Booking & Scheduling](../../)
>
> **Sub-Area**: 2.1.2 Appointment Management
>
> **Purpose**: Handle the complete appointment lifecycle from booking to completion

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Booking & Scheduling](../../) |
| **Dependencies** | Auth, Staff Management, Resources Management, Calendar Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

Appointment Management handles the core functionality of scheduling patient appointments in Orca. This includes creating, modifying, and tracking appointments through their entire lifecycle, managing recurring appointment series, and providing intelligent scheduling assistance.

This sub-area ensures efficient booking workflows, conflict prevention, and optimal resource utilization while maintaining flexibility for different appointment types and patient needs.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.1.2.1 | [Appointment Booking](./functions/appointment-booking.md) | Create and manage patient appointments | 📋 Planned | Critical |
| 2.1.2.2 | [Appointment Type Configuration](./functions/appointment-types.md) | Configure appointment types and settings | 📋 Planned | Critical |
| 2.1.2.3 | [Recurring Appointments](./functions/recurring-appointments.md) | Schedule and manage recurring series | 📋 Planned | High |
| 2.1.2.4 | [Appointment Status Management](./functions/appointment-status.md) | Track appointment lifecycle states | 📋 Planned | High |
| 2.1.2.5 | [Resource Scheduling](./functions/resource-scheduling.md) | Assign chairs, rooms, and equipment | 📋 Planned | High |
| 2.1.2.6 | [Scheduling Intelligence](./functions/scheduling-intelligence.md) | Smart scheduling and conflict detection | 📋 Planned | Medium |

---

## Function Details

### 2.1.2.1 Appointment Booking

**Purpose**: Create and manage patient appointments with full control over timing, resources, and provider assignment.

**Key Capabilities**:
- Schedule patient appointments with provider and resource assignment
- Book into template slots or custom time slots
- Drag-and-drop appointment creation and modification
- Quick booking from patient record
- Multi-appointment booking for same visit
- Appointment duration adjustment
- Copy/duplicate appointments
- Link appointments to treatment plans
- Patient self-service booking (online)

**User Stories**:
- As a **front desk**, I want to quickly book a patient into an available slot so that I can schedule their visit
- As a **front desk**, I want to drag an appointment to reschedule so that I can easily adjust the calendar
- As a **patient**, I want to book my own appointment online so that I don't have to call the office
- As a **clinical staff**, I want to link the appointment to a treatment so the procedure is documented

---

### 2.1.2.2 Appointment Type Configuration

**Purpose**: Define and configure different types of appointments with specific requirements and settings.

**Key Capabilities**:
- Define appointment types (Scan, Adjustment, Bonding, Debond, Emergency, etc.)
- Set default duration per type
- Configure color and icon for visual identification
- Link procedure codes to appointment types
- Specify resource requirements (chair, room, equipment)
- Set buffer/prep/cleanup times
- Configure online booking availability
- Set capacity limits per type

**User Stories**:
- As a **clinic admin**, I want to create an appointment type for emergencies so staff can book them quickly
- As a **clinic admin**, I want to set default durations so staff don't have to guess appointment length
- As a **clinic admin**, I want to link procedures to appointment types for automatic documentation

---

### 2.1.2.3 Recurring Appointments

**Purpose**: Schedule and manage recurring appointment series for ongoing treatment.

**Key Capabilities**:
- Create recurring appointment series (weekly, bi-weekly, monthly)
- Set recurrence patterns and end dates
- Modify single occurrence vs. entire series
- Handle conflicts in recurring series
- Skip/reschedule individual occurrences
- Track completion across series
- Generate appointments from treatment plans
- Bulk scheduling for adjustment appointments

**User Stories**:
- As a **front desk**, I want to schedule monthly adjustment appointments for the next 6 months
- As a **front desk**, I want to modify just one appointment in a series without affecting others
- As a **treatment coordinator**, I want to generate the full appointment series from a treatment plan

---

### 2.1.2.4 Appointment Status Management

**Purpose**: Track appointments through their lifecycle states and transitions.

**Key Capabilities**:
- Track appointment statuses (Scheduled, Confirmed, Arrived, In Progress, Completed, No-Show, Cancelled)
- Automated status transitions (check-in flow)
- Manual status overrides
- Status history tracking
- Status-based filtering and reporting
- Color-coded status visualization
- Status change notifications

**Appointment Status Flow**:
```
Scheduled → Confirmed → Arrived → In Progress → Completed
     ↓           ↓          ↓           ↓
Cancelled   Cancelled   No-Show    Incomplete
```

**User Stories**:
- As a **front desk**, I want to see which patients have confirmed so I know who to call
- As a **clinical staff**, I want to mark a patient as arrived so the doctor knows they're ready
- As a **clinic admin**, I want to track no-show rates by provider and appointment type

---

### 2.1.2.5 Resource Scheduling

**Purpose**: Manage the allocation of physical resources (chairs, rooms, equipment) to appointments.

**Key Capabilities**:
- Assign chairs to appointments
- Assign rooms (consultation, imaging, etc.)
- Track equipment requirements
- Detect resource conflicts
- Auto-assign resources based on availability
- Resource swap/reassignment
- Multi-resource appointments (chair + room)
- Resource utilization tracking

**User Stories**:
- As a **front desk**, I want the system to auto-assign an available chair when I book
- As a **clinical staff**, I want to change the chair assignment if the patient prefers a different one
- As a **clinic admin**, I want to see chair utilization to optimize our scheduling

---

### 2.1.2.6 Scheduling Intelligence

**Purpose**: Provide smart scheduling assistance and conflict prevention.

**Key Capabilities**:
- Conflict detection (provider, resource, patient double-booking)
- Smart slot suggestions based on appointment type
- Template-aware scheduling (suggest matching template slots)
- Optimal time recommendations based on provider preferences
- Travel time consideration for multi-location
- Patient preference learning
- Overbooking prevention with capacity limits
- Wait time optimization
- AI-powered scheduling recommendations

**User Stories**:
- As a **front desk**, I want the system to warn me about conflicts before I book
- As a **front desk**, I want suggestions for the best available slots based on the appointment type
- As a **clinic admin**, I want AI to recommend schedule optimizations to reduce patient wait time

---

## Data Model

```prisma
model Appointment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Timing
  startTime     DateTime
  endTime       DateTime
  duration      Int      // Minutes

  // Type
  appointmentTypeId  String   @db.ObjectId

  // Assignment
  providerId    String   @db.ObjectId
  chairId       String?  @db.ObjectId
  roomId        String?  @db.ObjectId

  // Status
  status        AppointmentStatus @default(SCHEDULED)
  statusHistory AppointmentStatusChange[]

  // Confirmation
  confirmationStatus  ConfirmationStatus @default(UNCONFIRMED)
  confirmedAt         DateTime?
  confirmedBy         String?  // "patient", "staff", "auto"

  // Check-in
  arrivedAt     DateTime?
  checkedInBy   String?  @db.ObjectId
  startedAt     DateTime?
  completedAt   DateTime?

  // Cancellation
  cancelledAt   DateTime?
  cancelledBy   String?  @db.ObjectId
  cancellationReason  String?

  // No-show
  markedNoShowAt DateTime?
  noShowReason   String?

  // Recurring
  recurringAppointmentId  String?  @db.ObjectId
  seriesOccurrence        Int?     // Which occurrence in series

  // Links
  treatmentPlanId    String?  @db.ObjectId
  procedureIds       String[] @db.ObjectId
  notes              String?
  patientNotes       String?  // Notes visible to patient

  // Source
  bookedBy      String   @db.ObjectId
  bookedAt      DateTime @default(now())
  source        AppointmentSource @default(STAFF)

  // Template slot reference
  templateSlotId  String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic         Clinic          @relation(fields: [clinicId], references: [id])
  patient        Patient         @relation(fields: [patientId], references: [id])
  appointmentType AppointmentType @relation(fields: [appointmentTypeId], references: [id])
  provider       User            @relation("Provider", fields: [providerId], references: [id])
  chair          Chair?          @relation(fields: [chairId], references: [id])
  room           Room?           @relation(fields: [roomId], references: [id])
  recurringAppointment RecurringAppointment? @relation(fields: [recurringAppointmentId], references: [id])
  treatmentPlan  TreatmentPlan?  @relation(fields: [treatmentPlanId], references: [id])
  reminders      AppointmentReminder[]
  procedures     Procedure[]     @relation(fields: [procedureIds], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([providerId])
  @@index([startTime])
  @@index([status])
  @@index([appointmentTypeId])
  @@index([recurringAppointmentId])
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  ARRIVED
  IN_PROGRESS
  COMPLETED
  NO_SHOW
  CANCELLED
  INCOMPLETE
}

enum ConfirmationStatus {
  UNCONFIRMED
  PENDING       // Reminder sent, waiting response
  CONFIRMED
  DECLINED      // Patient declined/wants to reschedule
}

enum AppointmentSource {
  STAFF         // Booked by staff
  ONLINE        // Patient self-service
  PHONE         // Phone booking
  RECALL        // Auto-generated from recall
  TREATMENT_PLAN // Generated from treatment plan
  WAITLIST      // Booked from waitlist
}

type AppointmentStatusChange {
  status       AppointmentStatus
  changedAt    DateTime
  changedBy    String  @db.ObjectId
  reason       String?
}

model RecurringAppointment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Recurrence pattern
  frequency     RecurrenceFrequency
  interval      Int      @default(1)  // Every X frequency units
  daysOfWeek    Int[]    // For weekly: [1, 3] = Mon, Wed
  dayOfMonth    Int?     // For monthly
  weekOfMonth   Int?     // For monthly: 1st, 2nd, 3rd, 4th, -1 (last)

  // Time
  preferredTime String   // "09:00"
  duration      Int      // Minutes

  // Type and assignment
  appointmentTypeId  String   @db.ObjectId
  providerId    String   @db.ObjectId

  // Bounds
  startDate     DateTime
  endDate       DateTime?
  maxOccurrences Int?
  generatedCount Int      @default(0)

  // Status
  status        RecurringStatus @default(ACTIVE)

  // Treatment link
  treatmentPlanId  String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String  @db.ObjectId

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])
  appointments Appointment[]

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}

enum RecurrenceFrequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  CUSTOM
}

enum RecurringStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

model AppointmentConflict {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Conflict details
  conflictType  ConflictType
  appointmentId String   @db.ObjectId
  conflictingId String   @db.ObjectId  // Other appointment or resource

  // Resolution
  status        ConflictStatus @default(UNRESOLVED)
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId
  resolution    String?

  // Timestamps
  detectedAt DateTime @default(now())

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([appointmentId])
  @@index([status])
}

enum ConflictType {
  PROVIDER_DOUBLE_BOOK
  CHAIR_DOUBLE_BOOK
  ROOM_DOUBLE_BOOK
  PATIENT_DOUBLE_BOOK
  EQUIPMENT_CONFLICT
  OUTSIDE_HOURS
  OVER_CAPACITY
}

enum ConflictStatus {
  UNRESOLVED
  RESOLVED
  OVERRIDDEN
  AUTO_RESOLVED
}
```

---

## API Endpoints

### Appointments

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/appointments` | List appointments | `booking:view_calendar` |
| GET | `/api/booking/appointments/:id` | Get appointment details | `booking:view_calendar` |
| POST | `/api/booking/appointments` | Create appointment | `booking:create_appointment` |
| PUT | `/api/booking/appointments/:id` | Update appointment | `booking:modify_appointment` |
| DELETE | `/api/booking/appointments/:id` | Cancel appointment | `booking:cancel_appointment` |
| POST | `/api/booking/appointments/:id/confirm` | Confirm appointment | `booking:modify_appointment` |
| POST | `/api/booking/appointments/:id/check-in` | Check in patient | `booking:modify_appointment` |
| POST | `/api/booking/appointments/:id/start` | Start appointment | `booking:modify_appointment` |
| POST | `/api/booking/appointments/:id/complete` | Complete appointment | `booking:modify_appointment` |
| POST | `/api/booking/appointments/:id/no-show` | Mark as no-show | `booking:modify_appointment` |
| POST | `/api/booking/appointments/:id/reschedule` | Reschedule appointment | `booking:modify_appointment` |
| GET | `/api/booking/appointments/:id/history` | Get status history | `booking:view_calendar` |

### Recurring Appointments

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/recurring` | List recurring series | `booking:view_calendar` |
| GET | `/api/booking/recurring/:id` | Get series details | `booking:view_calendar` |
| POST | `/api/booking/recurring` | Create recurring series | `booking:create_appointment` |
| PUT | `/api/booking/recurring/:id` | Update entire series | `booking:modify_appointment` |
| DELETE | `/api/booking/recurring/:id` | Cancel entire series | `booking:cancel_appointment` |
| POST | `/api/booking/recurring/:id/generate` | Generate next appointments | `booking:create_appointment` |
| POST | `/api/booking/recurring/:id/pause` | Pause series | `booking:modify_appointment` |
| POST | `/api/booking/recurring/:id/resume` | Resume series | `booking:modify_appointment` |

### Availability & Scheduling

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/availability` | Get available slots | `booking:view_calendar` |
| GET | `/api/booking/availability/provider/:id` | Provider availability | `booking:view_calendar` |
| GET | `/api/booking/availability/resource/:id` | Resource availability | `booking:view_calendar` |
| POST | `/api/booking/check-conflicts` | Check for conflicts | `booking:view_calendar` |
| GET | `/api/booking/suggestions` | Get slot suggestions | `booking:view_calendar` |

### Patient Self-Service

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/patient-portal/available-slots` | Get available slots | Patient Portal |
| POST | `/api/patient-portal/book` | Self-service booking | Patient Portal |
| GET | `/api/patient-portal/appointments` | List my appointments | Patient Portal |
| POST | `/api/patient-portal/cancel/:id` | Cancel my appointment | Patient Portal |
| POST | `/api/patient-portal/confirm/:id` | Confirm my appointment | Patient Portal |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `AppointmentForm` | Create/edit appointment | `components/booking/` |
| `QuickBookModal` | Fast appointment booking | `components/booking/` |
| `AppointmentCard` | Display appointment details | `components/booking/` |
| `AppointmentStatusBadge` | Show appointment status | `components/booking/` |
| `StatusTransitionButtons` | Change appointment status | `components/booking/` |
| `RecurringAppointmentWizard` | Create recurring series | `components/booking/` |
| `RecurrencePatternSelector` | Configure recurrence | `components/booking/` |
| `SeriesEditor` | Modify recurring series | `components/booking/` |
| `ResourceAssignment` | Assign chair/room | `components/booking/` |
| `ConflictWarning` | Display scheduling conflicts | `components/booking/` |
| `SlotSuggestions` | Show recommended slots | `components/booking/` |
| `AppointmentHistory` | Show appointment history | `components/booking/` |
| `PatientAppointmentList` | List patient's appointments | `components/booking/` |
| `DragDropAppointment` | Drag-drop rescheduling | `components/booking/` |
| `OnlineBookingWidget` | Patient self-service | `components/patient-portal/` |

---

## Business Rules

1. **Double Booking Prevention**: System prevents double-booking of providers, chairs, and patients unless explicitly overridden
2. **Working Hours**: Appointments can only be booked within provider working hours unless override permission granted
3. **Lead Time**: Appointments require minimum lead time (configurable, e.g., 2 hours) unless emergency
4. **Duration Minimums**: Each appointment type has a minimum duration that cannot be reduced
5. **Status Transitions**: Status changes must follow valid transitions (can't go from Scheduled directly to Completed)
6. **Cancellation Window**: Online cancellations may be restricted within X hours of appointment
7. **Recurring Limits**: Recurring series limited to 52 occurrences (1 year) maximum
8. **Resource Requirements**: Appointments of certain types require specific resources (e.g., imaging needs imaging room)
9. **Patient Balance**: May require balance check before booking new appointments (configurable)
10. **Confirmation Timeout**: Unconfirmed appointments may be auto-cancelled after X days (configurable)

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Staff Management | Required | Provider definitions and schedules |
| Resources Management | Required | Chair/room/equipment definitions |
| Calendar Management | Required | Templates and calendar structure |
| Treatment Management | Optional | Link appointments to treatments |
| Patient Communications | Optional | Confirmation/reminder integration |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| date-fns / Luxon | Required | Date/time manipulation |
| RRule | Optional | Recurring date calculation library |

---

## Security Requirements

### Access Control
- **View appointments**: All authenticated users (filtered by role)
- **Create appointments**: front_desk, clinical_staff, doctor, clinic_admin
- **Modify appointments**: Assigned provider + front_desk, clinic_admin
- **Cancel appointments**: front_desk, doctor, clinic_admin
- **Override conflicts**: clinic_admin only

### Audit Requirements
- Log all appointment creation, modification, cancellation
- Track status transitions with timestamps and actors
- Record conflict overrides with justification

### Data Protection
- Appointment data contains PHI - protected per HIPAA
- Patient notes require appropriate access level
- Audit trail required for all appointment access

---

## Related Documentation

- [Parent: Booking & Scheduling](../../)
- [Calendar Management](../calendar-management/)
- [Waitlist & Recovery](../waitlist-recovery/)
- [Emergency & Reminders](../emergency-reminders/)
- [Practice Orchestration](../../../practice-orchestration/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
