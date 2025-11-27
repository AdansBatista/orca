# result-parsing-validation

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Parse attachments (PDFs, images) and unstructured HL7/FHIR text fields into structured `ResultObservation` records and validate value formats, units, and reference ranges.

## Summary

Pipeline stages: OCR (for images/PDFs), text extraction, regex/ML-based field extraction, unit normalization, LOINC/CPT mapping, and value validation. Combine heuristic rules with ML models for ambiguous mappings.

## API

- POST `/api/lab/parse/attachment`
	- Request: `{ "attachmentRef": "s3://...", "hintTestCode": "CBC|null" }`
	- Response: `{ "observations": [ { "loincCode":"789-8","value":13.5,"unit":"g/dL","confidence":0.92 } ] }`

## Processing Steps

1. Download attachment from `attachmentRef`.
2. Run OCR -> plain text.
3. Extract candidate observation lines using regex and ML models.
4. Normalize units and map to LOINC when confidence high.
5. Return structured observations with confidence and suggested mappings.

## Sample Output

{
	"observations": [
		{ "loincCode":"789-8","displayName":"Hemoglobin","value":13.5,"unit":"g/dL","referenceRange":"13.2-17.1","flags":"N","confidence":0.93 }
	]
}

## DB / Data Fields

- ParseJob: `id`, `attachmentRef`, `status`, `resultRef`, `createdAt`, `errorRef`.

## AI / Model Notes

- Maintain versioning of ML models; include fallback deterministic regex rules. Track confidence thresholds and human review workflow for low-confidence mappings.

## Acceptance Criteria

- Parsed observations include LOINC codes for > 90% high-confidence matches in sample dataset.
- Low-confidence observations routed to manual review UI.
