# hl7-fhir-lab-result-ingest

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Critical |

## Purpose

Ingest lab results from external labs and LIS using HL7 v2 (ORU^R01) and FHIR DiagnosticReport resources. Persist raw payloads, attachments, and create normalized `LabResult` and `ResultObservation` records with idempotency safeguards.

## Summary

The ingestion pipeline accepts messages over multiple transports (MLLP/TCP, HTTP FHIR, SFTP file drops) and performs validation, normalization, LOINC mapping, and persistence. Raw messages and attachments are stored in object storage and referenced from normalized DB records.

## Supported Message Types

- HL7 v2 ORU^R01 (OBX segments for observations)
- FHIR DiagnosticReport + Observation
- Attachments: PDF, images (presentedForm / OBX of type ED)

## API / Ingestion Endpoints

- POST `/api/lab/ingest/fhir` — accepts FHIR DiagnosticReport JSON (requires OAuth2 client credentials)
- MLLP endpoint (port, TLS) for HL7 v2 messages — accepts ORU messages
- SFTP drop: watch folder for HL7 or PDF files

## Processing Steps

1. Receive message and compute `externalControlId` (from MSH-10 or FHIR id).
2. Check idempotency store — if seen, link to existing `LabResult` and ack.
3. Persist raw payload to object storage and create `IngestionRecord` with metadata.
4. Parse message into `LabResult` and `ResultObservation` records; attempt LOINC mapping.
5. If parsing fails, send to DLQ and create `IngestionError` record.

## HL7 v2 Example (ORU minimal)

MSH|^~\\&|LAB|LAB1|EMR|CLINIC|20251127||ORU^R01|12345|P|2.3
PID|1||123456||DOE^JOHN
OBR|1|ORD123||CBC^Complete Blood Count
OBX|1|NM|789-8^Hemoglobin^LN|1|13.5|g/dL|13.2-17.1|N|||F

## FHIR DiagnosticReport Example (abridged)

{
	"resourceType": "DiagnosticReport",
	"id": "report-1",
	"status": "final",
	"subject": { "reference": "Patient/123" },
	"result": [ { "reference": "Observation/obs-1" } ]
}

## DB / Data Fields

- IngestionRecord: `id`, `externalControlId`, `source`, `payloadRef`, `receivedAt`, `status`, `errorRef`
- LabResult: `id`, `labOrderItemId`, `status`, `reportedAt`, `source`, `rawPayloadRef`
- ResultObservation: `id`, `labResultId`, `loincCode`, `value`, `unit`, `flags`, `referenceRange`

## Error Handling

- Retry with backoff for transient errors.
- Permanent failures go to DLQ with UI for manual reconciliation.

## Acceptance Criteria

- Sample HL7 and FHIR messages processed successfully by CI tests and produce normalized `ResultObservation` records.
- Idempotency prevents duplicate result creation for repeated messages.

## Notes / TODO

- Add sample HL7/FHIR CI fixtures under `tests/doc-fixtures/lab-ingest/`.
