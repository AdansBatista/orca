# Schedule Template Builder

> **Sub-Area**: [Calendar Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Schedule Template Builder enables clinic administrators to create and manage pre-configured day and week schedule templates with color-coded appointment slots. Templates standardize scheduling across the practice by defining when specific appointment types can be booked, which resources are assigned, and how the visual calendar appears to staff.

---

## Core Requirements

- [ ] Create day templates (e.g., "Monday Template", "Scan Day", "Adjustment Heavy Day")
- [ ] Create week templates combining different day configurations
- [ ] Define time blocks with configurable start/end times
- [ ] Assign appointment types to slots with color coding
- [ ] Pre-assign chairs, rooms, and providers to template slots
- [ ] Configure slot capacity (single or multiple patients per slot)
- [ ] Set buffer/prep/cleanup times per slot
- [ ] Support drag-and-drop template design interface
- [ ] Clone/duplicate templates for quick creation
- [ ] Maintain template library with categories and versioning

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/templates` | `booking:view_calendar` | List schedule templates |
| GET | `/api/booking/templates/:id` | `booking:view_calendar` | Get template details with slots |
| POST | `/api/booking/templates` | `booking:manage_templates` | Create new template |
| PUT | `/api/booking/templates/:id` | `booking:manage_templates` | Update template |
| DELETE | `/api/booking/templates/:id` | `booking:manage_templates` | Soft delete template |
| POST | `/api/booking/templates/:id/clone` | `booking:manage_templates` | Clone existing template |
| POST | `/api/booking/templates/:id/slots` | `booking:manage_templates` | Add slot to template |
| PUT | `/api/booking/templates/:id/slots/:slotId` | `booking:manage_templates` | Update template slot |
| DELETE | `/api/booking/templates/:id/slots/:slotId` | `booking:manage_templates` | Remove slot from template |

---

## Data Model

```prisma
model ScheduleTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  name          String
  description   String?
  templateType  TemplateType  // DAY, WEEK
  category      String?
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)
  version       Int      @default(1)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  slots     TemplateSlot[]

  @@index([clinicId])
}

model TemplateSlot {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  templateId    String   @db.ObjectId
  startTime     String   // "09:00" (24hr format)
  endTime       String   // "09:30"
  dayOfWeek     Int?     // For week templates: 0-6
  appointmentTypeId  String   @db.ObjectId
  providerId    String?  @db.ObjectId
  chairId       String?  @db.ObjectId
  roomId        String?  @db.ObjectId
  capacity      Int      @default(1)
  color         String?
  prepTime      Int      @default(0)
  cleanupTime   Int      @default(0)

  template        ScheduleTemplate @relation(fields: [templateId], references: [id])
  appointmentType AppointmentType  @relation(fields: [appointmentTypeId], references: [id])

  @@index([templateId])
}
```

---

## Business Rules

- Only clinic_admin role can create and modify templates
- Templates belong to a clinic; multi-clinic sharing optional via flag
- Each clinic can have one default template per day of week
- Slot capacity cannot exceed assigned chair/room capacity
- Template modifications create new versions; existing applications reference old versions
- Deleting a template soft-deletes it; active applications continue until end date
- Slot times must not overlap within same day/provider

---

## Dependencies

**Depends On:**
- [Auth & Authorization](../../../../auth/) - Permission checking
- [Resources Management](../../../../resources-management/) - Chair/room definitions
- [Appointment Type Configuration](../../appointment-management/functions/appointment-types.md) - Appointment types

**Required By:**
- [Template Application](./template-application.md)
- [Template Analytics](./template-analytics.md)

---

## Notes

- Consider visual grid-based template builder similar to Google Calendar's event creation
- Templates should preview how they'll appear on the actual calendar
- Include validation to ensure all required appointment types have slots

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
