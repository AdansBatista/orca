# Messaging Hub

> **Sub-Area**: Messaging Hub
>
> **Area**: Patient Communications (2.4)
>
> **Purpose**: Unified multi-channel messaging center for SMS, email, and in-app notifications with templates, delivery tracking, and message history

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | High |
| **Functions** | 6 |

---

## Overview

The Messaging Hub provides a centralized platform for all patient communications across multiple channels. It handles message composition, template management, delivery routing, status tracking, and maintains a complete audit trail of all communications.

### Key Capabilities

- Multi-channel delivery (SMS, email, in-app notifications)
- Template library with variable substitution
- Delivery tracking with webhook status updates
- Unified inbox for staff
- Two-way messaging support
- Message scheduling and queuing

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [SMS Delivery](./functions/sms-delivery.md) | Send and track SMS messages | Critical |
| 2 | [Email Delivery](./functions/email-delivery.md) | Send and track email messages | Critical |
| 3 | [In-App Notifications](./functions/in-app-notifications.md) | Send internal/push notifications | High |
| 4 | [Message Routing & Delivery](./functions/message-routing-delivery.md) | Route messages to providers and handle webhooks | Critical |
| 5 | [Message History & Logging](./functions/message-history-logging.md) | Persistent history and audit trail | High |
| 6 | [Template Management](./functions/template-management.md) | Manage templates and versions | High |

---

## Function Details

### SMS Delivery

Send SMS messages to patients via Twilio or other providers.

**Key Features:**
- Twilio integration with delivery receipts
- Two-way SMS with inbound handling
- Short code and long code support
- Link shortening and click tracking
- Message segmentation handling
- Opt-out/STOP word processing

---

### Email Delivery

Send transactional and marketing emails via SendGrid or other providers.

**Key Features:**
- SendGrid integration with event tracking
- HTML and plain text templates
- Attachment support
- Click and open tracking
- Bounce and complaint handling
- Unsubscribe management

---

### In-App Notifications

Send notifications within the patient portal and mobile app.

**Key Features:**
- Push notification delivery (Firebase/APNS)
- In-app notification center
- Badge count management
- Notification preferences
- Rich notifications with actions
- Deep linking support

---

### Message Routing & Delivery

Central routing engine for all message delivery.

**Key Features:**
- Channel preference routing
- Fallback delivery (email → SMS)
- Delivery scheduling and queuing
- Rate limiting and throttling
- Provider failover
- Batch message processing

---

### Message History & Logging

Complete audit trail of all communications.

**Key Features:**
- Full message history per patient
- Delivery status tracking
- Staff access logging
- Search and filter capabilities
- Export for compliance
- Retention policy enforcement

---

### Template Management

Create and manage reusable message templates.

**Key Features:**
- Template editor with preview
- Variable substitution ({{patient.firstName}})
- Multi-channel templates (SMS + email)
- Version control and history
- Template categories and tags
- A/B variant support

---

## Data Model

### Prisma Schema

```prisma
model Message {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  patientId       String            @db.ObjectId

  // Message content
  channel         MessageChannel    // SMS, EMAIL, PUSH, IN_APP
  subject         String?           // For email
  body            String
  htmlBody        String?           // For email

  // Routing
  direction       MessageDirection  // OUTBOUND, INBOUND
  templateId      String?           @db.ObjectId

  // Delivery
  status          MessageStatus     // PENDING, SENT, DELIVERED, FAILED, BOUNCED
  scheduledAt     DateTime?
  sentAt          DateTime?
  deliveredAt     DateTime?

  // Metadata
  metadata        Json?
  tags            String[]

  // Audit
  createdBy       String            @db.ObjectId
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  patient         Patient           @relation(fields: [patientId], references: [id])
  template        MessageTemplate?  @relation(fields: [templateId], references: [id])
  deliveries      MessageDelivery[]

  @@index([clinicId, patientId])
  @@index([clinicId, status])
  @@index([clinicId, createdAt])
}

model MessageDelivery {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  messageId       String            @db.ObjectId

  // Provider details
  provider        String            // twilio, sendgrid, firebase
  providerMessageId String?

  // Delivery status
  status          DeliveryStatus    // PENDING, SENT, DELIVERED, FAILED, BOUNCED, CLICKED, OPENED
  statusDetails   String?

  // Tracking
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  bouncedAt       DateTime?

  // Webhook data
  webhookData     Json?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  message         Message           @relation(fields: [messageId], references: [id])

  @@index([messageId])
  @@index([providerMessageId])
}

model MessageTemplate {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId

  name            String
  description     String?
  category        String            // appointment, billing, treatment, marketing

  // Content by channel
  smsBody         String?
  emailSubject    String?
  emailBody       String?
  emailHtmlBody   String?
  pushTitle       String?
  pushBody        String?

  // Variables
  variables       String[]          // Available variables for substitution

  // Status
  isActive        Boolean           @default(true)
  version         Int               @default(1)

  createdBy       String            @db.ObjectId
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  messages        Message[]

  @@unique([clinicId, name])
  @@index([clinicId, category])
}

enum MessageChannel {
  SMS
  EMAIL
  PUSH
  IN_APP
}

enum MessageDirection {
  OUTBOUND
  INBOUND
}

enum MessageStatus {
  DRAFT
  PENDING
  SCHEDULED
  SENT
  DELIVERED
  FAILED
  BOUNCED
  CANCELLED
}

enum DeliveryStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
  OPENED
  CLICKED
  UNSUBSCRIBED
  COMPLAINED
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/messages` | Send a message |
| GET | `/api/v1/messages` | List messages (paginated) |
| GET | `/api/v1/messages/:id` | Get message details |
| GET | `/api/v1/messages/patient/:patientId` | Get patient message history |
| POST | `/api/v1/messages/bulk` | Send bulk messages |
| POST | `/api/v1/messages/webhook/:provider` | Handle provider webhooks |
| GET | `/api/v1/templates` | List message templates |
| POST | `/api/v1/templates` | Create template |
| PUT | `/api/v1/templates/:id` | Update template |
| DELETE | `/api/v1/templates/:id` | Delete template |
| POST | `/api/v1/templates/:id/preview` | Preview template with data |

---

## UI Components

| Component | Description |
|-----------|-------------|
| `MessageComposer` | Compose and send messages |
| `MessageInbox` | Unified inbox for all channels |
| `ConversationThread` | View message conversation with patient |
| `TemplateEditor` | Create/edit message templates |
| `TemplateSelector` | Select template for message |
| `DeliveryStatusBadge` | Show delivery status |
| `MessageHistoryList` | List message history |

---

## Business Rules

1. **Channel Preferences**: Respect patient communication preferences
2. **Opt-Out**: Honor opt-out requests immediately
3. **Quiet Hours**: No SMS between 9 PM and 8 AM local time (configurable)
4. **Rate Limits**: Max 10 messages per patient per day
5. **Required Consent**: Marketing messages require explicit consent
6. **PHI Protection**: PHI in messages must be minimized

---

## External Integrations

| Provider | Purpose | Documentation |
|----------|---------|---------------|
| Twilio | SMS delivery | twilio.com/docs |
| SendGrid | Email delivery | sendgrid.com/docs |
| Firebase | Push notifications | firebase.google.com/docs/cloud-messaging |

---

## Dependencies

- **CRM & Onboarding**: Patient contact information
- **Patient Portal**: For in-app notifications
- **Authentication**: For staff sender identification

---

## Related Documentation

- [Patient Communications Overview](../../README.md)
- [Automated Campaigns](../automated-campaigns/)
- [Patient Portal](../patient-portal/)
