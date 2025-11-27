# chain-of-custody-log

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Critical |

## Purpose

Maintain an append-only chain-of-custody (COC) ledger for each specimen to support traceability, legal defensibility, and regulatory audits.

## Summary

Every custody or handling change (collected, transferred to courier, received in lab, returned to archive) creates an immutable COC entry with actor, location, timestamp, reason and optional signature or photo evidence.

## API

- POST `/api/lab/specimens/{specimenId}/coc`
	- Request:
		{ "from": "locationA", "to":"locationB", "actorId":"user_1", "timestamp":"iso", "reason":"string", "signatureRef":"string|null" }
	- Response: `{ "cocEntryId":"coc_1" }`

- GET `/api/lab/specimens/{specimenId}/coc` — list COC entries.

## DB / Data Fields

- ChainOfCustodyEntry: `id`, `specimenId`, `from`, `to`, `actorId`, `timestamp`, `reason`, `signatureRef`, `evidenceRefs` (photos), `createdAt`.

## UI Notes

- COC timeline view on specimen page showing location movements and ability to export COC bundle (PDF/CSV) for compliance requests.

## Acceptance Criteria

- COC entries are append-only; only add operations permitted (no deletes); editing creates a separate correction entry with reason.
- Exportable COC reports include all related evidence.
