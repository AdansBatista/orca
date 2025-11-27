# Transfer & Hold

Purpose
Move patients between queues or temporarily hold their progress (e.g., awaiting imaging) with preserved context.

Primary Users
- Clinical staff, coordinators

Acceptance Criteria
- Transfers maintain history and reason codes; holds expose estimated resume time.

Implementation Notes
- Use event sourcing for stage transitions to allow replay and diagnostics.
