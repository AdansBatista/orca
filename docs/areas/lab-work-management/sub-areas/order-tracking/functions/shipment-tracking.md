# Shipment Tracking

> **Sub-Area**: [Order Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Shipment Tracking monitors packages in transit from labs to the clinic using carrier APIs (FedEx, UPS, USPS). The system captures tracking numbers, provides real-time status updates, estimates delivery dates, and alerts staff to shipping exceptions or delays.

---

## Core Requirements

- [ ] Capture tracking numbers from lab or manual entry
- [ ] Integrate with major carriers (FedEx, UPS, USPS)
- [ ] Display real-time shipment status
- [ ] Show estimated delivery date
- [ ] Record delivery confirmation
- [ ] Alert on shipping exceptions (delays, failed delivery)
- [ ] Maintain shipment event history
- [ ] Support multi-package orders

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/shipments` | `lab:track` | List shipments |
| GET | `/api/lab/shipments/:id` | `lab:track` | Get shipment details |
| POST | `/api/lab/shipments/:id/refresh` | `lab:track` | Refresh tracking status |
| POST | `/api/lab/orders/:id/shipment` | `lab:track` | Add shipment to order |
| POST | `/api/lab/orders/:id/mark-delivered` | `lab:track` | Mark as delivered |
| GET | `/api/lab/shipments/:id/events` | `lab:track` | Get tracking events |

---

## Data Model

```prisma
model LabShipment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  labOrderId    String   @db.ObjectId

  carrier       ShippingCarrier  // FEDEX, UPS, USPS, etc.
  trackingNumber String?
  trackingUrl   String?

  shippedDate   DateTime?
  estimatedDelivery DateTime?
  actualDelivery DateTime?

  status        ShipmentStatus @default(PENDING)
  lastUpdate    DateTime?

  deliveredTo   String?
  packageCount  Int      @default(1)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([labOrderId])
  @@index([trackingNumber])
}

model ShipmentEvent {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  shipmentId    String   @db.ObjectId

  status        String
  description   String
  location      String?
  timestamp     DateTime

  source        EventSource  // CARRIER_API, MANUAL, WEBHOOK

  @@index([shipmentId])
}
```

---

## Business Rules

- Tracking status refreshed hourly for in-transit shipments
- Delivery confirmation updates order status automatically
- Exception events trigger staff notifications
- Manual tracking entry for lab couriers
- Tracking URL generated for carrier websites

---

## Dependencies

**Depends On:**
- Lab Orders (order context)
- Lab Vendor Management (shipping preferences)
- External carrier APIs (FedEx, UPS, USPS)

**Required By:**
- Order Status Dashboard (shipment status display)
- Due Date Management (delivery estimates)
- Delivery Coordination (arrival notifications)

---

## Notes

- Consider webhook integration for real-time updates
- Cache carrier API responses to reduce calls
- Support signature confirmation display

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
