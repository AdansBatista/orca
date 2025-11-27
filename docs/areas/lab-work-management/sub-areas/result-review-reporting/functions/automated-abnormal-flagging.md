# automated-abnormal-flagging

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Automate detection of abnormal or critical observations using configurable rules and ML models to prioritize clinician review and trigger urgent notifications.

## Summary

Combine deterministic rule engine (reference ranges, flag indicators) with ML models trained on historical lab outcomes to score urgency. Provide explainability fields (why flagged) and allow clinicians to tune sensitivity per test or clinic policy.

## API

- POST `/api/lab/flagging/score` — input: observation(s); output: `{ score: 0-1, reason: "string", ruleHits: [...] }`

## Data Fields

- Flag: `id`, `labResultId`, `observationId`, `score`, `reason`, `ruleMatches`, `createdAt`, `status` (new|acknowledged|resolved)

## UI Notes

- Flag dashboard with queue for clinicians, filters by severity and patient risk. Allow ack/resolve and provide one-click escalate to urgent contact.

## Acceptance Criteria

- Flags generated within acceptable latency (seconds) and appear in clinician inbox. False-positive rate below configured threshold in pilot data.
