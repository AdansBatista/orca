# Delivery Tracking

> **Sub-Area**: [Vendor Performance](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Delivery Tracking analyzes vendor delivery performance including on-time rates, lead times, accuracy, and back-order frequency. This function calculates delivery metrics from order and receiving data, identifies delivery patterns and issues, and provides insights for vendor evaluation and ordering decisions. Helps practices plan for supply needs and hold vendors accountable.

---

## Core Requirements

- [ ] Calculate on-time delivery rates by vendor
- [ ] Track average lead times (order to receipt)
- [ ] Monitor lead time consistency and variance
- [ ] Track back-order frequency and duration
- [ ] Measure complete shipment rates
- [ ] Analyze delivery accuracy (correct location, time)
- [ ] Identify seasonal delivery patterns
- [ ] Compare delivery performance across vendors
- [ ] Alert on delivery performance degradation
- [ ] Generate delivery performance reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/:id/delivery` | `performance:read` | Get delivery metrics |
| GET | `/api/vendors/:id/delivery/trends` | `performance:read` | Delivery trends |
| GET | `/api/vendors/:id/delivery/lead-times` | `performance:read` | Lead time analysis |
| GET | `/api/vendors/delivery/comparison` | `performance:view_all` | Compare vendors |
| GET | `/api/vendors/delivery/backorders` | `performance:read` | Current back-orders |
| GET | `/api/vendors/delivery/late` | `performance:read` | Late orders |

---

## Data Model

```prisma
// Delivery metrics within VendorMetric
model VendorMetric {
  // Delivery Metrics
  onTimeDeliveries Int   @default(0)
  lateDeliveries Int     @default(0)
  avgLeadTimeDays Decimal?
  onTimeRate    Decimal?

  // Additional delivery fields
  backOrders    Int      @default(0)
  completeShipments Int  @default(0)
  partialShipments Int   @default(0)
}

// Optional: Detailed delivery event tracking
model DeliveryEvent {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  purchaseOrderId String @db.ObjectId
  vendorId      String   @db.ObjectId

  // Dates
  orderDate     DateTime
  expectedDate  DateTime?
  actualDate    DateTime?
  leadTimeDays  Decimal?

  // Status
  isOnTime      Boolean
  isComplete    Boolean
  isBackOrdered Boolean

  // Details
  daysLate      Int?
  backOrderReason String?

  @@index([vendorId])
  @@index([orderDate])
}
```

---

## Business Rules

- On-Time Rate: (On-time deliveries / Total deliveries) × 100
- Lead Time: Days from order submission to receipt completion
- On-time defined as delivered on or before expected date
- Expected date from vendor confirmation or standard lead time
- Target on-time rate: > 95%
- Back-order rate should be < 5%
- Lead time variance indicates reliability
- Rush order performance tracked separately
- Seasonal adjustments for holiday periods
- Carrier performance contributes to delivery metrics

---

## Dependencies

**Depends On:**
- Order Management (order dates, expected dates)
- Order Tracking (shipment status)
- Receiving (actual receipt dates)
- Performance Metrics (delivery calculations)

**Required By:**
- Vendor Ratings (delivery score component)
- Contract Management (SLA compliance)

---

## Notes

- Day-of-week delivery patterns useful for planning
- Rush order success rate for urgent need reliability
- Carrier-specific performance tracking
- Weather/disruption impact analysis
- Lead time by product category
- Predictive lead time based on historical data

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
