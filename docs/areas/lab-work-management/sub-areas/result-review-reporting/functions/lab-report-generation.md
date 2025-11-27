# lab-report-generation

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Medium |

## Purpose

Produce consolidated lab report bundles (PDF) including patient demographics, ordered tests, normalized results, attachments, clinician notes, and signatures for distribution and archiving.

## Summary

Report generator composes structured data and attachments into a printable PDF with clinic branding. Support templates for patient-facing and clinician-facing reports and include configurable sections and privacy redaction.

## API

- POST `/api/lab/reports/generate`
	- Request: `{ "orderId":"string" | "resultId":"string", "template":"patient|clinician", "includeAttachments": true }`
	- Response: `{ "reportId":"rpt_1", "pdfUrl":"https://.../rpt_1.pdf" }`

- GET `/api/lab/reports/{reportId}` — metadata and download link.

## Template Options

- `patient` template: simplified language, redacted sensitive commentary (optional), links to patient portal.
- `clinician` template: full detail, annotations, and attachments included.

## DB / Data Fields

- LabReport: `id`, `sourceId` (orderId/resultId), `template`, `generatedBy`, `generatedAt`, `pdfRef`, `checksum`.

## Sample Payload

Request:

{
	"resultId": "res_1",
	"template": "patient",
	"includeAttachments": true
}

Response:

{
	"reportId": "rpt_20251127_1",
	"pdfUrl": "https://s3.../rpt_20251127_1.pdf"
}

## UI Notes

- Provide preview and print options; allow bundling multiple results into a single report for case export.

## Acceptance Criteria

- Reports generate within SLA (e.g., < 30s for single result) and include requested attachments and signatures where applicable.
