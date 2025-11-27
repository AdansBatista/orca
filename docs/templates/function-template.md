# [Function Name]

> **Sub-Area**: [Sub-Area Name](../)
>
> **Purpose**: [Brief 1-sentence description]

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High / Medium / Low |
| **Complexity** | Small / Medium / Large |
| **Parent Sub-Area** | [Sub-Area Name](../) |
| **Dependencies** | [List function dependencies] |
| **Last Updated** | YYYY-MM-DD |
| **Owner** | [Team member name] |

---

## Overview

[2-3 paragraph description of what this function does, why it's needed, and how users will interact with it]

---

## User Stories

- As a **[role]**, I want to **[action]** so that **[benefit]**
- As a **[role]**, I want to **[action]** so that **[benefit]**
- As a **[role]**, I want to **[action]** so that **[benefit]**

---

## Functional Requirements

### Core Functionality
- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### User Interface
- [ ] [UI Requirement 1]
- [ ] [UI Requirement 2]
- [ ] [UI Requirement 3]

### Business Rules
- [ ] [Business Rule 1]
- [ ] [Business Rule 2]
- [ ] [Business Rule 3]

### Validation Rules
- [ ] [Validation 1]
- [ ] [Validation 2]

---

## Implementation Approach

### High-Level Steps

1. **[Step 1 Title]**
   - [Description of what needs to be done]
   - [Key considerations]

2. **[Step 2 Title]**
   - [Description of what needs to be done]
   - [Key considerations]

3. **[Step 3 Title]**
   - [Description of what needs to be done]
   - [Key considerations]

---

## Technical Specifications

### Database Schema

```prisma
model [ModelName] {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId  String   @db.ObjectId

  // Core fields
  [field1]  [Type]
  [field2]  [Type]?
  [field3]  [Type]   @default([value])

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  // Indexes
  @@index([clinicId])
  @@index([field1])
}
```

### Schema Changes Required
| Change | Type | Description |
|--------|------|-------------|
| [Model/Field] | Add/Modify/Remove | [What changes] |

---

### API Endpoints

#### `GET /api/[resource]`
**Purpose:** [What this endpoint does]

**Authentication:** Required
**Permissions:** `[permission:action]`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clinicId` | string | Yes (auto) | Clinic filter |
| `page` | number | No | Page number |
| `pageSize` | number | No | Items per page |

**Response:**
```typescript
{
  success: boolean;
  data: {
    items: [Resource][];
    total: number;
    page: number;
    pageSize: number;
  };
}
```

---

#### `POST /api/[resource]`
**Purpose:** [What this endpoint does]

**Authentication:** Required
**Permissions:** `[permission:action]`

**Request Body:**
```typescript
{
  field1: string;
  field2?: string;
  field3: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: [Resource];
}
```

---

#### `PUT /api/[resource]/[id]`
**Purpose:** [What this endpoint does]

**Authentication:** Required
**Permissions:** `[permission:action]`

**Request Body:**
```typescript
{
  field1?: string;
  field2?: string;
}
```

---

#### `DELETE /api/[resource]/[id]`
**Purpose:** [What this endpoint does]

**Authentication:** Required
**Permissions:** `[permission:action]`

---

### File Structure

```
src/
├── app/
│   └── api/
│       └── [resource]/
│           ├── route.ts           # GET (list), POST (create)
│           └── [id]/
│               └── route.ts       # GET (single), PUT, DELETE
│
├── components/
│   └── [feature]/
│       ├── [Component1].tsx
│       ├── [Component2].tsx
│       └── index.ts
│
├── lib/
│   └── validations/
│       └── [resource].ts          # Zod schemas
│
└── types/
    └── [resource].ts              # TypeScript types
```

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `[ComponentName]` | [What it does] | `components/[feature]/` |
| `[ComponentName]` | [What it does] | `components/[feature]/` |

---

## UI/UX Design

### Wireframe/Layout
```
┌─────────────────────────────────────────┐
│ Header: [Title]              [Actions]  │
├─────────────────────────────────────────┤
│                                         │
│  [Main Content Area]                    │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Item 1  │ │ Item 2  │ │ Item 3  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ Footer: [Pagination / Actions]          │
└─────────────────────────────────────────┘
```

### User Flow
1. User navigates to [page]
2. User sees [initial state]
3. User clicks [action]
4. System [response]
5. User sees [result]

### Validation & Error Handling
| Scenario | Error Message | UI Behavior |
|----------|---------------|-------------|
| [Scenario] | "[Message]" | [Behavior] |
| [Scenario] | "[Message]" | [Behavior] |

---

## Dependencies

### Internal Dependencies
| Dependency | Type | Description |
|------------|------|-------------|
| [Function/Sub-Area] | Required | [Why needed] |
| [Function/Sub-Area] | Optional | [Why helpful] |

### External Dependencies
| Dependency | Type | Description |
|------------|------|-------------|
| [Library/Service] | [Type] | [Why needed] |

---

## Security Requirements

### Access Control
- **Create:** [Roles that can create]
- **Read:** [Roles that can read]
- **Update:** [Roles that can update]
- **Delete:** [Roles that can delete]

### Audit Requirements
- [ ] Log all [specific actions]
- [ ] Track [specific data changes]

### Data Protection
- [ ] [Encryption requirements]
- [ ] [PHI handling]

---

## Testing Requirements

### Unit Tests
- [ ] [Test case 1]
- [ ] [Test case 2]
- [ ] [Test case 3]

### Integration Tests
- [ ] [Test scenario 1]
- [ ] [Test scenario 2]

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

---

## AI Integration (if applicable)

| AI Feature | Purpose | Implementation |
|------------|---------|----------------|
| [Feature] | [Purpose] | [How to implement] |

---

## Performance Considerations

- **Response Time:** [Target]
- **Data Volume:** [Expected scale]
- **Caching:** [Strategy if needed]

---

## Future Enhancements

Potential improvements for future iterations:
- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

---

## Notes

### Open Questions
- [ ] [Question 1]
- [ ] [Question 2]

### Decisions Made
| Decision | Rationale | Date |
|----------|-----------|------|
| [Decision] | [Why] | YYYY-MM-DD |

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- 👀 Review - Under review
- 🧪 Testing - In testing
- ✅ Completed - Fully implemented
- 🚫 Blocked - Blocked by dependency
