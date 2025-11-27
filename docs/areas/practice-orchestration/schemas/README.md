# Practice-Orchestration Event Schemas

This folder contains JSON Schema definitions for the canonical orchestration events used across Practice‑Orchestration integrations and CI fixtures.

Usage
- Each producer should wrap the event `data` with the common envelope described in `orchestration.event-envelope.schema.json` and set `eventType` to one of the event schemas below.
- CI fixtures in `tests/doc-fixtures/practice-orchestration/` should validate against these schemas during replay tests.

Schemas included
- `orchestration.event-envelope.schema.json` — common event envelope
- `patient-checkin.schema.json` — data payload for patient check-in events
- `appointment-status-change.schema.json` — appointment lifecycle changes
- `provider-status-update.schema.json` — provider availability updates
- `resource-occupancy.schema.json` — resource/chair occupancy and expected free times
- `orchestration-alert.schema.json` — alerts emitted by orchestration rules or telemetry

Quick mapping to fixtures
- `tests/doc-fixtures/practice-orchestration/patient-checkin.json` -> `patient-checkin.schema.json`
- `tests/doc-fixtures/practice-orchestration/appointment-status-change.json` -> `appointment-status-change.schema.json`
- `tests/doc-fixtures/practice-orchestration/provider-status-update.json` -> `provider-status-update.schema.json`
- `tests/doc-fixtures/practice-orchestration/resource-occupancy.json` -> `resource-occupancy.schema.json`
- `tests/doc-fixtures/practice-orchestration/orchestration-alert.json` -> `orchestration-alert.schema.json`
