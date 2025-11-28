# Setup Templates

> **Sub-Area**: [Room/Chair Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Setup Templates define standard room and chair setup configurations for different procedure types. Clinical staff can use these templates as checklists to ensure proper preparation before patient appointments. Templates include required equipment, supplies, and setup steps, and can be linked to appointment types for automatic display. This standardizes preparation and reduces setup errors.

---

## Core Requirements

- [ ] Create setup checklists per procedure type
- [ ] Define required equipment and supplies for procedures
- [ ] Link templates to appointment/procedure types
- [ ] Support clinic-wide and room-specific templates
- [ ] Track setup completion status
- [ ] Generate printable setup sheets
- [ ] Mark default template per procedure type
- [ ] Categorize checklist items (equipment, supplies, preparation steps)
- [ ] Support optional vs. required items
- [ ] Clone and customize templates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/setup-templates` | `room:read` | List templates |
| GET | `/api/resources/setup-templates/:id` | `room:read` | Get template details |
| POST | `/api/resources/setup-templates` | `room:configure` | Create template |
| PUT | `/api/resources/setup-templates/:id` | `room:configure` | Update template |
| DELETE | `/api/resources/setup-templates/:id` | `room:configure` | Delete template |
| POST | `/api/resources/setup-templates/:id/clone` | `room:configure` | Clone template |
| GET | `/api/resources/setup-templates/by-procedure/:procedureType` | `room:read` | Get by procedure |

---

## Data Model

```prisma
model RoomSetupTemplate {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  roomId          String?  @db.ObjectId  // null for clinic-wide templates

  // Template details
  name            String
  procedureType   String?  // Link to appointment/procedure type
  description     String?

  // Checklist
  checklistItems  Json     // Array of checklist items with categories
  /*
    [
      {
        "id": "uuid",
        "category": "equipment",
        "item": "Curing light",
        "description": "Verify battery charged",
        "isRequired": true,
        "order": 1
      },
      {
        "id": "uuid",
        "category": "supplies",
        "item": "Brackets (patient-specific)",
        "description": "Check prescription matches",
        "isRequired": true,
        "order": 2
      }
    ]
  */

  // Status
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false)  // Default for procedure type

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  room      Room?  @relation(fields: [roomId], references: [id])

  @@index([clinicId])
  @@index([roomId])
  @@index([procedureType])
}

model SetupCompletion {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  templateId      String   @db.ObjectId
  appointmentId   String?  @db.ObjectId
  roomId          String   @db.ObjectId

  // Completion details
  completedAt     DateTime @default(now())
  completedBy     String   @db.ObjectId

  // Status
  completionStatus CompletionStatus
  checkedItems    String[] // IDs of items checked

  // Notes
  notes           String?
  issues          String?  // Any issues found during setup

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  template  RoomSetupTemplate @relation(fields: [templateId], references: [id])

  @@index([clinicId])
  @@index([templateId])
  @@index([appointmentId])
  @@index([completedAt])
}

enum CompletionStatus {
  COMPLETE        // All required items checked
  PARTIAL         // Some required items missing
  ISSUE_REPORTED  // Issues found during setup
}
```

---

## Business Rules

- Only one template can be marked as default per procedure type per room/clinic
- Room-specific templates override clinic-wide templates for that room
- Required items must be checked for COMPLETE status
- Template linked to appointment type auto-displays at check-in/prep time
- Deactivated templates remain for historical reference but don't appear in selection
- Cloned templates create independent copies

---

## Dependencies

**Depends On:**
- Room Registry (room-specific templates)
- Auth & Authorization (user authentication, permissions)
- Appointment Types (procedure type linking)

**Required By:**
- Practice Orchestration (setup status in patient flow)
- Scheduling & Booking (appointment prep requirements)

---

## Notes

- Consider mobile-friendly checklist interface for clinical staff
- Photo reference per checklist item could aid training
- Setup time estimates could inform scheduling buffer times
- Issue reporting should notify appropriate staff (e.g., supply reorder needed)
- Analytics on incomplete setups could identify training needs
- Integration with inventory for supply verification

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
