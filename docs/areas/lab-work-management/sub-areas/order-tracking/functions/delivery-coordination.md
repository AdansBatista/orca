# Delivery Coordination

> **Sub-Area**: [Order Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Delivery Coordination ensures lab items arrive before patient appointments. The system links orders to appointments, monitors delivery progress against appointment dates, suggests rescheduling when items are delayed, and notifies patients when their items arrive.

---

## Core Requirements

- [ ] Link orders to patient appointments
- [ ] Display appointment readiness status (items ready/pending)
- [ ] Suggest appointment rescheduling when orders delayed
- [ ] Notify patients when items arrive at clinic
- [ ] Pre-appointment checklist for required items
- [ ] Day-before verification of item availability
- [ ] Coordinate multi-item appointments
- [ ] Track items by operatory location

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/tracking/appointments/:date` | `lab:track` | Orders for appointments on date |
| GET | `/api/lab/tracking/appointment/:appointmentId` | `lab:track` | Check appointment readiness |
| POST | `/api/lab/tracking/notify-patient` | `lab:track` | Send arrival notification |
| GET | `/api/lab/tracking/patient/:patientId/pending` | `lab:track` | Patient's pending items |
| POST | `/api/lab/orders/:id/link-appointment` | `lab:create_order` | Link order to appointment |

---

## Data Model

```prisma
// Order to appointment linking on LabOrder model
model LabOrder {
  // ... other fields
  appointmentId String?  @db.ObjectId  // Linked appointment

  // Computed readiness status
  // READY - all items received
  // PENDING - items in transit
  // AT_RISK - may not arrive in time
  // MISSING - overdue items
}

// Notification tracking
model LabItemNotification {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  labOrderId    String   @db.ObjectId

  notificationType String  // ARRIVAL, READY_PICKUP
  sentAt        DateTime @default(now())
  sentVia       String   // SMS, EMAIL, PORTAL

  @@index([clinicId])
  @@index([patientId])
}
```

---

## Business Rules

- Items needed for appointment flagged on daily schedule
- At-risk appointments highlighted for front desk
- Patient notification sent within 24 hours of arrival
- Multiple items must all be ready for appointment
- Reschedule suggestions include available lab time

---

## Dependencies

**Depends On:**
- Lab Orders (order context)
- Shipment Tracking (delivery status)
- Booking & Scheduling (appointment data)
- Patient Communications (notifications)

**Required By:**
- Practice Orchestration (daily readiness)
- Patient Flow (appointment prep)

---

## Notes

- Consider automated rescheduling workflow
- Integrate with patient portal for self-service
- Support multi-location item transfers

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
