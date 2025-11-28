# User Login

> **Sub-Area**: [Authentication](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Implements the user login flow using NextAuth.js with CredentialsProvider. Validates user credentials against the database, handles failed attempts with lockout logic, creates secure sessions with JWT tokens in HTTP-only cookies, and logs authentication events for compliance.

---

## Core Requirements

- [ ] Validate email format and password presence
- [ ] Lookup user by email (case-insensitive)
- [ ] Verify password hash using bcrypt
- [ ] Check if account is active and not locked
- [ ] Track failed login attempts (lock after 5 failures)
- [ ] Create JWT session with user data, role, permissions, clinicId
- [ ] Set HTTP-only secure cookie for session
- [ ] Log AUTH_LOGIN or AUTH_LOGIN_FAILED event
- [ ] Support "Remember Me" for extended session duration

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/auth/login` | None (public) | Authenticate user credentials |

### Request Body

```typescript
{
  email: string;      // User email
  password: string;   // User password
  rememberMe?: boolean; // Extended session (30 days vs 8 hours)
}
```

### Response

```typescript
// Success
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      clinicId: string;
      clinicIds: string[];
    }
  }
}

// Error
{
  success: false,
  error: {
    code: "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "ACCOUNT_INACTIVE",
    message: string;
  }
}
```

---

## Data Model

Uses existing `User` model from [Authentication README](../).

No new models required - uses NextAuth.js session management.

---

## Business Rules

- Passwords verified using bcrypt.compare()
- Lock account for 15 minutes after 5 consecutive failures
- Reset failed attempts counter on successful login
- Session duration: 8 hours (standard) or 30 days (remember me)
- Never reveal if email exists (security)
- Always return same error for invalid email or password

---

## Dependencies

**Depends On:**
- User model in database
- NextAuth.js configuration
- bcrypt for password hashing

**Required By:**
- All authenticated features
- Session Management function

---

## Notes

- Uses NextAuth.js CredentialsProvider
- JWT stored in HTTP-only cookie (not localStorage)
- CSRF token required for additional security
