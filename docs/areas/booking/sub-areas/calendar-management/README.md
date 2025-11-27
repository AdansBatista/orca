# Calendar Management

> **Area**: [Booking & Scheduling](../../)
>
> **Sub-Area**: 2.1.1 Calendar Management
>
> **Purpose**: Manage calendar views, schedule templates, and visual scheduling interfaces

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Booking & Scheduling](../../) |
| **Dependencies** | Auth, Staff Management, Resources Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

Calendar Management is the visual and organizational foundation of the Booking & Scheduling system. It provides multi-provider calendar views, powerful schedule template building, and intelligent template application across dates and resources.

This sub-area enables practices to design their ideal scheduling patterns through templates and visualize appointments across providers, chairs, and rooms. The template system allows standardized, color-coded scheduling that staff can quickly book into.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.1.1.1 | [Multi-Provider Calendar](./functions/multi-provider-calendar.md) | View and manage calendars for multiple providers | 📋 Planned | Critical |
| 2.1.1.2 | [Schedule Template Builder](./functions/schedule-template-builder.md) | Create reusable day/week schedule templates | 📋 Planned | Critical |
| 2.1.1.3 | [Template Application](./functions/template-application.md) | Apply templates to calendar dates | 📋 Planned | Critical |
| 2.1.1.4 | [Calendar Views](./functions/calendar-views.md) | Day, week, month, and resource views | 📋 Planned | High |
| 2.1.1.5 | [Resource Calendar](./functions/resource-calendar.md) | Chair and room scheduling views | 📋 Planned | High |
| 2.1.1.6 | [Template Analytics](./functions/template-analytics.md) | Template utilization and effectiveness metrics | 📋 Planned | Medium |

---

## Function Details

### 2.1.1.1 Multi-Provider Calendar

**Purpose**: Display and manage appointment calendars for multiple orthodontists and staff members simultaneously.

**Key Capabilities**:
- View multiple providers side-by-side
- Color-code by provider for easy identification
- Provider-specific filtering
- Cross-provider availability comparison
- Provider schedule overlay mode
- Quick provider switching

**User Stories**:
- As a **front desk**, I want to see all providers' calendars at once so that I can find available slots across the practice
- As a **clinic admin**, I want to compare provider utilization so that I can balance patient load
- As a **doctor**, I want to view my calendar filtered from others so that I can focus on my schedule

---

### 2.1.1.2 Schedule Template Builder

**Purpose**: Create and manage pre-configured day and week templates with color-coded appointment slots.

**Key Capabilities**:
- Create day templates (e.g., "Monday Template", "Scan Day", "Adjustment Heavy Day")
- Create week templates with different day configurations
- Define time blocks with start/end times
- Assign appointment types to slots (Scan, First Appointment, Adjustment, etc.)
- Color coding and icon assignment for visual identification
- Pre-assign chairs/rooms and providers to slots
- Slot capacity configuration (single or multiple patients)
- Buffer time and cleanup time per slot
- Template library with categories and versioning
- Clone/duplicate templates for quick creation
- Drag-and-drop template design interface

**User Stories**:
- As a **clinic admin**, I want to create a template for scan days so that I can standardize our schedule
- As a **clinic admin**, I want to color-code different appointment types so staff can visually identify slots
- As a **clinic admin**, I want to assign specific chairs to template slots so that resources are pre-allocated

---

### 2.1.1.3 Template Application

**Purpose**: Apply schedule templates to calendar dates, date ranges, and recurring patterns.

**Key Capabilities**:
- Apply template to specific date
- Apply template to date range (week, month)
- Apply template to recurring pattern (every Monday, every other Tuesday)
- Bulk template application across multiple providers/chairs
- Override template for specific dates (holidays, special events)
- Partial template application (apply only certain slots)
- Template preview before application
- Conflict detection when applying templates
- Auto-adjust for practice closures and holidays

**User Stories**:
- As a **clinic admin**, I want to apply my "Standard Week" template to the entire next month
- As a **front desk**, I want to see a preview before applying a template so I don't overwrite existing appointments
- As a **clinic admin**, I want to set a different template for holiday weeks automatically

---

### 2.1.1.4 Calendar Views

**Purpose**: Provide multiple calendar perspectives for different use cases.

**Key Capabilities**:
- Day view with time slots
- Week view with multiple days
- Month view with appointment counts
- Agenda/list view for quick scanning
- Timeline view for resource planning
- Zoom levels (15min, 30min, 1hr increments)
- Print-friendly views
- Mobile-responsive layouts

**User Stories**:
- As a **front desk**, I want to switch between day and week views based on what I'm scheduling
- As a **doctor**, I want a quick agenda view to see my day's patients at a glance
- As a **clinic admin**, I want a month view to see overall booking patterns

---

### 2.1.1.5 Resource Calendar

**Purpose**: View and manage scheduling from a resource (chair/room) perspective.

**Key Capabilities**:
- Chair-based calendar view
- Room-based calendar view
- Equipment availability overlay
- Resource utilization visualization
- Resource conflict detection
- Multi-resource booking for complex appointments
- Resource availability search

**User Stories**:
- As a **front desk**, I want to see which chairs are available when booking so I can assign the right one
- As a **clinic admin**, I want to view chair utilization to optimize our resources
- As a **clinical staff**, I want to know which room is available for consultations

---

### 2.1.1.6 Template Analytics

**Purpose**: Analyze template effectiveness and utilization patterns.

**Key Capabilities**:
- Slot utilization rates (percentage of template slots filled)
- Template effectiveness (actual vs. planned schedule)
- Most/least used slots identification
- Revenue per template analysis
- Patient wait time correlation with template design
- Template comparison reports
- AI-powered optimization suggestions
- Seasonal trend analysis

**User Stories**:
- As a **clinic admin**, I want to see which template slots rarely get booked so I can adjust the schedule
- As a **clinic admin**, I want AI suggestions for template improvements based on booking patterns
- As a **clinic admin**, I want to compare revenue between different template configurations

---

## Data Model

```prisma
model ScheduleTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  description   String?
  templateType  TemplateType  // DAY, WEEK
  category      String?       // "Standard", "Scan Day", "Adjustment Heavy"

  // Configuration
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // For week templates
  weekDays      ScheduleTemplateDay[]

  // Version tracking
  version       Int      @default(1)
  parentId      String?  @db.ObjectId  // For versioning

  // Sharing
  sharedAcrossClinics  Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  slots        TemplateSlot[]
  applications TemplateApplication[]

  @@index([clinicId])
  @@index([templateType])
  @@index([isActive])
}

enum TemplateType {
  DAY
  WEEK
}

type ScheduleTemplateDay {
  dayOfWeek     Int       // 0-6 (Sunday-Saturday)
  templateSlots String[]  // References to TemplateSlot IDs for this day
}

model TemplateSlot {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  templateId    String   @db.ObjectId

  // Time configuration
  startTime     String   // "09:00" (24hr format)
  endTime       String   // "09:30"
  dayOfWeek     Int?     // For week templates: 0-6

  // Appointment type
  appointmentTypeId  String   @db.ObjectId

  // Resource pre-assignment
  providerId    String?  @db.ObjectId
  chairId       String?  @db.ObjectId
  roomId        String?  @db.ObjectId

  // Capacity
  capacity      Int      @default(1)  // Number of patients per slot

  // Visual
  color         String?  // Override color (otherwise use appointmentType color)
  icon          String?  // Override icon

  // Buffer times
  prepTime      Int      @default(0)  // Minutes before
  cleanupTime   Int      @default(0)  // Minutes after

  // Relations
  template        ScheduleTemplate @relation(fields: [templateId], references: [id])
  appointmentType AppointmentType  @relation(fields: [appointmentTypeId], references: [id])

  @@index([templateId])
  @@index([appointmentTypeId])
}

model TemplateApplication {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  templateId    String   @db.ObjectId

  // Application scope
  applicationType  ApplicationType

  // For single date
  date          DateTime?

  // For date range
  startDate     DateTime?
  endDate       DateTime?

  // For recurring
  recurringPattern  RecurringPattern?

  // Target resources
  providerId    String?  @db.ObjectId
  chairId       String?  @db.ObjectId

  // Status
  status        ApplicationStatus @default(ACTIVE)

  // Generated slots tracking
  generatedSlots Int     @default(0)

  // Timestamps
  createdAt DateTime @default(now())
  appliedAt DateTime?

  // Audit
  appliedBy String?  @db.ObjectId

  // Relations
  clinic       Clinic           @relation(fields: [clinicId], references: [id])
  template     ScheduleTemplate @relation(fields: [templateId], references: [id])

  @@index([clinicId])
  @@index([templateId])
  @@index([status])
}

enum ApplicationType {
  SINGLE_DATE
  DATE_RANGE
  RECURRING
}

type RecurringPattern {
  frequency     String    // "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"
  daysOfWeek    Int[]     // For weekly: [1, 3, 5] = Mon, Wed, Fri
  interval      Int       // Every X frequency units
  endDate       DateTime?
  maxOccurrences Int?
}

enum ApplicationStatus {
  PENDING
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

model AppointmentType {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Type info
  code          String   // "SCAN", "ADJ", "BOND", etc.
  name          String   // "Scan", "Adjustment", "Bonding"
  description   String?

  // Duration
  defaultDuration  Int   // Minutes
  minDuration      Int?  // Minimum duration
  maxDuration      Int?  // Maximum duration

  // Visual
  color         String   // Hex color "#FF5733"
  icon          String?  // Icon identifier

  // Resources
  requiresChair    Boolean  @default(true)
  requiresRoom     Boolean  @default(false)
  equipmentNeeded  String[] // Equipment IDs

  // Buffer times
  defaultPrepTime     Int  @default(0)
  defaultCleanupTime  Int  @default(0)

  // Procedure link
  procedureCodes   String[]  // CDT procedure codes

  // Settings
  isActive      Boolean  @default(true)
  allowOnline   Boolean  @default(false)  // Can patients book this online?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  templateSlots TemplateSlot[]
  appointments  Appointment[]

  @@unique([clinicId, code])
  @@index([clinicId])
  @@index([isActive])
}

model ProviderSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  providerId    String   @db.ObjectId

  // Schedule type
  scheduleType  ScheduleType  @default(REGULAR)

  // Regular hours (for REGULAR type)
  regularHours  WeeklyHours?

  // Effective dates
  effectiveFrom DateTime
  effectiveTo   DateTime?

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  provider     User      @relation(fields: [providerId], references: [id])
  timeBlocks   TimeBlock[]

  @@index([clinicId])
  @@index([providerId])
  @@index([isActive])
}

enum ScheduleType {
  REGULAR
  TEMPORARY
  OVERRIDE
}

type WeeklyHours {
  monday    DayHours?
  tuesday   DayHours?
  wednesday DayHours?
  thursday  DayHours?
  friday    DayHours?
  saturday  DayHours?
  sunday    DayHours?
}

type DayHours {
  isWorking   Boolean
  startTime   String?  // "09:00"
  endTime     String?  // "17:00"
  breakStart  String?  // "12:00"
  breakEnd    String?  // "13:00"
}

model TimeBlock {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Block info
  blockType     TimeBlockType
  title         String
  description   String?

  // Time
  startTime     DateTime
  endTime       DateTime
  isAllDay      Boolean  @default(false)

  // Scope
  providerId    String?  @db.ObjectId
  chairId       String?  @db.ObjectId
  roomId        String?  @db.ObjectId

  // Recurring
  isRecurring   Boolean  @default(false)
  recurringPattern  RecurringPattern?

  // Status
  status        TimeBlockStatus @default(ACTIVE)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String?  @db.ObjectId

  // Relations
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  schedule     ProviderSchedule? @relation(fields: [providerId], references: [providerId])

  @@index([clinicId])
  @@index([providerId])
  @@index([startTime, endTime])
  @@index([blockType])
}

enum TimeBlockType {
  LUNCH
  BREAK
  MEETING
  VACATION
  SICK
  TRAINING
  ADMIN
  BLOCKED
  EMERGENCY_HOLD
}

enum TimeBlockStatus {
  ACTIVE
  CANCELLED
}
```

---

## API Endpoints

### Schedule Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/templates` | List schedule templates | `booking:view_calendar` |
| GET | `/api/booking/templates/:id` | Get template details | `booking:view_calendar` |
| POST | `/api/booking/templates` | Create template | `booking:manage_templates` |
| PUT | `/api/booking/templates/:id` | Update template | `booking:manage_templates` |
| DELETE | `/api/booking/templates/:id` | Delete template | `booking:manage_templates` |
| POST | `/api/booking/templates/:id/clone` | Clone template | `booking:manage_templates` |
| POST | `/api/booking/templates/:id/apply` | Apply template to dates | `booking:apply_templates` |

### Template Slots

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/templates/:id/slots` | List template slots | `booking:view_calendar` |
| POST | `/api/booking/templates/:id/slots` | Add slot to template | `booking:manage_templates` |
| PUT | `/api/booking/templates/:id/slots/:slotId` | Update slot | `booking:manage_templates` |
| DELETE | `/api/booking/templates/:id/slots/:slotId` | Remove slot | `booking:manage_templates` |

### Appointment Types

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/appointment-types` | List appointment types | `booking:view_calendar` |
| GET | `/api/booking/appointment-types/:id` | Get type details | `booking:view_calendar` |
| POST | `/api/booking/appointment-types` | Create appointment type | `booking:manage_templates` |
| PUT | `/api/booking/appointment-types/:id` | Update appointment type | `booking:manage_templates` |
| DELETE | `/api/booking/appointment-types/:id` | Delete appointment type | `booking:manage_templates` |

### Calendar Views

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/calendar` | Get calendar data | `booking:view_calendar` |
| GET | `/api/booking/calendar/day/:date` | Get day view | `booking:view_calendar` |
| GET | `/api/booking/calendar/week/:date` | Get week view | `booking:view_calendar` |
| GET | `/api/booking/calendar/month/:date` | Get month view | `booking:view_calendar` |
| GET | `/api/booking/calendar/resource/:resourceId` | Get resource calendar | `booking:view_calendar` |

### Provider Schedules

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/provider-schedules` | List provider schedules | `booking:view_calendar` |
| GET | `/api/booking/provider-schedules/:providerId` | Get provider schedule | `booking:view_calendar` |
| PUT | `/api/booking/provider-schedules/:providerId` | Update provider schedule | `booking:manage_templates` |
| GET | `/api/booking/provider-schedules/:providerId/availability` | Get availability | `booking:view_calendar` |

### Time Blocks

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/time-blocks` | List time blocks | `booking:view_calendar` |
| POST | `/api/booking/time-blocks` | Create time block | `booking:modify_appointment` |
| PUT | `/api/booking/time-blocks/:id` | Update time block | `booking:modify_appointment` |
| DELETE | `/api/booking/time-blocks/:id` | Delete time block | `booking:modify_appointment` |

### Analytics

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/booking/analytics/template-utilization` | Template utilization | `booking:view_analytics` |
| GET | `/api/booking/analytics/slot-effectiveness` | Slot effectiveness | `booking:view_analytics` |
| GET | `/api/booking/analytics/optimization-suggestions` | AI suggestions | `booking:view_analytics` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `CalendarView` | Main calendar display component | `components/booking/` |
| `DayView` | Single day calendar view | `components/booking/` |
| `WeekView` | Week calendar view | `components/booking/` |
| `MonthView` | Month calendar view | `components/booking/` |
| `ResourceView` | Resource-based calendar | `components/booking/` |
| `ProviderSelector` | Multi-provider filter/selector | `components/booking/` |
| `TemplateBuilder` | Template design interface | `components/booking/` |
| `TemplateSlotEditor` | Edit individual template slots | `components/booking/` |
| `TemplateLibrary` | Template list and management | `components/booking/` |
| `TemplateApplicationWizard` | Apply templates to dates | `components/booking/` |
| `AppointmentTypeManager` | Configure appointment types | `components/booking/` |
| `ColorPicker` | Color selection for types/slots | `components/booking/` |
| `TimeBlockEditor` | Create/edit time blocks | `components/booking/` |
| `TemplateAnalyticsDashboard` | Template performance metrics | `components/booking/` |
| `CalendarPrintView` | Print-optimized calendar | `components/booking/` |

---

## Business Rules

1. **Template Ownership**: Templates belong to a clinic; only clinic admins can create/modify
2. **Default Templates**: Each clinic can have one default day template per day of week
3. **Slot Capacity**: Slot capacity cannot exceed the capacity of assigned chair/room
4. **Provider Availability**: Template slots can only be created within provider working hours
5. **Color Uniqueness**: Appointment type colors should be visually distinct within a clinic
6. **Template Versioning**: Modifying a template creates a new version; existing applications reference old version
7. **Holiday Handling**: Template applications automatically skip clinic closure dates
8. **Conflict Prevention**: Cannot apply overlapping templates to the same resource/date

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Staff Management | Required | Provider definitions and roles |
| Resources Management | Required | Chair and room definitions |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| FullCalendar | Optional | Calendar UI component library |
| date-fns | Required | Date manipulation library |

---

## Security Requirements

### Access Control
- **View calendar**: All authenticated users
- **Create templates**: clinic_admin only
- **Apply templates**: clinic_admin, front_desk (with restrictions)
- **View analytics**: clinic_admin, doctor

### Audit Requirements
- Log all template creation and modifications
- Track template applications
- Record time block creation/modification

### Data Protection
- Calendar data linked to patient PHI protected per HIPAA
- Provider schedules are confidential staff data

---

## Related Documentation

- [Parent: Booking & Scheduling](../../)
- [Appointment Management](../appointment-management/)
- [Staff Management](../../../staff-management/)
- [Resources Management](../../../resources-management/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
