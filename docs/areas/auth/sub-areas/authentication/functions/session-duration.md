# Session Duration

> **Sub-Area**: [Authentication](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Manages session timeout rules including idle timeout (30 minutes), absolute timeout (12 hours), and remember-me functionality (30 days). Tracks user activity to detect idle sessions and displays warning before automatic logout.

---

## Core Requirements

- [ ] Track last activity timestamp in session
- [ ] Check idle timeout (30 min) on each request
- [ ] Enforce absolute timeout (12 hours) regardless of activity
- [ ] Support remember-me for 30-day sessions
- [ ] Show warning modal 2 minutes before idle timeout
- [ ] Allow session extension from warning modal
- [ ] Auto-logout when timeout reached
- [ ] Clear session data on timeout

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/auth/extend-session` | Authenticated | Extend session on user activity |

---

## Data Model

No persistent model - timeout configuration in constants:

```typescript
// lib/auth/config.ts
export const SESSION_CONFIG = {
  standard: 8 * 60 * 60,           // 8 hours in seconds
  rememberMe: 30 * 24 * 60 * 60,   // 30 days in seconds
  idleTimeout: 30 * 60,            // 30 minutes in seconds
  absoluteTimeout: 12 * 60 * 60,   // 12 hours in seconds
  warningBefore: 2 * 60,           // Show warning 2 min before timeout
};
```

---

## Business Rules

- Idle timeout: 30 minutes without activity
- Absolute timeout: 12 hours maximum session length
- Remember-me extends session but not absolute timeout
- Activity = any authenticated API call or user interaction
- Warning shown 2 minutes before idle logout
- User can click "Stay Logged In" to reset idle timer
- Absolute timeout cannot be extended (must re-login)

---

## Dependencies

**Depends On:**
- Session Management
- User Login

**Required By:**
- All authenticated pages (for timeout warning)

---

## Notes

- Client-side timer tracks idle timeout
- Server validates both timestamps on each request
- SessionWarning component displays countdown modal
- Consider: pause timeout during active form editing
