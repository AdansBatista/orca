# Multi-View Toggle (Timeline / Board / Grid / Floor Plan)

Purpose
Allow users to switch between visual representations (timeline, kanban-style board, grid, floor plan) of the same operational dataset to suit different tasks and roles.

Primary Users
- Front-desk, managers, owners

Core Behavior
- Preserves filters and selected time window across views
- Floor plan maps resources (chairs/rooms) to physical positions and indicates occupancy
- Board view groups appointments by stage or priority

Events / Inputs
- Resource status and occupancy events
- User preference persistence (saved views)

Acceptance Criteria
- State remains consistent when switching views; no data loss or mismatched timestamps

Implementation Notes
- Views are lightweight client-side renderings applying the same normalized feed.
