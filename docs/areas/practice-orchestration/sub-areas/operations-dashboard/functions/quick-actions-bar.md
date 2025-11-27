# Quick Actions Bar

Purpose
Provide commonly used operational actions inline from dashboards (reschedule, reassign, send delay notice, mark no-show, create task).

Primary Users
- Front-desk, clinical staff

Core Actions
- Reschedule appointment (with suggested alternatives)
- Reassign staff or room
- Send patient delay notification via Patient Communications
- Create follow-up task for manager

Acceptance Criteria
- Actions are auditable and generate corresponding events consumed by other areas.

Implementation Notes
- Keep the bar role-aware; hide elevated actions from low-permission users.
