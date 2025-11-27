# qa-audit-logging

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Critical |

## Purpose

Record immutable audit trails for all lab-related operations (order creation, edits, specimen events, result views, sign-offs) and provide exportable bundles for regulatory requests.

## Summary

Audit logs capture `who`, `what`, `when`, `where`, and `why`. Logs must be tamper-evident, searchable, and exportable. Include contextual links to related records (orderId, specimenId, resultId).

## API

- GET `/api/audit/logs?entity=labOrder&entityId=ord_1` — query logs.
- POST `/api/audit/export` — request export bundle for date range and entities; returns signed archive URL.

## Data Fields

- AuditEntry: `id`, `actorId`, `action`, `entityType`, `entityId`, `timestamp`, `metadata` (JSON), `ip`, `userAgent`, `createdAt`.

## Security & Retention

- Audit storage is append-only; retention and archival controlled by `retention-policy-enforcement` rules. Exports must be signed and access-controlled.

## UI Notes

- Compliance console: search by actor, entity, date; provide export and anomaly detection (e.g., bulk downloads, unusual access patterns).

## Acceptance Criteria

- Audit entries recorded for all critical actions; compliance role can export signed audit bundles.
