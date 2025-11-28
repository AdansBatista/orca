# Current Development Focus

> **Last Updated**: 2024-11-27
>
> **Purpose**: Single source of truth for what LLMs and developers should work on

---

## Project Status

| Attribute | Value |
|-----------|-------|
| **Current Phase** | Phase 1 - Foundation Infrastructure |
| **Implementation Status** | 📋 Planning Complete, Development Not Started |
| **Documentation Status** | ✅ Complete for all 13 areas |

---

## What's Ready to Build (No Blockers)

These areas have no dependencies and can be started immediately:

### 1. Authentication & Authorization
- **Documentation**: [docs/areas/auth/](areas/auth/) *(to be created)*
- **Why First**: Foundation for all other areas - every feature needs auth
- **Key Deliverables**: User login, session management, role-based permissions
- **Guide**: [AUTH-GUIDE.md](guides/AUTH-GUIDE.md)

### 2. Staff Management
- **Documentation**: [docs/areas/staff-management/](areas/staff-management/)
- **Depends On**: Authentication (start after auth basics complete)
- **Key Deliverables**: Staff profiles, credentials, scheduling, roles
- **Priority**: Critical - providers needed for appointments

### 3. Resources Management
- **Documentation**: [docs/areas/resources-management/](areas/resources-management/)
- **Depends On**: Authentication (start after auth basics complete)
- **Key Deliverables**: Equipment, rooms, inventory, supplies
- **Priority**: High - resources needed for scheduling

---

## What's Blocked

| Area | Phase | Blocked By | Status |
|------|-------|------------|--------|
| Booking & Scheduling | 2 | Auth, Staff, Resources | ⏳ Waiting |
| Practice Orchestration | 2 | Auth, Staff | ⏳ Waiting |
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
├── No  → Start Auth (see AUTH-GUIDE.md)
└── Yes → Is Staff Management implemented?
          ├── No  → Start Staff Management
          └── Yes → Is Resources Management implemented?
                    ├── No  → Start Resources Management
                    └── Yes → Phase 1 complete! Start Phase 2 (Booking)
```

---

## Recently Completed

| Date | Area/Feature | Status |
|------|--------------|--------|
| - | - | No implementations yet |

---

## Active Development

| Area | Sub-Area | Assignee | Started | Status |
|------|----------|----------|---------|--------|
| - | - | - | - | No active development |

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
- [AUTH-GUIDE.md](guides/AUTH-GUIDE.md) - Start here for Phase 1
