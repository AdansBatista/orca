# [Sub-Area Name]

> **Sub-Area of**: [Parent Area Name]
>
> **Purpose**: [Brief 1-2 sentence description]

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High / Medium / Low |
| **Parent Area** | [Area Name](../) |
| **Functions** | X |
| **Last Updated** | YYYY-MM-DD |
| **Owner** | [Team member name] |

---

## Overview

[2-3 paragraph description of this sub-area, its purpose, and how it fits within the parent area]

---

## Functions

| # | Function | Status | Priority | Dependencies | Complexity |
|---|----------|--------|----------|--------------|------------|
| 1 | [Function Name](./functions/function-name.md) | 📋 Planned | High | None | Medium |
| 2 | [Function Name](./functions/function-name.md) | 📋 Planned | High | Function 1 | Small |
| 3 | [Function Name](./functions/function-name.md) | 📋 Planned | Medium | Function 1, 2 | Large |

---

## Implementation Order

Based on dependencies and priority:

```
1. [Function Name] (foundation - no dependencies)
      │
      ├──> 2. [Function Name] (depends on 1)
      │         │
      │         └──> 4. [Function Name] (depends on 2)
      │
      └──> 3. [Function Name] (depends on 1)
```

### Recommended Sequence

1. **[Function Name]** - [Why first: foundational data model, core API, etc.]
2. **[Function Name]** - [Why second: builds on function 1]
3. **[Function Name]** - [Why third: depends on 1 and 2]

---

## Function Summaries

### 1. [Function Name]
*[One-line description]*

**Purpose:** [What this function does]

**Key Capabilities:**
- [Capability 1]
- [Capability 2]
- [Capability 3]

**Technical Notes:**
- Database: [Tables/collections affected]
- API: [Endpoints needed]
- UI: [Components needed]

**Details:** [functions/function-name.md](./functions/function-name.md)

---

### 2. [Function Name]
*[One-line description]*

**Purpose:** [What this function does]

**Key Capabilities:**
- [Capability 1]
- [Capability 2]

**Technical Notes:**
- Database: [Tables/collections affected]
- API: [Endpoints needed]
- UI: [Components needed]

**Details:** [functions/function-name.md](./functions/function-name.md)

---

## User Stories

### As a [Role]
- I want to [action] so that [benefit]
- I want to [action] so that [benefit]

### As a [Different Role]
- I want to [action] so that [benefit]
- I want to [action] so that [benefit]

---

## Data Requirements

### Core Entities

```
[EntityName]
├── id: ObjectId
├── clinicId: ObjectId (required)
├── [field1]: [type]
├── [field2]: [type]
├── createdAt: DateTime
├── updatedAt: DateTime
└── deletedAt: DateTime?
```

### Key Relationships
- [Entity] → [Related Entity]: [Relationship type]
- [Entity] → [Related Entity]: [Relationship type]

---

## UI/UX Overview

### Main Views
| View | Purpose | Access |
|------|---------|--------|
| [View Name] | [Purpose] | [Roles] |
| [View Name] | [Purpose] | [Roles] |

### Key User Flows
1. **[Flow Name]**: [User] → [Action] → [Result]
2. **[Flow Name]**: [User] → [Action] → [Result]

---

## Technical Considerations

### Performance Requirements
- [Response time requirements]
- [Concurrent user requirements]
- [Data volume considerations]

### Security Requirements
- [Access control specifics]
- [Audit logging requirements]
- [Data encryption needs]

### Integration Requirements
- [Integration with other sub-areas]
- [External system integrations]

---

## Testing Requirements

### Test Coverage
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows
- [ ] Accessibility testing

### Key Test Scenarios
1. [Scenario 1]
2. [Scenario 2]
3. [Scenario 3]

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
