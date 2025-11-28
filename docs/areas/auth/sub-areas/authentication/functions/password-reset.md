# Password Reset

> **Sub-Area**: [Authentication](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Enables self-service password recovery for users who have forgotten their password. Generates secure reset tokens, sends reset links via email, validates tokens, and allows password update. Prevents email enumeration attacks by always showing success message.

---

## Core Requirements

- [ ] Accept email address for reset request
- [ ] Generate cryptographically secure reset token
- [ ] Store hashed token with expiration (1 hour)
- [ ] Send reset link via email
- [ ] Always show success message (prevent email enumeration)
- [ ] Validate token on reset page load
- [ ] Accept new password meeting policy requirements
- [ ] Invalidate token after use (one-time use)
- [ ] Log password reset events for audit

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/auth/password/reset-request` | None | Request password reset email |
| GET | `/api/auth/password/reset/[token]` | None | Validate reset token |
| POST | `/api/auth/password/reset` | None | Complete password reset |

### Reset Request

```typescript
// POST /api/auth/password/reset-request
{ email: string }

// Response (always success to prevent enumeration)
{ success: true, message: "If the email exists, a reset link has been sent" }
```

### Complete Reset

```typescript
// POST /api/auth/password/reset
{
  token: string;
  password: string;
  confirmPassword: string;
}
```

---

## Data Model

```prisma
model PasswordResetToken {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  token     String   @unique  // Hashed token
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}
```

---

## Business Rules

- Token valid for 1 hour only
- Token is one-time use (mark usedAt on completion)
- Store token hashed (like password)
- Email contains link: `/auth/reset-password?token=xxx`
- Rate limit: max 3 requests per email per hour
- New password must meet password policy
- Cannot reuse last 5 passwords
- Invalidate all other reset tokens for user on success
- Log AUTH_PASSWORD_RESET event

---

## Dependencies

**Depends On:**
- User model
- Password Policy function
- Email service (Patient Communications area)

**Required By:**
- Login page (forgot password link)

---

## Notes

- Use crypto.randomBytes(32) for token generation
- Hash token before storing (user receives unhashed)
- Consider: require security questions for additional verification
