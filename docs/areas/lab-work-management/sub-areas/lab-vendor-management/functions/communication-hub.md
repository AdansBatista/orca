# Communication Hub

> **Sub-Area**: [Lab Vendor Management](../) | **Status**: 📋 Planned | **Priority**: Low

---

## Overview

Communication Hub centralizes messaging with lab vendors about orders, questions, and feedback. Messages can be linked to specific orders and maintain threaded conversation history. This provides a documented communication trail and reduces reliance on phone calls and external email.

---

## Core Requirements

- [ ] Send messages to lab contacts from within system
- [ ] Thread messages by order or topic
- [ ] Attach files to messages
- [ ] Track read status and responses
- [ ] Maintain full message history
- [ ] Use template responses for common messages
- [ ] Support notification preferences
- [ ] Search message history

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/messages` | `lab:track` | List messages |
| GET | `/api/lab/messages/order/:orderId` | `lab:track` | Messages for order |
| POST | `/api/lab/messages` | `lab:create_order` | Send message |
| PUT | `/api/lab/messages/:id/read` | `lab:track` | Mark as read |
| GET | `/api/lab/messages/unread` | `lab:track` | Unread messages |
| GET | `/api/lab/messages/thread/:threadId` | `lab:track` | Get thread |

---

## Data Model

```prisma
model LabMessage {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId
  orderId       String?  @db.ObjectId

  threadId      String?
  direction     MessageDirection  // OUTBOUND, INBOUND
  subject       String?
  body          String

  attachments   Json?    // Array of attachment references

  isRead        Boolean  @default(false)
  readAt        DateTime?

  createdAt     DateTime @default(now())
  sentBy        String?  @db.ObjectId

  @@index([clinicId])
  @@index([vendorId])
  @@index([orderId])
  @@index([threadId])
}
```

---

## Business Rules

- Messages linked to orders appear on order detail view
- Unread inbound messages highlighted in dashboard
- Attachment files stored securely
- Message history preserved indefinitely
- Template messages speed common communications

---

## Dependencies

**Depends On:**
- Lab Directory Management (vendor contacts)
- Lab Order Creation (order context)

**Required By:**
- Order Tracking (communication on delays)
- Quality & Remakes (remake discussions)
- Lab Feedback System (feedback delivery)

---

## Notes

- Consider lab portal integration for two-way sync
- Support email notifications for new messages
- Track response time metrics for labs

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
