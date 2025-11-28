# Rush Order Management

> **Sub-Area**: [Lab Orders](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Rush Order Management handles expedited lab orders when patients need items faster than standard turnaround. The system tracks rush levels, calculates appropriate upcharges, documents rush reasons, and ensures labs are notified of priority status. Rush orders are highlighted throughout tracking for special attention.

---

## Core Requirements

- [ ] Flag orders as rush with selectable rush level
- [ ] Support multiple rush tiers (Emergency, Rush, Priority)
- [ ] Auto-calculate upcharge based on rush level and product
- [ ] Document reason for rush request
- [ ] Notify lab of rush status upon submission
- [ ] Highlight rush orders in tracking dashboard
- [ ] Track rush order history and costs
- [ ] Report on rush order frequency and spend

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| PUT | `/api/lab/orders/:id/rush` | `lab:create_order` | Set rush status and level |
| GET | `/api/lab/rush/upcharge/:productId/:rushLevel` | `lab:create_order` | Get upcharge calculation |
| GET | `/api/lab/orders/rush` | `lab:track` | List rush orders |
| GET | `/api/lab/reports/rush-orders` | `lab:manage_vendors` | Rush order report |

---

## Data Model

```prisma
// Fields on LabOrder model
model LabOrder {
  // ... other fields

  isRush        Boolean  @default(false)
  rushLevel     RushLevel?  // EMERGENCY, RUSH, PRIORITY
  rushReason    String?
  rushUpcharge  Decimal  @default(0)

  // ... other fields
}

enum RushLevel {
  EMERGENCY   // Same day / Next day
  RUSH        // 2-3 business days
  PRIORITY    // 3-5 business days
}
```

---

## Business Rules

- Rush upcharge calculated from vendor fee schedule
- Emergency orders may require phone confirmation with lab
- Rush reason required for all expedited orders
- Rush status cannot be changed after submission
- Upcharge automatically added to order total

---

## Dependencies

**Depends On:**
- Lab Order Creation (parent order context)
- Lab Vendor Management (rush upcharge rates)
- Pricing & Fee Schedules (upcharge calculations)

**Required By:**
- Order Tracking (rush orders highlighted)
- Billing & Insurance (rush charges billed)

---

## Notes

- Rush levels and upcharges may vary by lab vendor
- Consider automatic rush suggestion when due date is tight
- Alert staff when marking high-cost rush orders

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
