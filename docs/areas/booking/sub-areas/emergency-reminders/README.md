# Emergency & Reminders

> **Area**: [Booking & Scheduling](../../)
>
> **Sub-Area**: 2.1.4 Emergency & Reminders
>
> **Purpose**: Handle emergency appointments, on-call scheduling, and automated appointment reminders

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Booking & Scheduling](../../) |
| **Dependencies** | Auth, Appointment Management, Patient Communications |
| **Last Updated** | 2024-11-26 |

---

## Overview

Emergency & Reminders handles two critical aspects of appointment management: emergency appointment handling and automated reminder systems. For emergencies, this includes on-call scheduling, emergency triage, and priority scheduling workflows. For reminders, it covers multi-channel automated reminders, confirmation systems, and communication optimization.

Together, these functions ensure patients can reach the practice when urgent issues arise and that regular appointments have maximum attendance through effective reminder strategies.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.1.4.1 | [Emergency Appointments](./functions/emergency-appointments.md) | Handle emergency patient requests | 📋 Planned | High |
| 2.1.4.2 | [On-Call Management](./functions/on-call-management.md) | Manage on-call provider schedules | 📋 Planned | High |
| 2.1.4.3 | [Appointment Reminders](./functions/appointment-reminders.md) | Automated multi-channel reminders | 📋 Planned | Critical |
| 2.1.4.4 | [Confirmation System](./functions/confirmation-system.md) | Appointment confirmation workflows | 📋 Planned | High |
| 2.1.4.5 | [After-Hours Handling](./functions/after-hours-handling.md) | After-hours contact routing | 📋 Planned | Medium |
| 2.1.4.6 | [Emergency Protocols](./functions/emergency-protocols.md) | Standard emergency procedures | 📋 Planned | Medium |

---

## Function Details

### 2.1.4.1 Emergency Appointments

**Purpose**: Handle emergency appointment requests with appropriate triage and priority scheduling.

**Key Capabilities**:
- Emergency appointment request intake
- Triage assessment (severity levels)
- Priority slot allocation
- Same-day emergency booking
- Emergency slot reservations in schedule templates
- Emergency fee tracking
- Emergency visit documentation
- Escalation workflows for severe cases
- After-hours emergency routing

**Common Orthodontic Emergencies**:
- Broken bracket
- Poking/broken wire
- Lost retainer
- Loose band
- Appliance irritation
- Trauma/injury
- Severe pain
- Swelling/infection (refer to general dentist/hospital)

**User Stories**:
- As a **front desk**, I want to quickly book an emergency patient into today's schedule
- As a **patient**, I want to report an emergency and get guidance on what to do
- As a **doctor**, I want emergency slots reserved in my schedule for urgent cases

---

### 2.1.4.2 On-Call Management

**Purpose**: Manage on-call provider schedules for multi-provider practices.

**Key Capabilities**:
- On-call schedule creation
- Rotating on-call assignments
- On-call calendar view
- Contact information for on-call provider
- On-call handoff documentation
- On-call availability tracking
- Backup on-call assignments
- On-call compensation tracking
- Integration with after-hours messaging

**User Stories**:
- As a **clinic admin**, I want to set up a rotating on-call schedule so coverage is fair
- As a **front desk**, I want to know who is on-call to direct emergency patients
- As a **doctor**, I want to see my upcoming on-call dates on my calendar

---

### 2.1.4.3 Appointment Reminders

**Purpose**: Send automated appointment reminders through multiple channels to maximize attendance.

**Key Capabilities**:
- Multi-channel reminders (SMS, email, voice, push)
- Configurable reminder sequences (e.g., 1 week, 2 days, 1 day, 2 hours before)
- Reminder templates with personalization
- Patient channel preferences
- Smart timing (don't send at night)
- Reminder delivery tracking
- Open/click tracking for emails
- Unsubscribe handling
- Reminder effectiveness analytics
- AI-optimized send times

**Reminder Sequence Example**:
1. 1 week before: Email with appointment details
2. 2 days before: SMS reminder
3. 1 day before: SMS with confirmation request
4. 2 hours before: Final SMS reminder (for first appointments)

**User Stories**:
- As a **patient**, I want to receive reminders about my upcoming appointments so I don't forget
- As a **clinic admin**, I want to configure reminder sequences that work best for our patients
- As a **patient**, I want to choose whether I receive reminders by text or email

---

### 2.1.4.4 Confirmation System

**Purpose**: Obtain appointment confirmations from patients and handle responses.

**Key Capabilities**:
- Confirmation request messages
- Two-way SMS confirmation (reply YES/NO)
- Email confirmation links
- Phone confirmation tracking
- Confirmation status tracking
- Auto-mark confirmed appointments
- Handle confirmation declines (trigger reschedule)
- Escalation for unconfirmed appointments
- Confirmation analytics

**User Stories**:
- As a **patient**, I want to confirm my appointment by replying to a text
- As a **front desk**, I want to see which appointments are unconfirmed so I can follow up
- As a **clinic admin**, I want patients who decline confirmation to be contacted for rescheduling

---

### 2.1.4.5 After-Hours Handling

**Purpose**: Route patient contacts appropriately outside of business hours.

**Key Capabilities**:
- After-hours phone message/routing
- After-hours text auto-response
- Emergency vs. non-emergency differentiation
- On-call provider notification
- After-hours message queue
- Callback scheduling for next business day
- After-hours emergency protocols
- Integration with answering service
- After-hours contact logging

**User Stories**:
- As a **patient**, I want to reach someone when I have an emergency outside office hours
- As a **on-call doctor**, I want to be notified only of true emergencies after hours
- As a **front desk**, I want to see after-hours messages when I arrive in the morning

---

### 2.1.4.6 Emergency Protocols

**Purpose**: Standardized procedures for common orthodontic emergencies.

**Key Capabilities**:
- Emergency protocol library
- Self-care instructions for common issues
- Visual guides (images/videos)
- Protocol-based triage questions
- Severity assessment guidelines
- Referral criteria (when to see general dentist/ER)
- Protocol versioning and updates
- Patient-facing emergency FAQ
- Staff training materials

**Common Emergency Protocols**:
| Emergency | Self-Care | Urgency |
|-----------|-----------|---------|
| Broken bracket | Orthodontic wax, call for appointment | Low |
| Poking wire | Wax, push back with eraser, clip if trained | Low-Medium |
| Lost retainer | Wear backup if available, call ASAP | Medium |
| Loose band | Don't eat hard foods, call for appointment | Medium |
| Severe pain | OTC pain relief, call immediately | High |
| Swelling/infection | Refer to general dentist/ER | High |
| Trauma | Stabilize, ER if serious, call practice | High |

**User Stories**:
- As a **patient**, I want to know what to do when my bracket breaks at home
- As a **front desk**, I want triage questions to assess emergency severity
- As a **clinic admin**, I want standard protocols that all staff follow for emergencies

---

## Data Model

```prisma
model EmergencyAppointment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Emergency details
  emergencyType    EmergencyType
  severity         EmergencySeverity
  description      String
  symptomStarted   DateTime?

  // Request info
  requestedAt      DateTime @default(now())
  requestedVia     RequestChannel
  requestedBy      String?  // Patient phone/email if not logged in

  // Triage
  triageStatus     TriageStatus @default(PENDING)
  triageNotes      String?
  triagedAt        DateTime?
  triagedBy        String?  @db.ObjectId

  // Self-care provided
  selfCareProvided Boolean  @default(false)
  selfCareNotes    String?

  // Appointment
  appointmentId    String?  @db.ObjectId
  scheduledFor     DateTime?
  seenAt           DateTime?

  // Follow-up
  followUpRequired Boolean  @default(false)
  followUpNotes    String?

  // Resolution
  resolution       EmergencyResolution?
  resolvedAt       DateTime?
  resolvedBy       String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])
  appointment  Appointment? @relation(fields: [appointmentId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([severity])
  @@index([triageStatus])
}

enum EmergencyType {
  BROKEN_BRACKET
  POKING_WIRE
  BROKEN_WIRE
  LOST_RETAINER
  LOOSE_BAND
  APPLIANCE_IRRITATION
  SEVERE_PAIN
  SWELLING
  TRAUMA
  OTHER
}

enum EmergencySeverity {
  LOW           // Can wait for regular appointment
  MEDIUM        // Should be seen within 1-2 days
  HIGH          // Same-day appointment needed
  CRITICAL      // Immediate care / refer to ER
}

enum TriageStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  REFERRED
}

enum RequestChannel {
  PHONE
  SMS
  WEB_FORM
  PATIENT_PORTAL
  WALK_IN
  AFTER_HOURS
}

enum EmergencyResolution {
  APPOINTMENT_SCHEDULED
  SELF_CARE_RESOLVED
  REFERRED_GENERAL_DENTIST
  REFERRED_ER
  NO_ACTION_NEEDED
  PATIENT_NO_SHOW
}

model OnCallSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  providerId    String   @db.ObjectId

  // Schedule period
  startDateTime DateTime
  endDateTime   DateTime

  // On-call type
  type          OnCallType @default(PRIMARY)

  // Backup
  backupProviderId String? @db.ObjectId

  // Contact info override
  contactPhone    String?
  contactNotes    String?

  // Status
  status        OnCallStatus @default(SCHEDULED)

  // Swap tracking
  originalProviderId String? @db.ObjectId
  swappedAt         DateTime?
  swapReason        String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String  @db.ObjectId

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  provider     User      @relation("OnCall", fields: [providerId], references: [id])
  backup       User?     @relation("OnCallBackup", fields: [backupProviderId], references: [id])

  @@index([clinicId])
  @@index([providerId])
  @@index([startDateTime, endDateTime])
  @@index([status])
}

enum OnCallType {
  PRIMARY
  BACKUP
  HOLIDAY
}

enum OnCallStatus {
  SCHEDULED
  ACTIVE
  COMPLETED
  SWAPPED
  CANCELLED
}

model AppointmentReminder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  appointmentId String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Reminder info
  reminderType  ReminderType
  channel       NotificationChannel
  scheduledFor  DateTime
  sequence      Int      // Which reminder in sequence (1, 2, 3...)

  // Content
  templateId    String?  @db.ObjectId
  subject       String?
  message       String

  // Status
  status        ReminderStatus @default(SCHEDULED)
  sentAt        DateTime?
  deliveredAt   DateTime?
  failedAt      DateTime?
  failureReason String?

  // Tracking
  openedAt      DateTime?
  clickedAt     DateTime?

  // Response (for confirmation reminders)
  responseReceived Boolean @default(false)
  response         String?
  respondedAt      DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  appointment  Appointment @relation(fields: [appointmentId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([appointmentId])
  @@index([scheduledFor])
  @@index([status])
}

enum ReminderType {
  STANDARD        // General reminder
  CONFIRMATION    // Request confirmation
  FINAL           // Day-of final reminder
  PRE_VISIT       // Pre-visit instructions
  FIRST_VISIT     // Special first visit reminder
}

enum ReminderStatus {
  SCHEDULED
  SENDING
  SENT
  DELIVERED
  FAILED
  CANCELLED
  SKIPPED       // Skipped due to earlier confirmation
}

model ReminderTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  description   String?
  channel       NotificationChannel
  reminderType  ReminderType

  // Content
  subject       String?  // For email
  body          String
  includeCalendarLink Boolean @default(false)
  includeDirections   Boolean @default(false)

  // Variables available: {patient_name}, {appointment_date}, {appointment_time}, {provider_name}, {clinic_name}, {clinic_phone}, {confirm_link}, {cancel_link}

  // Settings
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([channel])
  @@index([reminderType])
}

model ReminderSequence {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Sequence info
  name          String
  description   String?
  appointmentTypes String[] @db.ObjectId // Empty = all types

  // Status
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // Steps
  steps         ReminderStep[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([isActive])
}

type ReminderStep {
  sequence      Int      // Order in sequence
  offsetDays    Int      // Days before appointment (negative = before)
  offsetHours   Int      // Hours offset
  channel       NotificationChannel
  reminderType  ReminderType
  templateId    String   @db.ObjectId
  skipIfConfirmed Boolean @default(false)
}

model AfterHoursMessage {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Contact info
  patientId     String?  @db.ObjectId
  callerName    String
  callerPhone   String
  callerEmail   String?

  // Message
  channel       RequestChannel
  receivedAt    DateTime @default(now())
  messageType   AfterHoursMessageType
  message       String
  urgency       AfterHoursUrgency

  // Routing
  routedTo      AfterHoursRouting
  onCallProviderId String? @db.ObjectId
  onCallNotifiedAt DateTime?
  onCallResponse   String?

  // Resolution
  status        AfterHoursStatus @default(PENDING)
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId
  resolution    String?
  callbackScheduled DateTime?

  // Follow-up
  createdAppointmentId String? @db.ObjectId
  createdEmergencyId   String? @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient?  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([status])
  @@index([receivedAt])
}

enum AfterHoursMessageType {
  EMERGENCY
  APPOINTMENT_REQUEST
  GENERAL_QUESTION
  BILLING_QUESTION
  OTHER
}

enum AfterHoursUrgency {
  ROUTINE
  URGENT
  EMERGENCY
}

enum AfterHoursRouting {
  VOICEMAIL
  ON_CALL_PROVIDER
  ANSWERING_SERVICE
  AUTO_RESPONSE
}

enum AfterHoursStatus {
  PENDING
  ACKNOWLEDGED
  IN_PROGRESS
  RESOLVED
  CALLBACK_SCHEDULED
}

model EmergencyProtocol {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Protocol info
  emergencyType EmergencyType
  name          String
  description   String

  // Triage questions
  triageQuestions TriageQuestion[]

  // Self-care instructions
  selfCareInstructions String
  selfCareImages       String[]  // URLs to images
  selfCareVideo        String?   // URL to video

  // When to call
  whenToCall    String
  whenToSeekER  String?

  // Scheduling guidance
  typicalSeverity   EmergencySeverity
  maxWaitDays       Int?

  // Status
  isActive      Boolean  @default(true)
  version       Int      @default(1)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  updatedBy String?  @db.ObjectId

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, emergencyType])
  @@index([clinicId])
}

type TriageQuestion {
  question     String
  options      TriageOption[]
}

type TriageOption {
  answer       String
  severity     EmergencySeverity
  nextAction   String
}
```

---

## API Endpoints

### Emergency Appointments

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/emergencies` | List emergencies | `booking:handle_emergency` |
| GET | `/api/booking/emergencies/:id` | Get emergency details | `booking:handle_emergency` |
| POST | `/api/booking/emergencies` | Create emergency request | `booking:handle_emergency` |
| PUT | `/api/booking/emergencies/:id` | Update emergency | `booking:handle_emergency` |
| POST | `/api/booking/emergencies/:id/triage` | Complete triage | `booking:handle_emergency` |
| POST | `/api/booking/emergencies/:id/schedule` | Schedule emergency | `booking:handle_emergency` |
| POST | `/api/booking/emergencies/:id/resolve` | Resolve emergency | `booking:handle_emergency` |

### On-Call Management

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/on-call` | List on-call schedules | `booking:view_calendar` |
| GET | `/api/booking/on-call/current` | Get current on-call | `booking:view_calendar` |
| POST | `/api/booking/on-call` | Create on-call assignment | `booking:manage_templates` |
| PUT | `/api/booking/on-call/:id` | Update on-call | `booking:manage_templates` |
| DELETE | `/api/booking/on-call/:id` | Delete on-call | `booking:manage_templates` |
| POST | `/api/booking/on-call/:id/swap` | Swap on-call shift | `booking:modify_appointment` |

### Reminders

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/reminders` | List scheduled reminders | `booking:view_calendar` |
| GET | `/api/booking/reminders/appointment/:id` | Get appointment reminders | `booking:view_calendar` |
| POST | `/api/booking/reminders/send` | Manually send reminder | `booking:manage_reminders` |
| DELETE | `/api/booking/reminders/:id` | Cancel reminder | `booking:manage_reminders` |
| GET | `/api/booking/reminders/analytics` | Reminder analytics | `booking:view_analytics` |

### Reminder Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/reminder-templates` | List templates | `booking:manage_reminders` |
| GET | `/api/booking/reminder-templates/:id` | Get template | `booking:manage_reminders` |
| POST | `/api/booking/reminder-templates` | Create template | `booking:manage_reminders` |
| PUT | `/api/booking/reminder-templates/:id` | Update template | `booking:manage_reminders` |
| DELETE | `/api/booking/reminder-templates/:id` | Delete template | `booking:manage_reminders` |

### Reminder Sequences

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/reminder-sequences` | List sequences | `booking:manage_reminders` |
| GET | `/api/booking/reminder-sequences/:id` | Get sequence | `booking:manage_reminders` |
| POST | `/api/booking/reminder-sequences` | Create sequence | `booking:manage_reminders` |
| PUT | `/api/booking/reminder-sequences/:id` | Update sequence | `booking:manage_reminders` |
| DELETE | `/api/booking/reminder-sequences/:id` | Delete sequence | `booking:manage_reminders` |

### After-Hours

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/after-hours` | List after-hours messages | `booking:handle_emergency` |
| GET | `/api/booking/after-hours/:id` | Get message details | `booking:handle_emergency` |
| PUT | `/api/booking/after-hours/:id` | Update message | `booking:handle_emergency` |
| POST | `/api/booking/after-hours/:id/resolve` | Resolve message | `booking:handle_emergency` |

### Emergency Protocols

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/protocols` | List protocols | `booking:view_calendar` |
| GET | `/api/booking/protocols/:type` | Get protocol by type | `booking:view_calendar` |
| PUT | `/api/booking/protocols/:type` | Update protocol | `booking:manage_templates` |
| GET | `/api/patient-portal/emergency-info/:type` | Patient-facing protocol | Patient Portal |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `EmergencyRequestForm` | Patient emergency intake | `components/booking/` |
| `EmergencyTriagePanel` | Triage assessment interface | `components/booking/` |
| `EmergencyList` | List of pending emergencies | `components/booking/` |
| `EmergencyDetail` | Emergency details view | `components/booking/` |
| `OnCallCalendar` | On-call schedule view | `components/booking/` |
| `OnCallAssignment` | Assign on-call shifts | `components/booking/` |
| `CurrentOnCallCard` | Display current on-call | `components/booking/` |
| `ReminderSequenceBuilder` | Configure reminder sequences | `components/booking/` |
| `ReminderTemplateEditor` | Edit reminder templates | `components/booking/` |
| `ReminderStatusList` | List reminders with status | `components/booking/` |
| `ReminderAnalytics` | Reminder effectiveness charts | `components/booking/` |
| `AfterHoursInbox` | After-hours message queue | `components/booking/` |
| `ProtocolEditor` | Edit emergency protocols | `components/booking/` |
| `PatientEmergencyGuide` | Patient-facing emergency info | `components/patient-portal/` |
| `ConfirmationWidget` | Confirmation response UI | `components/patient-portal/` |

---

## Business Rules

1. **Emergency Priority**: Critical emergencies immediately notify on-call provider, don't wait in queue
2. **On-Call Coverage**: Must have on-call coverage for all after-hours periods (no gaps)
3. **Reminder Timing**: No reminders sent between 9 PM and 8 AM (configurable)
4. **Confirmation Window**: Confirmation requests sent 2-7 days before appointment (configurable)
5. **Auto-Cancel Threshold**: Unconfirmed appointments may auto-cancel 24 hours before (configurable, disabled by default)
6. **SMS Opt-In**: SMS reminders only sent to patients who have opted in
7. **Emergency Slots**: Emergency appointments can override normal scheduling rules
8. **After-Hours Auto-Response**: Non-emergency after-hours messages get auto-response with next business day callback
9. **Protocol Updates**: Emergency protocol changes require clinic admin approval
10. **Reminder Skipping**: Skip remaining reminders once appointment is confirmed

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Appointment Management | Required | Appointment data for reminders |
| Patient Communications | Required | SMS/email delivery |
| Staff Management | Required | Provider information for on-call |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Twilio | Required | SMS reminders and confirmations |
| SendGrid/SES | Required | Email reminders |
| Answering Service | Optional | After-hours call handling |

---

## Security Requirements

### Access Control
- **View emergencies**: front_desk, clinical_staff, doctor, clinic_admin
- **Handle emergencies**: front_desk, clinical_staff, doctor, clinic_admin
- **Manage on-call**: clinic_admin
- **Configure reminders**: clinic_admin

### Audit Requirements
- Log all emergency requests and resolutions
- Track on-call schedule changes
- Record reminder delivery and responses
- Log after-hours message handling

### Data Protection
- Patient contact information protected per HIPAA
- Emergency health information is PHI
- Communication records retained per policy

### Communication Compliance
- SMS follows TCPA requirements
- Email follows CAN-SPAM requirements
- Patient opt-out preferences respected

---

## Related Documentation

- [Parent: Booking & Scheduling](../../)
- [Appointment Management](../appointment-management/)
- [Waitlist & Recovery](../waitlist-recovery/)
- [Patient Communications](../../../patient-communications/)
- [Staff Management](../../../staff-management/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
