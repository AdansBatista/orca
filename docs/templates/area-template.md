# [Area Name]

> **Area Overview**: [Brief 1-2 sentence description of this area's purpose]

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High / Medium / Low |
| **Phase** | [Phase number from MASTER-INDEX] |
| **Dependencies** | [List dependent areas] |
| **Last Updated** | YYYY-MM-DD |

---

## Before Implementing This Area

> **For LLMs**: Complete this checklist before writing any code for this area.

- [ ] Verify dependencies are complete (see Quick Info → Dependencies)
- [ ] Read [AUTH-GUIDE.md](../../guides/AUTH-GUIDE.md) for permission patterns
- [ ] Read [TECH-STACK.md](../../guides/TECH-STACK.md) for coding standards
- [ ] Check [QUICK-REFERENCE.md](../../QUICK-REFERENCE.md) for common patterns
- [ ] Review **Data Models** section below for Prisma schema
- [ ] Review **API Endpoints** section for route structure
- [ ] Check **Business Rules** for validation requirements

---

## Goals

What this area aims to achieve:

1. **[Goal 1]**: [Description]
2. **[Goal 2]**: [Description]
3. **[Goal 3]**: [Description]

---

## Sub-Areas

| # | Sub-Area | Status | Functions | Priority |
|---|----------|--------|-----------|----------|
| 1 | [Sub-Area Name](./sub-areas/sub-area-name/) | 📋 Planned | X | High |
| 2 | [Sub-Area Name](./sub-areas/sub-area-name/) | 📋 Planned | X | Medium |
| 3 | [Sub-Area Name](./sub-areas/sub-area-name/) | 📋 Planned | X | Medium |
| 4 | [Sub-Area Name](./sub-areas/sub-area-name/) | 📋 Planned | X | Medium |

---

## Sub-Area Details

### 1. [Sub-Area Name]
*[Brief description]*

**Key Functions:**
- Function 1
- Function 2
- Function 3

**Documentation:** [sub-areas/sub-area-name/](./sub-areas/sub-area-name/)

---

### 2. [Sub-Area Name]
*[Brief description]*

**Key Functions:**
- Function 1
- Function 2
- Function 3

**Documentation:** [sub-areas/sub-area-name/](./sub-areas/sub-area-name/)

---

## User Roles & Permissions

| Role | Access Level | Notes |
|------|--------------|-------|
| Super Admin | Full | All operations |
| Clinic Admin | Full | Within assigned clinics |
| Doctor | [Level] | [Specific access notes] |
| Clinical Staff | [Level] | [Specific access notes] |
| Front Desk | [Level] | [Specific access notes] |
| Billing | [Level] | [Specific access notes] |
| Read Only | View | Read-only access |

See [AUTH-GUIDE.md](../../guides/AUTH-GUIDE.md) for full permission details.

---

## Data & Privacy Considerations

### PHI/PII Handling
- [ ] [Describe what PHI/PII this area handles]
- [ ] [Data encryption requirements]
- [ ] [Access logging requirements]

### Data Retention
- [ ] [Retention policy for this area's data]

### Compliance
- [ ] HIPAA requirements: [Details]
- [ ] PIPEDA requirements: [Details]

---

## Integration Points

### Internal Integrations
| Area | Integration Type | Description |
|------|------------------|-------------|
| [Area Name] | Data dependency | [How they integrate] |

### External Integrations
| System | Integration Type | Description |
|--------|------------------|-------------|
| [External System] | [API/File/etc.] | [How they integrate] |

---

## AI Integration

Relevant AI capabilities for this area:

- [ ] [AI Feature 1]: [How it enhances this area]
- [ ] [AI Feature 2]: [How it enhances this area]

See [AI-INTEGRATION.md](../../guides/AI-INTEGRATION.md) for full AI details.

---

## Success Metrics

How we measure success:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [Metric Name] | [Target Value] | [How to measure] |

---

## Implementation Notes

### Technical Considerations
- [Key technical decisions or constraints]

### Dependencies to Resolve
- [Any blockers or dependencies that need attention]

### Risk Factors
- [Potential risks and mitigation strategies]

---

## Related Documentation

- [MASTER-INDEX.md](../../MASTER-INDEX.md) - Project overview
- [CURRENT-FOCUS.md](../../CURRENT-FOCUS.md) - Development priorities
- [AUTH-GUIDE.md](../../guides/AUTH-GUIDE.md) - Permission patterns
- [TECH-STACK.md](../../guides/TECH-STACK.md) - Coding standards

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- 👀 Review - Under review
- 🧪 Testing - In testing
- ✅ Completed - Fully implemented
- 🚫 Blocked - Blocked by dependency
