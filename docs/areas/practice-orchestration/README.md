# Practice Orchestration

> **Area**: Practice Orchestration
>
> **Phase**: 2 - Core Operations
>
> **Purpose**: Practice management command center providing real-time dashboards, patient flow management, resource coordination, and AI-powered operational insights

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete (88%) |
| **Priority** | High |
| **Phase** | 2 - Core Operations |
| **Dependencies** | Phase 1 (Auth, Staff, Resources), Booking & Scheduling |
| **Last Updated** | 2025-12-06 |
| **Completion** | 3/4 sub-areas (30/34 functions), AI Manager deferred |

---

## 📊 Implementation Tracking

For detailed implementation progress, current work, and session continuity:

- **[IMPLEMENTATION-PROGRESS.md](./IMPLEMENTATION-PROGRESS.md)** - Complete implementation status, progress tracking, and session context
- **[enhanced-floor-plan-spec.md](./enhanced-floor-plan-spec.md)** - Current feature: Enhanced Floor Plan technical specification

---

## Overview

Practice Orchestration is the operational command center for orthodontic practices—a multi-view system that gives staff, managers, and owners real-time visibility into daily operations. It combines dashboards (day/week/month views), patient flow tracking, resource management, and an AI Manager that surfaces priorities and recommendations.

In busy orthodontic practices with multiple providers and treatment chairs, coordinating patient flow, staff assignments, and resource utilization is critical. This area streamlines daily operations, reduces bottlenecks, and maximizes chair time productivity.

### Key Capabilities

- **Operations Dashboard**: Multi-view dashboards (timeline, board, floor plan) for day/week/month
- **Patient Flow Management**: Real-time queue management, check-in/checkout, and journey tracking
- **Resource Coordination**: Chair/room assignments, equipment status, and staff workload balancing
- **AI Manager**: Natural-language queries, anomaly detection, schedule optimization, and task generation

### Business Value

- Reduce patient wait times and improve flow
- Maximize chair utilization and provider productivity
- Improve staff coordination and reduce bottlenecks
- Give managers actionable operational insights
- Enable proactive problem detection and resolution
- Support data-driven operational decisions

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 1 | [Operations Dashboard](./sub-areas/operations-dashboard/) | Day/week/month dashboards and views | ✅ Complete | Critical |
| 2 | [Patient Flow Management](./sub-areas/patient-flow/) | Queue management and patient journey tracking | ✅ Complete | Critical |
| 3 | [Resource Coordination](./sub-areas/resource-coordination/) | Chair/room and staff assignments | ✅ Complete | High |
| 4 | [AI Manager](./sub-areas/ai-manager/) | AI-powered insights and recommendations | ⏸️ Deferred | Medium |

---

## Sub-Area Details

### 1. Operations Dashboard

Multi-view operational dashboards for different time horizons and perspectives.

**Functions:**
- Day View Dashboard
- Week View Dashboard
- Month View Dashboard
- Timeline View
- Board/Kanban View
- Floor Plan View

**Key Features:**
- Real-time data with auto-refresh
- Multiple view options (timeline, kanban, floor plan)
- Customizable widgets and layouts
- Role-based dashboard configurations
- Mobile-responsive design
- Drill-down capabilities

---

### 2. Patient Flow Management

Track and manage patient journey through the clinic.

**Functions:**
- Patient Check-In
- Queue Management
- Call-to-Chair
- Patient Journey Tracking
- Wait Time Monitoring
- Check-Out Processing

**Key Features:**
- Self-service check-in kiosk support
- Real-time queue display
- Average wait time calculations
- Stage-based patient tracking
- SMS notification when ready
- Flow analytics and bottleneck detection

---

### 3. Resource Coordination

Manage chairs, rooms, equipment, and staff assignments.

**Functions:**
- Chair/Room Assignment
- Equipment Status Tracking
- Staff Assignment Management
- Break Scheduling
- Resource Utilization Tracking
- Capacity Planning

**Key Features:**
- Visual chair/room status board
- Equipment maintenance alerts
- Staff workload balancing
- Real-time availability updates
- Conflict detection
- Utilization reports

---

### 4. AI Manager

AI-powered operational assistance and insights.

**Functions:**
- Natural Language Queries
- Anomaly Detection
- Schedule Optimization
- Daily Task Generation
- Performance Analytics
- Predictive Staffing

**Key Features:**
- Ask questions in natural language ("show me today's delays")
- Automatic anomaly alerts
- AI-suggested schedule optimizations
- Auto-generated daily priorities
- Trend analysis and predictions
- "What-if" scenario modeling

---

## Operational Views

### Day View Perspectives

| View | Purpose | Primary Users |
|------|---------|---------------|
| **Timeline** | Hour-by-hour schedule with patient flow | Front desk, clinical staff |
| **Board/Kanban** | Patient stages (waiting, in-chair, checkout) | Clinical coordinator |
| **Floor Plan** | Visual chair/room occupancy | Office manager |
| **Provider Schedule** | Individual provider appointments | Doctors |
| **Worklist** | Actionable task list | All staff |

### Key Metrics (Day View)

| Metric | Description |
|--------|-------------|
| **Patients Seen** | Count vs. scheduled |
| **Average Wait Time** | Minutes from check-in to chair |
| **Chair Utilization** | % of chair time used |
| **Running On Time** | % of appointments on schedule |
| **No-Shows** | Count and percentage |
| **Walk-Ins/Emergencies** | Unscheduled visits |

---

## Patient Flow Stages

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SCHEDULED  │────▶│  CHECKED_IN  │────▶│   WAITING    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  COMPLETED   │◀────│   IN_CHAIR   │◀────│    CALLED    │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  CHECKED_OUT │────▶│   DEPARTED   │
└──────────────┘     └──────────────┘
```

### Stage Definitions

| Stage | Description | Trigger |
|-------|-------------|---------|
| `SCHEDULED` | Appointment on calendar | Appointment created |
| `CHECKED_IN` | Patient arrived | Check-in action |
| `WAITING` | In waiting room | After check-in |
| `CALLED` | Called back to clinical | Staff action |
| `IN_CHAIR` | Being treated | Seated in chair |
| `COMPLETED` | Treatment finished | Provider marks complete |
| `CHECKED_OUT` | Checkout processed | Checkout action |
| `DEPARTED` | Left the office | Door/auto-detect |

---

## Integration Points

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Booking & Scheduling | Appointment data | Schedule source, reschedules |
| Staff Management | Staff schedules | Provider availability |
| Resources Management | Chair/room status | Resource availability |
| Patient Communications | Notifications | Delay alerts, ready notices |
| Billing & Insurance | Checkout | Payment processing at checkout |
| Treatment Management | Treatment data | What's being done |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| Kiosk Systems | Local/Network | Self-service check-in |
| Digital Signage | Network | Waiting room displays |
| Door Sensors | IoT | Patient departure tracking |

---

## User Roles & Permissions

| Role | Dashboard | Patient Flow | Resources | AI Manager |
|------|-----------|--------------|-----------|------------|
| Super Admin | Full | Full | Full | Full |
| Clinic Admin | Full | Full | Full | Full |
| Doctor | Full | View + Call | View | Full |
| Clinical Staff | Day View | Full | View | Limited |
| Front Desk | Full | Full | View | Limited |
| Billing | View | Checkout | None | None |
| Read Only | View | View | View | View |

### Special Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `ops:view_dashboard` | View operations dashboard | all |
| `ops:manage_flow` | Check-in, call, checkout patients | clinical_staff, front_desk |
| `ops:assign_resources` | Assign chairs/rooms | clinic_admin, clinical_staff |
| `ops:view_all_locations` | View all clinic locations | super_admin, clinic_admin |
| `ops:ai_manager` | Access AI manager features | clinic_admin, doctor |
| `ops:configure` | Configure dashboard settings | clinic_admin |

---

## Data Models

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Appointment   │────▶│ PatientFlowState│────▶│ FlowStageHistory│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               │
                               ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Resource     │────▶│ResourceOccupancy│     │ StaffAssignment │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ OperationsTask  │     │ DailyMetrics    │
└─────────────────┘     └─────────────────┘
```

### Prisma Schema

```prisma
model PatientFlowState {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  appointmentId   String            @db.ObjectId
  patientId       String            @db.ObjectId

  // Current state
  stage           FlowStage         // Current stage in flow
  chairId         String?           @db.ObjectId
  providerId      String?           @db.ObjectId

  // Timestamps
  scheduledAt     DateTime
  checkedInAt     DateTime?
  calledAt        DateTime?
  seatedAt        DateTime?
  completedAt     DateTime?
  checkedOutAt    DateTime?

  // Notes
  notes           String?
  priority        FlowPriority      @default(NORMAL)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  appointment     Appointment       @relation(fields: [appointmentId], references: [id])
  patient         Patient           @relation(fields: [patientId], references: [id])
  chair           Resource?         @relation(fields: [chairId], references: [id])
  stageHistory    FlowStageHistory[]

  @@unique([clinicId, appointmentId])
  @@index([clinicId, stage])
  @@index([clinicId, scheduledAt])
}

model FlowStageHistory {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  flowStateId     String            @db.ObjectId

  stage           FlowStage
  enteredAt       DateTime          @default(now())
  exitedAt        DateTime?
  duration        Int?              // Minutes in this stage

  // Who triggered the transition
  triggeredBy     String?           @db.ObjectId
  notes           String?

  // Relations
  flowState       PatientFlowState  @relation(fields: [flowStateId], references: [id])

  @@index([flowStateId, stage])
}

model ResourceOccupancy {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  resourceId      String            @db.ObjectId

  // Current state
  status          OccupancyStatus   // AVAILABLE, OCCUPIED, BLOCKED, MAINTENANCE
  appointmentId   String?           @db.ObjectId
  patientId       String?           @db.ObjectId

  // Timing
  occupiedAt      DateTime?
  expectedFreeAt  DateTime?

  // Notes
  blockReason     String?

  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  resource        Resource          @relation(fields: [resourceId], references: [id])

  @@unique([clinicId, resourceId])
}

model StaffAssignment {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  staffId         String            @db.ObjectId
  appointmentId   String            @db.ObjectId

  role            String            // provider, assistant, hygienist

  assignedAt      DateTime          @default(now())
  assignedBy      String?           @db.ObjectId

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  staff           Staff             @relation(fields: [staffId], references: [id])
  appointment     Appointment       @relation(fields: [appointmentId], references: [id])

  @@index([clinicId, staffId])
  @@index([appointmentId])
}

model OperationsTask {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId

  title           String
  description     String?
  type            TaskType          // MANUAL, AI_GENERATED, SYSTEM

  // Assignment
  assigneeId      String?           @db.ObjectId
  ownerId         String            @db.ObjectId

  // Timing
  dueAt           DateTime?
  completedAt     DateTime?

  // Status
  status          TaskStatus        // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  priority        TaskPriority      // LOW, NORMAL, HIGH, URGENT

  // Related entities
  relatedType     String?           // appointment, patient, resource
  relatedId       String?           @db.ObjectId

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])

  @@index([clinicId, status])
  @@index([clinicId, assigneeId])
  @@index([clinicId, dueAt])
}

model DailyMetrics {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  date            DateTime          @db.Date

  // Patient metrics
  scheduledCount  Int
  checkedInCount  Int
  completedCount  Int
  noShowCount     Int
  cancelledCount  Int
  walkInCount     Int

  // Time metrics
  avgWaitMinutes  Float?
  avgChairMinutes Float?
  onTimePercentage Float?

  // Resource metrics
  chairUtilization Float?
  providerUtilization Json?         // By provider

  // Financial (summary only)
  productionTotal Float?
  collectionTotal Float?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, date])
}

enum FlowStage {
  SCHEDULED
  CHECKED_IN
  WAITING
  CALLED
  IN_CHAIR
  COMPLETED
  CHECKED_OUT
  DEPARTED
  NO_SHOW
  CANCELLED
}

enum FlowPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum OccupancyStatus {
  AVAILABLE
  OCCUPIED
  BLOCKED
  MAINTENANCE
}

enum TaskType {
  MANUAL
  AI_GENERATED
  SYSTEM
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ops/dashboard` | Get dashboard data |
| GET | `/api/v1/ops/dashboard/day/:date` | Get day view data |
| GET | `/api/v1/ops/dashboard/week/:date` | Get week view data |
| GET | `/api/v1/ops/flow` | Get current patient flow |
| POST | `/api/v1/ops/flow/:appointmentId/check-in` | Check in patient |
| POST | `/api/v1/ops/flow/:appointmentId/call` | Call patient to chair |
| POST | `/api/v1/ops/flow/:appointmentId/seat` | Seat patient in chair |
| POST | `/api/v1/ops/flow/:appointmentId/complete` | Mark treatment complete |
| POST | `/api/v1/ops/flow/:appointmentId/check-out` | Check out patient |
| GET | `/api/v1/ops/resources/status` | Get resource occupancy |
| PUT | `/api/v1/ops/resources/:id/status` | Update resource status |
| GET | `/api/v1/ops/tasks` | Get operations tasks |
| POST | `/api/v1/ops/tasks` | Create task |
| PUT | `/api/v1/ops/tasks/:id` | Update task |
| GET | `/api/v1/ops/metrics/:date` | Get daily metrics |
| POST | `/api/v1/ops/ai/query` | AI manager query |

---

## UI Components

| Component | Description |
|-----------|-------------|
| `OperationsDashboard` | Main dashboard container |
| `DayViewTimeline` | Timeline view of daily schedule |
| `PatientFlowBoard` | Kanban board of patient stages |
| `FloorPlanView` | Visual floor plan with occupancy |
| `CheckInPanel` | Patient check-in interface |
| `QueueDisplay` | Waiting room queue display |
| `CallToChairButton` | Call patient action |
| `ChairStatusBoard` | Chair occupancy overview |
| `StaffWorkloadView` | Staff assignments and load |
| `DailyMetricsWidget` | Key metrics summary |
| `TaskList` | Operations task list |
| `AIManagerChat` | AI query interface |

---

## AI Manager Capabilities

| Feature | Description |
|---------|-------------|
| **Natural Language Queries** | "Show me patients waiting over 15 minutes" |
| **Anomaly Detection** | Alert on unusual appointment lengths |
| **Schedule Optimization** | Suggest schedule changes to reduce gaps |
| **Task Generation** | Auto-create daily priority tasks |
| **Predictive Staffing** | Recommend staffing based on schedule |
| **What-If Analysis** | Model impact of schedule changes |

### Example Queries

- "Who's running behind today?"
- "Show me chair 3's utilization this week"
- "What's our average wait time today?"
- "Are there any gaps I can fill?"
- "Who should I call back next?"

---

## Business Rules

1. **Check-In Required**: Patients must check in before being called
2. **Chair Assignment**: Patient must have chair assigned before seating
3. **Provider Required**: Provider must be assigned for treatment
4. **Auto-No-Show**: Mark as no-show if 30 min past appointment (configurable)
5. **Checkout Required**: All appointments must be checked out for metrics
6. **Concurrent Limits**: Max patients per provider configurable
7. **Break Protection**: Cannot schedule during blocked break times

---

## Compliance Requirements

### HIPAA Compliance
- Dashboard displays limited PHI (name, appointment type)
- Full audit logging of patient flow actions
- Role-based access to patient information
- Secure display recommendations (privacy screens)

### Data Retention
- Daily metrics retained indefinitely
- Patient flow history retained per policy
- Real-time data cleared daily

---

## Implementation Notes

### Phase 2 Dependencies
- **Authentication**: For user access control
- **Staff Management**: For staff schedules and assignments
- **Resources Management**: For chair/room data
- **Booking & Scheduling**: For appointment data

### Implementation Order
1. Operations Dashboard (basic day view)
2. Patient Flow Management (check-in to checkout)
3. Resource Coordination (chair status)
4. AI Manager (future enhancement)

### Key Technical Decisions
- Use WebSockets/SSE for real-time updates
- Cache dashboard data with short TTL
- Implement optimistic UI updates
- Use event-driven architecture for flow changes

---

## File Structure

```
docs/areas/practice-orchestration/
├── README.md                      # This file (area overview)
└── sub-areas/
    ├── operations-dashboard/
    │   ├── README.md
    │   └── functions/
    │       ├── day-view-dashboard.md
    │       ├── week-view-dashboard.md
    │       ├── timeline-view.md
    │       ├── board-view.md
    │       └── floor-plan-view.md
    │
    ├── patient-flow/
    │   ├── README.md
    │   └── functions/
    │       ├── patient-check-in.md
    │       ├── queue-management.md
    │       ├── call-to-chair.md
    │       ├── patient-journey-tracking.md
    │       └── check-out-processing.md
    │
    ├── resource-coordination/
    │   ├── README.md
    │   └── functions/
    │       ├── chair-room-assignment.md
    │       ├── equipment-status.md
    │       ├── staff-assignment.md
    │       └── utilization-tracking.md
    │
    └── ai-manager/
        ├── README.md
        └── functions/
            ├── natural-language-queries.md
            ├── anomaly-detection.md
            ├── schedule-optimization.md
            └── task-generation.md
```

---

## Related Documentation

- [Booking & Scheduling](../booking-scheduling/) - Appointment source
- [Staff Management](../staff-management/) - Staff schedules
- [Resources Management](../resources-management/) - Chair/room data

---

## Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Planned | 📋 | Documented, not started |
| In Progress | 🔄 | Currently being implemented |
| Review | 👀 | Under review |
| Testing | 🧪 | In testing |
| Completed | ✅ | Fully implemented |
| Blocked | 🚫 | Blocked by dependency |

---

## 🚀 Quick Start for Development

### For New Claude Sessions

1. **Read First**: [IMPLEMENTATION-PROGRESS.md](./IMPLEMENTATION-PROGRESS.md) - Get current status and context
2. **Check Current Work**: See "Phase 2: Enhanced Features" section for active tasks
3. **Review Specs**: [enhanced-floor-plan-spec.md](./enhanced-floor-plan-spec.md) for current feature details
4. **Code Standards**: Consult [TECH-STACK.md](../../guides/TECH-STACK.md) and [STYLING-GUIDE.md](../../guides/STYLING-GUIDE.md)

### Key Files to Reference

```
docs/areas/practice-orchestration/
├── README.md                          # This file - Feature overview
├── IMPLEMENTATION-PROGRESS.md         # ⭐ Current status & progress
├── enhanced-floor-plan-spec.md        # ⭐ Current feature spec
└── integrations.md                    # Integration requirements

src/app/(app)/ops/
├── page.tsx                           # Main operations dashboard
├── floor-plan/page.tsx                # Floor plan (to be enhanced)
└── tasks/page.tsx                     # Tasks management

src/components/ops/
├── PatientFlowBoard.tsx               # Kanban board ✅
├── QueueDisplay.tsx                   # Queue view ✅
├── PatientDetailSheet.tsx             # Patient details ✅
└── ChairSelectionDialog.tsx           # Chair selection ✅

src/app/api/ops/
├── flow/                              # Patient flow endpoints ✅
├── chairs/                            # Chair management endpoints ✅
├── dashboard/                         # Dashboard data endpoints ✅
└── tasks/                             # Task management endpoints ✅
```

### Recent Commits

- `2cb4a10` - "mid_state orchestration feature" (Initial implementation)

---

**Status**: ✅ Complete (88%)
**Last Updated**: 2025-12-06
**Completed**: Operations Dashboard, Patient Flow, Resource Coordination
**Deferred**: AI Manager (requires AI infrastructure planning)
**Owner**: Development Team
