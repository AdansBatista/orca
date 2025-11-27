# Feedback & Survey Campaigns

Purpose & Summary
Create and send feedback or survey requests, collect responses, and run sentiment analysis.

API Endpoints
- `POST /api/v1/campaigns/survey` — create survey campaign
  - Request: { "name":"post-visit survey","questions":[{"type":"likert","text":"How was your visit?"}], "templateId":"uuid" }

DB / Data Fields
- Survey (id, name, questions, templateId, status)
- SurveyResponse (id, surveyId, patientId, answers, submittedAt)

Sample Payloads
- Submit response: { "surveyId":"s1","patientId":"p1","answers":{ "q1":5 } }

UI Notes
- Survey designer and response dashboard with export and sentiment summaries

Acceptance Criteria
- Responses stored and exportable; basic sentiment analysis run and results surfaced
- Opt-out respected for repeated survey requests

Integration Hooks
- Messaging Hub to send survey invites
- Analytics to aggregate responses and run sentiment models
