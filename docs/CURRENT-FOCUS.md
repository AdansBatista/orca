# Current Development Focus

> **Last Updated**: 2025-12-10 (Updated after Staff Management completion)
>
> **Purpose**: Single source of truth for what LLMs and developers should work on

---

## Project Status

| Attribute | Value |
|-----------|-------|
| **Current Phase** | Phase 2 - Core Operations (In Progress) |
| **Implementation Status** | 🔄 Phase 1 ~95%, ✅ Phase 2 ~95% (Booking ✅, Orchestration 88%, Patient Comms ~95%) |
| **Documentation Status** | ✅ Complete for all 13 areas |

---

## What's Ready to Build (No Blockers)

These areas have no dependencies and can be started immediately:

### ~~1. Authentication & Authorization~~ ✅ COMPLETE
- **Documentation**: [docs/areas/auth/](areas/auth/)
- **Status**: ✅ Implemented (Phase 1 scope)
- **Completed Features**: User login, session management (JWT), role-based permissions, audit logging
- **Code Patterns**: [AUTH-PATTERNS.md](guides/AUTH-PATTERNS.md)

### 2. Staff Management ✅ ~90% COMPLETE
- **Documentation**: [docs/areas/staff-management/](areas/staff-management/)
- **Depends On**: Authentication ✅
- **Status**: ✅ ~90% complete (all major features implemented)
- **Sub-Area Status**:
  - ✅ Staff Profiles & HR (~95%) - Core complete, credential alerts implemented
  - ✅ Scheduling & Time Management (100%) - Fully implemented
  - ✅ Roles & Permissions (~85%) - CRUD, templates, audit log, hierarchy display
  - ✅ Performance & Training (~85%) - Charts, review scheduling, analytics

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

### ~~2. Practice Orchestration~~ ✅ COMPLETE (88%)
- **Documentation**: [docs/areas/practice-orchestration/](areas/practice-orchestration/)
- **Depends On**: Auth ✅, Staff ✅, Booking ✅
- **Status**: ✅ 3/4 sub-areas implemented (30/34 functions)
- **Completed Sub-Areas**:
  - ✅ Operations Dashboard (day view, timeline, kanban board, floor plan, stats)
  - ✅ Patient Flow Management (check-in, queue, call-to-chair, seating, checkout)
  - ✅ Resource Coordination (chair status, resource occupancy, staff workload)
- **Deferred**: AI Manager (requires AI infrastructure planning)

### ~~3. Patient Communications~~ ✅ COMPLETE (~95%)
- **Documentation**: [docs/areas/patient-communications/](areas/patient-communications/)
- **Depends On**: Auth ✅, Booking ✅
- **Status**: ✅ ~95% complete - All unblocked features implemented
- **Sub-Area Status**:
  - ✅ Messaging Hub (100%) - SMS/Email/Push, Unified Inbox, Two-way conversations
  - 🔄 Patient Portal (~75%) - Auth complete, billing **blocked** by Billing area
  - ✅ Automated Campaigns (100%) - Workflow builder, template gallery complete
  - ✅ Educational Content (100%) - Rich text editor, article management, FAQs complete
  - ✅ Surveys (100%) - Form builder with drag-drop questions complete
- **Remaining (Blocked)**:
  - 🚫 Payment self-service blocked by Billing & Insurance area
  - 🚫 Patient Portal billing features blocked by Billing area

---

## What's Blocked

| Area | Phase | Blocked By | Status |
|------|-------|------------|--------|
| CRM & Onboarding | 3 | Patient Comms | ⏳ Waiting |
| Treatment Management | 3 | Phase 2 Complete | ⏳ Waiting |
| Imaging Management | 3 | Treatment | ⏳ Waiting |
| Lab Work Management | 3 | Treatment | ⏳ Waiting |
| Billing & Insurance | 4 | Treatment, CRM | ⏳ Waiting |
| Financial Management | 4 | Billing | ⏳ Waiting |
| Compliance & Audit | 4 | All clinical areas | ⏳ Waiting |
| Vendors Management | 5 | Financial | ⏳ Waiting |

---

## Implementation Phases Overview

```
Phase 1: Foundation ~95%     Phase 2: Core Operations ~95%  Phase 3: Clinical
┌─────────────────────┐     ┌─────────────────────┐        ┌─────────────────────┐
│ ✅ Auth & Users     │ ──▶ │ ✅ Booking          │ ──▶    │ • CRM & Onboarding  │
│ ✅ Staff Mgmt ~90%  │     │ ✅ Practice Orch.   │        │ • Treatment Mgmt    │
│ ✅ Resources Mgmt   │     │ ✅ Patient Comms    │        │ • Imaging           │
└─────────────────────┘     └─────────────────────┘        │ • Lab Work          │
                                   ~95% DONE               └─────────────────────┘
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
Phase 1 Complete? ✅ YES (~95%)
├── ✅ Auth & Users - Complete
├── ✅ Staff Management - ~90% (role templates, audit, performance analytics)
└── ✅ Resources Management - Complete
Phase 2 Complete? ✅ YES (~95% overall)
├── ✅ Booking & Scheduling - Complete
├── ✅ Practice Orchestration - Complete (88%, AI Manager deferred)
└── ✅ Patient Communications - ~95% COMPLETE
```

---

## Recently Completed

| Date | Area/Feature | Status |
|------|--------------|--------|
| 2025-12-09 | Patient Communications - Survey Form Builder (API + UI) | ✅ Complete |
| 2025-12-09 | Patient Communications - Campaign Template Gallery (14 templates) | ✅ Complete |
| 2025-12-09 | Patient Communications - FAQ Management (API + UI) | ✅ Complete |
| 2025-12-09 | Patient Communications - Rich Text Article Editor | ✅ Complete |
| 2025-12-09 | Patient Communications - Tiptap Rich Text Component | ✅ Complete |
| 2025-12-06 | Practice Orchestration - All 3 core sub-areas | ✅ Complete (88%) |
| 2025-12-06 | Practice Orchestration - Tasks feature (CRUD, validation fixes) | ✅ Complete |
| 2025-12-05 | Practice Orchestration - Patient Flow & Resource Coordination | ✅ Complete |
| 2025-12-05 | Practice Orchestration - Operations Dashboard (Floor Plan, Kanban) | ✅ Complete |
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
| Patient Communications | Patient Portal | - | - | 🔄 ~75% (billing blocked by Phase 4) |
| Staff Management | Roles & Permissions | - | - | 🔄 ~40% (hierarchy incomplete) |
| Staff Management | Performance & Training | - | - | 🔄 ~50% (visualization incomplete) |

### Next Priority (Unblocked)
1. Staff Management - Role hierarchy & permission templates
2. Staff Management - Performance visualization dashboards
3. Staff Management - Training workflows & certification alerts

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
