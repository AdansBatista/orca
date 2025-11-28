# Password Policy

> **Sub-Area**: [Authentication](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Enforces strong password requirements for user accounts. Validates password complexity, checks against password history to prevent reuse, enforces maximum password age, and provides clear validation feedback. Ensures HIPAA compliance for access controls.

---

## Core Requirements

- [ ] Minimum 12 characters length
- [ ] At least 1 uppercase letter (A-Z)
- [ ] At least 1 lowercase letter (a-z)
- [ ] At least 1 number (0-9)
- [ ] At least 1 special character (!@#$%^&*...)
- [ ] Cannot reuse last 5 passwords
- [ ] Maximum password age: 90 days
- [ ] Warn user 14 days before expiration
- [ ] Provide real-time validation feedback

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/auth/password/validate` | None | Validate password strength (no auth needed for registration) |

### Validation Response

```typescript
{
  success: boolean;
  valid: boolean;
  errors: string[];  // Array of failed requirements
  strength: "weak" | "medium" | "strong";
}
```

---

## Data Model

Password history stored on User model:

```prisma
model User {
  // ... other fields
  passwordHash      String
  passwordChangedAt DateTime?
  passwordHistory   String[]  // Last 5 hashed passwords
}
```

---

## Business Rules

- Hash passwords with bcrypt (cost factor 12)
- Store last 5 password hashes for history check
- Update passwordChangedAt on every password change
- Check expiration on login, warn if within 14 days
- Force password change if expired (90+ days)
- Never log or expose actual password values

### Zod Validation Schema

```typescript
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character');
```

---

## Dependencies

**Depends On:**
- User model
- bcrypt library

**Required By:**
- User Login
- Password Reset
- Password Change

---

## Notes

- Validation runs client-side for UX (real-time feedback)
- Validation runs server-side for security (can't trust client)
- Common password list check could be added in future
