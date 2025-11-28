# MFA Implementation

> **Sub-Area**: [Authentication](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Implements multi-factor authentication (MFA) as an additional security layer. Supports TOTP (authenticator apps), SMS codes, and email codes. Allows trusted device registration to skip MFA for recognized devices. This is a future enhancement - not required for initial release.

---

## Core Requirements

- [ ] Support TOTP via authenticator apps (Google Authenticator, Authy)
- [ ] Support SMS code delivery (backup method)
- [ ] Support email code delivery (backup method)
- [ ] Generate and store TOTP secret per user
- [ ] Display QR code for authenticator setup
- [ ] Validate 6-digit codes with time window tolerance
- [ ] Support backup/recovery codes (one-time use)
- [ ] Allow trusted device registration (skip MFA)
- [ ] Require MFA re-verification for sensitive operations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/auth/mfa/setup` | Authenticated | Initialize MFA setup |
| POST | `/api/auth/mfa/verify-setup` | Authenticated | Verify setup with first code |
| POST | `/api/auth/mfa/verify` | Partial auth | Verify MFA code during login |
| POST | `/api/auth/mfa/disable` | Authenticated | Disable MFA (requires code) |
| GET | `/api/auth/mfa/recovery-codes` | Authenticated | Generate recovery codes |

---

## Data Model

```prisma
model UserMFA {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @unique @db.ObjectId

  // TOTP
  totpSecret   String?  // Encrypted TOTP secret
  totpEnabled  Boolean  @default(false)

  // Backup methods
  smsEnabled   Boolean  @default(false)
  emailEnabled Boolean  @default(false)

  // Recovery codes (hashed)
  recoveryCodes String[]

  // Trusted devices
  trustedDevices TrustedDevice[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model TrustedDevice {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userMfaId   String   @db.ObjectId
  deviceHash  String   // Hash of device fingerprint
  name        String   // "Chrome on Windows"
  lastUsed    DateTime
  expiresAt   DateTime // 30 days from last use

  userMfa     UserMFA  @relation(fields: [userMfaId], references: [id])
}
```

---

## Business Rules

- TOTP codes valid for 30-second windows (±1 window tolerance)
- SMS/email codes valid for 5 minutes
- Recovery codes are one-time use (10 codes generated)
- Trusted devices expire after 30 days of non-use
- Disabling MFA requires current code verification
- Super admin can reset user MFA in emergencies
- Log all MFA events: enable, disable, verify success/failure

---

## Dependencies

**Depends On:**
- User Login (triggers MFA flow)
- Session Management
- SMS service (for SMS codes)
- Email service (for email codes)

**Required By:**
- High-security operations (payment processing, user management)

---

## Notes

- Use `otplib` library for TOTP generation/verification
- Encrypt TOTP secret at rest
- Future phase - not required for MVP
- Consider: mandatory MFA for admin roles
