# Staff Management - Remaining Backlog

> **Purpose**: Track remaining features to implement for Staff Management area
> **Status**: Post-MVP Enhancements (Core Complete)
> **Last Updated**: 2024-11-30

---

## Overview

All core Staff Management features have been implemented. This document tracks only the remaining enhancements and deferred items.

---

## Remaining Items

### Scheduling Enhancements (UX/Future)

- [ ] Drag-and-drop shift scheduling (UX enhancement)
- [ ] Schedule publication workflow
- [ ] PTO balance limits (currently unlimited PTO model)
- [ ] Bulk time-off for practice closures

### Deferred Items

These items are intentionally deferred to other areas or require additional infrastructure:

- **File Upload Infrastructure** → Imaging Management area
- **PDF Generation** → Requires @react-pdf/renderer installation
- **Notification System** → Patient Communications integration
- **Multi-Location Access** → Location-specific role assignment UI, Cross-location access management, Location-based permission restrictions

---

## Completed Features Summary

All original backlog items have been implemented:

| Category | Features Completed |
|----------|-------------------|
| **Scheduling** | Coverage Management, Overtime Tracking, Availability UI, Schedule Templates |
| **Roles & Permissions** | Role Hierarchy, Role Clone/Validate, Role History, Role Export/Import, Role Templates, Access Audit |
| **Performance & Training** | 6 Prisma Models, 6 API Endpoints, 6 UI Pages, Seed Data |

### Implementation Details

| Feature | Files Created |
|---------|---------------|
| Coverage Management | `api/staff/coverage/*`, `components/staff/scheduling/Coverage*`, `staff/schedules/coverage/page.tsx` |
| Overtime Tracking | `api/staff/overtime/*`, `components/staff/scheduling/Overtime*`, `staff/schedules/overtime/page.tsx` |
| Availability UI | `components/staff/scheduling/Availability*` |
| Role Clone/Validate | `api/roles/[id]/clone/route.ts`, `api/roles/[id]/validate/route.ts`, `lib/permissions.ts` |
| Role Templates | `api/role-templates/*`, `admin/role-templates/page.tsx` |
| Access Audit | `api/audit/*`, `admin/audit/page.tsx` |
| Role Hierarchy | `prisma/schema.prisma` (level, parentRoleId) |
| Role Change History | `prisma/schema.prisma` (RoleChangeHistory), `api/roles/[id]/history/route.ts` |
| Role Export/Import | `api/roles/export/route.ts`, `api/roles/import/route.ts` |
| Performance Models | `prisma/schema.prisma` (PerformanceMetric, StaffGoal, PerformanceReview, TrainingRecord, CECredit, Recognition) |
| Performance APIs | `api/staff/performance-metrics/*`, `api/staff/goals/*`, `api/staff/reviews/*`, `api/staff/training/*`, `api/staff/ce-credits/*`, `api/staff/recognition/*` |
| Performance UI | `staff/performance/*.tsx` (dashboard, goals, reviews, training, ce-credits, recognition) |
| Seed Data | `prisma/seed/areas/performance.seed.ts` |

---

**Last Updated**: 2024-11-30
