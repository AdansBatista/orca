# Campaign Creation & Scheduling

Purpose & Summary
Create campaigns, schedule runs, manage versions, and preview recipients.

API Endpoints
- `POST /api/v1/campaigns` — create campaign
  - Request: { "name":"string", "trigger":{}, "schedule":{}, "templateId":"uuid" }
  - Response: { "campaignId":"uuid", "status":"draft" }
- `POST /api/v1/campaigns/{id}/activate` — activate campaign

DB / Data Fields
- Campaign (id, name, trigger, schedule, templateId, status, createdBy)

Sample Payloads
- Create request example above

UI Notes
- Campaign builder with trigger editor, audience preview, schedule cron/rrule UI, and analytics

Acceptance Criteria
- Campaign validates template variables and audience preview
- Activation schedules jobs and produces initial run summary

Integration Hooks
- Messaging Hub for message sends
- CRM for audience selection and segmentation
