# Expiration Monitoring

> **Sub-Area**: [Inventory Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Expiration Monitoring tracks expiration dates for supplies to prevent use of expired materials and minimize waste. The system generates tiered alerts as expiration approaches, enforces FIFO (First In, First Out) usage, and provides reporting on expired inventory for waste analysis. This is critical for patient safety and regulatory compliance, especially for bonding agents, impression materials, and other time-sensitive supplies.

---

## Core Requirements

- [ ] Record expiration dates by lot/batch
- [ ] Generate expiration alerts at configurable intervals (30/60/90 days)
- [ ] Enforce FIFO usage (oldest stock first)
- [ ] Track items approaching expiration by urgency
- [ ] Automatically flag expired inventory
- [ ] Report on expired inventory and waste costs
- [ ] Support expiration extension documentation (when applicable)
- [ ] Generate audit reports for compliance
- [ ] Alert on items without expiration when required
- [ ] Quarantine expired lots automatically

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/inventory/expiring` | `inventory:read` | Get expiring items |
| GET | `/api/resources/inventory/expired` | `inventory:read` | Get expired items |
| POST | `/api/resources/inventory/lots/:id/expire` | `inventory:adjust` | Mark lot as expired |
| POST | `/api/resources/inventory/lots/:id/extend` | `inventory:adjust` | Document extension |
| GET | `/api/resources/inventory/expiration-report` | `inventory:read` | Expiration report |
| PUT | `/api/resources/inventory/lots/:id/quarantine` | `inventory:adjust` | Quarantine lot |

---

## Data Model

```prisma
// Expiration tracked on InventoryLot
model InventoryLot {
  // ... existing fields ...

  expirationDate    DateTime?
  expirationAlertSent Boolean @default(false)
  expirationAlertDates Json?  // Track which alerts sent

  // Extension documentation
  originalExpirationDate DateTime?
  extensionReason   String?
  extensionApprovedBy String? @db.ObjectId
  extensionDocument String?  // URL to documentation
}

model ExpirationAlert {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  itemId          String   @db.ObjectId
  lotId           String   @db.ObjectId

  // Alert details
  alertLevel      ExpirationAlertLevel
  alertDate       DateTime @default(now())
  expirationDate  DateTime
  daysUntilExpiry Int

  // Quantity at risk
  quantity        Int
  estimatedValue  Decimal?

  // Status
  status          ExpirationAlertStatus @default(ACTIVE)
  action          ExpirationAction?
  actionDate      DateTime?
  actionBy        String?  @db.ObjectId
  actionNotes     String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic        @relation(fields: [clinicId], references: [id])
  item      InventoryItem @relation(fields: [itemId], references: [id])
  lot       InventoryLot  @relation(fields: [lotId], references: [id])

  @@index([clinicId])
  @@index([itemId])
  @@index([status])
  @@index([alertLevel])
  @@index([expirationDate])
}

enum ExpirationAlertLevel {
  WARNING         // 90 days before
  CAUTION         // 60 days before
  URGENT          // 30 days before
  CRITICAL        // 7 days or less
  EXPIRED         // Past expiration
}

enum ExpirationAlertStatus {
  ACTIVE          // Needs attention
  ACKNOWLEDGED    // Seen, no action yet
  RESOLVED        // Action taken
}

enum ExpirationAction {
  USED            // Prioritized and consumed
  RETURNED        // Returned to supplier
  DISCARDED       // Disposed of
  EXTENDED        // Expiration extended
  TRANSFERRED     // Sent to another location
}
```

---

## Business Rules

- Alert levels: 90 days (warning), 60 days (caution), 30 days (urgent), 7 days (critical)
- Expired lots automatically quarantined and removed from available stock
- FIFO: system should suggest/default to oldest lot when recording usage
- Items requiring expiration tracking must have expiration dates on receipt
- Expiration extensions require documentation and approval
- Waste report calculates: quantity × unit cost for value lost
- Certain categories (bonding, impression) always require expiration tracking

---

## Dependencies

**Depends On:**
- Supplies Catalog (item settings for expiration tracking)
- Stock Tracking (lot management)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Stock Tracking (lot status updates)
- Usage Analytics (waste analysis)
- Compliance Reporting (audit documentation)

---

## Notes

- Color-coded visual indicators: green (safe), yellow (warning), orange (urgent), red (critical/expired)
- Dashboard widget showing expiring items for quick visibility
- Consider integration with usage to prioritize expiring items in suggestions
- Waste reduction metrics track improvement over time
- Some supplies may have "best by" vs. hard expiration dates
- Mobile alerts for urgent expiration situations

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
