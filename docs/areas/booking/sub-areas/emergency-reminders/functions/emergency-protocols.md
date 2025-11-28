# Emergency Protocols

> **Sub-Area**: [Emergency & Reminders](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Emergency Protocols provides standardized procedures for common orthodontic emergencies. This function maintains a library of protocols with triage questions, self-care instructions, severity guidelines, and referral criteria. Protocols guide both staff during triage and patients via self-service.

---

## Core Requirements

- [ ] Maintain emergency protocol library by type
- [ ] Provide self-care instructions for common issues
- [ ] Include visual guides (images/videos)
- [ ] Define protocol-based triage questions
- [ ] Establish severity assessment guidelines
- [ ] Document referral criteria (when to see dentist/ER)
- [ ] Support protocol versioning and updates
- [ ] Patient-facing emergency FAQ
- [ ] Staff training materials
- [ ] Protocol effectiveness tracking

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/protocols` | `booking:view_calendar` | List protocols |
| GET | `/api/booking/protocols/:type` | `booking:view_calendar` | Get protocol by type |
| PUT | `/api/booking/protocols/:type` | `booking:manage_templates` | Update protocol |
| POST | `/api/booking/protocols` | `booking:manage_templates` | Create custom protocol |
| GET | `/api/booking/protocols/:type/triage` | `booking:handle_emergency` | Get triage flow |
| GET | `/api/patient-portal/emergency-info/:type` | Patient Portal | Patient-facing protocol |
| GET | `/api/patient-portal/emergency-faq` | Patient Portal | Emergency FAQ |

---

## Data Model

```prisma
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

  // When to escalate
  whenToCall    String
  whenToSeekER  String?

  // Scheduling guidance
  typicalSeverity   EmergencySeverity
  maxWaitDays       Int?

  // Status
  isActive      Boolean  @default(true)
  version       Int      @default(1)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  updatedBy String?  @db.ObjectId

  @@unique([clinicId, emergencyType])
  @@index([clinicId])
}

type TriageQuestion {
  question     String
  order        Int
  options      TriageOption[]
}

type TriageOption {
  answer       String
  severity     EmergencySeverity
  nextAction   String
  followUp     String?  // Follow-up question if needed
}

model EmergencyFAQ {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  question      String
  answer        String
  category      String   // "Prevention", "Self-Care", "When to Call"
  order         Int
  isActive      Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clinicId])
  @@index([category])
}
```

### Standard Protocol Reference

| Emergency | Self-Care | Typical Severity | Max Wait |
|-----------|-----------|------------------|----------|
| Broken bracket | Apply wax, avoid hard foods | LOW | 5-7 days |
| Poking wire | Wax, push back, clip if trained | LOW-MEDIUM | 2-3 days |
| Broken wire | Wax sharp end, avoid chewing on side | MEDIUM | 1-2 days |
| Lost retainer | Wear backup if available | MEDIUM | 2-3 days |
| Loose band | Don't eat hard foods | MEDIUM | 1-2 days |
| Appliance irritation | Wax, salt water rinse | LOW | 3-5 days |
| Severe pain | OTC pain relief | HIGH | Same day |
| Swelling | Monitor, may need referral | HIGH-CRITICAL | Same day |
| Trauma | Stabilize, ER if serious | CRITICAL | Immediate |

---

## Business Rules

- Default protocols provided for all standard emergency types
- Clinics can customize protocols while maintaining medical accuracy
- Protocol updates require clinic admin approval
- Version history maintained for compliance
- Patient-facing content reviewed for clarity
- Triage flows guide to appropriate severity
- Referral to general dentist/ER for non-orthodontic issues
- Protocols linked to emergency appointment triage

---

## Dependencies

**Depends On:**
- [Auth & Authorization](../../../../auth/) - Permission checking
- File storage for images/videos

**Required By:**
- [Emergency Appointments](./emergency-appointments.md) - Triage guidance
- [After-Hours Handling](./after-hours-handling.md) - Self-service info
- Patient Portal emergency section

---

## Notes

- Visual guides significantly help patients with self-care
- Consider chatbot integration for protocol delivery
- Track which self-care steps patients attempt
- Protocols should be reviewed annually by clinical staff

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
