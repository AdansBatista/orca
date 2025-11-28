# Conversion Pipeline

> **Sub-Area**: [Lead Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Conversion Pipeline provides a visual Kanban-style board for managing leads through customizable stages from initial contact to treatment start or lost. It enables treatment coordinators to track progress, identify bottlenecks, and manage their workload with stage-based automation and time-in-stage tracking.

---

## Core Requirements

- [ ] Display leads in a draggable Kanban board grouped by pipeline stage
- [ ] Allow custom pipeline stages with configurable order and colors
- [ ] Track time spent in each stage for bottleneck identification
- [ ] Support stage-based automation (task creation, email triggers)
- [ ] Log all stage changes with timestamps and user attribution
- [ ] Require lost reason selection when moving to "Lost" stage
- [ ] Prevent backward stage movement (except to Lost)
- [ ] Calculate stage conversion rates for analytics

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/pipeline-stages` | `lead:read` | List pipeline stages in order |
| POST | `/api/pipeline-stages` | `lead:configure` | Create new pipeline stage |
| PUT | `/api/pipeline-stages/:id` | `lead:configure` | Update stage settings |
| PUT | `/api/pipeline-stages/reorder` | `lead:configure` | Reorder stages |
| DELETE | `/api/pipeline-stages/:id` | `lead:configure` | Delete stage (if no leads) |
| POST | `/api/leads/:id/stage` | `lead:update` | Move lead to new stage |
| GET | `/api/leads/pipeline` | `lead:read` | Get leads grouped by stage |

---

## Data Model

```prisma
model PipelineStage {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Stage definition
  name          String
  slug          String
  description   String?
  order         Int
  color         String?

  // Automation
  autoTaskTemplate    String?  // Task template ID to create
  autoEmailTemplate   String?  // Email template ID to send
  maxDaysInStage      Int?     // Alert if lead exceeds this

  // Flags
  isTerminal    Boolean  @default(false)  // e.g., Converted, Lost
  isDefault     Boolean  @default(false)  // Default for new leads

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, slug])
  @@index([clinicId])
  @@index([order])
}
```

---

## Business Rules

- Default stages seeded on clinic creation: New Lead → Contacted → Consultation Scheduled → Consultation Completed → Pending Decision → Treatment Accepted → Treatment Started → Lost
- Leads can skip stages forward but cannot move backward (except to Lost from any stage)
- Moving to Lost stage requires lostReason and optional lostNotes
- Moving to "Treatment Started" stage triggers lead conversion to patient
- Stage changes logged in LeadActivity with previousStage and newStage
- maxDaysInStage triggers visual warning and optional notification
- Terminal stages (Converted, Lost) prevent further stage movement

---

## Dependencies

**Depends On:**
- Auth (user authentication, permissions)
- Lead Capture (leads to display)

**Required By:**
- Lead Analytics (conversion funnel metrics)
- Follow-up Management (stage-based task triggers)

---

## Notes

- Pipeline board should support filtering by coordinator, source, date range
- Consider implementing swimlanes for multi-coordinator views
- Stage automation should be configurable per-stage
- Provide stage-level metrics: count, average time, conversion rate

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
