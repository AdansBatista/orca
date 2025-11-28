# Order Status Dashboard

> **Sub-Area**: [Order Tracking](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Order Status Dashboard provides a centralized view of all lab orders with filtering, sorting, and status indicators. Staff can quickly see which orders are on track, at risk, or late, and take appropriate action. The dashboard supports multiple views and saved filter presets.

---

## Core Requirements

- [ ] Display all orders in a single, filterable view
- [ ] Filter by status, lab, patient, product type, date range
- [ ] Sort by due date, order date, patient name, status
- [ ] Show visual status indicators (on track, at risk, late)
- [ ] Support bulk actions (mark received, print labels)
- [ ] Search by order number or patient name
- [ ] Export order list to CSV/Excel
- [ ] Save and recall filter presets

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/tracking/dashboard` | `lab:track` | Get dashboard data |
| GET | `/api/lab/tracking/orders` | `lab:track` | List orders with filters |
| GET | `/api/lab/tracking/orders/:id` | `lab:track` | Get order tracking details |
| GET | `/api/lab/tracking/stats` | `lab:track` | Get tracking statistics |
| POST | `/api/lab/tracking/presets` | `lab:track` | Save filter preset |
| GET | `/api/lab/tracking/export` | `lab:track` | Export order list |

---

## Data Model

```prisma
// Uses LabOrder model with computed status indicators

model OrderTrackingPreset {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  name          String
  filters       Json     // Saved filter configuration
  isDefault     Boolean  @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([userId])
}
```

---

## Business Rules

- Status indicators calculated from due date vs current progress
- At-risk threshold configurable (default: 2 days before due)
- Late orders highlighted and sorted to top
- Dashboard refreshes automatically (configurable interval)
- Filter presets are user-specific

---

## Dependencies

**Depends On:**
- Lab Orders (order data)
- Lab Vendor Management (vendor information)
- Shipment Tracking (shipping status)

**Required By:**
- Practice Orchestration (daily operations view)
- Due Date Management (alert integration)

---

## Notes

- Consider Kanban-style board view option
- Support date range quick-select (today, this week, this month)
- Show order count badges per status

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
