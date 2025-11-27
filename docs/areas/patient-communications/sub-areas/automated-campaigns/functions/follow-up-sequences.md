# Follow-Up Sequences

Purpose & Summary
Create post-visit follow-up sequences (e.g., 24-hour check, 1-week follow-up) that can include multiple messages across channels.

API Endpoints
- `POST /api/v1/campaigns/follow-up` — create follow-up campaign
  - Request: { "name":"string","steps":[{"delayMinutes":1440,"templateId":"uuid","channel":"sms"}] }

DB / Data Fields
- FollowUpCampaign (id, name, steps, audience, status)
- CampaignRun (id, campaignId, startedAt, status)

Sample Payloads
- Create follow-up request example above

UI Notes
- Campaign builder with timeline view, step editor, and audience preview

Acceptance Criteria
- Steps trigger at configured delays and handle failures per step
- Reporting shows per-step delivery and engagement metrics

Integration Hooks
- Messaging Hub for sends
- Booking/Treatment to seed audience after appointment/procedure
