# Practice Orchestration — Integrations & Event Contracts

Purpose
This document specifies internal and external integrations for the Practice-Orchestration area and provides canonical event contracts (JSON schemas and examples) for key operational events. It is documentation-only: use these contracts as the authoritative source for producers/consumers and for CI replay fixtures.

Integration Principles
- Event-first design: Orchestration receives domain events (appointments, check-ins, status updates) and publishes orchestration events (alerts, adjustments, occupancy updates).
- Versioned event contracts: include `eventVersion` and `eventId` on all events. Use semantic versioning for schemas.
- Idempotency: use provider-produced stable ids (appointmentId, messageId) + `eventId` for dedupe.
- Ordering: prefer idempotent processing; where ordering matters include `sequence` or `occurredAt` timestamps.
- Security: authenticate producers via mTLS or signed JWT; sign webhooks where external providers are involved.

Event Bus & Delivery
- Recommended transport: internal event bus or message queue (Kafka / NATS / RabbitMQ). Use durable topics with consumer groups for scalability.
- Delivery semantics: at-least-once with idempotent consumers.
- Retry/backoff: exponential backoff with max attempts and a Dead Letter Queue (DLQ) for manual review.

Event Naming Conventions
- Use dot-separated names and version suffix when needed:
  - `appointment.scheduled.v1`
  - `patient.checkin.v1`
  - `provider.status.update.v1`
  - `resource.occupancy.update.v1`
  - `orchestration.alert.v1`

Key Events (schemas & examples)

All canonical orchestration events MUST be sent using the standard envelope and the event-specific `data` object. Validate the envelope against `schemas/orchestration.event-envelope.schema.json` and validate `data` against the event schema linked below.

Envelope (canonical)
```json
{
  "eventId": "evt-0001",
  "eventType": "<logical.event.name.vX>",
  "eventVersion": "1",
  "occurredAt": "2025-11-27T09:05:00Z",
  "producer": "booking-service",
  "tenantId": "clinic-abc",
  "correlationId": "req-9876",
  "data": { /* event-specific payload */ }
}
```

1) `patient.checkin.v1` — patient arrives and checks in

Schema: `schemas/patient-checkin.schema.json`

Example (validate `data` against the schema above)
```json
{
  "eventId": "evt-0001",
  "eventType": "patient.checkin.v1",
  "eventVersion": "1",
  "occurredAt": "2025-11-27T09:05:00Z",
  "producer": "portal-service",
  "tenantId": "clinic-abc",
  "data": {
    "patientId": "patient-123",
    "appointmentId": "appt-456",
    "locationId": "loc-1",
    "checkinAt": "2025-11-27T09:04:30Z",
    "method": "front-desk",
    "screeningAnswers": { "fever": false },
    "notes": "running 5 minutes late"
  }
}
```

Producers: Booking & Scheduling, Portal
Consumers: Practice-Orchestration, Messaging (for confirmations), Analytics

Delivery semantics: idempotent by `eventId`; consumer should acknowledge after updating queue and patient flow state.

2) `appointment.status.changed.v1` — appointment lifecycle changes

Schema: `schemas/appointment-status-change.schema.json`

Example
```json
{
  "eventId": "evt-0002",
  "eventType": "appointment.status.changed.v1",
  "eventVersion": "1",
  "occurredAt": "2025-11-27T09:15:00Z",
  "producer": "booking-service",
  "tenantId": "clinic-abc",
  "data": {
    "appointmentId": "appt-456",
    "previousStatus": "scheduled",
    "newStatus": "in_progress",
    "updatedAt": "2025-11-27T09:15:00Z",
    "actorId": "user-32",
    "reason": "patient moved to chair"
  }
}
```

Producers: Booking system, Portal actions, Orchestration UI
Consumers: Orchestration engine, Messaging (reminders/notifications), Billing

3) `provider.status.update.v1` — provider (staff) availability/assignment changes

Schema: `schemas/provider-status-update.schema.json`

Example
```json
{
  "eventId": "evt-0003",
  "eventType": "provider.status.update.v1",
  "eventVersion": "1",
  "occurredAt": "2025-11-27T09:20:00Z",
  "producer": "staff-service",
  "tenantId": "clinic-abc",
  "data": {
    "providerId": "prov-77",
    "status": "available",
    "effectiveAt": "2025-11-27T09:20:00Z",
    "locationId": "room-3",
    "note": "back from break"
  }
}
```

Producers: Staff Management, Orchestration UI
Consumers: Orchestration engine, Booking (for assignment), Analytics

4) `resource.occupancy.update.v1` — chair/room occupancy changes

Schema: `schemas/resource-occupancy.schema.json`

Example
```json
{
  "eventId": "evt-0004",
  "eventType": "resource.occupancy.update.v1",
  "eventVersion": "1",
  "occurredAt": "2025-11-27T09:25:00Z",
  "producer": "resource-service",
  "tenantId": "clinic-abc",
  "data": {
    "resourceId": "chair-12",
    "status": "occupied",
    "currentAppointmentId": "appt-456",
    "expectedFreeAt": "2025-11-27T09:55:00Z",
    "locationId": "loc-1"
  }
}
```

Producers: Resource Management systems, Orchestration UI
Consumers: Orchestration engine, Booking, Maintenance workflows

5) `orchestration.alert.v1` — orchestrator issues an alert that needs escalation

Schema: `schemas/orchestration-alert.schema.json`

Example
```json
{
  "eventId": "evt-0005",
  "eventType": "orchestration.alert.v1",
  "eventVersion": "1",
  "occurredAt": "2025-11-27T09:30:00Z",
  "producer": "orchestrator-service",
  "tenantId": "clinic-abc",
  "data": {
    "alertId": "alert-9001",
    "level": "warning",
    "category": "delay",
    "message": "Provider running >30m behind",
    "relatedAppointments": ["appt-456", "appt-457"],
    "meta": { "avgDelayMinutes": 42 },
    "emittedAt": "2025-11-27T09:30:00Z"
  }
}
```

Producers: Orchestration engine, Monitoring systems
Consumers: Staff UI notifications, Messaging (patient/staff notifications), Audit

6) `patient.flow.update.v1` — patient journey stage update (detailed flow tracking)

Schema: `schemas/patient-flow-update.schema.json`

Example
```json
{
  "eventId": "evt-0006",
  "eventType": "patient.flow.update.v1",
  "eventVersion": "1",
  "occurredAt": "2025-11-27T09:35:00Z",
  "producer": "orchestrator-service",
  "tenantId": "clinic-abc",
  "data": {
    "patientId": "patient-123",
    "appointmentId": "appt-456",
    "stage": "called",
    "stageEnteredAt": "2025-11-27T09:34:50Z",
    "notes": "called from waiting area"
  }
}
```

Producers: Orchestration engine, Staff UI
Consumers: Analytics, Patient Communications (to send messages), QA

Event Versioning & Evolution
- Include `eventVersion` and maintain backward-compatible changes where possible. For breaking changes, publish `v2` of the event (e.g., `patient.checkin.v2`).
- Keep a changelog of schema changes and consumer migration guidance in a central docs index.

Security & Access Patterns
- Internal producers must authenticate using service tokens or mTLS. External providers (if any) must use signed webhooks.
- Restrict event subscriptions by role and tenant; include `tenantId` on events for multi-tenant deployments.

Schema Validation & Testing
- Validate all incoming events against JSON Schema and reject malformed events to DLQ.
- Provide a test harness of fixtures (see `tests/doc-fixtures/practice-orchestration/`) for CI replay.

Operational Notes
- Monitoring: track event ingress rate, consumer lag, DLQ rate, and processing time per event type.
- Backpressure: consumers should expose metrics for processing backlog and rely on the bus for buffering.

Appendix: Payload Field Notes
- `eventId`: UUID v4 assigned by producer for idempotency.
- `occurredAt`: event source time; do not rely on receive time for ordering.
- `eventVersion`: schema version.
- `tenantId`: mandatory in multi-tenant deployments.
