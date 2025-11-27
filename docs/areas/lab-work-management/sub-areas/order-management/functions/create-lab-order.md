# create-lab-order

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Critical |

## Purpose

Create a lab order for a patient containing one or more tests, validate codes, assign routing, and optionally generate specimen placeholders and labels.

## Summary

This endpoint and UI support creating new lab orders from intake or clinician workflows. The service validates test codes (LOINC/CPT), applies routing rules, reserves specimen slots, and optionally returns label payloads for printing.

## User Stories

- As a front-desk user, I create a lab order during intake and print specimen labels.
- As a clinician, I add tests, set urgency, and choose preferred lab provider.

## API

- POST `/api/lab/orders`
	- Request JSON:
		{
			"patientId": "string",
			"encounterId": "string|null",
			"requestedBy": "userId",
			"priority": "routine|stat|urgent",
			"items": [
				{ "testCode": "string", "testType": "string", "specimenType": "string", "quantity": 1 }
			],
			"preferredLabId": "string|null",
			"notes": "string|null"
		}
	- Response 201 Created:
		{
			"orderId": "string",
			"externalOrderId": "string|null",
			"items": [{ "id":"string","testCode":"string","specimenPlaceholderId":"string|null" }],
			"labels": [{ "specimenId":"string","zpl":"string","pdfUrl":"string" }]
		}

- GET `/api/lab/orders/{orderId}` — returns full order with items, specimens, status history.

## DB / Data Fields (created)

- LabOrder: `id`, `patientId`, `encounterId`, `requestedBy`, `priority`, `status`, `externalOrderId`, `createdAt`, `updatedAt`
- LabOrderItem: `id`, `labOrderId`, `testCode`, `testName`, `specimenType`, `quantity`, `collectionRequirement`
- Specimen (placeholder): `id`, `labOrderItemId`, `labelId`, `status`

## Sample Payload

Request example:

{
	"patientId": "pat_123",
	"requestedBy": "user_45",
	"priority": "routine",
	"items": [ { "testCode": "CBC", "testType": "Hematology", "specimenType": "Blood", "quantity": 1 } ]
}

Response example (201):

{
	"orderId": "ord_987",
	"items": [{ "id":"item_1","testCode":"CBC","specimenPlaceholderId":"spec_1" }],
	"labels": [{ "specimenId":"spec_1","zpl":"^XA...^XZ","pdfUrl":"https://.../label-spec_1.pdf" }]
}

## UI Notes

- Order creation form: patient lookup, encounter link, test search/auto-complete (LOINC/CPT), quantity and specimen type selection, preferred lab selector, comments.
- After create: show printable label actions (PDF / send to printer), and quick link to specimen collection checklist.

## Acceptance Criteria

- Creates `LabOrder` and `LabOrderItem` records and returns 201 with order id.
- Validates test codes against local catalog; returns warnings for unmapped codes.
- Generates specimen placeholders and label payload when requested.

## Notes / TODO

- Add UI wireframes and batch order CSV import endpoint in future.
