# Order Templates

> **Sub-Area**: [Lab Orders](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Order Templates allow practices to save and reuse common order configurations. Templates capture product selection, prescription defaults, and standard notes to speed up order creation. Templates can be clinic-wide (shared by all staff) or personal (visible only to the creator).

---

## Core Requirements

- [ ] Save current order configuration as a new template
- [ ] Create clinic-wide templates accessible to all staff
- [ ] Create personal templates visible only to creator
- [ ] Organize templates by product category
- [ ] Quick-apply template to new order
- [ ] Override template defaults during application
- [ ] Track template usage statistics
- [ ] Import/export templates between clinics

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/templates` | `lab:create_order` | List available templates |
| GET | `/api/lab/templates/:id` | `lab:create_order` | Get template details |
| POST | `/api/lab/templates` | `lab:create_order` | Create new template |
| PUT | `/api/lab/templates/:id` | `lab:create_order` | Update template |
| DELETE | `/api/lab/templates/:id` | `lab:admin` | Delete template |
| POST | `/api/lab/orders/:id/apply-template` | `lab:create_order` | Apply template to order |

---

## Data Model

```prisma
model LabOrderTemplate {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  name            String
  description     String?
  category        LabProductCategory
  isClinicWide    Boolean  @default(true)
  createdByUserId String?  @db.ObjectId

  productId       String   @db.ObjectId
  prescription    Json     // Default prescription values
  defaultNotes    String?

  usageCount      Int      @default(0)
  lastUsedAt      DateTime?

  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([clinicId])
  @@index([category])
}
```

---

## Business Rules

- Personal templates only visible to their creator
- Clinic-wide templates require appropriate permissions to create
- Template deletion requires admin permission
- Usage count incremented each time template is applied
- Inactive templates hidden from selection but preserved

---

## Dependencies

**Depends On:**
- Lab Order Creation (context for applying templates)
- Lab Vendor Management (product catalog)
- Auth & Authorization (template ownership)

**Required By:**
- Lab Order Creation (speeds up order creation)

---

## Notes

- Common templates: Standard Hawley, Clear Essix, Hyrax RPE
- Consider template versioning for tracking changes
- Support template categories for easier browsing

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
