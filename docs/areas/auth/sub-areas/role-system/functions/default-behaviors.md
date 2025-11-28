# Default Behaviors

> **Sub-Area**: [Role System](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Defines the default access patterns and UI behaviors for each role. Determines default landing pages, visible menu items, and feature access without checking individual permissions. Provides consistent user experience based on role persona.

---

## Core Requirements

- [ ] Define default landing page per role
- [ ] Define visible navigation sections per role
- [ ] Define default dashboard widgets per role
- [ ] Provide role-based feature flags
- [ ] Allow customization while maintaining defaults

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/roles/[code]/defaults` | `settings:manage_roles` | Get role default configuration |

---

## Data Model

Defaults defined in TypeScript (not database):

```typescript
// lib/auth/roleDefaults.ts
export interface RoleDefaults {
  landingPage: string;
  navSections: string[];
  dashboardWidgets: string[];
  quickActions: string[];
}

export const ROLE_DEFAULTS: Record<RoleCode, RoleDefaults> = {
  super_admin: {
    landingPage: '/admin/dashboard',
    navSections: ['admin', 'clinics', 'reports', 'settings'],
    dashboardWidgets: ['system-health', 'clinic-overview', 'user-activity'],
    quickActions: ['create-clinic', 'create-user', 'view-logs'],
  },
  clinic_admin: {
    landingPage: '/dashboard',
    navSections: ['dashboard', 'patients', 'schedule', 'staff', 'reports', 'settings'],
    dashboardWidgets: ['daily-schedule', 'patient-flow', 'financials', 'staff-status'],
    quickActions: ['new-patient', 'new-appointment', 'run-report'],
  },
  doctor: {
    landingPage: '/schedule',
    navSections: ['schedule', 'patients', 'treatments', 'imaging', 'lab'],
    dashboardWidgets: ['my-schedule', 'pending-treatments', 'lab-orders'],
    quickActions: ['view-schedule', 'create-treatment', 'order-lab'],
  },
  clinical_staff: {
    landingPage: '/patient-flow',
    navSections: ['patient-flow', 'patients', 'schedule'],
    dashboardWidgets: ['patient-queue', 'room-status', 'tasks'],
    quickActions: ['check-in-patient', 'update-progress'],
  },
  front_desk: {
    landingPage: '/schedule',
    navSections: ['schedule', 'patients', 'communications', 'check-in'],
    dashboardWidgets: ['today-appointments', 'check-ins', 'messages'],
    quickActions: ['new-appointment', 'check-in', 'send-message'],
  },
  billing: {
    landingPage: '/billing',
    navSections: ['billing', 'claims', 'payments', 'reports'],
    dashboardWidgets: ['outstanding-balance', 'pending-claims', 'daily-collections'],
    quickActions: ['create-invoice', 'submit-claim', 'process-payment'],
  },
  read_only: {
    landingPage: '/dashboard',
    navSections: ['dashboard', 'reports'],
    dashboardWidgets: ['summary-stats'],
    quickActions: [],
  },
};
```

---

## Business Rules

- Defaults apply automatically on role assignment
- User preferences can override defaults (stored separately)
- Quick actions respect permission checks
- Navigation sections filtered by actual permissions
- Unknown roles fall back to read_only defaults

---

## Dependencies

**Depends On:**
- Role Definitions
- Permission Matrix

**Required By:**
- Navigation component
- Dashboard page
- Landing page redirect

---

## Notes

- Defaults are UX convenience, not security
- Actual access still controlled by permissions
- Consider: per-clinic default customization
