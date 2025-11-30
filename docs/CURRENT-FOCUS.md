# Current Development Focus

> **Last Updated**: 2024-11-29
>
> **Purpose**: Single source of truth for what LLMs and developers should work on

---

## Project Status

| Attribute | Value |
|-----------|-------|
| **Current Phase** | Phase 1 - Foundation Infrastructure |
| **Implementation Status** | 🔄 Phase 1 In Progress (Auth ✅ Complete) |
| **Documentation Status** | ✅ Complete for all 13 areas |

---

## What's Ready to Build (No Blockers)

These areas have no dependencies and can be started immediately:

### ~~1. Authentication & Authorization~~ ✅ COMPLETE
- **Documentation**: [docs/areas/auth/](areas/auth/)
- **Status**: ✅ Implemented (Phase 1 scope)
- **Completed Features**: User login, session management (JWT), role-based permissions, audit logging
- **Code Patterns**: [AUTH-PATTERNS.md](guides/AUTH-PATTERNS.md)

### 2. Staff Management (NEXT PRIORITY)
- **Documentation**: [docs/areas/staff-management/](areas/staff-management/)
- **Depends On**: Authentication ✅
- **Key Deliverables**: Staff profiles, credentials, scheduling, roles
- **Priority**: Critical - providers needed for appointments
- **Status**: Ready to implement

### 3. Resources Management
- **Documentation**: [docs/areas/resources-management/](areas/resources-management/)
- **Depends On**: Authentication ✅
- **Key Deliverables**: Equipment, rooms, inventory, supplies
- **Priority**: High - resources needed for scheduling
- **Status**: Ready to implement

---

## What's Blocked

| Area | Phase | Blocked By | Status |
|------|-------|------------|--------|
| Booking & Scheduling | 2 | ~~Auth~~, Staff, Resources | ⏳ Waiting |
| Practice Orchestration | 2 | ~~Auth~~, Staff | ⏳ Waiting |
| Patient Communications | 2 | Auth, Booking | ⏳ Waiting |
| CRM & Onboarding | 3 | Auth, Patient Comms | ⏳ Waiting |
| Treatment Management | 3 | Auth, Booking, Staff | ⏳ Waiting |
| Imaging Management | 3 | Auth, Treatment | ⏳ Waiting |
| Lab Work Management | 3 | Auth, Treatment | ⏳ Waiting |
| Billing & Insurance | 4 | Treatment, Patient | ⏳ Waiting |
| Financial Management | 4 | Billing | ⏳ Waiting |
| Compliance & Audit | 4 | All clinical areas | ⏳ Waiting |
| Vendors Management | 5 | Financial | ⏳ Waiting |

---

## Implementation Phases Overview

```
Phase 1: Foundation          Phase 2: Core Operations       Phase 3: Clinical
┌─────────────────────┐     ┌─────────────────────┐        ┌─────────────────────┐
│ • Auth & Users      │ ──▶ │ • Booking           │ ──▶    │ • CRM & Onboarding  │
│ • Staff Management  │     │ • Practice Orch.    │        │ • Treatment Mgmt    │
│ • Resources Mgmt    │     │ • Patient Comms     │        │ • Imaging           │
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

1. **Check if Auth exists** → If not, start with Authentication & Authorization
2. **Check Phase 1 completion** → Complete all Phase 1 areas before Phase 2
3. **Follow dependency order** → Never start an area before its dependencies

### Quick Decision Tree

```
Is Auth implemented?
├── No  → Start Auth (see areas/auth/ and guides/AUTH-PATTERNS.md)
└── Yes ✅ → Is Staff Management implemented?
             ├── No  → Start Staff Management ← YOU ARE HERE
             └── Yes → Is Resources Management implemented?
                       ├── No  → Start Resources Management
                       └── Yes → Phase 1 complete! Start Phase 2 (Booking)
```

---

## Recently Completed

| Date | Area/Feature | Status |
|------|--------------|--------|
| 2024-11-29 | Auth & Authorization (Phase 1) | ✅ Complete |

---

## Active Development

| Area | Sub-Area | Assignee | Started | Status |
|------|----------|----------|---------|--------|
| Staff Management | - | - | - | Ready to start |

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
