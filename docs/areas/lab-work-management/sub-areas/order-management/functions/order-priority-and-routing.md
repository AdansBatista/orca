# order-priority-and-routing

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Medium |

## Purpose

Determine order priority and route orders to the most appropriate lab provider based on rules (test capability, turnaround time, cost, location) while allowing manual overrides and ensuring auditability.

## Summary

Provides a rules engine and decision API. Default routing is automatic; UI allows users to override and record rationale. Supports policy-driven routing (e.g., urgent tests must route to in-network labs with <24h TAT).

## API

- POST `/api/lab/orders/{orderId}/route`
	- Request: `{ "strategy": "auto|manual", "preferredLabId": "string|null", "actorId": "string" }`
	- Response: `{ "orderId":"...", "routedTo":"lab_123", "rationale":"string" }`

- GET `/api/lab/routing-suggestions?testCode=CBC&location=zip` — returns ranked lab providers with estimated TAT and cost.

## DB / Data Fields

- RoutingDecision: `id`, `labOrderId`, `selectedLabId`, `decider` (`rules_engine`|`manual`), `rationale`, `metadata`, `createdAt`.

## Sample Payload

Request (auto): `{ "strategy":"auto","actorId":"user_3" }`

Response: `{ "orderId":"ord_1","routedTo":"lab_17","rationale":"Selected by rules: lowest TAT within network" }`

## UI Notes

- Routing suggestion panel shows ranked labs, TAT, cost estimates, and capabilities; manual override requires a rationale and is recorded.

## Acceptance Criteria

- RoutingDecision record created for each routing action.
- Manual overrides are auditable and appear in order history.
