# Emergency Appointments

> **Sub-Area**: [Emergency & Reminders](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Emergency Appointments handles urgent patient requests with appropriate triage and priority scheduling. This function supports intake of orthodontic emergencies (broken brackets, poking wires, lost retainers), severity assessment, priority slot allocation, and documentation of emergency visits.

---

## Core Requirements

- [ ] Emergency appointment request intake (phone, web, portal)
- [ ] Triage assessment with severity levels
- [ ] Priority slot allocation for same-day booking
- [ ] Emergency slot reservations in schedule templates
- [ ] Track emergency fees and visit type
- [ ] Document emergency visit details
- [ ] Escalation workflows for severe cases
- [ ] After-hours emergency routing
- [ ] Self-care guidance before appointment
- [ ] Link emergency to patient treatment record

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/emergencies` | `booking:handle_emergency` | List emergencies |
| GET | `/api/booking/emergencies/:id` | `booking:handle_emergency` | Get emergency details |
| POST | `/api/booking/emergencies` | `booking:handle_emergency` | Create emergency request |
| PUT | `/api/booking/emergencies/:id` | `booking:handle_emergency` | Update emergency |
| POST | `/api/booking/emergencies/:id/triage` | `booking:handle_emergency` | Complete triage |
| POST | `/api/booking/emergencies/:id/schedule` | `booking:handle_emergency` | Schedule appointment |
| POST | `/api/booking/emergencies/:id/resolve` | `booking:handle_emergency` | Resolve emergency |
| GET | `/api/patient-portal/emergency` | Patient Portal | Submit emergency request |

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
  requestedBy      String?  // Phone/email if not logged in

  // Triage
  triageStatus     TriageStatus @default(PENDING)
  triageNotes      String?
  triagedAt        DateTime?
  triagedBy        String?  @db.ObjectId

  // Self-care provided
  selfCareProvided Boolean  @default(false)
  selfCareNotes    String?

  // Appointment link
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

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])

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
```

---

## Business Rules

- Critical emergencies immediately notify on-call provider
- Emergency slots reserved in daily templates (configurable count)
- Same-day emergency booking can override normal scheduling rules
- Triage must be completed before scheduling (severity determines slot)
- Self-care instructions provided based on emergency type
- Swelling/severe pain may require referral to general dentist or ER
- Emergency fees may apply (tracked for billing)
- All emergencies logged for quality tracking

---

## Dependencies

**Depends On:**
- [Auth & Authorization](../../../../auth/) - Permission checking
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md) - Scheduling
- [Emergency Protocols](./emergency-protocols.md) - Triage guidelines

**Required By:**
- [After-Hours Handling](./after-hours-handling.md) - Routing
- [On-Call Management](./on-call-management.md) - Provider notification

---

## Notes

- Patient portal should have prominent emergency button
- Consider chatbot for initial symptom collection
- Photo upload capability for assessing severity remotely
- Track common emergency types for prevention education

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
