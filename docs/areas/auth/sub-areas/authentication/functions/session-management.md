# Session Management

> **Sub-Area**: [Authentication](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Manages user sessions including JWT token creation, validation, refresh, and expiration. Handles idle timeout detection, absolute timeout enforcement, and secure session storage in HTTP-only cookies. Provides session data to both server and client components.

---

## Core Requirements

- [ ] Create JWT with user ID, email, name, role, permissions, clinicId, clinicIds
- [ ] Store JWT in HTTP-only secure cookie
- [ ] Validate JWT signature on each request
- [ ] Check token expiration before processing requests
- [ ] Track last activity timestamp for idle timeout
- [ ] Enforce absolute timeout (12 hours max)
- [ ] Provide useSession hook for client components
- [ ] Provide getServerSession for server components/API routes
- [ ] Handle session refresh without re-login

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/auth/session` | Authenticated | Get current session data |
| POST | `/api/auth/refresh` | Authenticated | Refresh session token |

### Session Response

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
    clinicId: string;
    clinicIds: string[];
    clinics: { id: string; name: string }[];
  };
  expires: string; // ISO date
}
```

---

## Data Model

No persistent model - sessions stored in JWT cookie.

```typescript
// JWT payload structure
interface JWTPayload {
  sub: string;           // User ID
  email: string;
  name: string;
  role: string;
  permissions: string[];
  clinicId: string;
  clinicIds: string[];
  iat: number;           // Issued at
  exp: number;           // Expires at
  lastActivity: number;  // For idle timeout
}
```

---

## Business Rules

- Standard session: 8 hours
- Remember me session: 30 days
- Idle timeout: 30 minutes of inactivity
- Absolute timeout: 12 hours (force re-login)
- JWT signed with secure secret
- Cookie flags: HttpOnly, Secure, SameSite=Lax
- Session includes all data needed for authorization (no extra DB calls)

---

## Dependencies

**Depends On:**
- User Login function
- NextAuth.js

**Required By:**
- All authenticated API routes
- All protected UI components
- withAuth wrapper
- PermissionGate component

---

## Notes

- Use getServerSession() in API routes and server components
- Use useSession() hook in client components
- Session data cached to avoid repeated parsing
