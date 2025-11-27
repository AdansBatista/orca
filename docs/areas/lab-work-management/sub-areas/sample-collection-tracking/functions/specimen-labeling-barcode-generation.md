# specimen-labeling-barcode-generation

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Critical |

## Purpose

Generate unique specimen labels (barcode/QR) and print-ready payloads (ZPL and PDF) for specimen identification during collection and transit.

## Summary

Service creates `labelId` and returns formats for thermal printers (ZPL) and printable PDFs. Labels include specimen id, order id, test code, collection date/time and a 2D barcode encoding an id or URL for quick scanning.

## API

- POST `/api/lab/specimens/{specimenId}/labels`
	- Request:
		{ "format": "zpl|pdf", "copies": 1, "includeHumanReadable": true }
	- Response 200:
		{ "specimenId":"spec_1","labels": [ { "format":"zpl","content":"^XA...^XZ" , "pdfUrl":"https://.../label.pdf" } ] }

## Label Content (ZPL example)

ZPL snippet example (shortened):

^XA
^FO50,50^BQN,2,10^FDQA,https://orca.local/scan/spec_1^FS
^FO50,200^A0N,30,30^FDOrder: ORD_987^FS
^FO50,240^A0N,24,24^FDTest: CBC^FS
^XZ

## DB / Data Fields

- Label: `id`, `specimenId`, `format`, `contentRef` (storage key), `createdAt`, `generatedBy`.

## UI Notes

- Print dialog integrates with clinic printers; support sending ZPL directly to networked printers or downloading PDF for local printing. Allow preview and copy count.

## Acceptance Criteria

- Label payloads generated for requested format, contain specimen id, order id, and 2D barcode.
- Labels are downloadable and printable; preview available in UI.
