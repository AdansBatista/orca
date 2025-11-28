# Board/Kanban View

> **Sub-Area**: [Operations Dashboard](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Board/Kanban View visualizes patient flow through stages as a Kanban board with columns representing flow stages (Scheduled, Waiting, In Chair, Checkout). Patient cards move between columns as they progress, providing an intuitive view of current clinic operations.

---

## Core Requirements

- [ ] Display columns for each patient flow stage
- [ ] Show patient cards with key information
- [ ] Support drag-and-drop to update patient stage
- [ ] Display time-in-stage indicators on cards
- [ ] Enable priority flagging for urgent patients
- [ ] Enforce WIP (Work-In-Progress) limits per column
- [ ] Color-code by appointment type or wait time
- [ ] Filter by provider or appointment type
- [ ] Show card count per column

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/dashboard/board/:date` | `ops:view_dashboard` | Get board view data |
| PUT | `/api/v1/ops/flow/:appointmentId/stage` | `ops:manage_flow` | Update stage via drag-drop |
| GET | `/api/v1/ops/dashboard/board/config` | `ops:view_dashboard` | Get board configuration |
| PUT | `/api/v1/ops/dashboard/board/config` | `ops:configure` | Update board settings |

---

## Data Model

```typescript
interface BoardViewData {
  date: Date;
  columns: BoardColumn[];
  config: BoardConfig;
}

interface BoardColumn {
  stage: FlowStage;
  title: string;
  cards: PatientCard[];
  count: number;
  wipLimit?: number;
  isOverLimit: boolean;
}

interface PatientCard {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhoto?: string;
  appointmentType: string;
  appointmentColor: string;
  providerId: string;
  providerName: string;
  scheduledTime: Date;
  currentStage: FlowStage;
  stageEnteredAt: Date;
  timeInStage: number;  // Minutes
  isOverdue: boolean;
  priority: FlowPriority;
  alerts: string[];
  chairId?: string;
}

interface BoardConfig {
  visibleColumns: FlowStage[];
  wipLimits: Record<FlowStage, number>;
  cardColorBy: 'type' | 'wait_time' | 'provider';
  showPhotos: boolean;
}
```

---

## Business Rules

- Columns ordered by flow progression (left to right)
- Drag-drop validates stage transitions (can't skip stages)
- WIP limit violations highlighted but not blocked
- Time-in-stage turns yellow at warning threshold, red at critical
- Cards auto-sort by scheduled time within column
- Completed/departed cards removed after 15 minutes

---

## Dependencies

**Depends On:**
- [Patient Flow Management](../../patient-flow/) - Stage data
- [Patient Check-In](../../patient-flow/functions/patient-check-in.md) - Check-in flow
- [Queue Management](../../patient-flow/functions/queue-management.md) - Queue data

**Required By:**
- [Day View Dashboard](./day-view-dashboard.md) - Widget option
- Clinical coordinator workflow

---

## Notes

- Consider swimlanes by provider as alternative view
- Real-time updates via WebSocket essential
- Touch-friendly for tablet use at clinical stations
- Patient photos require HIPAA-compliant display handling

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
