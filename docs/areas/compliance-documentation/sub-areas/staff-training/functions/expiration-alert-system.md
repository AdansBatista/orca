# Expiration Alert System

> **Sub-Area**: [Staff Training](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

The Expiration Alert System proactively notifies staff and administrators about upcoming certification and training expirations. It provides configurable alert thresholds at 90, 60, 30, and 14 days before expiration, supports multiple notification channels, implements escalation paths for non-response, and helps prevent compliance gaps from lapsed credentials.

---

## Core Requirements

- [ ] Configure alert thresholds by certification type (30/60/90 days)
- [ ] Deliver notifications via email, SMS, and in-app alerts
- [ ] Implement escalation paths when initial alerts are not acknowledged
- [ ] Display dashboard view of all upcoming expirations
- [ ] Generate bulk expiration reports by period
- [ ] Integrate with calendar for renewal date reminders
- [ ] Auto-assign training programs when certifications expire
- [ ] Track alert acknowledgment and response

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/certifications/expiring` | `training:view_all` | Get expiring certifications |
| GET | `/api/compliance/certifications/expiring/my` | `training:view_own` | Get my expiring certifications |
| GET | `/api/compliance/training/overdue` | `training:view_all` | Get overdue training |
| POST | `/api/compliance/alerts/:id/acknowledge` | `training:view_own` | Acknowledge alert |
| PUT | `/api/compliance/alerts/settings` | `training:manage` | Configure alert settings |
| GET | `/api/compliance/alerts/settings` | `training:manage` | Get alert settings |
| GET | `/api/compliance/expiration-dashboard` | `training:view_all` | Get expiration dashboard |
| POST | `/api/compliance/alerts/send-reminders` | `training:manage` | Trigger manual reminders |

---

## Data Model

```prisma
model CertificationAlert {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  certificationId String   @db.ObjectId

  // Alert info
  alertType       AlertType
  alertDate       DateTime
  daysUntilExpiry Int

  // Delivery
  sentVia         String[]  // ["email", "sms", "in_app"]
  sentAt          DateTime?
  deliveryStatus  Json?     // Status per channel

  // Acknowledgment
  acknowledged    Boolean   @default(false)
  acknowledgedAt  DateTime?

  // Escalation
  escalated       Boolean   @default(false)
  escalatedTo     String?   @db.ObjectId
  escalatedAt     DateTime?

  // Relations
  certification Certification @relation(fields: [certificationId], references: [id])

  @@index([certificationId])
  @@index([alertDate])
  @@index([alertType])
}

model AlertConfiguration {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Thresholds
  earlyWarningDays   Int @default(90)
  standardAlertDays  Int @default(60)
  urgentAlertDays    Int @default(30)
  criticalAlertDays  Int @default(14)

  // Channels
  emailEnabled       Boolean @default(true)
  smsEnabled         Boolean @default(false)
  inAppEnabled       Boolean @default(true)

  // Escalation settings
  escalationEnabled  Boolean @default(true)
  escalateAfterDays  Int @default(7)  // Days without acknowledgment
  escalateToRole     String? // Role to escalate to

  // Auto-actions
  autoAssignTraining Boolean @default(true)
  autoRestrictOnExpiry Boolean @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@unique([clinicId])
}

enum AlertType {
  EARLY_WARNING    // 90 days
  STANDARD         // 60 days
  URGENT           // 30 days
  CRITICAL         // 14 days
  EXPIRED          // Overdue
}
```

---

## Business Rules

- Alert schedule and recipients:
  - 90 days (Early): Staff member only
  - 60 days (Standard): Staff member only
  - 30 days (Urgent): Staff member + supervisor
  - 14 days (Critical): Staff member + supervisor + admin
  - Expired: Staff member + supervisor + admin + compliance
- Escalation triggers:
  - 30 days: Training assignment triggered
  - 14 days: Supervisor notification
  - Expired: Potential work restriction
  - 30 days overdue: HR notification
- Alert acknowledgment resets escalation timer
- Critical certifications (licenses) have stricter escalation
- SMS alerts only for urgent/critical thresholds (configurable)

---

## Dependencies

**Depends On:**
- Certification Management (certification expiration dates)
- Training Program Administration (training due dates)
- Patient Communications (notification delivery)
- Staff Management (escalation hierarchy)

**Required By:**
- Training Compliance Reporting (alert metrics)
- Audit Management (compliance gap tracking)

---

## Notes

- Dashboard should show: expiring this week, this month, this quarter
- Consider calendar feed export for integration with external calendars
- Group alerts by staff member to avoid notification fatigue
- Track alert effectiveness: time from alert to renewal completion
- Quiet hours: don't send SMS during off-hours unless critical

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
