# Clinic Switching

> **Sub-Area**: [Data Isolation](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Enables users with access to multiple clinics to switch their active clinic context. Switching updates the session's clinicId, affecting all subsequent data queries. Provides UI components and context for clinic selection.

---

## Core Requirements

- [ ] Check if user has multiple clinic access
- [ ] Display clinic switcher for multi-clinic users
- [ ] Validate user has permission for target clinic
- [ ] Update session with new clinicId
- [ ] Refresh page data after switch
- [ ] Log clinic switch for audit
- [ ] Persist last-used clinic preference

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/auth/clinics` | Authenticated | Get user's accessible clinics |
| POST | `/api/auth/switch-clinic` | Authenticated | Switch active clinic |

### Switch Request

```typescript
// POST /api/auth/switch-clinic
{ clinicId: string }

// Response
{
  success: true,
  data: {
    clinicId: string;
    clinicName: string;
  }
}
```

---

## Data Model

User clinic assignments:

```prisma
model User {
  clinicId  String   @db.ObjectId  // Current active clinic
  clinicIds String[] @db.ObjectId  // All assigned clinics
}
```

---

## Business Rules

### Who Can Switch

| Role | Can Switch | Clinics Available |
|------|------------|-------------------|
| Super Admin | Yes | All clinics |
| Clinic Admin | Yes | Assigned clinics |
| Other roles | Conditional | Only if assigned multiple |

### Switch Flow

```typescript
async function switchClinic(session: Session, targetClinicId: string) {
  // 1. Validate user has access
  if (session.user.role !== 'super_admin') {
    if (!session.user.clinicIds.includes(targetClinicId)) {
      throw new ForbiddenError('Not authorized for this clinic');
    }
  }

  // 2. Update user's current clinic in database
  await db.user.update({
    where: { id: session.user.id },
    data: { clinicId: targetClinicId },
  });

  // 3. Log the switch
  await logAudit(session, {
    action: 'CLINIC_SWITCH',
    details: {
      from: session.user.clinicId,
      to: targetClinicId,
    },
  });

  // 4. Return new session data (client will refresh)
  return { clinicId: targetClinicId };
}
```

### UI Component

```tsx
// Shown in header for multi-clinic users
<ClinicSwitcher
  currentClinicId={session.user.clinicId}
  availableClinics={session.user.clinics}
  onSwitch={handleSwitch}
/>
```

### After Switch

- Session token updated with new clinicId
- Page reloads to fetch new clinic data
- All queries now filter by new clinicId
- Navigation remains on same page (if accessible)

---

## Dependencies

**Depends On:**
- Session Management
- Scope Management

**Required By:**
- Header component
- Multi-clinic reports

---

## Notes

- Switching is immediate - no confirmation needed
- Consider: switch confirmation for sensitive pages
- Consider: preserve URL path when switching
