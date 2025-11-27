# Order Tracking

> **Area**: [Lab Work Management](../../)
>
> **Sub-Area**: 3.4.3 Order Tracking
>
> **Purpose**: Monitor lab order status, shipment tracking, due date management, and delivery coordination

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Lab Work Management](../../) |
| **Dependencies** | Auth, Lab Orders, Lab Vendor Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Order Tracking provides visibility into the status of all lab orders from submission through patient pickup. It monitors orders across multiple labs, tracks shipments, alerts staff to delays, coordinates delivery with patient appointments, and manages the inventory of items awaiting pickup.

Practices often have dozens of orders in progress at any time. This sub-area ensures nothing falls through the cracks by providing a centralized dashboard, proactive notifications, and integration with scheduling to coordinate deliveries with patient visits.

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.4.3.1 | [Order Status Dashboard](./functions/order-status-dashboard.md) | Central view of all orders | 📋 Planned | Critical |
| 3.4.3.2 | [Shipment Tracking](./functions/shipment-tracking.md) | Track packages in transit | 📋 Planned | High |
| 3.4.3.3 | [Due Date Management](./functions/due-date-management.md) | Monitor and alert on due dates | 📋 Planned | High |
| 3.4.3.4 | [Delivery Coordination](./functions/delivery-coordination.md) | Coordinate with appointments | 📋 Planned | High |
| 3.4.3.5 | [Patient Pickup Tracking](./functions/patient-pickup-tracking.md) | Track items awaiting pickup | 📋 Planned | Medium |
| 3.4.3.6 | [Reorder Reminders](./functions/reorder-reminders.md) | Automatic reorder suggestions | 📋 Planned | Low |

---

## Function Details

### 3.4.3.1 Order Status Dashboard

**Purpose**: Provide a centralized view of all lab orders with filtering and quick actions.

**Key Capabilities**:
- All orders in a single view
- Filter by status, lab, patient, product type
- Sort by due date, order date, patient name
- Quick status indicators (on track, at risk, late)
- Bulk actions (mark received, print labels)
- Search by order number or patient
- Export order list
- Saved filter presets

**Dashboard Views**:
| View | Description |
|------|-------------|
| **All Orders** | Complete order list with filters |
| **In Progress** | Orders at lab being fabricated |
| **Shipped** | Orders in transit |
| **Received** | Arrived, awaiting inspection |
| **Ready for Pickup** | Inspected, awaiting patient |
| **Late/At Risk** | Orders past due or delayed |

**Status Indicators**:
| Indicator | Meaning |
|-----------|---------|
| 🟢 **On Track** | Expected to arrive on time |
| 🟡 **At Risk** | May not arrive by needed date |
| 🔴 **Late** | Past due date |
| ⏸️ **On Hold** | Order paused |

**User Stories**:
- As a **clinical staff**, I want to see all orders in progress at a glance
- As a **front desk**, I want to quickly find orders for today's patients
- As a **office manager**, I want to see which orders are running late

---

### 3.4.3.2 Shipment Tracking

**Purpose**: Track packages in transit from labs to the clinic.

**Key Capabilities**:
- Automatic tracking number capture
- Carrier integration (FedEx, UPS, USPS)
- Real-time status updates
- Estimated delivery dates
- Delivery confirmation
- Exception alerts (delay, failed delivery)
- Tracking history
- Multi-package orders

**Supported Carriers**:
| Carrier | Features |
|---------|----------|
| **FedEx** | Real-time tracking, signature confirmation |
| **UPS** | Real-time tracking, delivery alerts |
| **USPS** | Tracking updates, delivery confirmation |
| **Lab Courier** | Manual status updates |
| **Other** | Manual tracking |

**Tracking Events**:
- Label created
- Picked up
- In transit
- Out for delivery
- Delivered
- Exception (delay, address issue)

**User Stories**:
- As a **clinical staff**, I want to see where a shipment is right now
- As a **front desk**, I want to be notified when a package is delivered
- As a **clinical staff**, I want to be alerted if a shipment is delayed

---

### 3.4.3.3 Due Date Management

**Purpose**: Monitor order due dates and proactively alert on potential delays.

**Key Capabilities**:
- Due date calculation from order date
- Needed-by date from appointment
- At-risk detection
- Proactive alerts before due date
- Escalation for late orders
- Due date modification
- Calendar integration
- Lab turnaround analysis

**Alert Types**:
| Alert | Timing | Action |
|-------|--------|--------|
| **Approaching Due** | 2 days before | Notification to staff |
| **Due Today** | Day of | Dashboard highlight |
| **Overdue** | 1+ days past | Escalation alert |
| **Appointment Risk** | Won't arrive in time | Contact lab/reschedule |

**User Stories**:
- As a **clinical staff**, I want to receive alerts when orders are at risk of being late
- As a **office manager**, I want to see all orders due this week
- As a **front desk**, I want to know if a patient's appliance won't be ready for their appointment

---

### 3.4.3.4 Delivery Coordination

**Purpose**: Coordinate lab deliveries with patient appointments.

**Key Capabilities**:
- Link orders to patient appointments
- Appointment readiness indicator
- Reschedule suggestions when orders delayed
- Patient notification when item arrives
- Checklist for patient visits (items ready?)
- Pre-appointment verification
- Multi-item coordination (all items for appointment)

**Coordination Workflow**:
1. Order created, linked to appointment
2. System monitors order progress vs appointment date
3. If at risk, alert staff to contact lab or reschedule
4. When delivered, mark appointment as "materials ready"
5. Day before: verify all items received
6. Appointment day: items available in operatory

**User Stories**:
- As a **front desk**, I want to know if all lab items are ready before a patient's appointment
- As a **clinical staff**, I want to be alerted if an appliance won't arrive in time
- As a **patient**, I want to be notified when my retainer arrives at the office

---

### 3.4.3.5 Patient Pickup Tracking

**Purpose**: Track lab items that have arrived and are awaiting patient pickup.

**Key Capabilities**:
- Inventory of items awaiting pickup
- Patient notification system
- Aging report (how long waiting)
- Pickup reminders
- Storage location tracking
- Pickup confirmation
- Unclaimed item workflow

**Pickup Workflow**:
1. Item arrives and passes inspection
2. Status changed to "Ready for Pickup"
3. Patient notified (text/email/portal)
4. Item stored in designated location
5. Patient arrives, item retrieved
6. Pickup confirmed in system

**Aging Thresholds**:
| Duration | Action |
|----------|--------|
| **0-7 days** | Normal, patient notified |
| **8-14 days** | Reminder sent |
| **15-30 days** | Second reminder, phone call |
| **30+ days** | Review with doctor, possible restock/discard |

**User Stories**:
- As a **front desk**, I want to see all items waiting for patient pickup
- As a **clinical staff**, I want to send a reminder to patients who haven't picked up their retainers
- As a **office manager**, I want to know how many unclaimed items we have

---

### 3.4.3.6 Reorder Reminders

**Purpose**: Automatically suggest reorders for replacement items.

**Key Capabilities**:
- Retainer replacement reminders
- Scheduled reorder programs
- Patient-specific reorder schedules
- Proactive outreach for reorders
- Treatment-based reorder suggestions
- Bulk reorder campaigns
- Reorder history

**Reorder Scenarios**:
| Item | Trigger | Timing |
|------|---------|--------|
| **Clear Retainers** | Time-based | Every 6-12 months |
| **Vivera Set** | Running low | When 1 retainer left |
| **Sport Guards** | Seasonal | Start of season |
| **Appliance Replacement** | Damage/Loss | On request |

**User Stories**:
- As a **treatment coordinator**, I want patients reminded to reorder retainers annually
- As a **front desk**, I want to see which patients are due for retainer replacement
- As a **clinic admin**, I want to set up automatic reorder reminders

---

## Data Model

```prisma
model LabShipment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId

  // Carrier info
  carrier       ShippingCarrier
  trackingNumber String?
  trackingUrl   String?

  // Dates
  shippedDate   DateTime?
  estimatedDelivery DateTime?
  actualDelivery DateTime?

  // Status
  status        ShipmentStatus @default(PENDING)
  lastUpdate    DateTime?

  // Delivery
  deliveredTo   String?          // Person who received
  signatureUrl  String?          // Signature image if captured

  // Package info
  packageCount  Int      @default(1)
  weight        Decimal?
  dimensions    String?

  // Events
  events        ShipmentEvent[]

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  labOrder      LabOrder @relation(fields: [labOrderId], references: [id])

  @@index([clinicId])
  @@index([labOrderId])
  @@index([trackingNumber])
  @@index([status])
}

enum ShippingCarrier {
  FEDEX
  UPS
  USPS
  DHL
  LAB_COURIER
  OTHER
}

enum ShipmentStatus {
  PENDING
  LABEL_CREATED
  PICKED_UP
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  EXCEPTION
  RETURNED
}

model ShipmentEvent {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  shipmentId    String   @db.ObjectId

  // Event info
  status        String           // Carrier-specific status
  description   String
  location      String?
  timestamp     DateTime

  // Source
  source        EventSource @default(CARRIER_API)

  // Relations
  shipment      LabShipment @relation(fields: [shipmentId], references: [id])

  @@index([shipmentId])
  @@index([timestamp])
}

enum EventSource {
  CARRIER_API
  MANUAL
  WEBHOOK
}

model PatientPickupItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  labOrderId    String   @db.ObjectId
  labOrderItemId String  @db.ObjectId

  // Item info
  itemDescription String
  productCategory LabProductCategory

  // Status
  status        PickupStatus @default(AWAITING_PICKUP)

  // Location
  storageLocation String?       // e.g., "Drawer 3", "Retainer Cabinet A"

  // Dates
  arrivedAt     DateTime
  notifiedAt    DateTime?
  pickedUpAt    DateTime?

  // Reminders
  remindersSent Int      @default(0)
  lastReminderAt DateTime?
  nextReminderAt DateTime?

  // Pickup
  pickedUpBy    String?          // Who picked it up
  verifiedBy    String?  @db.ObjectId  // Staff who verified

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
  @@index([arrivedAt])
}

enum PickupStatus {
  AWAITING_PICKUP
  NOTIFIED
  REMINDED
  PICKED_UP
  RETURNED_TO_LAB
  DISCARDED
}

model ReorderReminder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Product info
  productCategory LabProductCategory
  productName   String
  originalOrderId String? @db.ObjectId

  // Schedule
  reminderType  ReminderType
  scheduledFor  DateTime
  intervalMonths Int?             // For recurring

  // Status
  status        ReminderStatus @default(PENDING)
  sentAt        DateTime?
  respondedAt   DateTime?
  response      String?          // "ordered", "declined", "no_response"

  // Outcome
  resultingOrderId String? @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([scheduledFor])
  @@index([status])
}

enum ReminderType {
  TIME_BASED
  QUANTITY_BASED
  TREATMENT_MILESTONE
  MANUAL
}

enum ReminderStatus {
  PENDING
  SENT
  RESPONDED
  ORDERED
  DECLINED
  CANCELLED
}

model OrderDueDateAlert {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId

  // Alert info
  alertType     DueDateAlertType
  message       String
  severity      AlertSeverity

  // Status
  isRead        Boolean  @default(false)
  isResolved    Boolean  @default(false)
  readAt        DateTime?
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  // Action taken
  action        String?          // What was done to resolve

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([labOrderId])
  @@index([isResolved])
  @@index([createdAt])
}

enum DueDateAlertType {
  APPROACHING_DUE
  DUE_TODAY
  OVERDUE
  APPOINTMENT_AT_RISK
  SHIPMENT_DELAYED
}

enum AlertSeverity {
  INFO
  WARNING
  CRITICAL
}
```

---

## API Endpoints

### Dashboard

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/tracking/dashboard` | Get dashboard data | `lab:track` |
| GET | `/api/lab/tracking/orders` | List orders with tracking | `lab:track` |
| GET | `/api/lab/tracking/orders/:id` | Get order tracking details | `lab:track` |
| GET | `/api/lab/tracking/stats` | Get tracking statistics | `lab:track` |

### Shipments

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/shipments` | List shipments | `lab:track` |
| GET | `/api/lab/shipments/:id` | Get shipment details | `lab:track` |
| POST | `/api/lab/shipments/:id/refresh` | Refresh tracking | `lab:track` |
| POST | `/api/lab/orders/:id/mark-delivered` | Mark as delivered | `lab:track` |

### Due Dates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/tracking/due-dates` | Get due date overview | `lab:track` |
| GET | `/api/lab/tracking/at-risk` | Get at-risk orders | `lab:track` |
| GET | `/api/lab/tracking/alerts` | Get due date alerts | `lab:track` |
| PUT | `/api/lab/tracking/alerts/:id/resolve` | Resolve alert | `lab:track` |

### Delivery Coordination

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/tracking/appointments/:date` | Orders for date | `lab:track` |
| GET | `/api/lab/tracking/patient/:patientId/appointment/:appointmentId` | Check readiness | `lab:track` |
| POST | `/api/lab/tracking/notify-patient` | Notify patient of arrival | `lab:track` |

### Patient Pickup

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/pickup` | List awaiting pickup | `lab:track` |
| GET | `/api/lab/pickup/patient/:patientId` | Patient's pending items | `lab:track` |
| POST | `/api/lab/pickup/:id/confirm` | Confirm pickup | `lab:track` |
| POST | `/api/lab/pickup/:id/remind` | Send reminder | `lab:track` |

### Reorder Reminders

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/lab/reorder-reminders` | List reminders | `lab:track` |
| POST | `/api/lab/reorder-reminders` | Create reminder | `lab:create_order` |
| POST | `/api/lab/reorder-reminders/:id/send` | Send reminder | `lab:track` |
| PUT | `/api/lab/reorder-reminders/:id/respond` | Record response | `lab:track` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `OrderTrackingDashboard` | Main tracking view | `components/lab/` |
| `OrderStatusList` | Filterable order list | `components/lab/` |
| `OrderStatusCard` | Individual order summary | `components/lab/` |
| `ShipmentTracker` | Shipment status view | `components/lab/` |
| `TrackingTimeline` | Shipment event history | `components/lab/` |
| `DueDateCalendar` | Calendar of due dates | `components/lab/` |
| `AtRiskOrdersPanel` | At-risk/late orders | `components/lab/` |
| `AppointmentReadiness` | Check appointment items | `components/lab/` |
| `PickupInventory` | Items awaiting pickup | `components/lab/` |
| `PickupConfirmDialog` | Confirm patient pickup | `components/lab/` |
| `ReorderReminderList` | Manage reminders | `components/lab/` |
| `AlertsPanel` | Due date alerts | `components/lab/` |

---

## Business Rules

1. **Auto-Status Update**: Shipment status updates automatically from carrier APIs
2. **Alert Generation**: Alerts created automatically based on due dates
3. **Appointment Link**: Orders linked to appointments show on appointment readiness
4. **Pickup Reminders**: Automatic reminders sent at configurable intervals
5. **Reorder Eligibility**: Only completed orders eligible for reorder reminders
6. **Tracking Refresh**: Tracking refreshed hourly for in-transit shipments
7. **Pickup Aging**: Items over 90 days flagged for review

---

## Related Documentation

- [Parent: Lab Work Management](../../)
- [Lab Orders](../lab-orders/)
- [Lab Vendor Management](../lab-vendor-management/)
- [Quality & Remakes](../quality-remakes/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
