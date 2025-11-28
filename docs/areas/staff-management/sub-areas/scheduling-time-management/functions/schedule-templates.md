# Schedule Templates

> **Sub-Area**: [Scheduling & Time Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Create reusable schedule templates for efficient recurring schedule creation. Supports weekly, bi-weekly, and monthly templates with location and department scoping. Allows quick application of standard schedules with one-click template deployment.

---

## Core Requirements

- [ ] Create templates from existing schedules
- [ ] Support weekly/bi-weekly/monthly patterns
- [ ] Department and location-specific templates
- [ ] Template versioning and history
- [ ] Seasonal schedule variations
- [ ] One-click template application
- [ ] Template preview before application

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/schedule-templates` | `schedule:read` | List templates |
| GET | `/api/staff/schedule-templates/:id` | `schedule:read` | Get template |
| POST | `/api/staff/schedule-templates` | `schedule:create` | Create template |
| PUT | `/api/staff/schedule-templates/:id` | `schedule:update` | Update template |
| DELETE | `/api/staff/schedule-templates/:id` | `schedule:delete` | Delete template |
| POST | `/api/staff/schedule-templates/:id/apply` | `schedule:create` | Apply template |
| POST | `/api/staff/schedule-templates/from-week` | `schedule:create` | Create from existing week |

---

## Data Model

```prisma
model ScheduleTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  name          String
  description   String?
  templateType  TemplateType
  periodType    TemplatePeriod @default(WEEKLY)

  locationId    String?  @db.ObjectId
  departmentId  String?  @db.ObjectId
  roleId        String?  @db.ObjectId

  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  effectiveFrom DateTime?
  effectiveUntil DateTime?

  shifts        TemplateShift[]

  @@index([templateType])
  @@index([isActive])
}

type TemplateShift {
  dayOfWeek     Int       // 0-6 (Sunday-Saturday)
  startTime     String    // "HH:mm"
  endTime       String    // "HH:mm"
  breakMinutes  Int
  roleId        String?
  staffProfileId String?
  locationId    String?
  shiftType     ShiftType
  notes         String?
}

enum TemplateType {
  STANDARD
  EXTENDED_HOURS
  HOLIDAY
  SEASONAL
  CUSTOM
}

enum TemplatePeriod {
  DAILY
  WEEKLY
  BI_WEEKLY
  MONTHLY
}
```

---

## Business Rules

- Only one template can be marked as default per location
- Templates can be scoped to specific departments or roles
- Applying a template does not overwrite existing shifts
- Template application respects staff availability
- Seasonal templates have effective date ranges
- System templates cannot be deleted (only deactivated)

### Template Types

| Template | Description | Use Case |
|----------|-------------|----------|
| Standard Week | Regular operating schedule | Normal weeks |
| Extended Hours | Evening/weekend coverage | High-demand periods |
| Holiday Week | Reduced staffing | Holiday periods |
| Seasonal | School-year adjusted | Summer schedules |

---

## Dependencies

**Depends On:**
- Shift Scheduling
- Staff Availability

**Required By:**
- Quick schedule creation
- Consistent scheduling patterns

---

## Notes

- Consider: template suggestions based on historical patterns
- Provider rotation templates for multi-location practices
- Template conflicts should show preview before application
- Auto-apply templates for future weeks
