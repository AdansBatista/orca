# Order Tracking

> **Sub-Area**: [Order Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Order Tracking provides visibility into purchase order status from submission through delivery. This function tracks order acknowledgment from vendors, shipping and delivery information, expected arrival dates, and status updates throughout the fulfillment process. Enables staff to monitor orders and plan for deliveries.

---

## Core Requirements

- [ ] Display order status through complete lifecycle
- [ ] Track vendor acknowledgment of orders
- [ ] Capture shipping information (carrier, tracking number)
- [ ] Integration with carrier tracking where available
- [ ] Record expected and actual delivery dates
- [ ] Alert on overdue orders
- [ ] Update status based on receiving activity
- [ ] Provide order history and timeline view
- [ ] Dashboard of pending and in-transit orders
- [ ] Notify staff of delivery expectations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/orders/:id/tracking` | `order:read` | Get order tracking |
| PUT | `/api/vendors/orders/:id/acknowledge` | `order:update` | Record vendor ack |
| PUT | `/api/vendors/orders/:id/shipping` | `order:update` | Update shipping info |
| PUT | `/api/vendors/orders/:id/status` | `order:update` | Update order status |
| GET | `/api/vendors/orders/pending` | `order:read` | Pending orders |
| GET | `/api/vendors/orders/in-transit` | `order:read` | In-transit orders |
| GET | `/api/vendors/orders/overdue` | `order:read` | Overdue orders |
| GET | `/api/vendors/orders/expected-today` | `order:read` | Expected today |

---

## Data Model

```prisma
// Tracking fields within PurchaseOrder
model PurchaseOrder {
  // ... other fields

  // Tracking
  status        PurchaseOrderStatus
  expectedDate  DateTime?

  // Vendor Response
  vendorAckDate DateTime?
  vendorAckNumber String?

  // Shipping
  shippingDate  DateTime?
  carrier       String?
  trackingNumber String?
  trackingUrl   String?

  // Delivery
  deliveredDate DateTime?
  signedBy      String?
}

// Optional detailed tracking log
model OrderTrackingEvent {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  purchaseOrderId String @db.ObjectId

  // Event
  eventType     OrderEventType
  eventDate     DateTime @default(now())
  description   String?

  // Details
  location      String?
  carrier       String?

  // Source
  source        String   // Manual, Carrier API, Vendor Portal

  @@index([purchaseOrderId])
  @@index([eventDate])
}

enum OrderEventType {
  SUBMITTED
  ACKNOWLEDGED
  PROCESSING
  SHIPPED
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  EXCEPTION
  CANCELLED
}
```

---

## Business Rules

- Orders without acknowledgment after 48 hours flagged for follow-up
- Expected date calculated from vendor lead time if not specified
- Orders past expected date marked OVERDUE
- Tracking integration where carrier API available
- Status auto-updates when receiving recorded
- PARTIALLY_RECEIVED when some items received
- RECEIVED when all items received
- COMPLETED when matched to invoice and paid
- Timeline shows all status changes with timestamps

---

## Dependencies

**Depends On:**
- Purchase Orders (order records)
- Email Service (delivery notifications)

**Required By:**
- Receiving (delivery information)
- Vendor Performance (delivery metrics)

---

## Notes

- Carrier integration: UPS, FedEx, USPS APIs
- Tracking URL links for manual tracking
- SMS notifications for delivery (optional)
- Expected delivery calendar view
- Daily delivery report email option
- Back-order visibility for partial shipments

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
