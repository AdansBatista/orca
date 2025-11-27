# order-editing-cancellation

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Allow authorized users to update lab orders or cancel them per clinic policy while maintaining a full audit trail and optional business rules (e.g., cancellation windows, refund triggers).

## Summary

Supports partial updates (items added/removed, quantities changed, priority updates), and full or partial cancellation with required reason and actor. Changes produce audit entries and may create `OrderChange` records to preserve previous state.

## API

- PUT `/api/lab/orders/{orderId}`
	- Request JSON: full or partial order fields to update; patch semantics supported.
	- Response 200: updated order and `changeEventId`.

- POST `/api/lab/orders/{orderId}/cancel`
	- Request JSON: `{ "cancelledBy": "userId", "reason": "string", "refund": true|false }`
	- Response 200: `{ "orderId": "...", "status": "canceled", "cancellationEventId": "..." }`

## DB / Data Fields

- OrderChange: `id`, `labOrderId`, `changedBy`, `changePayload` (JSON diff), `createdAt`.
- CancellationEvent: `id`, `labOrderId`, `cancelledBy`, `reason`, `createdAt`, `affectsBilling`.

## Sample Requests

PUT example (add item):

{
	"items": [ { "testCode": "BMP", "specimenType": "Blood" } ]
}

Cancel example:

{
	"cancelledBy": "user_12",
	"reason": "Duplicate order",
	"refund": true
}

## UI Notes

- Edit flow should show original values side-by-side and require reason for critical changes. Cancellation requires confirmation modal and optional refund workflow.

## Acceptance Criteria

- All edits recorded with `OrderChange` containing the JSON diff and actor.
- Cancellation marks order and associated pending specimens as canceled and triggers billing hooks if `refund` is true.
