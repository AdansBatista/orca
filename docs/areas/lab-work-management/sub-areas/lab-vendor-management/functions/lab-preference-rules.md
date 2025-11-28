# Lab Preference Rules

> **Sub-Area**: [Lab Vendor Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Lab Preference Rules enable automatic vendor selection based on configurable criteria. Rules can route orders by product category, rush status, cost thresholds, or other conditions. This streamlines order creation by pre-selecting the appropriate lab.

---

## Core Requirements

- [ ] Define rules with conditions and actions
- [ ] Set default vendor by product category
- [ ] Route rush orders to specific labs
- [ ] Support cost-based routing (cheapest option)
- [ ] Configure rule priority for evaluation order
- [ ] Allow manual override of rule selection
- [ ] Test rules before activation
- [ ] Track rule usage statistics

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/preference-rules` | `lab:manage_vendors` | List preference rules |
| POST | `/api/lab/preference-rules` | `lab:manage_vendors` | Create rule |
| PUT | `/api/lab/preference-rules/:id` | `lab:manage_vendors` | Update rule |
| DELETE | `/api/lab/preference-rules/:id` | `lab:manage_vendors` | Delete rule |
| POST | `/api/lab/preference-rules/evaluate` | `lab:create_order` | Test rule evaluation |
| PUT | `/api/lab/preference-rules/reorder` | `lab:manage_vendors` | Reorder rule priority |

---

## Data Model

```prisma
model LabPreferenceRule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  name          String
  description   String?
  priority      Int      @default(0)  // Higher = evaluated first
  isActive      Boolean  @default(true)

  // Conditions stored as JSON for flexibility
  conditions    Json
  // Example: { "category": "RETAINER", "priority": "RUSH" }

  vendorId      String   @db.ObjectId  // Selected vendor

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([isActive])
  @@index([priority])
}
```

---

## Business Rules

- Rules evaluated in priority order (highest first)
- First matching rule determines vendor selection
- No match falls back to default vendor or manual selection
- Inactive rules skipped during evaluation
- Manual override always available during order creation

---

## Dependencies

**Depends On:**
- Lab Directory Management (vendor options)
- Lab Product Catalog (product categories)

**Required By:**
- Lab Order Creation (auto-selects vendor)

---

## Notes

- Common rules: retainers to Lab A, appliances to Lab B
- Consider geographic routing for multi-location practices
- Support complex conditions with AND/OR logic

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
