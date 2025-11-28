# Due Date Management

> **Sub-Area**: [Order Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Due Date Management monitors order due dates and proactively alerts staff to potential delays. The system calculates expected delivery based on lab turnaround, compares against needed-by dates, and escalates when orders are at risk of arriving late.

---

## Core Requirements

- [ ] Calculate expected delivery from order date and turnaround
- [ ] Track needed-by date from linked appointment
- [ ] Detect at-risk orders before they become late
- [ ] Send proactive alerts before due dates
- [ ] Escalate overdue orders to appropriate staff
- [ ] Support due date modifications with reason
- [ ] Integrate with calendar views
- [ ] Analyze historical turnaround accuracy

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/tracking/due-dates` | `lab:track` | Get due date overview |
| GET | `/api/lab/tracking/at-risk` | `lab:track` | Get at-risk orders |
| GET | `/api/lab/tracking/alerts` | `lab:track` | Get due date alerts |
| PUT | `/api/lab/tracking/alerts/:id/resolve` | `lab:track` | Resolve alert |
| PUT | `/api/lab/orders/:id/due-date` | `lab:create_order` | Modify due date |
| GET | `/api/lab/tracking/calendar` | `lab:track` | Calendar view of due dates |

---

## Data Model

```prisma
model OrderDueDateAlert {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId

  alertType     DueDateAlertType  // APPROACHING_DUE, DUE_TODAY, OVERDUE, etc.
  message       String
  severity      AlertSeverity  // INFO, WARNING, CRITICAL

  isRead        Boolean  @default(false)
  isResolved    Boolean  @default(false)
  readAt        DateTime?
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  action        String?  // Resolution action taken

  createdAt     DateTime @default(now())

  @@index([clinicId])
  @@index([labOrderId])
  @@index([isResolved])
}
```

---

## Business Rules

- Approaching due alerts sent 2 days before (configurable)
- At-risk calculated when shipping won't meet needed-by date
- Overdue alerts escalate to supervisor
- Alert resolution requires action documentation
- Late orders affect vendor performance metrics

---

## Dependencies

**Depends On:**
- Lab Orders (order dates and status)
- Shipment Tracking (delivery estimates)
- Lab Vendor Management (turnaround times)

**Required By:**
- Order Status Dashboard (alert indicators)
- Delivery Coordination (appointment risk)
- Performance Metrics (on-time calculations)

---

## Notes

- Consider AI-based delivery prediction
- Support configurable alert thresholds per practice
- Email/SMS notifications for critical alerts

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
