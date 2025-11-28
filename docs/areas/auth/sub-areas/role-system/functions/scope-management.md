# Scope Management

> **Sub-Area**: [Role System](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Manages role scope types (Global, Multi-Clinic, Clinic) and determines what data users can access based on their role scope. Ensures proper clinic access control based on role assignments.

---

## Core Requirements

- [ ] Define three scope levels: GLOBAL, MULTI_CLINIC, CLINIC
- [ ] Determine accessible clinics based on role scope
- [ ] Validate clinic access on every request
- [ ] Handle clinic switching for multi-clinic users
- [ ] Provide getAccessibleClinics(user) utility

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/auth/clinics` | Authenticated | Get user's accessible clinics |
| POST | `/api/auth/switch-clinic` | Authenticated | Switch current clinic context |

---

## Data Model

Scope stored on Role model:

```prisma
enum RoleScope {
  GLOBAL       // Access all clinics
  MULTI_CLINIC // Access assigned clinics
  CLINIC       // Access single clinic
}
```

User clinic assignments:

```prisma
model User {
  clinicId  String   @db.ObjectId  // Current/primary clinic
  clinicIds String[] @db.ObjectId  // All assigned clinics
}
```

---

## Business Rules

### Scope Definitions

| Scope | Access | Roles |
|-------|--------|-------|
| GLOBAL | All clinics in system | super_admin only |
| MULTI_CLINIC | Multiple assigned clinics | clinic_admin |
| CLINIC | Single assigned clinic | doctor, clinical_staff, front_desk, billing, read_only |

### Access Rules

```typescript
function getAccessibleClinics(user: User): string[] {
  if (user.role === 'super_admin') {
    // Global scope: all clinics
    return getAllClinicIds();
  }

  // Multi-clinic or single clinic: assigned clinics only
  return user.clinicIds;
}

function canAccessClinic(user: User, clinicId: string): boolean {
  if (user.role === 'super_admin') return true;
  return user.clinicIds.includes(clinicId);
}
```

### Clinic Switching

- Only users with multiple clinics can switch
- Switching updates session.user.clinicId
- All subsequent queries use new clinicId
- Log clinic switch event for audit

---

## Dependencies

**Depends On:**
- Role Definitions
- User model

**Required By:**
- Data Isolation (query filtering)
- Clinic Switcher component
- All data access

---

## Notes

- Super admin scope is implicit (code check, not DB)
- Clinic assignments stored on User, not Role
- Session must be refreshed after clinic switch
