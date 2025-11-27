# Operations Dashboard

Purpose
Provide staff, managers and owners with multi-view, real-time dashboards to observe and act on the practice's operational state for Day/Week/Month horizons.

Primary Users
- Front-desk staff (real-time list and actions)
- Managers (worklist, escalations, trend view)
- Owners (high-level pace, KPIs, financial snapshot)

Core Functions
- Day View Timeline: chronological appointments, check-ins, and ongoing procedures.
- Week/Month Rollup: utilization trends, no-shows, and revenue pacing.
- Multi-View Toggle: timeline/board/grid/floor-plan (visual map of chairs/rooms).
- Live Alerts Panel: exceptions, delays, equipment faults, staffing issues.
- Quick Actions Bar: reassign staff, cancel/reschedule, send delay notices.
- Owner Snapshot: high-level metrics (daily revenue, chair utilization, completed procedures).

Implementation Notes
- Low-latency data via sockets; fall back to polling for low-tier clients.
- Views should be configurable and shareable (saved filters/bookmarks).
