# Data Models — Lab Work Management

## ER Diagram (overview)

```
┌───────────┐     ┌─────────────┐     ┌───────────┐
│  Patient  │────▶│  LabOrder   │────▶│ LabOrderItem│
└───────────┘     └─────────────┘     └───────────┘
                       │                     │
                       ▼                     ▼
                 ┌──────────┐         ┌─────────────┐
                 │ Specimen │────────▶│ SpecimenEvent│
                 └──────────┘         └─────────────┘
                       │
                       ▼
                 ┌──────────┐
                 │ LabResult│────▶ ResultObservation
                 └──────────┘
```

## Key Models (summary)

- LabOrder: id, patientId, orderedBy, orderDate, status, externalOrderId, priority
- LabOrderItem: id, labOrderId, testCode (CPT/LOINC), name, collectionRequirement
- Specimen: id, labOrderItemId, specimenType, labelId, location, collectedAt
- SpecimenEvent: id, specimenId, eventType (collected, shipped, received), actorId, timestamp, notes
- LabResult: id, labOrderItemId, status, reportedAt, source (LIS), rawPayloadRef
- ResultObservation: id, labResultId, loincCode, value, unit, referenceRange, flags
- ResultAttachment: id, labResultId, contentType, storageUrl
- ChainOfCustodyEntry: id, specimenId, from, to, timestamp, signature
- LabProvider: id, name, endpointType, authConfig

## Fields & Common Patterns

- Use `createdAt`, `updatedAt`, `createdBy`, `updatedBy` on all models.
- Include `sourceMessageId` / `externalControlId` on ingestion records for idempotency.
- Keep raw payloads and attachments in object storage referenced by `rawPayloadRef`.
