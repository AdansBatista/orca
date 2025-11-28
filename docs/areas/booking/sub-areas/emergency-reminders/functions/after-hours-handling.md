# After-Hours Handling

> **Sub-Area**: [Emergency & Reminders](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

After-Hours Handling routes patient contacts appropriately outside of business hours. This function differentiates between emergency and non-emergency requests, routes emergencies to on-call providers, queues routine messages for next-day follow-up, and integrates with answering services.

---

## Core Requirements

- [ ] Configure after-hours phone routing/messages
- [ ] Send auto-response to after-hours texts
- [ ] Differentiate emergency vs. non-emergency requests
- [ ] Route emergencies to on-call provider
- [ ] Queue non-emergency messages for next business day
- [ ] Schedule callbacks for routine requests
- [ ] Document after-hours emergency protocols
- [ ] Integrate with answering service (optional)
- [ ] Log all after-hours contacts
- [ ] Morning queue review interface for staff

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/after-hours` | `booking:handle_emergency` | List after-hours messages |
| GET | `/api/booking/after-hours/:id` | `booking:handle_emergency` | Get message details |
| PUT | `/api/booking/after-hours/:id` | `booking:handle_emergency` | Update message |
| POST | `/api/booking/after-hours/:id/resolve` | `booking:handle_emergency` | Resolve message |
| POST | `/api/booking/after-hours/:id/callback` | `booking:handle_emergency` | Schedule callback |
| GET | `/api/booking/after-hours/queue` | `booking:handle_emergency` | Get pending queue |
| GET | `/api/booking/after-hours/settings` | `booking:manage_reminders` | Get routing settings |
| PUT | `/api/booking/after-hours/settings` | `booking:manage_reminders` | Update settings |

---

## Data Model

```prisma
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

  // Follow-up created
  createdAppointmentId String? @db.ObjectId
  createdEmergencyId   String? @db.ObjectId

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

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

model AfterHoursSettings {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Business hours (outside = after-hours)
  weekdayStart  String   // "08:00"
  weekdayEnd    String   // "17:00"
  saturdayStart String?
  saturdayEnd   String?
  sundayStart   String?
  sundayEnd     String?

  // Routing options
  phoneRouting  AfterHoursRouting @default(VOICEMAIL)
  smsAutoReply  String?
  emailAutoReply String?

  // Emergency keywords for SMS triage
  emergencyKeywords String[]

  // Answering service
  answeringServicePhone String?
  answeringServiceEnabled Boolean @default(false)

  updatedAt DateTime @updatedAt

  @@unique([clinicId])
}
```

---

## Business Rules

- After-hours defined by clinic business hours settings
- Emergency keywords in SMS trigger on-call notification
- Non-emergency SMS gets auto-reply with next-day callback promise
- On-call provider has 15 minutes to acknowledge emergency
- Escalate to backup on-call if primary doesn't respond
- All after-hours contacts logged regardless of type
- Morning queue shows all pending items for front desk
- Callbacks scheduled during next business hours

---

## Dependencies

**Depends On:**
- [On-Call Management](./on-call-management.md) - Provider routing
- [Emergency Appointments](./emergency-appointments.md) - Emergency creation
- [Patient Communications](../../../../patient-communications/) - Auto-responses

**Required By:**
- [Emergency Appointments](./emergency-appointments.md) - After-hours emergencies
- Practice operations workflow

---

## Notes

- Consider integration with VoIP system for call routing
- SMS triage should err on side of caution (unclear = emergency)
- Time zone handling critical for multi-location practices
- Track after-hours volume for staffing decisions

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
