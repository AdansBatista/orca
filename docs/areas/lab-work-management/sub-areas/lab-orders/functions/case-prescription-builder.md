# Case Prescription Builder

> **Sub-Area**: [Lab Orders](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Case Prescription Builder provides product-specific configuration forms for orthodontic appliances and retainers. Each product type has unique specification fields (wire types, expansion settings, acrylic colors, tooth selections) that must be captured accurately for lab fabrication.

---

## Core Requirements

- [ ] Product-specific prescription forms with relevant fields
- [ ] Wire type and size selection for applicable products
- [ ] Expansion parameters for expanders (RPE, quad helix)
- [ ] Acrylic color and design options for retainers
- [ ] Visual tooth selection diagrams for appliances
- [ ] Band size specifications for banded appliances
- [ ] Special instructions free-text field
- [ ] Prescription validation before submission

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/products/:productId/prescription-schema` | `lab:create_order` | Get prescription form schema |
| POST | `/api/lab/orders/:orderId/items` | `lab:create_order` | Add item with prescription |
| PUT | `/api/lab/orders/:orderId/items/:itemId` | `lab:create_order` | Update item prescription |
| GET | `/api/lab/prescription-options` | `lab:create_order` | Get dropdown options (wires, colors) |

---

## Data Model

```prisma
model LabOrderItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  labOrderId    String   @db.ObjectId

  productId     String   @db.ObjectId
  productName   String
  category      LabProductCategory
  quantity      Int      @default(1)

  // Product-specific configuration stored as JSON
  prescription  Json

  arch          Arch?    // UPPER, LOWER, BOTH
  toothNumbers  String[]

  unitPrice     Decimal
  totalPrice    Decimal

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([labOrderId])
}
```

---

## Business Rules

- Prescription schema defined per product type
- Required fields must be completed before submission
- Tooth numbers validated against valid range (1-32)
- Wire specifications must match product compatibility
- Expansion amounts validated against safe ranges

---

## Dependencies

**Depends On:**
- Lab Order Creation (parent order context)
- Lab Vendor Management (product catalog and schemas)

**Required By:**
- Lab Order Creation (items added to order)
- Digital File Attachment (files for specific items)

---

## Notes

- Store prescription schemas as JSON for flexibility
- Support visual tooth chart component for selection
- Consider autocomplete for frequently used configurations

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
