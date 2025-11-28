# [Function Name]

> **Sub-Area**: [Sub-Area Name](../) | **Status**: 📋 Planned | **Priority**: High / Medium / Low

---

## Overview

[2-3 sentences describing what this function does, why it's needed, and how users interact with it]

---

## Core Requirements

- [ ] [Requirement 1 - What the function must do]
- [ ] [Requirement 2]
- [ ] [Requirement 3]
- [ ] [Requirement 4]
- [ ] [Requirement 5]

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/[resource]` | `[resource]:read` | List/fetch resources |
| GET | `/api/[resource]/[id]` | `[resource]:read` | Get single resource |
| POST | `/api/[resource]` | `[resource]:create` | Create new resource |
| PUT | `/api/[resource]/[id]` | `[resource]:update` | Update resource |
| DELETE | `/api/[resource]/[id]` | `[resource]:delete` | Soft delete resource |

---

## Data Model

```prisma
model [ResourceName] {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId  String   @db.ObjectId

  // Core fields
  [field1]  String
  [field2]  String?
  [field3]  [Type]   @default([value])

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
}
```

---

## Business Rules

- [Rule 1 - Validation, constraints, or business logic]
- [Rule 2]
- [Rule 3]

---

## Dependencies

**Depends On:**
- [Function/Sub-Area this depends on]

**Required By:**
- [Functions that depend on this]

---

## Notes

[Any implementation notes, edge cases, or clarifications]

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
