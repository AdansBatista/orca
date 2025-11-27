# order-status-tracking

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Manage and record status transitions for lab orders and their related specimens, and publish events for downstream systems and integrations.

## Summary

Status tracking provides traceability across the order lifecycle: `created`, `awaiting-collection`, `collected`, `in-transit`, `received`, `resulted`, `signed-off`, `canceled`. Each change stores actor, timestamp, reason, and optional metadata. Events are emitted to downstream consumers with idempotency keys.

## API

- PATCH `/api/lab/orders/{orderId}/status`
	- Request JSON:
		{
			"status": "string",
			"actorId": "string",
			"timestamp": "iso8601|null",
			"note": "string|null",
			"externalControlId": "string|null"
		}
	- Response 200: updated order status and a `statusEventId`.

- GET `/api/lab/orders/{orderId}/status-history` — returns ordered history of status events.

## DB / Data Fields

- OrderStatusEvent: `id`, `labOrderId`, `status`, `actorId`, `timestamp`, `note`, `externalControlId`, `createdAt`

## Events / Webhooks

- Topic: `lab.order.status.changed`
	- Payload includes `orderId`, `newStatus`, `previousStatus`, `actorId`, `timestamp`, `externalControlId`, `metadata`.
	- Include `messageId` for idempotency and `retryCount` metadata.

## Sample Requests

PATCH example:

{
	"status": "collected",
	"actorId": "user_98",
	"timestamp": "2025-11-27T13:45:00Z",
	"note": "Specimen collected by phlebotomist",
	"externalControlId": "mlp-1234"
}

Webhook payload example:

{
	"messageId": "evt_abc",
	"orderId": "ord_987",
	"newStatus": "collected",
	"actorId": "user_98",
	"timestamp": "2025-11-27T13:45:00Z"
}

## UI Notes

- Order timeline view shows status events with actor and notes; allow filtering by timeframe and event type. Admin UI to retry failed webhook deliveries and inspect DLQ.

## Acceptance Criteria

- All status transitions are persisted and immutable (history kept).
- Events emitted and delivered with retries; duplicate events ignored via `messageId`.
