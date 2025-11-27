# Patient Communications — Data Models

ER Diagram (High Level)

- Patient (1) --- (N) Message
- Patient (1) --- (N) NotificationPreference
- Campaign (1) --- (N) Message
- Template (1) --- (N) Campaign

Key Models

Message
- id: UUID
- patientId: UUID
- channel: enum [sms,email,in-app]
- status: enum [queued,sent,delivered,failed]
- content: text (resolved template)
- templateId: UUID (nullable)
- providerMessageId: string (from vendor)
- sentAt: datetime
- deliveredAt: datetime
- createdAt, updatedAt

Campaign
- id: UUID
- name: string
- trigger: json (event definition)
- schedule: cron/rrule
- templateId: UUID
- status: enum [draft,active,paused,archived]
- createdAt, updatedAt

Template
- id: UUID
- channel: enum
- name: string
- content: string (mustache/handlebars/variable schema)
- variables: json-schema
- version: int
- createdBy, createdAt

NotificationPreference
- id: UUID
- patientId: UUID
- channel: enum
- optIn: boolean
- frequency: enum [immediate,daily,summary]
- allowedFrom, allowedTo: time-range

PatientPortalAccount
- id: UUID
- patientId: UUID
- email: string
- passwordHash: string
- lastLogin: datetime
- settings: json

Notes
- All models must include tenantId for multi-tenant deployments.
- Store templates with variable schemas and expose a preview API.
