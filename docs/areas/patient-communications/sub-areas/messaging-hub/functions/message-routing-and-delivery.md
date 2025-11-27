# Message Routing and Delivery

Purpose & Summary
Route messages from the internal queue to provider adapters, handle retries, failover, and provider webhooks.

API Endpoints
- Internal only: `POST /internal/messaging/route` — scheduler/worker endpoint (not public)

DB / Data Fields
- ProviderAdapter (id, name, type, config, priority)
- MessageDelivery (id, messageId, providerId, attemptNumber, status, error)

Sample Payloads
- Internal job payload: { "messageId":"uuid", "attempt":1 }

UI Notes
- Provider health dashboard, per-provider stats, manual failover switch

Acceptance Criteria
- Messages retried with exponential backoff up to configurable max
- Failover to secondary providers when primary returns persistent errors
- Delivery receipts reconcile to message status

Integration Hooks
- Providers: POST webhook endpoints for delivery receipts and failures
- Audit: send events to audit service on final delivery/failure
