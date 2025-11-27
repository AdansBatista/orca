# Event-Triggered Workflows

Purpose & Summary
Define and execute workflows triggered by events (e.g., appointment.scheduled, lab.result.released). Supports branching, delays, and conditional actions.

API Endpoints
- `POST /api/v1/workflows/execute` — execute workflow (internal)
- `GET /api/v1/workflows/{id}` — workflow definition

DB / Data Fields
- Workflow (id, name, triggerEvent, definitionJSON, status)
- WorkflowExecution (id, workflowId, startedAt, status, context)

Sample Payloads
- Trigger: { "eventType":"appointment.scheduled","patientId":"p1","appointmentId":"a1" }

UI Notes
- Visual workflow editor with nodes for send-message, wait, condition, and sub-workflow; test/debug runner

Acceptance Criteria
- Workflows execute reliably on trigger events and maintain idempotency
- Failure paths are logged and retried according to policy

Integration Hooks
- Messaging Hub for sends
- Campaign engine for scheduled steps
- Audit log and monitoring systems
# Event-Triggered Workflows

Purpose & Summary
Define workflows triggered by events (appointment booked, result released) that can run multi-step sequences across channels.

API Endpoints
- `POST /api/v1/workflows/trigger` — trigger workflow manually
  - Request: { "workflowId":"uuid", "event":{} }

DB / Data Fields
- Workflow (id, steps[], retryPolicy, createdBy)

Sample Payloads
- Trigger: { "workflowId":"wf1", "event":{ "type":"appointment.booked","data":{}} }

UI Notes
- Workflow visual designer with step types (delay, send message, conditional branch)

Acceptance Criteria
- Workflow executes steps reliably, records step results and errors
- Supports conditional branching based on patient data

Integration Hooks
- Event bus for subscribing to system events
- Message Hub and Portal for actions
