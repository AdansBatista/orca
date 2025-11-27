# Content Personalization

Purpose & Summary
Personalize content recommendations and delivery based on patient profile, treatment phase, and engagement history.

API Endpoints
- `POST /api/v1/content/personalize` — get recommended content for patient
  - Request: { "patientId":"uuid","context":{"treatmentPhase":"alignment"} }
  - Response: { "recommendations":[{"contentId":"c1","score":0.92}] }

DB / Data Fields
- PersonalizationProfile (id, patientId, preferences, signals)

Sample Payloads
- Request example above; Response contains scored recommendations

UI Notes
- Portal home card for recommended articles and videos; admin controls to tune models

Acceptance Criteria
- Recommendations relevant to patient context and tunable via admin controls
- Respect opt-outs and content age gating

Integration Hooks
- AI services for scoring and model training
- Campaign engine to seed personalized drips
