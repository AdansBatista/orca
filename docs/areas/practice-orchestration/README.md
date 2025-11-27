# Practice Orchestration (Practice Management System)

Quick Info
- **Area:** Practice Orchestration
- **Phase:** 2 - Core Operations
- **Owner:** `ops-orchestration@orca.example`
- **Status:** Draft

Overview
Practice Orchestration is the practice management command center: a multi-view system that gives staff, managers, and owners a single place to see the day's pace, manage tasks, coordinate people and resources (chairs/rooms/equipment), and respond to exceptions. It combines real-time dashboards (Day/Week/Month), actionable worklists and task management, and an AI Manager that surfaces priorities, recommendations, and quick reports.

Business Value
- Reduce downtime and maximize chair utilization
- Improve staff coordination and reduce bottlenecks
- Give managers a to-do and decision surface for daily operations
- Give owners high-level pace and financial visibility across time horizons
- Automate triage and recommended actions with AI-driven insights

Key Capabilities
- Multi-view dashboards (Timeline/Board/Grid/Floor Plan) for Day/Week/Month
- Real-time patient flow and check-in/check-out tracking
- Resource occupancy and equipment monitoring
- Staff activity, worklists, and dynamic task assignment
- Alerts, escalation rules, and owner-level summaries
- AI Manager: natural-language queries, anomaly detection, schedule optimizer, and daily to-do generation

Suggested Sub-Areas (4)
- Operations Dashboard — Day/Week/Month dashboards and multi-view interfaces
- Patient Flow & Queue Management — queues, check-ins, call-to-chair, patient journey tracking
- Resource & Staff Management — chairs/rooms, equipment, staff assignments, and breaks
- AI Manager & Analytics — KPI dashboards, quick reports, AI recommendations, and task generation

Integration Points
- Booking & Scheduling: appointment schedule, reschedules, cancellations
- Patient Communications: reminders, delay notifications, patient alerts
- Staff Management: staff schedules, clock-in/out, certifications
- Resources Management: chair/room status, equipment telemetry, maintenance
- Billing & Finance: payments, quotes, expected revenue per slot

Data Models (high level)
- OrchestrationSession (id, date, locationId, summaryMetrics)
- PatientFlowState (patientId, appointmentId, stage, enteredAt, notes)
- ResourceOccupancy (resourceId, status, currentAppointmentId, expectedFreeAt)
- StaffAssignment (staffId, appointmentId, role, assignedAt)
- Task / WorkItem (id, ownerId, assigneeId, dueAt, priority, status, relatedAppointment)

AI Features
- Natural-language manager queries ("show me today's top delays")
- Schedule optimization suggestions to reduce cascading delays
- Proactive to-do generation and triage (AI-created daily tasks)
- Anomaly detection for unusual appointment lengths or equipment issues
- Predictive staffing suggestions based on expected load

Compliance & Security
- PHI access controls per role and per view
- Audit logging for all status changes and task actions
- Data retention policy for live session data vs. historical analytics

Implementation Notes
- Use event-driven integration (see `integrations.md`) with durable event bus.
- Build dashboards with websockets/SSE for low-latency updates and optimistic UI behavior.
- Implement tenant/clinic scoping so managers see their location(s).
- Provide admin configuration for custom statuses, WIP limits, alert thresholds, and KPI windows.

See sub-areas for function lists and detailed specs.
