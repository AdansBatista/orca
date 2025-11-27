# collection-checklist

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Mobile-first interactive collection checklist to guide collectors through required tasks, capture consent, record vitals/conditions, attach photos, and sign the collection event.

## Summary

Checklist templates are configurable per `testCode` and can enforce required fields, prompt for temperature storage conditions, and require photo attachments for certain specimen types.

## API

- GET `/api/lab/specimens/{specimenId}/collection-checklist` — returns checklist template and required fields.
- POST `/api/lab/specimens/{specimenId}/collection-event`
	- Request example:
		{
			"collectedBy":"user_12",
			"collectedAt":"2025-11-27T14:00:00Z",
			"answers": { "tubeType":"EDTA", "fasting":"yes" },
			"photos": ["https://storage/.../img1.jpg"],
			"signature": "base64-sig"
		}
	- Response 200: `{ "specimenEventId": "evt_1" }`

## DB / Data Fields

- CollectionEvent: `id`, `specimenId`, `collectedBy`, `collectedAt`, `answers` (JSON), `photos` (refs), `signatureRef`, `createdAt`.

## UI Notes

- Mobile form with offline capability: cache answers and attachments until upload. Show required fields highlighted; provide scanner button to attach specimen label barcode.

## Acceptance Criteria

- Checklist enforces required fields per template.
- Collector can attach photos and provide signature; event stored and linked to specimen.
