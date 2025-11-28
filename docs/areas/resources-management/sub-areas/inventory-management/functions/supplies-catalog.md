# Supplies Catalog

> **Sub-Area**: [Inventory Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Supplies Catalog maintains a comprehensive catalog of all orthodontic supplies and consumables used in the practice. This includes brackets (metal, ceramic, self-ligating), wires (NiTi, stainless steel, TMA), elastics (power chains, ligatures), bonding materials, impression supplies, and clinical consumables. The catalog stores product specifications, supplier information, pricing, and supports categorization specific to orthodontic workflows.

---

## Core Requirements

- [ ] Register items with unique SKU per clinic
- [ ] Categorize items by orthodontic-specific categories
- [ ] Store complete product specifications (size, color, material)
- [ ] Link items to preferred suppliers with supplier SKUs
- [ ] Track alternative suppliers per item
- [ ] Record pricing (unit cost, average cost, last cost)
- [ ] Define unit of measure and package quantities
- [ ] Store product documentation (MSDS, images)
- [ ] Track item brand and manufacturer
- [ ] Manage item status (active, discontinued, inactive)
- [ ] Support barcode/UPC for scanning

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/inventory` | `inventory:read` | List inventory items |
| GET | `/api/resources/inventory/:id` | `inventory:read` | Get item details |
| POST | `/api/resources/inventory` | `inventory:create` | Add item |
| PUT | `/api/resources/inventory/:id` | `inventory:update` | Update item |
| DELETE | `/api/resources/inventory/:id` | `inventory:delete` | Soft delete item |
| GET | `/api/resources/inventory/categories` | `inventory:read` | List categories |
| GET | `/api/resources/inventory/search` | `inventory:read` | Search items |

---

## Data Model

```prisma
model InventoryItem {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  // Identification
  name            String
  sku             String
  barcode         String?
  upc             String?

  // Classification
  category        InventoryCategory
  subcategory     String?
  brand           String?
  manufacturer    String?

  // Specifications
  description     String?
  specifications  Json?    // Size, color, material, etc.
  size            String?
  color           String?
  material        String?

  // Supplier info
  supplierId      String?  @db.ObjectId
  supplierSku     String?
  alternateSuppliers String[] @db.ObjectId

  // Pricing
  unitCost        Decimal
  lastCost        Decimal?
  averageCost     Decimal?
  unitOfMeasure   String   // e.g., "EACH", "BOX", "PACK"
  unitsPerPackage Int      @default(1)
  packageDescription String?

  // Storage
  storageLocation String?
  storageRequirements String?  // e.g., "Refrigerate", "Keep dry"

  // Status
  status          InventoryStatus @default(ACTIVE)
  isOrderable     Boolean  @default(true)

  // Documents
  msdsUrl         String?  // Material Safety Data Sheet
  imageUrl        String?
  documents       String[]

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  supplier  Supplier? @relation(fields: [supplierId], references: [id])

  @@unique([clinicId, sku])
  @@index([clinicId])
  @@index([category])
  @@index([barcode])
  @@index([status])
}

enum InventoryCategory {
  BRACKETS        // Metal, ceramic, self-ligating, lingual
  WIRES           // NiTi, stainless steel, TMA, copper NiTi
  ELASTICS        // Power chains, ligatures, separators
  BANDS           // Molar bands, pre-welded
  BONDING         // Adhesives, primers, etchants
  IMPRESSION      // Alginate, PVS, bite registration
  RETAINERS       // Clear retainer material, Hawley
  INSTRUMENTS     // Disposable instruments
  DISPOSABLES     // Single-use clinical items
  PPE             // Personal protective equipment
  OFFICE_SUPPLIES // Non-clinical supplies
  CLEANING        // Sterilization and cleaning
  OTHER
}

enum InventoryStatus {
  ACTIVE          // Currently in use
  DISCONTINUED    // No longer available from supplier
  BACKORDERED     // Temporarily unavailable
  INACTIVE        // Not currently ordering
  PENDING_APPROVAL // Awaiting approval to add
}
```

---

## Business Rules

- SKU must be unique within each clinic
- Items with stock cannot be deleted (only deactivated)
- Discontinued items trigger alert to find replacements
- Average cost calculated as weighted average of received costs
- Last cost updated on each receipt
- Barcode scanning should find exact match or suggest similar items
- MSDS required for certain chemical supplies

---

## Dependencies

**Depends On:**
- Auth & Authorization (user authentication, permissions)
- Supplier Management (supplier links)

**Required By:**
- Stock Tracking (tracks stock of catalog items)
- Reorder Automation (reorder based on catalog settings)
- Purchase Orders (orders catalog items)
- Usage Analytics (analyzes catalog item usage)

---

## Notes

- Consider import functionality for supplier catalogs
- Product images help staff identify correct items
- Specification fields should be flexible for different item types
- Category hierarchy could expand based on practice needs
- Integration with distributor catalogs for pricing updates
- Search should support partial matches and common abbreviations

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
