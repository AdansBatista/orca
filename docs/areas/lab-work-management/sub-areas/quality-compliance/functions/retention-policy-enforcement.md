# retention-policy-enforcement

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Configure and enforce retention, archival, and deletion schedules for lab data (results, attachments, audit logs) by test type, jurisdiction, and policy.

## Summary

Policies define retention periods, archival targets (cold storage), soft-delete windows, and final destruction. Retention rules applied to `LabResult`, `ResultAttachment`, and `AuditEntry` types.

## API

- GET `/api/lab/retention/policies` — list policies.
- POST `/api/lab/retention/policies` — create/update policy (admin only).
- POST `/api/lab/retention/run` — run archival job (manual trigger) with report.

## Policy Model

- RetentionPolicy: `id`, `entityType`, `testCodePattern`, `jurisdiction`, `retainDays`, `archiveAfterDays`, `deleteAfterDays`, `createdBy`, `createdAt`.

## Processing

- Periodic job evaluates policies, moves items to archival storage, marks soft-deleted, and eventually purges per schedule. Maintain logs of archival and deletion actions.

## UI Notes

- Admin UI to view active policies, run jobs, and inspect reports of archived/deleted items. Ability to exempt specific records with rationale.

## Acceptance Criteria

- Policies enforced with scheduled jobs and reports available; manual override flows documented and auditable.
