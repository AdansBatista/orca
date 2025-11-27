# clinician-review-and-signoff

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Critical |

## Purpose

Provide UI and API workflows for clinicians to review normalized observations, add clinical notes, escalate abnormalities, and sign final reports. Sign-off creates a signed `ResultVersion` and optionally triggers patient notification according to release policy.

## Summary

Review UI displays normalized observations, original attachments, previous versions, and automated flags. Clinician can annotate, add notes, change interpretation, and sign. Signing records user identity, timestamp, and locked snapshot.

## API

- POST `/api/lab/results/{resultId}/review`
	- Request: `{ "reviewerId":"user_x", "notes":"string", "annotations": [...], "action":"save|signoff" }`
	- Response: when `signoff` returns new `resultVersionId` and `signedAt`.

## DB / Data Fields

- ReviewEvent: `id`, `labResultId`, `reviewerId`, `notes`, `annotations`(JSON), `action`, `createdAt`.
- ResultVersion created on `signoff` with `signedBy`, `signedAt`, `signatureRef`.

## UI Notes

- Present observations grouped by panel, with quick links to original attachments. Provide keyboard shortcuts for common sign-off tasks and a confirmation modal showing legal disclaimer.

## Acceptance Criteria

- Sign-off creates a locked `ResultVersion` with audit fields and prevents edits to that version.
- Signing triggers downstream actions per policy (e.g., notify patient or queue for release).
