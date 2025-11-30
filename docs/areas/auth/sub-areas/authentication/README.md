# Authentication

> **Sub-Area**: [Auth & Authorization](../../) | **Status**: 📋 Planned

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Parent Area** | [Auth & Authorization](../../) |
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Functions** | 6 |

---

## Overview

This sub-area handles all aspects of user authentication including login flows, session management, password policies, and token handling. Orca uses NextAuth.js with the CredentialsProvider for secure, session-based authentication.

### Key Capabilities

- **Login Flow**: Secure credential validation with NextAuth.js
- **Session Management**: JWT tokens in HTTP-only cookies
- **Password Policy**: Strong password requirements and rotation
- **Session Duration**: Configurable timeouts and remember-me
- **MFA Support**: Multi-factor authentication (future)

---

## Functions

### Phase 1 (Current Scope)

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [User Login](./functions/) | Credential validation and session creation | Critical |
| 2 | [Session Management](./functions/) | JWT handling, refresh, validation | Critical |
| 3 | [Password Policy](./functions/) | Basic validation (8+ chars, complexity) | High |
| 4 | [Session Duration](./functions/) | Timeout rules, idle detection | High |

### Future Phases

| # | Function | Description | Phase |
|---|----------|-------------|-------|
| 5 | Password Reset | Self-service password recovery | Phase 2 |
| 6 | MFA Implementation | Multi-factor authentication | Phase 3 |
| 7 | User Self-Registration | Public sign-up flow | Phase 3 |

> **Note**: In Phase 1, user creation and password resets are performed by super_admin or clinic_admin only.

---

## Data Model

### Session Configuration

```typescript
// Session duration rules
const SESSION_CONFIG = {
  standard: 8 * 60 * 60,      // 8 hours
  rememberMe: 30 * 24 * 60 * 60, // 30 days
  idleTimeout: 30 * 60,        // 30 minutes
  absoluteTimeout: 12 * 60 * 60, // 12 hours max
};
```

### Prisma Schema

```prisma
model User {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  email          String   @unique
  passwordHash   String
  name           String
  isActive       Boolean  @default(true)

  // Multi-clinic support
  clinicId       String   @db.ObjectId  // Primary/current clinic
  clinicIds      String[] @db.ObjectId  // All assigned clinics

  // Auth metadata
  lastLoginAt    DateTime?
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?

  // Password management
  passwordChangedAt DateTime?
  passwordHistory   String[] // Last 5 password hashes

  // Audit fields
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?

  @@index([email])
  @@index([clinicId])
}

model PasswordResetToken {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}
```

---

## API Endpoints

### Phase 1 (Current Scope)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/session` | Get current session | Yes |
| POST | `/api/auth/password/change` | Change password (logged in) | Yes |

### Future Phases

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| POST | `/api/auth/refresh` | Refresh session token | Phase 2 |
| POST | `/api/auth/password/reset-request` | Request password reset | Phase 2 |
| POST | `/api/auth/password/reset` | Complete password reset | Phase 2 |

### Request/Response Examples

#### Login

```typescript
// POST /api/auth/login
// Request
{
  email: "user@clinic.com",
  password: "SecurePassword123!",
  rememberMe?: boolean
}

// Response (Success)
{
  success: true,
  data: {
    user: {
      id: "...",
      email: "user@clinic.com",
      name: "John Doe",
      role: "clinic_admin",
      clinicId: "...",
      clinicIds: ["..."]
    }
  }
}

// Response (Error)
{
  success: false,
  error: {
    code: "INVALID_CREDENTIALS",
    message: "Invalid email or password"
  }
}
```

#### Password Reset Request

```typescript
// POST /api/auth/password/reset-request
// Request
{
  email: "user@clinic.com"
}

// Response (always success to prevent email enumeration)
{
  success: true,
  message: "If the email exists, a reset link has been sent"
}
```

---

## Business Rules

### Password Policy

#### Phase 1 (Current)

| Requirement | Value |
|-------------|-------|
| Minimum length | 8 characters |
| Uppercase letters | At least 1 |
| Lowercase letters | At least 1 |
| Numbers | At least 1 |

#### Future Enhancements

| Requirement | Value | Phase |
|-------------|-------|-------|
| Special characters | At least 1 | Phase 2 |
| Password history | Cannot reuse last 5 | Phase 2 |
| Maximum age | 90 days | Phase 2 |

### Password Validation Schema

```typescript
import { z } from 'zod';

// Phase 1: Basic password requirements for on-premises deployment
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');
```

### Session Rules

| Rule | Value | Notes |
|------|-------|-------|
| Standard session | 8 hours | Normal workday |
| Remember me | 30 days | User-selected option |
| Idle timeout | 30 minutes | Auto-logout on inactivity |
| Absolute timeout | 12 hours | Force re-login regardless of activity |

### Failed Login Handling

1. Track failed attempts per user
2. Lock account after 5 consecutive failures
3. Lock duration: 15 minutes
4. Reset counter on successful login
5. Alert clinic admin after repeated lockouts

### Token Handling

- JWT tokens stored in HTTP-only cookies (not accessible via JavaScript)
- CSRF token required for state-changing requests
- Token contains: userId, clinicId, role, permissions
- No refresh tokens (session-based approach)

---

## UI Components

| Component | Purpose |
|-----------|---------|
| `LoginForm` | Email/password form with validation |
| `PasswordResetForm` | Reset request and completion forms |
| `PasswordChangeForm` | In-app password change |
| `SessionWarning` | Idle timeout warning modal |
| `MFAPrompt` | MFA code entry (future) |

---

## MFA Implementation (Phase 3 - Future)

> **Status**: Deferred to Phase 3. On-premises deployment with physical access control reduces immediate MFA need.

```typescript
// MFA flow when implemented
interface MFAFlow {
  // Step 1: Primary authentication
  primaryAuth: {
    method: 'credentials';
    result: 'requires_mfa' | 'authenticated';
  };

  // Step 2: Secondary authentication
  secondaryAuth: {
    method: 'totp' | 'sms' | 'email';
    codeLength: 6;
    expiresIn: 300; // 5 minutes
  };

  // Bypass scenarios
  bypass: {
    trustedDevice: boolean;
    trustedDuration: 30; // Days
  };
}
```

---

## Dependencies

### Internal
- None (this is the foundation)

### External
- NextAuth.js - Authentication framework
- bcrypt - Password hashing
- MongoDB - User storage

---

## Related Documentation

- [Parent: Auth & Authorization](../../)
- [AUTH-PATTERNS.md](../../../../guides/AUTH-PATTERNS.md) - Code patterns
- [Role System](../role-system/) - Role definitions
- [Data Isolation](../data-isolation/) - Clinic scoping

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented
