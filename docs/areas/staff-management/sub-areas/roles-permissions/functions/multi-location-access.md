# Multi-Location Access

> **Sub-Area**: [Roles & Permissions](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Manage staff access across multiple clinic locations within a practice group. Supports location-specific role assignments, cross-location visibility rules, and floating staff access patterns. Essential for multi-site orthodontic practices with shared providers.

---

## Core Requirements

- [ ] Assign location-specific roles
- [ ] Configure cross-location data visibility
- [ ] Manage floating staff access patterns
- [ ] Support provider multi-location assignments
- [ ] Handle primary vs. secondary location access
- [ ] Location-restricted permission overrides
- [ ] Cross-location audit logging

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/users/:userId/locations` | `roles:read` | Get user locations |
| POST | `/api/users/:userId/locations` | `roles:assign` | Add location access |
| DELETE | `/api/users/:userId/locations/:locationId` | `roles:assign` | Remove location access |
| GET | `/api/users/:userId/roles` | `roles:read` | Get user role assignments |
| POST | `/api/users/:userId/roles` | `roles:assign` | Assign role (with location) |
| DELETE | `/api/users/:userId/roles/:assignmentId` | `roles:assign` | Remove role assignment |
| GET | `/api/locations/:locationId/users` | `roles:read` | Get location users |

---

## Data Model

```prisma
model RoleAssignment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  userId        String   @db.ObjectId
  roleId        String   @db.ObjectId

  clinicId      String?  @db.ObjectId  // Location scope (null = all)
  isPrimary     Boolean  @default(false)

  effectiveFrom DateTime @default(now())
  effectiveUntil DateTime?
  isActive      Boolean  @default(true)

  assignedBy    String?  @db.ObjectId
  revokedBy     String?  @db.ObjectId
  revokedAt     DateTime?

  @@unique([userId, roleId, clinicId])
  @@index([userId])
  @@index([clinicId])
}
```

---

## Business Rules

- Staff can have different roles at different locations
- Primary location determines default context
- Same role at multiple locations = multi-location access
- Location-specific assignment overrides global assignment
- Providers typically need full clinical access at all locations
- Super admin has implicit access to all locations
- Location switching changes data context for queries

### Access Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| Single Location | One clinic only | Most staff |
| Multi-Location (same role) | Same permissions everywhere | Floating staff |
| Primary + Secondary | Full at primary, limited at secondary | Coverage |
| Organization-Wide | All locations | Executives, IT |
| Location-Specific Roles | Different roles per location | Varied responsibilities |

### Provider Multi-Location Scenarios

```
Scenario: Dr. Smith works at two locations
- Location A: Monday, Tuesday, Wednesday
- Location B: Thursday, Friday

Access Configuration:
- Role: doctor at both locations
- Full clinical access at both
- Schedule determines default location context
```

---

## Dependencies

**Depends On:**
- Role Management
- Clinic/Location Setup
- Employee Profiles (assigned locations)

**Required By:**
- Data isolation enforcement
- Appointment scheduling
- Reporting (location filters)

---

## Notes

- Consider: automatic location context based on IP/schedule
- Location switching should be logged for audit
- Reports may aggregate across locations based on permissions
- Multi-location providers need unified patient view
