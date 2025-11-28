# Re-engagement Campaigns

> **Sub-Area**: [Waitlist & Recovery](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Re-engagement Campaigns enables practices to create targeted outreach campaigns for inactive patients. This function supports multi-channel campaign creation, audience segmentation, personalized messaging, and performance tracking to bring lapsed patients back into active treatment.

---

## Core Requirements

- [ ] Define inactive patient criteria (days since last visit)
- [ ] Create and schedule campaign workflows
- [ ] Support multi-channel outreach (email, SMS, mail)
- [ ] Build message templates with personalization
- [ ] Integrate special offers and incentives
- [ ] Track campaign performance metrics
- [ ] Segment by treatment stage
- [ ] Enable personalized messaging based on patient data
- [ ] A/B testing for message effectiveness
- [ ] Automated campaign execution on schedule

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/campaigns` | `booking:view_analytics` | List campaigns |
| GET | `/api/booking/campaigns/:id` | `booking:view_analytics` | Get campaign details |
| POST | `/api/booking/campaigns` | `booking:manage_reminders` | Create campaign |
| PUT | `/api/booking/campaigns/:id` | `booking:manage_reminders` | Update campaign |
| DELETE | `/api/booking/campaigns/:id` | `booking:manage_reminders` | Delete campaign |
| POST | `/api/booking/campaigns/:id/launch` | `booking:manage_reminders` | Launch campaign |
| POST | `/api/booking/campaigns/:id/pause` | `booking:manage_reminders` | Pause campaign |
| GET | `/api/booking/campaigns/:id/stats` | `booking:view_analytics` | Campaign statistics |
| GET | `/api/booking/campaigns/:id/recipients` | `booking:view_analytics` | List recipients |
| POST | `/api/booking/campaigns/:id/preview` | `booking:manage_reminders` | Preview with test data |

---

## Data Model

```prisma
model ReEngagementCampaign {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Campaign info
  name          String
  description   String?
  status        CampaignStatus @default(DRAFT)

  // Targeting criteria
  inactiveDays  Int      // Patients not seen in X days
  treatmentStages String[] // Filter by treatment stage
  includeNoShows Boolean @default(true)
  includeDropouts Boolean @default(true)
  excludeRecentContact Boolean @default(true)
  excludeContactDays Int @default(30)

  // Messages
  channels      NotificationChannel[]
  messageTemplates CampaignMessage[]

  // Schedule
  startDate     DateTime?
  endDate       DateTime?
  sendTimes     String[] // Times of day to send

  // Incentive
  hasIncentive  Boolean  @default(false)
  incentiveDetails String?
  incentiveCode String?

  // Stats
  targetCount   Int      @default(0)
  sentCount     Int      @default(0)
  responseCount Int      @default(0)
  rebookedCount Int      @default(0)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  launchedAt DateTime?
  completedAt DateTime?
  createdBy String  @db.ObjectId

  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  recipients   CampaignRecipient[]

  @@index([clinicId])
  @@index([status])
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

type CampaignMessage {
  channel      NotificationChannel
  subject      String?
  body         String
  sequence     Int      // Order in multi-touch campaign
  delayDays    Int      // Days after previous message
}

model CampaignRecipient {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  campaignId    String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Status
  status        RecipientStatus @default(PENDING)

  // Contact tracking
  lastContactedAt DateTime?
  contactAttempts Int      @default(0)

  // Response
  respondedAt   DateTime?
  response      RecipientResponse?
  rebookedAppointmentId String? @db.ObjectId

  campaign     ReEngagementCampaign @relation(fields: [campaignId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])

  @@index([campaignId])
  @@index([patientId])
  @@index([status])
}

enum RecipientStatus {
  PENDING
  CONTACTED
  RESPONDED
  REBOOKED
  UNSUBSCRIBED
  BOUNCED
}

enum RecipientResponse {
  INTERESTED
  NOT_INTERESTED
  REBOOKED
  NO_RESPONSE
}
```

---

## Business Rules

- Campaigns respect patient communication preferences (opt-outs)
- Minimum 30 days between campaigns targeting same patient
- Exclude patients contacted in last 30 days (configurable)
- Multi-touch sequences wait configured days between messages
- Campaign ends automatically when end date reached
- Incentive codes tracked for ROI calculation
- Only clinic_admin can launch campaigns
- Draft campaigns can be duplicated for templates

---

## Dependencies

**Depends On:**
- [At-Risk Patient Identification](./at-risk-patients.md) - Targeting criteria
- [Patient Communications](../../../../patient-communications/) - Message delivery
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md) - Rebooking

**Required By:**
- Marketing and retention analytics
- Practice growth reporting

---

## Notes

- Message templates should support merge fields (patient name, last visit date)
- Consider integration with marketing automation tools
- Track ROI: (revenue from rebooked patients) vs (campaign cost)
- Compliance: include unsubscribe links in all messages

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
