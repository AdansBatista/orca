# Current Development Focus

> **Last Updated**: 2025-12-04
>
> **Purpose**: Single source of truth for what LLMs and developers should work on

---

## Project Status

| Attribute | Value |
|-----------|-------|
| **Current Phase** | Phase 2 - Core Operations (In Progress) |
| **Implementation Status** | ✅ Phase 1 Complete, 🔄 Phase 2 In Progress |
| **Documentation Status** | ✅ Complete for all 13 areas |

---

## What's Ready to Build (No Blockers)

These areas have no dependencies and can be started immediately:

### ~~1. Authentication & Authorization~~ ✅ COMPLETE
- **Documentation**: [docs/areas/auth/](areas/auth/)
- **Status**: ✅ Implemented (Phase 1 scope)
- **Completed Features**: User login, session management (JWT), role-based permissions, audit logging
- **Code Patterns**: [AUTH-PATTERNS.md](guides/AUTH-PATTERNS.md)

### ~~2. Staff Management~~ ✅ COMPLETE
- **Documentation**: [docs/areas/staff-management/](areas/staff-management/)
- **Depends On**: Authentication ✅
- **Status**: ✅ All 4 sub-areas implemented (24/24 functions)
- **Completed Sub-Areas**:
  - ✅ Staff Profiles & HR (profiles, credentials, certifications, emergency contacts, documents)
  - ✅ Scheduling & Time Management (shifts, time-off, templates, availability, coverage)
  - ✅ Roles & Permissions (custom roles, permission assignment)
  - ✅ Performance & Training (metrics, goals, reviews)

### ~~3. Resources Management~~ ✅ COMPLETE
- **Documentation**: [docs/areas/resources-management/](areas/resources-management/)
- **Depends On**: Authentication ✅
- **Status**: ✅ All 4 sub-areas implemented
- **Completed Sub-Areas**:
  - ✅ Equipment Management (catalog, maintenance, repairs, types, suppliers)
  - ✅ Room/Chair Management (rooms, chairs, configuration, status)
  - ✅ Inventory Management (supplies catalog, stock tracking, purchase orders, alerts)
  - ✅ Sterilization & Compliance (cycles, packages, validations, compliance reports)

---

## 🚀 Phase 2: Core Operations - IN PROGRESS

### 1. Booking & Scheduling 🔄 IN PROGRESS
- **Documentation**: [docs/areas/booking/](areas/booking/)
- **Depends On**: Auth ✅, Staff ✅, Resources ✅
- **Key Deliverables**: Appointment scheduling, calendar management, provider availability
- **Priority**: Critical - core functionality for practice operations
- **Status**: Phase 2 UI Implementation In Progress
- **Completed (Phase 1 MVP)**:
  - ✅ API routes for appointments CRUD
  - ✅ API routes for appointment types
  - ✅ Appointment status transitions (confirm, check-in, start, complete, cancel, no-show)
  - ✅ Calendar API with provider/resource filtering
  - ✅ Availability checking API
  - ✅ Basic booking calendar component (FullCalendar)
- **Completed (Phase 2)**:
  - ✅ Enhanced calendar page with provider filtering
  - ✅ Calendar status refresh on appointment changes
  - ✅ Appointments list page with search, filters, pagination
  - ✅ Sidebar sub-navigation for booking
  - ✅ Waitlist Management (API + UI) - waitlist entries, prioritization, preferences
  - ✅ Cancellation Tracking (API + UI) - failed appointment recovery, rebooking workflow
  - ✅ At-Risk Patients (API + UI) - risk scoring, intervention tracking
  - ✅ Emergency Appointments (API + UI) - triage, severity tracking, resolution workflow
  - ✅ Appointment Reminders (API + UI) - templates, queue, multi-channel support

### 2. Practice Orchestration
- **Documentation**: [docs/areas/practice-orchestration/](areas/practice-orchestration/)
- **Depends On**: Auth ✅, Staff ✅, Booking
- **Key Deliverables**: Patient flow, check-in/out, waitlist management
- **Priority**: High - operational efficiency
- **Status**: Waiting on Booking

### 3. Patient Communications
- **Documentation**: [docs/areas/patient-communications/](areas/patient-communications/)
- **Depends On**: Auth ✅, Booking
- **Key Deliverables**: Reminders, notifications, messaging
- **Priority**: High - patient engagement
- **Status**: Waiting on Booking

---

## What's Blocked

| Area | Phase | Blocked By | Status |
|------|-------|------------|--------|
| Practice Orchestration | 2 | Booking | ⏳ Waiting |
| Patient Communications | 2 | Booking | ⏳ Waiting |
| CRM & Onboarding | 3 | Booking, Patient Comms | ⏳ Waiting |
| Treatment Management | 3 | Booking | ⏳ Waiting |
| Imaging Management | 3 | Treatment | ⏳ Waiting |
| Lab Work Management | 3 | Treatment | ⏳ Waiting |
| Billing & Insurance | 4 | Treatment, CRM | ⏳ Waiting |
| Financial Management | 4 | Billing | ⏳ Waiting |
| Compliance & Audit | 4 | All clinical areas | ⏳ Waiting |
| Vendors Management | 5 | Financial | ⏳ Waiting |

---

## Implementation Phases Overview

```
Phase 1: Foundation ✅       Phase 2: Core Operations       Phase 3: Clinical
┌─────────────────────┐     ┌─────────────────────┐        ┌─────────────────────┐
│ ✅ Auth & Users     │ ──▶ │ • Booking ← NEXT    │ ──▶    │ • CRM & Onboarding  │
│ ✅ Staff Management │     │ • Practice Orch.    │        │ • Treatment Mgmt    │
│ ✅ Resources Mgmt   │     │ • Patient Comms     │        │ • Imaging           │
└─────────────────────┘     └─────────────────────┘        │ • Lab Work          │
                                                           └─────────────────────┘
                                                                     │
                                                                     ▼
                            Phase 5: Support               Phase 4: Financial
                            ┌─────────────────────┐        ┌─────────────────────┐
                            │ • Vendors Mgmt      │ ◀───── │ • Billing           │
                            └─────────────────────┘        │ • Financial Mgmt    │
                                                           │ • Compliance        │
                                                           └─────────────────────┘
```

---

## For LLMs: Default Priority

If asked to "implement the next feature" or "start development" without specifics:

1. **Check Phase 1 completion** → ✅ Phase 1 is complete!
2. **Start Phase 2** → Begin with Booking & Scheduling
3. **Follow dependency order** → Never start an area before its dependencies

### Quick Decision Tree

```
Phase 1 Complete? ✅ YES
Phase 2 Started? ✅ YES (Booking in progress)
└── Continue Phase 2: Booking & Scheduling ← YOU ARE HERE
    ├── ✅ Calendar Management (MVP + Enhanced UI)
    ├── ✅ Appointment Management (CRUD + List View)
    ├── ✅ Waitlist & Recovery (API + UI Complete, Notifications on hold)
    ├── ✅ Emergency & Reminders (API + UI Complete)
    └── ⏳ On-Call Management (Next - additional features)
```

---

## Recently Completed

| Date | Area/Feature | Status |
|------|--------------|--------|
| 2025-12-04 | Booking - UI Styling Review & Standardization | ✅ Complete |
| 2025-12-04 | Booking - PatientSearchCombobox reusable component | ✅ Complete |
| 2025-12-03 | Booking - Emergency & Reminders (API + UI) | ✅ Complete |
| 2025-12-03 | Booking - Waitlist & Recovery (API + UI) | ✅ Complete |
| 2025-12-03 | Booking - Phase 2 Calendar & Appointments UI | ✅ Complete |
| 2024-12-02 | Booking - Phase 1 MVP (API & Basic Components) | ✅ Complete |
| 2024-12-02 | Resources Management - Sterilization & Compliance | ✅ Complete |
| 2024-12-02 | Resources Management - Inventory Management | ✅ Complete |
| 2024-12-01 | Resources Management - Room/Chair Management | ✅ Complete |
| 2024-12-01 | Resources Management - Equipment Management | ✅ Complete |
| 2024-11-30 | Staff Management - Performance & Training | ✅ Complete |
| 2024-11-30 | Staff Management - Roles & Permissions | ✅ Complete |
| 2024-11-30 | Staff Management - Scheduling & Time Management | ✅ Complete |
| 2024-11-30 | Staff Management - Staff Profiles & HR | ✅ Complete |
| 2024-11-29 | Auth & Authorization (Phase 1) | ✅ Complete |

---

## Active Development

| Area | Sub-Area | Assignee | Started | Status |
|------|----------|----------|---------|--------|
| Booking & Scheduling | Opening Notifications | - | - | On hold (infrastructure needed) |
| Booking & Scheduling | On-Call Management | - | - | Next priority |

---

## How to Update This File

When starting work on an area:
1. Move it from "What's Blocked" to "Active Development"
2. Add start date and assignee

When completing work:
1. Move from "Active Development" to "Recently Completed"
2. Update any areas that were blocked by this work
3. Update the decision tree if Phase completion changes

---

**Related Documentation**:
- [MASTER-INDEX.md](MASTER-INDEX.md) - Full project overview
- [CLAUDE.md](../CLAUDE.md) - LLM instructions
- [Auth Area](areas/auth/) - Full auth documentation
- [AUTH-PATTERNS.md](guides/AUTH-PATTERNS.md) - Auth code patterns
