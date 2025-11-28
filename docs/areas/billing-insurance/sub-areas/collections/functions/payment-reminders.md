# Payment Reminders

> **Sub-Area**: [Collections Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Payment Reminders sends payment reminder communications to patients through multiple channels. This function delivers friendly to firm reminders based on aging stage, includes payment links for convenient payment, tracks reminder effectiveness, and respects patient communication preferences. It balances collection effectiveness with maintaining positive patient relationships.

---

## Core Requirements

- [ ] Multi-channel delivery (email, SMS, letter, phone task)
- [ ] Reminder templates by aging stage (friendly → firm → final)
- [ ] Include payment links in digital reminders
- [ ] Track delivery status and response rates
- [ ] Respect patient communication preferences
- [ ] Compliance with debt collection regulations
- [ ] Batch reminder sending
- [ ] Reminder history per account

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/collections/reminders` | `collections:read` | List sent reminders |
| GET | `/api/collections/reminders/pending` | `collections:read` | List pending reminders |
| POST | `/api/collections/reminders/send` | `collections:manage` | Send reminder |
| POST | `/api/collections/reminders/batch` | `collections:manage` | Batch send reminders |
| GET | `/api/collections/reminders/templates` | `collections:read` | List templates |
| POST | `/api/collections/reminders/templates` | `collections:manage` | Create template |
| GET | `/api/collections/reminders/effectiveness` | `collections:read` | Reminder effectiveness |

---

## Data Model

```prisma
model PaymentReminder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Reminder details
  reminderType  ReminderType
  templateId    String?  @db.ObjectId
  stage         Int?     // Collection stage number
  daysOverdue   Int

  // Delivery
  channel       CommunicationChannel
  sentTo        String   // Email, phone, or address
  sentAt        DateTime

  // Content
  subject       String?
  body          String?
  paymentLinkId String?  @db.ObjectId

  // Response tracking
  deliveryStatus DeliveryStatus @default(SENT)
  deliveredAt   DateTime?
  openedAt      DateTime?
  clickedAt     DateTime?

  // Outcome
  paymentReceived Boolean @default(false)
  paymentDate   DateTime?
  paymentAmount Decimal?
  paymentId     String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([accountId])
  @@index([patientId])
  @@index([sentAt])
  @@index([reminderType])
}

model ReminderTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template details
  name          String
  reminderType  ReminderType
  channel       CommunicationChannel

  // Content
  subject       String?  // For email
  body          String   // Supports variables: {{patient_name}}, {{balance}}, {{payment_link}}

  // Settings
  includePaymentLink Boolean @default(true)
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([reminderType])
  @@index([isActive])
}

enum ReminderType {
  UPCOMING_DUE     // Before due date
  PAST_DUE_GENTLE  // 1-30 days
  PAST_DUE_FIRM    // 31-60 days
  PAST_DUE_URGENT  // 61-90 days
  FINAL_NOTICE     // 90+ days
  PAYMENT_PLAN_DUE // Upcoming auto-payment
  PAYMENT_PLAN_LATE // Missed payment plan
}

enum CommunicationChannel {
  EMAIL
  SMS
  LETTER
  PHONE
  PORTAL
}

enum DeliveryStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  FAILED
  BOUNCED
  UNSUBSCRIBED
}
```

---

## Business Rules

- Respect patient "do not contact" preferences
- Maximum one reminder per channel per account per day
- Reminders only sent during business hours (configurable)
- SMS requires prior consent
- Payment links expire after reminder expires
- Track reminder-to-payment conversion rate
- Escalating tone as aging increases
- Stop reminders when account enters payment plan

---

## Dependencies

**Depends On:**
- Collection Workflows (reminder triggers)
- Patient Communications (delivery infrastructure)
- Card-Not-Present Transactions (payment links)

**Required By:**
- Collection Workflows (stage actions)
- Collection Analytics (effectiveness tracking)

---

## Notes

- Use merge fields for personalization
- A/B test subject lines and messaging
- Consider optimal send times (Tuesday 10 AM often best)
- Track unsubscribes for compliance
- Generate print queue for letter reminders

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
