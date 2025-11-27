# proficiency-test-tracking

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | Medium |

## Purpose

Track proficiency testing events, QA cycles, external proficiency providers, and corrective actions to demonstrate quality control and certification readiness.

## Summary

Record proficiency test submissions, results, deviations, corrective actions, and timelines. Link QA events to lab providers and specimens when applicable.

## API

- POST `/api/lab/qa/proficiency` — create proficiency test event (fields: provider, roundId, sampleIds, submittedAt)
- GET `/api/lab/qa/proficiency/{id}` — retrieve event and status

## DB / Data Fields

- ProficiencyEvent: `id`, `providerId`, `roundId`, `sampleRefs`, `submittedAt`, `resultsRef`, `status`, `correctiveActions` (JSON), `createdAt`.

## UI Notes

- QA dashboard to track upcoming proficiency rounds, submission deadlines, discrepancies, and corrective actions with ownership and evidence attachment.

## Acceptance Criteria

- QA events and corrective actions recorded with evidence and resolution tracking; exportable QA reports for auditors.
