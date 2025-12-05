# Practice Orchestration - Session Context

> **Quick Reference**: Use this file to quickly get context when starting a new Claude session
>
> **Last Updated**: 2024-12-05

---

## 🎯 Current Focus

**Feature**: Enhanced Floor Plan (Interactive Resource Management)
**Status**: 🔄 Planning Phase
**Started**: 2024-12-05

---

## 📋 What to Read First

When starting a new session, read these files **in this order**:

1. **This file** (SESSION-CONTEXT.md) - Quick overview (you are here!)
2. [IMPLEMENTATION-PROGRESS.md](./IMPLEMENTATION-PROGRESS.md) - Detailed progress tracking
3. [enhanced-floor-plan-spec.md](./enhanced-floor-plan-spec.md) - Current feature specification
4. [README.md](./README.md) - Full area documentation (if needed)

---

## ✅ What's Already Done

### Phase 1: Core Operations (Complete)

**Database** ✅
- PatientFlowState, FlowStageHistory models
- ResourceOccupancy, StaffAssignment models
- OperationsTask, DailyMetrics models
- FloorPlanConfig model
- All enums (FlowStage, OccupancyStatus, ChairActivitySubStage, etc.)

**API Endpoints** ✅ (24 endpoints)
- Patient flow: check-in, call, seat, complete, check-out, revert
- Chair management: sub-stage, ready-for-doctor, notes
- Dashboard: metrics, day view
- Queue management
- Task CRUD operations
- Resource status tracking

**UI Pages** ✅
- `/ops` - Main dashboard (Kanban/Queue toggle)
- `/ops/floor-plan` - Basic floor plan view
- `/ops/tasks` - Task management

**Components** ✅
- PatientFlowBoard (Kanban with drag-drop)
- QueueDisplay (List view)
- PatientDetailSheet (Side panel)
- ChairSelectionDialog
- Basic floor plan components

**Last Commit**: `2cb4a10` - "mid_state orchestration feature"

---

## �� What We're Working On

### Enhanced Floor Plan

**Goal**: Transform basic floor plan into fully interactive resource management center

**Key Features**:
1. **Interactive Layout** - Drag-and-drop chairs/rooms, save configurations
2. **Real-Time Updates** - SSE for live status, 2-second latency
3. **Quick Actions** - Click-to-view, hover actions, context menu
4. **Advanced Filters** - Filter by status, provider, priority
5. **Resource Management** - Block chairs, cleaning timers, utilization heatmap

**Current Phase**: Step 1 - Planning & Architecture

**Next Steps**:
- [ ] Choose drag-and-drop library (@dnd-kit recommended)
- [ ] Design component architecture
- [ ] Set up project structure
- [ ] Create base components

---

## 🏗️ Architecture Decisions

### Confirmed
- **Real-Time**: Server-Sent Events (SSE) with polling fallback
- **Grid System**: 20x15 default, 50px cells, snap-to-grid
- **Storage**: JSON in FloorPlanConfig.layout field

### To Decide
- **Drag-Drop Library**: @dnd-kit vs alternatives
- **State Management**: Context vs Zustand vs Jotai
- **Animations**: Framer Motion (already installed?)

---

## 📁 Key File Locations

### Documentation
```
docs/areas/practice-orchestration/
├── SESSION-CONTEXT.md              # ⭐ This file
├── IMPLEMENTATION-PROGRESS.md      # ⭐ Detailed tracking
├── enhanced-floor-plan-spec.md     # ⭐ Feature spec
├── README.md                       # Area overview
└── integrations.md                 # Integration points
```

### Current Implementation
```
src/app/(app)/ops/
├── page.tsx                        # Main dashboard ✅
├── floor-plan/page.tsx             # Basic floor plan ✅ (to enhance)
└── tasks/page.tsx                  # Tasks ✅

src/components/ops/
├── PatientFlowBoard.tsx            # ✅
├── QueueDisplay.tsx                # ✅
├── PatientDetailSheet.tsx          # ✅
├── ChairSelectionDialog.tsx        # ✅
└── FloorPlanView.tsx               # ✅ (basic, to replace)

src/app/api/ops/
├── flow/*.ts                       # ✅ All flow endpoints
├── chairs/*.ts                     # ✅ Basic chair endpoints
├── dashboard/*.ts                  # ✅ Metrics endpoints
└── tasks/*.ts                      # ✅ Task endpoints
```

### To Create (Enhanced Floor Plan)
```
src/components/ops/floor-plan/
├── FloorPlanCanvas.tsx             # 📋 Main canvas
├── FloorPlanControls.tsx           # 📋 Controls
├── DraggableChair.tsx              # 📋 Interactive chair
├── DraggableRoom.tsx               # 📋 Interactive room
├── ChairQuickActions.tsx           # 📋 Action overlay
├── FilterPanel.tsx                 # 📋 Filters
├── ZoomControls.tsx                # 📋 Zoom
├── MiniMap.tsx                     # 📋 Overview map
└── hooks/
    ├── useFloorPlanLayout.ts       # 📋 Layout state
    ├── useFloorPlanRealtime.ts     # 📋 SSE connection
    └── useFloorPlanActions.ts      # 📋 Actions

src/app/api/ops/floor-plan/
├── layout/route.ts                 # 📋 Save/load
├── templates/route.ts              # 📋 Templates
├── stream/route.ts                 # 📋 SSE endpoint
└── analytics/route.ts              # 📋 Utilization
```

---

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Check ops data
node scripts/check-ops-data.js

# Seed fresh ops data
npm run db:seed -- --area ops

# Check git status
git status

# View recent commits
git log --oneline -10

# Generate Prisma client (if schema changed)
npx prisma generate

# View current branch
git branch
```

---

## 🎨 Code Standards Reminders

### Always Check First
1. ✅ Use existing UI components from `@/components/ui/`
2. ✅ Reference `/ui-showcase` for component variants
3. ✅ Follow STYLING-GUIDE.md for design tokens
4. ✅ Use TECH-STACK.md patterns for API routes

### Critical Rules
- 🔒 All queries MUST filter by `clinicId`
- 🔒 All API routes use `withAuth` wrapper
- 🔐 All PHI wrapped in `<PhiProtected>`
- ✅ All inputs validated with Zod schemas
- 📝 Audit logging for PHI access

### UI Component Usage
```tsx
// ✅ CORRECT - Use Card component
<Card variant="ghost">
  <CardContent>...</CardContent>
</Card>

// ❌ WRONG - Raw Tailwind
<div className="rounded-2xl bg-muted/50 border">
  ...
</div>
```

---

## 📊 Progress Summary

| Area | Complete | In Progress | Remaining |
|------|----------|-------------|-----------|
| **Database Models** | 100% | - | - |
| **API Endpoints (Phase 1)** | 100% | - | - |
| **Basic UI Pages** | 100% | - | - |
| **Patient Flow** | 100% | - | - |
| **Enhanced Floor Plan** | 0% | Planning | Implementation |
| **Week/Month Views** | 0% | - | Not started |
| **AI Manager** | 0% | - | Not started |

---

## 🔗 Quick Links

### Internal Docs
- [TECH-STACK.md](../../guides/TECH-STACK.md) - All code patterns
- [STYLING-GUIDE.md](../../guides/STYLING-GUIDE.md) - UI standards
- [AUTH-PATTERNS.md](../../guides/AUTH-PATTERNS.md) - Auth code
- [MASTER-INDEX.md](../../MASTER-INDEX.md) - Project overview

### External References
- [@dnd-kit Docs](https://docs.dndkit.com/)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Framer Motion](https://www.framer.com/motion/)

---

## 💡 Common Tasks

### Start Working on Enhanced Floor Plan

1. Review the spec: [enhanced-floor-plan-spec.md](./enhanced-floor-plan-spec.md)
2. Check current progress: [IMPLEMENTATION-PROGRESS.md](./IMPLEMENTATION-PROGRESS.md) → Phase 2
3. Pick a task from the implementation plan
4. Create components in `src/components/ops/floor-plan/`
5. Update progress document when done

### Add a New API Endpoint

1. Create in `src/app/api/ops/[feature]/route.ts`
2. Use `withAuth` wrapper
3. Add Zod validation in `src/lib/validations/ops.ts`
4. Filter by `clinicId`
5. Add audit logging
6. Update API endpoints section in IMPLEMENTATION-PROGRESS.md

### Create a New UI Component

1. Check if similar component exists in `src/components/ui/`
2. Use existing components/variants when possible
3. Follow STYLING-GUIDE.md patterns
4. Wrap PHI in `<PhiProtected>`
5. Add to components list in IMPLEMENTATION-PROGRESS.md

---

## 🐛 Known Issues

- None currently (fresh implementation)

---

## 📝 Notes from Last Session

**Date**: 2024-12-05

**What Was Done**:
- ✅ Created IMPLEMENTATION-PROGRESS.md tracking document
- ✅ Created enhanced-floor-plan-spec.md technical specification
- ✅ Updated README.md with progress links
- ✅ Created this SESSION-CONTEXT.md file

**Next Session Should**:
1. Review the enhanced floor plan spec
2. Make architecture decisions (drag-drop library, state management)
3. Start with Step 1: Planning & Architecture
4. Create component structure

**Questions to Answer**:
- Which drag-drop library? (@dnd-kit recommended)
- State management approach?
- Should we support background images?
- Multi-floor clinics handling?

---

## 🎯 Success Criteria

**Enhanced Floor Plan will be complete when**:
- [ ] Admins can drag-and-drop chairs to rearrange layout
- [ ] Real-time status updates appear within 2 seconds
- [ ] Staff can perform 90% of actions within 2 clicks
- [ ] Floor plan loads in < 3 seconds for 50-chair clinics
- [ ] All features in spec are implemented
- [ ] Tests pass
- [ ] Documentation updated

---

**Last Updated**: 2024-12-05
**Current Phase**: Enhanced Floor Plan - Planning
**Next Milestone**: Complete Step 1 (Planning & Architecture)

---

## 🚀 Ready to Code?

1. Read [enhanced-floor-plan-spec.md](./enhanced-floor-plan-spec.md)
2. Pick a task from "Implementation Plan → Step 1"
3. Code following standards in TECH-STACK.md and STYLING-GUIDE.md
4. Update checkboxes in IMPLEMENTATION-PROGRESS.md as you complete tasks
5. Commit with message: `feat(ops): <description>`

Let's build! 🎉
