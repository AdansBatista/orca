# Permission Levels

> **Sub-Area**: [Permissions](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Defines four permission levels (None, View, Edit, Full) that can be assigned per area. Levels simplify permission management by grouping related actions. Used in the role-area matrix for quick overview of access patterns.

---

## Core Requirements

- [ ] Define four permission levels with action mappings
- [ ] Provide level-to-actions expansion
- [ ] Support level display in permission UI
- [ ] Allow override of individual actions within level
- [ ] Provide hasLevel(user, area, level) utility

---

## API Endpoints

No dedicated endpoints - levels are UI convenience for permission assignment.

---

## Data Model

Levels defined in TypeScript constants:

```typescript
// lib/auth/permissionLevels.ts
export type PermissionLevel = 'none' | 'view' | 'edit' | 'full';

export const PERMISSION_LEVELS = {
  none: {
    name: 'None',
    description: 'No access',
    actions: [],
  },
  view: {
    name: 'View',
    description: 'Read-only access',
    actions: ['read'],
  },
  edit: {
    name: 'Edit',
    description: 'Create and modify',
    actions: ['create', 'read', 'update'],
  },
  full: {
    name: 'Full',
    description: 'Complete access including delete',
    actions: ['create', 'read', 'update', 'delete', 'export'],
  },
} as const;
```

---

## Business Rules

### Level Definitions

| Level | Actions | Use Case |
|-------|---------|----------|
| None | [] | No access to area |
| View | read | Read-only users, auditors |
| Edit | create, read, update | Standard working access |
| Full | create, read, update, delete, export | Admin access |

### Level Expansion

```typescript
function expandLevel(area: string, level: PermissionLevel): string[] {
  const actions = PERMISSION_LEVELS[level].actions;
  return actions.map(action => `${area}:${action}`);
}

// Example:
// expandLevel('patient', 'edit') => ['patient:create', 'patient:read', 'patient:update']
```

### Level Detection

```typescript
function detectLevel(area: string, permissions: string[]): PermissionLevel {
  const areaPermissions = permissions.filter(p => p.startsWith(`${area}:`));
  const actions = areaPermissions.map(p => p.split(':')[1]);

  if (actions.length === 0) return 'none';
  if (actions.includes('delete') && actions.includes('export')) return 'full';
  if (actions.includes('create') && actions.includes('update')) return 'edit';
  if (actions.includes('read')) return 'view';
  return 'none';
}
```

---

## Dependencies

**Depends On:**
- Permission Structure

**Required By:**
- Permission Matrix UI
- Role permission editor

---

## Notes

- Levels are UI convenience, not stored in database
- Individual permissions always stored and checked
- Special permissions (view_phi, manage_users) don't fit level pattern
