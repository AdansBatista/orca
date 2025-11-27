# Live Alerts Panel

Purpose
Surface operational exceptions (delays, equipment faults, staffing shortages) and provide triage actions.

Primary Users
- Managers, front-desk leads

Inputs
- Alert rules: thresholds for delays, utilization, staff-to-appointment ratio
- Telemetry events for equipment and resource health

Outputs
- Prioritized alerts with suggested actions and related context (appointments affected)
- Escalation workflows (auto-assign tasks, page manager)

Acceptance Criteria
- Alerts show causal context and a one-click suggested remediation

Implementation Notes
- Support suppression windows and alert cooldown to avoid notification storms.
