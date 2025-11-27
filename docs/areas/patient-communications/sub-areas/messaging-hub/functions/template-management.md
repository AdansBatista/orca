# Template Management

Purpose & Summary
Manage versioned templates for SMS, Email, and In-App messages. Provide validation against variable schemas and preview rendering.

API Endpoints
- `POST /api/v1/messaging/templates` — create template
  - Request: { "channel":"sms|email|in-app", "name":"string", "content":"string", "variablesSchema":{} }
  - Response: { "templateId":"uuid", "version":1 }
- `GET /api/v1/messaging/templates/{id}/preview?variables={}` — render preview

DB / Data Fields
- Template (id, channel, name, content, variablesSchema, version, createdBy, createdAt)

Sample Payloads
- Create request: { "channel":"sms", "name":"appt-reminder", "content":"Hi {{firstName}}...", "variablesSchema":{...} }

UI Notes
- Template editor with variable autocomplete, preview pane, version history and rollback

Acceptance Criteria
- Templates validated against provided JSON Schema
- Preview renders variables; version increments on save
- Deleting a template requires admin confirmation and archival

Integration Hooks
- Campaign engine validates templates before activation
- Messaging Hub resolves templates at send-time using provided variables
