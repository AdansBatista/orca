# result-versioning

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Medium |

## Purpose

Maintain immutable version history for `LabResult` records, including attachments and manual corrections. Each sign-off or manual change produces a new `ResultVersion` with metadata and diff information.

## Summary

Versioning ensures reproducibility and auditability for clinical results. Support read-only archived versions and allow comparison between versions in UI.

## API

- GET `/api/lab/results/{resultId}/versions` — list versions with metadata
- GET `/api/lab/results/{resultId}/versions/{versionId}` — retrieve version snapshot
- POST `/api/lab/results/{resultId}/versions` — create manual version (for corrections) with `createdBy`, `notes`, `patch` fields

## DB / Data Fields

- ResultVersion: `id`, `labResultId`, `versionNumber`, `createdBy`, `createdAt`, `changeSummary`, `snapshotRef` (JSON or object storage ref).

## Sample Flow

- Ingested result creates `version 1`.
- Clinician sign-off creates `version 2` (signed metadata).
- Manual correction posts a `version 3` with `changeSummary`.

## UI Notes

- Version history view: compare values side-by-side, see who signed and when, and export specific version as PDF bundle.

## Acceptance Criteria

- Every sign-off or manual correction creates a new `ResultVersion` and snapshot of normalized observations and attachments.
