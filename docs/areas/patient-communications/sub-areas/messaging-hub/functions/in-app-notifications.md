# In-App Notifications

Purpose & Summary
Deliver notifications inside the patient portal and clinic staff UI.

API Endpoints
- `POST /api/v1/messaging/in-app` — create in-app notification
  - Request: { "userId":"uuid", "title":"string", "body":"string", "link":"/appointments/123" }
  - Response: { "notificationId":"uuid" }

DB / Data Fields
- Notification (id, userId, title, body, read=false, channel='in-app', createdAt)

Sample Payloads
- { "userId":"p1", "title":"Results ready", "body":"Your lab results are ready." }

UI Notes
- Bell icon with unread count; notification panel; deep links into portal

Acceptance Criteria
- Notifications appear in portal within 2s of API call
- Read/unread state persisted and synced

Integration Hooks
- Lab results release to create notification
- Billing payment receipt to create notification
