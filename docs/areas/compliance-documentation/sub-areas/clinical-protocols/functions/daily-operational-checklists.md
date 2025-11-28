# Daily Operational Checklists

> **Sub-Area**: [Clinical Protocols](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Daily Operational Checklists manages morning opening, evening closing, and operatory turnover checklists that ensure consistent practice operations. The system generates daily checklist instances from configurable templates, tracks item-by-item completion with timestamps and staff identification, and provides alerts for incomplete checklists to maintain compliance with infection control and safety standards.

---

## Core Requirements

- [ ] Configure checklist templates with customizable items
- [ ] Generate daily checklist instances automatically
- [ ] Provide mobile-friendly completion interface
- [ ] Track time-stamped completion of each item
- [ ] Assign checklist responsibilities by role
- [ ] Alert on incomplete checklists at end of shift
- [ ] Archive completed checklists for compliance documentation
- [ ] Report on checklist completion rates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/checklists/templates` | `protocol:read` | List checklist templates |
| POST | `/api/compliance/checklists/templates` | `protocol:create` | Create checklist template |
| PUT | `/api/compliance/checklists/templates/:id` | `protocol:create` | Update template |
| GET | `/api/compliance/checklists/today` | `protocol:execute` | Get today's checklists |
| GET | `/api/compliance/checklists/:id` | `protocol:read` | Get checklist instance |
| POST | `/api/compliance/checklists/:id/items/:itemId` | `protocol:execute` | Complete checklist item |
| POST | `/api/compliance/checklists/:id/signoff` | `protocol:execute` | Sign off completed checklist |
| GET | `/api/compliance/checklists/history` | `protocol:read` | Get checklist history |

---

## Data Model

```prisma
model ChecklistTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  code          String   @unique  // e.g., "MORNING_OPENING"
  type          ChecklistType
  description   String?

  // Configuration
  items         Json     // Array of checklist items with order
  schedule      Json?    // Auto-generation schedule
  assignedRoles String[] // Roles that can complete

  // Settings
  isActive      Boolean  @default(true)
  requiresSignoff Boolean @default(true)
  alertIfIncomplete Boolean @default(true)
  incompleteAlertTime String? // e.g., "17:00" for closing checklists

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic      Clinic @relation(fields: [clinicId], references: [id])
  instances   ChecklistInstance[]

  @@index([clinicId])
  @@index([type])
}

model ChecklistInstance {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  templateId    String   @db.ObjectId

  // Instance info
  date          DateTime
  status        ChecklistStatus @default(PENDING)

  // Location context
  locationId    String?  @db.ObjectId
  locationName  String?  // Operatory name, room, etc.

  // Completion tracking
  completedItems Json    // Array of {itemId, completedAt, completedBy}
  completedAt    DateTime?
  signedOffBy    String?  @db.ObjectId
  signedOffAt    DateTime?

  // Notes
  notes         String?
  issues        String?  // Any issues noted

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  template  ChecklistTemplate @relation(fields: [templateId], references: [id])

  @@index([clinicId])
  @@index([templateId])
  @@index([date])
  @@index([status])
}

enum ChecklistType {
  MORNING_OPENING
  EVENING_CLOSING
  OPERATORY_TURNOVER
  EQUIPMENT_DAILY
  EQUIPMENT_WEEKLY
  EMERGENCY_EQUIPMENT
  CUSTOM
}

enum ChecklistStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  INCOMPLETE
  MISSED
}
```

---

## Business Rules

- Morning opening checklist must be completed before first patient
- Evening closing checklist must be completed before staff leave
- Operatory turnover checklists generated between each patient
- Incomplete checklists at shift end trigger supervisor notification
- All items require staff identification when completed
- Checklists cannot be modified after signoff (immutable for compliance)
- Weekly/monthly checklists auto-generate on configured schedule

---

## Dependencies

**Depends On:**
- Protocol Library Management (references detailed protocols)
- Staff Management (staff assignments and roles)
- Auth & User Management (user identification for completion)

**Required By:**
- Sterilization & Infection Control (opening/closing sterilization tasks)
- Equipment Safety Monitoring (equipment checks in checklists)
- Compliance Reporting (checklist completion metrics)

---

## Notes

- Standard morning items: water line flush, compressor check, autoclave verification, handpiece test
- Standard closing items: instrument processing, biohazard disposal, security check
- Operatory turnover: surface disinfection, barrier change, equipment ready
- Mobile app interface critical for staff completing items throughout day
- Consider gamification: completion streaks, team compliance scores

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
