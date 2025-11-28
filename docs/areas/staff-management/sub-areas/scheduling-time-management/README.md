# Scheduling & Time Management

> **Area**: [Staff Management](../../)
>
> **Sub-Area**: 2.2 Scheduling & Time Management
>
> **Purpose**: Manage staff schedules, time-off requests, coverage, and overtime tracking for orthodontic practices

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [Staff Management](../../) |
| **Dependencies** | Staff Profiles, Auth |
| **Last Updated** | 2024-11-27 |

---

## Overview

Scheduling & Time Management provides comprehensive workforce scheduling capabilities for orthodontic practices. This includes shift scheduling, time-off request management, coverage gap detection, and overtime tracking. The system supports multi-location scheduling, ensuring adequate staffing across all practice locations while respecting staff availability preferences and labor regulations.

Orthodontic practices have unique scheduling needs including provider availability for patient appointments, clinical staff coverage for procedures, and front desk coverage for patient flow. This sub-area integrates with appointment scheduling to ensure staff availability aligns with patient appointments.

### Key Capabilities

- Visual schedule builder with drag-and-drop interface
- Shift template management for recurring schedules
- Time-off request workflow with approval routing
- Coverage gap identification and alerts
- Overtime monitoring and compliance tracking
- Multi-location scheduling coordination
- Integration with appointment scheduling
- Schedule conflict detection and resolution
- Staff availability preference management

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.2.1 | [Shift Scheduling](./functions/shift-scheduling.md) | Create and manage staff shifts | 📋 Planned | Critical |
| 2.2.2 | [Time-Off Management](./functions/time-off-management.md) | Handle time-off requests and approvals | 📋 Planned | High |
| 2.2.3 | [Coverage Management](./functions/coverage-management.md) | Identify and fill coverage gaps | 📋 Planned | High |
| 2.2.4 | [Overtime Tracking](./functions/overtime-tracking.md) | Monitor and manage overtime | 📋 Planned | Medium |
| 2.2.5 | [Schedule Templates](./functions/schedule-templates.md) | Create reusable schedule templates | 📋 Planned | Medium |
| 2.2.6 | [Availability Management](./functions/availability-management.md) | Track staff availability preferences | 📋 Planned | Medium |

---

## Function Details

### 2.2.1 Shift Scheduling

**Purpose**: Create, manage, and modify staff work schedules across all practice locations.

**Key Capabilities**:
- Visual schedule builder (day/week/month views)
- Drag-and-drop shift assignment
- Shift templates for recurring patterns
- Multi-location scheduling
- Provider schedule integration with appointments
- Shift swap and trade requests
- Schedule publication and notification

**Shift Types**:
| Shift Type | Description | Typical Hours |
|------------|-------------|---------------|
| Morning | AM shift | 7:00 AM - 1:00 PM |
| Afternoon | PM shift | 1:00 PM - 7:00 PM |
| Full Day | Standard shift | 8:00 AM - 5:00 PM |
| Extended | Long shift | 7:00 AM - 7:00 PM |
| Half Day | Partial shift | 4-5 hours |
| On-Call | As needed | Variable |

**Orthodontic Schedule Patterns**:
- Provider clinic days (specific days at specific locations)
- Multi-location provider rotation
- Clinical staff aligned with provider schedules
- Front desk coverage during all operating hours
- Extended hours for after-school appointments

**User Stories**:
- As a **clinic admin**, I want to create weekly schedules for all staff
- As a **provider**, I want to see my schedule across all locations
- As a **staff member**, I want to request shift swaps with colleagues

---

### 2.2.2 Time-Off Management

**Purpose**: Handle time-off requests with approval workflows and impact assessment.

**Key Capabilities**:
- Self-service time-off requests
- Approval workflow routing
- PTO balance tracking
- Calendar integration showing approved time-off
- Coverage requirement alerts
- Time-off blackout dates
- Bulk time-off handling (holidays, practice closures)

**Time-Off Types**:
| Type | Approval Required | Accrues |
|------|-------------------|---------|
| Vacation | Yes | Yes |
| Sick | Notification | Yes |
| Personal | Yes | No |
| Bereavement | Notification | No |
| Jury Duty | Notification | No |
| FMLA | HR Review | No |
| Continuing Education | Yes | No |
| Unpaid Leave | Yes | No |

**Request Workflow**:
1. Staff submits request with dates and type
2. System checks coverage impact
3. Request routes to manager/admin
4. Approver reviews coverage and approves/denies
5. Staff notified of decision
6. Approved time-off appears on schedule

**User Stories**:
- As a **staff member**, I want to request time off through the system
- As a **clinic admin**, I want to approve/deny time-off requests
- As a **manager**, I want to see how time-off requests affect coverage

---

### 2.2.3 Coverage Management

**Purpose**: Identify coverage gaps and ensure adequate staffing for all shifts.

**Key Capabilities**:
- Minimum staffing level configuration
- Coverage gap detection and alerts
- Open shift posting for staff volunteers
- Coverage request notifications
- Provider coverage requirements
- Cross-training visibility for coverage options
- Historical coverage analysis

**Minimum Staffing Requirements**:
| Role Category | Minimum per Shift | Notes |
|---------------|-------------------|-------|
| Provider | 1 | Required for clinical operations |
| Clinical Staff | 2 | Per provider |
| Front Desk | 1 | For patient flow |
| Treatment Coordinator | 1 | For new patient hours |

**Coverage Gap Types**:
- **Understaffed**: Below minimum staffing levels
- **No Provider**: Clinical operations affected
- **No Front Desk**: Patient flow affected
- **Partial Coverage**: Reduced capacity

**User Stories**:
- As a **clinic admin**, I want to be alerted when we're understaffed
- As a **staff member**, I want to volunteer for open shifts
- As a **manager**, I want to see coverage levels for the upcoming week

---

### 2.2.4 Overtime Tracking

**Purpose**: Monitor and manage overtime to ensure compliance and budget management.

**Key Capabilities**:
- Real-time overtime calculations
- Weekly hour tracking
- Overtime alerts and warnings
- Overtime approval workflow
- Overtime reports by employee/department
- Budget impact analysis
- Labor law compliance monitoring

**Overtime Thresholds**:
| Threshold | Hours | Action |
|-----------|-------|--------|
| Standard Week | 40 hours | Normal tracking |
| Approaching | 38 hours | Warning alert |
| Overtime | 40+ hours | Overtime rate applies |
| Excessive | 50+ hours | Management review required |

**Compliance Considerations**:
- Federal overtime requirements (FLSA)
- State-specific overtime rules
- Healthcare worker regulations
- Meal and break requirements

**User Stories**:
- As a **clinic admin**, I want to see who is approaching overtime
- As a **payroll manager**, I want accurate overtime reports for payroll
- As a **manager**, I want to approve overtime before it's worked

---

### 2.2.5 Schedule Templates

**Purpose**: Create reusable schedule templates for efficient recurring schedule creation.

**Key Capabilities**:
- Template creation from existing schedules
- Weekly/bi-weekly/monthly templates
- Department-specific templates
- Location-specific templates
- Template versioning
- Seasonal template variations
- One-click template application

**Template Types**:
- **Standard Week**: Regular operating schedule
- **Extended Hours**: Additional evening/weekend coverage
- **Holiday Week**: Reduced staffing
- **Provider Rotation**: Multi-location provider schedules
- **Summer Schedule**: School-year adjusted hours

**User Stories**:
- As a **clinic admin**, I want to create templates for common schedule patterns
- As a **manager**, I want to apply templates quickly for weekly scheduling
- As a **admin**, I want to create seasonal schedule templates

---

### 2.2.6 Availability Management

**Purpose**: Track staff availability preferences and constraints.

**Key Capabilities**:
- Staff availability input
- Recurring availability patterns
- Temporary unavailability
- Preferred shift preferences
- Maximum hours preferences
- Location preferences for multi-location staff
- Constraint-aware scheduling

**Availability Types**:
| Type | Description |
|------|-------------|
| Available | Preferred working times |
| Unavailable | Cannot work |
| Preferred | Would like to work |
| If Needed | Available but not preferred |
| Blocked | System-blocked (leave, training) |

**User Stories**:
- As a **staff member**, I want to set my availability preferences
- As a **scheduler**, I want to see staff availability when creating schedules
- As a **staff member**, I want to block out recurring unavailable times

---

## Data Model

```prisma
// Staff Shifts
model StaffShift {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Shift Details
  shiftDate     DateTime @db.Date
  startTime     DateTime
  endTime       DateTime
  breakMinutes  Int      @default(0)
  scheduledHours Decimal

  // Location
  locationId    String   @db.ObjectId

  // Shift Type
  shiftType     ShiftType @default(REGULAR)

  // Status
  status        ShiftStatus @default(SCHEDULED)

  // Actual Times (for time tracking)
  clockIn       DateTime?
  clockOut      DateTime?
  actualBreakMinutes Int?
  actualHours   Decimal?

  // Notes
  notes         String?

  // Template Reference
  templateId    String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String?  @db.ObjectId
  modifiedBy String? @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])
  location      Clinic    @relation("ShiftLocation", fields: [locationId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([shiftDate])
  @@index([locationId])
  @@index([status])
}

enum ShiftType {
  REGULAR
  OVERTIME
  ON_CALL
  TRAINING
  MEETING
  COVERAGE
}

enum ShiftStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
  SWAP_PENDING
}

// Time-Off Requests
model TimeOffRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Request Details
  requestType   TimeOffType
  startDate     DateTime @db.Date
  endDate       DateTime @db.Date
  totalDays     Decimal
  totalHours    Decimal?

  // Partial Day Options
  isPartialDay  Boolean  @default(false)
  partialStartTime DateTime?
  partialEndTime DateTime?

  // Status
  status        TimeOffStatus @default(PENDING)

  // Reason
  reason        String?
  notes         String?

  // Approval
  reviewedBy    String?  @db.ObjectId
  reviewedAt    DateTime?
  approvalNotes String?
  rejectionReason String?

  // Coverage
  coverageRequired Boolean @default(true)
  coverageStaffId String?  @db.ObjectId
  coverageNotes String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])
  coverageStaff StaffProfile? @relation("TimeOffCoverage", fields: [coverageStaffId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([startDate])
  @@index([status])
}

enum TimeOffType {
  VACATION
  SICK
  PERSONAL
  BEREAVEMENT
  JURY_DUTY
  MILITARY
  MATERNITY
  PATERNITY
  FMLA
  UNPAID
  CONTINUING_EDUCATION
  HOLIDAY
  OTHER
}

enum TimeOffStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  WITHDRAWN
}

// Schedule Templates
model ScheduleTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template Details
  name          String
  description   String?
  templateType  TemplateType
  periodType    TemplatePeriod @default(WEEKLY)

  // Scope
  locationId    String?  @db.ObjectId  // null = all locations
  departmentId  String?  @db.ObjectId
  roleId        String?  @db.ObjectId

  // Status
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // Effective Dates
  effectiveFrom DateTime?
  effectiveUntil DateTime?

  // Template Data
  shifts        TemplateShift[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([templateType])
  @@index([isActive])
}

type TemplateShift {
  dayOfWeek     Int       // 0-6 (Sunday-Saturday)
  startTime     String    // "HH:mm"
  endTime       String    // "HH:mm"
  breakMinutes  Int
  roleId        String?
  staffProfileId String?  // For specific staff templates
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

// Staff Availability
model StaffAvailability {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Availability Type
  availabilityType AvailabilityType
  isRecurring   Boolean  @default(false)

  // For Recurring
  dayOfWeek     Int?     // 0-6 (Sunday-Saturday)
  startTime     String?  // "HH:mm"
  endTime       String?  // "HH:mm"

  // For Specific Dates
  specificDate  DateTime? @db.Date
  allDay        Boolean  @default(false)

  // Location Preference
  locationId    String?  @db.ObjectId

  // Effective Period
  effectiveFrom DateTime?
  effectiveUntil DateTime?

  // Notes
  reason        String?
  notes         String?

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([clinicId])
  @@index([staffProfileId])
  @@index([dayOfWeek])
  @@index([specificDate])
}

enum AvailabilityType {
  AVAILABLE
  UNAVAILABLE
  PREFERRED
  IF_NEEDED
  BLOCKED
}

// Coverage Requirements
model CoverageRequirement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  locationId    String   @db.ObjectId

  // Requirement Details
  name          String
  roleId        String?  @db.ObjectId
  departmentId  String?  @db.ObjectId

  // Staffing Levels
  minimumStaff  Int
  optimalStaff  Int?
  maximumStaff  Int?

  // Time Period
  dayOfWeek     Int?     // null = all days
  startTime     String?  // null = all hours
  endTime       String?

  // Priority
  priority      Int      @default(1)
  isCritical    Boolean  @default(false)

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  location      Clinic    @relation("CoverageLocation", fields: [locationId], references: [id])

  @@index([clinicId])
  @@index([locationId])
  @@index([roleId])
}

// Shift Swap Requests
model ShiftSwapRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Original Shift
  originalShiftId String @db.ObjectId
  requesterId   String   @db.ObjectId

  // Swap Type
  swapType      SwapType

  // Target (for SWAP type)
  targetShiftId String?  @db.ObjectId
  targetStaffId String?  @db.ObjectId

  // Status
  status        SwapStatus @default(PENDING)

  // Approval
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // Notes
  reason        String?
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  originalShift StaffShift @relation("OriginalShift", fields: [originalShiftId], references: [id])
  targetShift   StaffShift? @relation("TargetShift", fields: [targetShiftId], references: [id])

  @@index([clinicId])
  @@index([originalShiftId])
  @@index([requesterId])
  @@index([status])
}

enum SwapType {
  SWAP       // Exchange shifts with another staff
  GIVEAWAY   // Give shift to another staff
  PICKUP     // Pick up open shift
}

enum SwapStatus {
  PENDING
  ACCEPTED      // Target accepted (awaiting approval)
  APPROVED      // Manager approved
  REJECTED
  CANCELLED
  COMPLETED
}

// Overtime Log
model OvertimeLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  // Period
  weekStartDate DateTime @db.Date
  weekEndDate   DateTime @db.Date

  // Hours
  regularHours  Decimal
  overtimeHours Decimal
  totalHours    Decimal

  // Status
  status        OvertimeStatus @default(PENDING)
  preApproved   Boolean  @default(false)

  // Approval
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // Notes
  reason        String?
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@unique([staffProfileId, weekStartDate])
  @@index([clinicId])
  @@index([staffProfileId])
  @@index([weekStartDate])
  @@index([status])
}

enum OvertimeStatus {
  PENDING
  APPROVED
  REJECTED
  PAID
}
```

---

## API Endpoints

### Shifts

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/schedules` | Get schedules | `schedule:read` |
| GET | `/api/staff/schedules/week` | Get weekly schedule | `schedule:read` |
| GET | `/api/staff/:id/shifts` | Get staff shifts | `schedule:read` |
| POST | `/api/staff/:id/shifts` | Create shift | `schedule:create` |
| PUT | `/api/staff/shifts/:shiftId` | Update shift | `schedule:update` |
| DELETE | `/api/staff/shifts/:shiftId` | Delete shift | `schedule:update` |
| POST | `/api/staff/shifts/bulk` | Bulk create shifts | `schedule:create` |
| PUT | `/api/staff/shifts/:shiftId/status` | Update shift status | `schedule:update` |

### Time-Off

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/time-off` | List time-off requests | `schedule:read` |
| GET | `/api/staff/:id/time-off` | Get staff time-off | `schedule:read` |
| POST | `/api/staff/:id/time-off` | Request time-off | `schedule:request` |
| PUT | `/api/staff/time-off/:requestId` | Update request | `schedule:update` |
| POST | `/api/staff/time-off/:requestId/approve` | Approve request | `schedule:approve_timeoff` |
| POST | `/api/staff/time-off/:requestId/reject` | Reject request | `schedule:approve_timeoff` |
| DELETE | `/api/staff/time-off/:requestId` | Cancel request | `schedule:request` |
| GET | `/api/staff/:id/time-off/balance` | Get PTO balance | `schedule:read` |

### Coverage

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/coverage` | Get coverage overview | `schedule:read` |
| GET | `/api/staff/coverage/gaps` | Get coverage gaps | `schedule:read` |
| GET | `/api/staff/coverage/requirements` | Get requirements | `schedule:read` |
| POST | `/api/staff/coverage/requirements` | Create requirement | `schedule:create` |
| PUT | `/api/staff/coverage/requirements/:id` | Update requirement | `schedule:update` |
| GET | `/api/staff/shifts/open` | Get open shifts | `schedule:read` |

### Overtime

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/overtime` | Get overtime report | `schedule:read` |
| GET | `/api/staff/:id/overtime` | Get staff overtime | `schedule:read` |
| GET | `/api/staff/overtime/approaching` | Get approaching overtime | `schedule:read` |
| POST | `/api/staff/overtime/:id/approve` | Approve overtime | `schedule:approve_overtime` |

### Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/schedule-templates` | List templates | `schedule:read` |
| GET | `/api/staff/schedule-templates/:id` | Get template | `schedule:read` |
| POST | `/api/staff/schedule-templates` | Create template | `schedule:create` |
| PUT | `/api/staff/schedule-templates/:id` | Update template | `schedule:update` |
| DELETE | `/api/staff/schedule-templates/:id` | Delete template | `schedule:delete` |
| POST | `/api/staff/schedule-templates/:id/apply` | Apply template | `schedule:create` |

### Availability

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/:id/availability` | Get availability | `schedule:read` |
| POST | `/api/staff/:id/availability` | Set availability | `schedule:update` |
| PUT | `/api/staff/availability/:id` | Update availability | `schedule:update` |
| DELETE | `/api/staff/availability/:id` | Remove availability | `schedule:update` |

### Shift Swaps

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/staff/shift-swaps` | List swap requests | `schedule:read` |
| POST | `/api/staff/shifts/:shiftId/swap` | Request swap | `schedule:request` |
| PUT | `/api/staff/shift-swaps/:id/accept` | Accept swap | `schedule:request` |
| POST | `/api/staff/shift-swaps/:id/approve` | Approve swap | `schedule:update` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ScheduleCalendar` | Main schedule view (day/week/month) | `components/staff/scheduling/` |
| `ShiftEditor` | Create/edit individual shifts | `components/staff/scheduling/` |
| `ShiftCard` | Shift summary card | `components/staff/scheduling/` |
| `BulkShiftCreator` | Create multiple shifts | `components/staff/scheduling/` |
| `ScheduleToolbar` | View controls and filters | `components/staff/scheduling/` |
| `TimeOffRequestForm` | Submit time-off request | `components/staff/scheduling/` |
| `TimeOffCalendar` | Visual time-off view | `components/staff/scheduling/` |
| `TimeOffApprovalList` | Pending approvals list | `components/staff/scheduling/` |
| `TimeOffBalanceCard` | Display PTO balance | `components/staff/scheduling/` |
| `CoverageOverview` | Coverage status dashboard | `components/staff/scheduling/` |
| `CoverageGapAlert` | Coverage gap notifications | `components/staff/scheduling/` |
| `OpenShiftBoard` | Available open shifts | `components/staff/scheduling/` |
| `CoverageRequirementForm` | Set coverage requirements | `components/staff/scheduling/` |
| `OvertimeTracker` | Overtime status display | `components/staff/scheduling/` |
| `OvertimeReport` | Overtime summary report | `components/staff/scheduling/` |
| `OvertimeAlert` | Approaching overtime alert | `components/staff/scheduling/` |
| `TemplateSelector` | Choose schedule template | `components/staff/scheduling/` |
| `TemplateEditor` | Create/edit templates | `components/staff/scheduling/` |
| `AvailabilityEditor` | Set availability preferences | `components/staff/scheduling/` |
| `AvailabilityGrid` | Weekly availability view | `components/staff/scheduling/` |
| `ShiftSwapRequest` | Request shift swap | `components/staff/scheduling/` |
| `SwapApprovalList` | Pending swap approvals | `components/staff/scheduling/` |
| `StaffScheduleView` | Individual staff schedule | `components/staff/scheduling/` |

---

## Business Rules

1. **Shift Overlap Prevention**: Staff cannot be scheduled for overlapping shifts at the same location
2. **Multi-Location Conflicts**: System warns when scheduling conflicts across locations
3. **Break Requirements**: Shifts over 6 hours must include break time (per state law)
4. **Overtime Thresholds**: Alert at 38 hours, overtime at 40+ hours
5. **Time-Off Blackouts**: Blackout dates prevent time-off requests during critical periods
6. **Coverage Minimums**: Shifts below minimum coverage generate alerts
7. **Provider Requirements**: Clinical operations require at least one provider scheduled
8. **Advance Notice**: Time-off requests require configurable advance notice (default: 2 weeks)
9. **Approval Authority**: Time-off approval routes to appropriate manager/admin
10. **Schedule Publication**: Schedules should be published with configurable advance notice
11. **Swap Approval**: Shift swaps require manager approval before finalization
12. **Availability Respect**: Scheduling respects staff availability preferences when possible

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Staff Profiles | Required | Staff information for scheduling |
| Auth | Required | User authentication |
| Roles & Permissions | Required | Schedule access control |
| Appointment Scheduling | Integration | Provider availability sync |
| Payroll | Export | Hours worked for payroll |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Calendar Service | Optional | External calendar sync |
| Notification Service | Required | Schedule notifications |
| Email Service | Required | Time-off request notifications |

---

## Related Documentation

- [Parent: Staff Management](../../)
- [Staff Profiles & HR](../staff-profiles-hr/)
- [Roles & Permissions](../roles-permissions/)
- [Performance & Training](../performance-training/)
- [Scheduling & Booking](../../../scheduling-booking/) - Appointment integration

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
