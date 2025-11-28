# Availability Management

> **Sub-Area**: [Scheduling & Time Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Track staff availability preferences and constraints for informed scheduling decisions. Supports recurring availability patterns, temporary unavailability, preferred shift times, and location preferences. Enables constraint-aware scheduling that respects staff preferences.

---

## Core Requirements

- [ ] Staff availability input (self-service)
- [ ] Recurring availability patterns
- [ ] Temporary/one-time unavailability
- [ ] Preferred vs. available distinction
- [ ] Maximum hours preferences
- [ ] Location preferences for multi-location staff
- [ ] Availability-aware schedule suggestions

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/availability` | `schedule:read` | Get staff availability |
| POST | `/api/staff/:id/availability` | `schedule:update` | Set availability |
| PUT | `/api/staff/availability/:id` | `schedule:update` | Update availability |
| DELETE | `/api/staff/availability/:id` | `schedule:update` | Remove availability |
| GET | `/api/staff/availability/summary` | `schedule:read` | Team availability view |

---

## Data Model

```prisma
model StaffAvailability {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  availabilityType AvailabilityType
  isRecurring   Boolean  @default(false)

  // For recurring
  dayOfWeek     Int?     // 0-6 (Sunday-Saturday)
  startTime     String?  // "HH:mm"
  endTime       String?  // "HH:mm"

  // For specific dates
  specificDate  DateTime? @db.Date
  allDay        Boolean  @default(false)

  // Location preference
  locationId    String?  @db.ObjectId

  // Effective period
  effectiveFrom DateTime?
  effectiveUntil DateTime?

  reason        String?
  notes         String?
  isActive      Boolean  @default(true)

  @@index([staffProfileId])
  @@index([dayOfWeek])
  @@index([specificDate])
}

enum AvailabilityType {
  AVAILABLE       // Can work these times
  UNAVAILABLE     // Cannot work
  PREFERRED       // Would like to work
  IF_NEEDED       // Available but not preferred
  BLOCKED         // System-blocked (leave, training)
}
```

---

## Business Rules

- Staff can set recurring weekly availability
- One-time unavailability overrides recurring availability
- Approved time-off automatically creates BLOCKED entries
- Schedulers see availability when creating shifts
- Scheduling against UNAVAILABLE generates warning
- PREFERRED times get priority in auto-scheduling
- Availability does not guarantee shifts
- Changes take effect after current schedule period

### Availability Types

| Type | Description | Schedule Impact |
|------|-------------|-----------------|
| Available | Can work | Normal scheduling |
| Unavailable | Cannot work | Block scheduling |
| Preferred | Would like to work | Priority for shifts |
| If Needed | Available but not preferred | Use as backup |
| Blocked | System-blocked | Cannot override |

---

## Dependencies

**Depends On:**
- Employee Profiles
- Time-Off Management (creates blocks)

**Required By:**
- Shift Scheduling (constraint-aware)
- Coverage Management (available staff)
- Schedule Templates (availability check)

---

## Notes

- Consider: availability suggestions based on historical patterns
- Students may have class-based recurring unavailability
- Part-time staff typically have limited availability windows
- Multi-location staff may prefer certain locations
