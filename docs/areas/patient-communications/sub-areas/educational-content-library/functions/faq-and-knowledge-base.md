# FAQ & Knowledge Base

Purpose & Summary
Provide searchable FAQ and knowledge base for common patient questions and clinic policies.

API Endpoints
- `GET /api/v1/faq?query=` — search FAQ
- `POST /api/v1/faq` — create FAQ entry (admin)

DB / Data Fields
- FAQEntry (id, question, answer, tags, createdBy, updatedAt)

Sample Payloads
- Search response: [ { "id":"f1","question":"How do I reschedule?","answer":"..." } ]

UI Notes
- Search box with suggested articles and related content; content linking to portal actions

Acceptance Criteria
- Search returns relevant results and supports ranking by clicks
- Admin can create/edit entries and track metrics

Integration Hooks
- Messaging Hub can include FAQ links in messages
- Portal for inline help and support flow
