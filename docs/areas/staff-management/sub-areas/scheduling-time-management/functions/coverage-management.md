# Coverage Management

> **Sub-Area**: [Scheduling & Time Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Identify coverage gaps and ensure adequate staffing for all shifts and locations. Defines minimum staffing requirements by role, detects understaffing situations, and provides tools for posting open shifts and finding coverage volunteers.

---

## Core Requirements

- [ ] Define minimum staffing levels by role and location
- [ ] Detect coverage gaps automatically
- [ ] Generate coverage gap alerts
- [ ] Post open shifts for volunteer pickup
- [ ] Track cross-training for coverage flexibility
- [ ] Coverage request notifications
- [ ] Historical coverage analysis reporting

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/coverage` | `schedule:read` | Get coverage overview |
| GET | `/api/staff/coverage/gaps` | `schedule:read` | Get coverage gaps |
| GET | `/api/staff/coverage/requirements` | `schedule:read` | Get staffing requirements |
| POST | `/api/staff/coverage/requirements` | `schedule:create` | Create requirement |
| PUT | `/api/staff/coverage/requirements/:id` | `schedule:update` | Update requirement |
| GET | `/api/staff/shifts/open` | `schedule:read` | Get open/uncovered shifts |
| POST | `/api/staff/shifts/:shiftId/volunteer` | `schedule:request` | Volunteer for open shift |

---

## Data Model

```prisma
model CoverageRequirement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  locationId    String   @db.ObjectId

  name          String
  roleId        String?  @db.ObjectId
  departmentId  String?  @db.ObjectId

  minimumStaff  Int
  optimalStaff  Int?
  maximumStaff  Int?

  dayOfWeek     Int?     // null = all days
  startTime     String?  // null = all hours
  endTime       String?

  priority      Int      @default(1)
  isCritical    Boolean  @default(false)
  isActive      Boolean  @default(true)

  @@index([locationId])
  @@index([roleId])
}
```

---

## Business Rules

- Provider coverage is critical for clinical operations
- Minimum requirements enforced per role category
- Coverage gaps generate alerts to managers
- Open shifts visible to qualified staff
- Cross-training determines coverage eligibility
- Historical gaps inform scheduling decisions

### Minimum Staffing Requirements

| Role Category | Minimum per Shift | Notes |
|---------------|-------------------|-------|
| Provider | 1 | Required for clinical ops |
| Clinical Staff | 2 | Per provider |
| Front Desk | 1 | For patient flow |
| Treatment Coordinator | 1 | During new patient hours |

### Coverage Gap Types

| Type | Severity | Description |
|------|----------|-------------|
| No Provider | Critical | Cannot operate clinically |
| Understaffed | High | Below minimum levels |
| No Front Desk | High | Patient flow affected |
| Partial Coverage | Medium | Reduced capacity |

---

## Dependencies

**Depends On:**
- Shift Scheduling
- Employee Profiles
- Role definitions

**Required By:**
- Time-Off Approval (impact assessment)
- Schedule Views (gap visualization)
- Manager Alerts

---

## Notes

- Consider: automated coverage suggestions based on availability
- Consider: cross-location coverage for multi-site practices
- Providers may have specific location assignments
- Coverage needs vary by appointment volume
