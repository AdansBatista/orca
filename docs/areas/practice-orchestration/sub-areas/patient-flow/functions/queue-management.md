# Queue Management & Prioritization

Purpose
Manage ordered patient queues with priority rules, promotions, and manual overrides.

Primary Users
- Front-desk leads, patient flow coordinators

Features
- Automatic priority for urgent flags, provider-specific queues, manual bump/push, estimated wait time

Events
- `orchestration.queue-updated`, `orchestration.patient-promoted`

Acceptance Criteria
- Queue state consistent across clients and respects WIP limits.
