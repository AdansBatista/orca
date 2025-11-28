# Documentation Standards

> **Purpose**: Define conventions for all Orca documentation
>
> **Audience**: LLMs and developers creating or updating documentation

---

## Documentation Hierarchy

```
docs/
├── MASTER-INDEX.md              # Project overview & area index
├── CURRENT-FOCUS.md             # What to work on now
├── QUICK-REFERENCE.md           # Pattern cheat sheet
├── DOCUMENTATION-STANDARDS.md   # This file
│
├── guides/                      # Technical foundation (4 guides)
│   ├── TECH-STACK.md           # Coding standards
│   ├── STYLING-GUIDE.md        # UI/UX standards
│   ├── AUTH-GUIDE.md           # Auth & permissions
│   └── AI-INTEGRATION.md       # AI capabilities
│
├── templates/                   # Document templates
│   ├── area-template.md
│   ├── sub-area-template.md
│   └── function-template.md
│
└── areas/                       # Feature documentation (13 areas)
    └── {area-name}/
        ├── README.md            # Area overview (200-300 lines)
        └── sub-areas/
            └── {sub-area-name}/
                ├── README.md    # Sub-area spec (150-200 lines)
                └── functions/
                    └── {function}.md  # Function spec (50-100 lines)
```

---

## Numbering Convention

### Simple Sequential Numbering

Use simple sequential numbers within each level:

| Level | Format | Example |
|-------|--------|---------|
| Areas | None (use names) | `staff-management` |
| Sub-Areas | `1, 2, 3, 4` | Sub-Area 1, Sub-Area 2 |
| Functions | `1, 2, 3...` | Function 1, Function 2 |

### ❌ Do NOT Use

- Hierarchical numbering: `2.1.1`, `2.1.2`
- Phase prefixes: `P1-2.1`, `Phase2-Area3`
- Nested formats: `2.4.1`, `3.2.1`

### ✅ Correct Examples

**In Area README:**
```markdown
| # | Sub-Area | Description |
|---|----------|-------------|
| 1 | Staff Profiles | Employee profiles and HR |
| 2 | Scheduling | Shift scheduling |
| 3 | Roles & Permissions | Access control |
| 4 | Performance | Performance tracking |
```

**In Sub-Area README:**
```markdown
| # | Function | Description |
|---|----------|-------------|
| 1 | Profile Management | Create/edit profiles |
| 2 | Credential Tracking | License management |
| 3 | Document Storage | HR document handling |
```

---

## File Structure Per Area

```
docs/areas/{area-name}/
├── README.md                    # Area overview & specifications
└── sub-areas/
    ├── {sub-area-1}/
    │   ├── README.md           # Sub-area details
    │   └── functions/
    │       ├── {function-1}.md
    │       ├── {function-2}.md
    │       └── {function-3}.md
    ├── {sub-area-2}/
    │   ├── README.md
    │   └── functions/
    └── ...
```

---

## Status Icons

| Status | Icon | Meaning |
|--------|------|---------|
| Planned | 📋 | Documented, not started |
| In Progress | 🔄 | Currently implementing |
| Review | 👀 | Under review |
| Testing | 🧪 | In testing |
| Completed | ✅ | Fully implemented |
| Blocked | 🚫 | Blocked by dependency |

---

## Required Sections by Document Type

### Area README.md

1. **Quick Info Table** - Status, Priority, Phase, Dependencies
2. **Overview** - Purpose, Key Capabilities, Business Value
3. **Sub-Areas Table** - Links to all sub-areas
4. **Sub-Area Details** - Expanded descriptions
5. **Data Models** - Entity diagram + Prisma schemas
6. **API Endpoints** - Method, path, description, permissions
7. **UI Components** - Component inventory
8. **Business Rules** - Operational constraints
9. **Integration Points** - Internal and external
10. **User Roles & Permissions** - Access matrix

### Sub-Area README.md

1. **Quick Info Table** - Status, Priority, Parent Area
2. **Overview** - Purpose, Key Capabilities
3. **Functions Table** - Links to function docs
4. **Function Details** - Expanded descriptions
5. **Data Model** - Prisma schema for this sub-area
6. **API Endpoints** - Specific to this sub-area
7. **UI Components** - Specific to this sub-area
8. **Business Rules** - Specific rules
9. **Dependencies** - Internal and external

### Function .md

1. **Summary** - Brief description
2. **Implementation Status** - Planned/In Progress/Complete
3. **Quick Reference** - Links to parent README sections
4. **User Stories** (when expanded)
5. **API Specification** (when expanded)
6. **Validation Rules** (when expanded)

---

## Link Conventions

### Relative Links (Preferred)

```markdown
<!-- From area README to sub-area -->
[Staff Profiles](./sub-areas/staff-profiles/)

<!-- From sub-area to parent -->
[Staff Management](../../)

<!-- From sub-area to function -->
[Profile Management](./functions/profile-management.md)

<!-- From function to sub-area README -->
[Sub-Area README](../README.md)
```

### Cross-Area Links

```markdown
<!-- To another area -->
[Booking & Scheduling](../booking/)

<!-- To a guide -->
[AUTH-GUIDE](../../guides/AUTH-GUIDE.md)
```

---

## Naming Conventions

### File Names

| Type | Convention | Example |
|------|------------|---------|
| Area folders | kebab-case | `staff-management/` |
| Sub-area folders | kebab-case | `staff-profiles/` |
| Function files | kebab-case | `profile-management.md` |
| Guide files | SCREAMING-KEBAB | `AUTH-GUIDE.md` |

### Section Headings

- Use Title Case for main sections: `## Data Models`
- Use sentence case for subsections: `### Creating a new profile`

---

## Writing Style

### Do

- Be concise - prefer tables over paragraphs
- Use code blocks for patterns and examples
- Include orthodontic-specific context where relevant
- Link to related documentation
- Keep technical accuracy over completeness

### Don't

- Duplicate content from other documents
- Use marketing language
- Include implementation timelines
- Add placeholder content ("TBD", "Coming soon")

---

## Updating Documentation

### When Adding a New Area

1. Copy from `templates/area-template.md`
2. Follow numbering convention (sequential 1, 2, 3, 4)
3. Create sub-area folders and READMEs
4. Create function stub files
5. Update MASTER-INDEX.md

### When Completing a Feature

1. Update function doc with implementation details
2. Update sub-area README if needed
3. Update area README status
4. Update MASTER-INDEX.md status
5. Update CURRENT-FOCUS.md if phase changes

### When Changing Structure

1. Update this document (DOCUMENTATION-STANDARDS.md)
2. Update affected templates
3. Update CLAUDE.md if navigation changes
4. Communicate changes in commit message

---

**Last Updated**: 2024-11-27
