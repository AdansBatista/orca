# consent-and-privacy-controls

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Capture and enforce patient consent for specimen collection, diagnostic use, research, and marketing. Support consent versioning, expiry, and linkage to specimens and results.

## Summary

Consent records store scope (treatment, research, marketing), signer, timestamp, and optional document references. Enforcement middleware checks consent scope before data sharing or export.

## API

- POST `/api/patients/{patientId}/consents` — create consent record (fields: scope, expiresAt, documentRef, signedBy)
- GET `/api/patients/{patientId}/consents` — list consents and status

## DB / Data Fields

- Consent: `id`, `patientId`, `scope`, `signedBy`, `signedAt`, `expiresAt`, `documentRef`, `status`, `createdAt`.

## Enforcement

- Middleware or service checks consent before exporting attachments, sharing to third parties, or releasing to marketing. Flag missing consent in UI workflows.

## UI Notes

- Consent capture flows integrated into intake and collection checklist; show active consents with expiry and ability to renew.

## Acceptance Criteria

- Consent records linked to specimens and results, expiry enforced, and exports blocked when consent missing.
