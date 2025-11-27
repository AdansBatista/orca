# Integrations — Lab Work Management

## Overview

This document describes external and internal integration patterns for lab-related data flows. Primary focus is ingesting lab results from external labs and LIS, and notifying downstream systems.

## Supported Protocols

- HL7 v2 (ORU^R01): Widely used by laboratory information systems for result messages.
- FHIR (DiagnosticReport / Observation): Modern REST-based APIs and resources.
- SFTP / Secure file drops: For bulk report file exchange.
- REST API (JSON): Vendor-specific APIs.

## Recommended Approach

1. Implement an ingestion pipeline that accepts HL7 v2 messages and FHIR DiagnosticReport resources.
2. Persist raw payloads/attachments in object storage and create normalized `LabResult` and `ResultObservation` records.
3. Provide idempotency and message deduplication based on external message control IDs.

## HL7 v2 Example (ORU^R01) — minimal

```
MSH|^~\\&|LAB|LAB1|EMR|CLINIC|20251127||ORU^R01|12345|P|2.3
PID|1||123456||DOE^JOHN
OBR|1|ORD123||CBC^Complete Blood Count
OBX|1|NM|789-8^Hemoglobin^LN|1|13.5|g/dL|13.2-17.1|N|||F
```

## FHIR DiagnosticReport Example (JSON sketch)

```
{
  "resourceType": "DiagnosticReport",
  "id": "report-1",
  "status": "final",
  "subject": { "reference": "Patient/123" },
  "result": [ { "reference": "Observation/obs-1" } ],
  "presentedForm": [ { "contentType": "application/pdf", "url": "https://.../attachments/report-1.pdf" } ]
}
```

## Authentication

- For REST/FHIR: OAuth2 with client credentials or token exchange.
- For HL7 v2 over TCP: MLLP with network-level security (TLS) and source IP allow-listing.
- SFTP: key-based authentication.

## Error Handling & Dead Letter

- Failed messages should be retried with exponential backoff.
- After configurable attempts, move to a dead-letter queue with a human review workflow.
