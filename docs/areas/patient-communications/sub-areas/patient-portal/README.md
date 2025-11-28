# Patient Portal & Self-Service

> **Sub-Area**: Patient Portal & Self-Service
>
> **Area**: Patient Communications (2.4)
>
> **Purpose**: Self-service portal for patients to manage appointments, view treatment progress, handle billing, and access their health information

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | High |
| **Functions** | 5 |

---

## Overview

The Patient Portal provides a secure, patient-facing web application where patients can manage their orthodontic care. It offers self-service capabilities for appointments, forms, payments, and treatment progress tracking—reducing staff workload while improving patient engagement.

### Key Capabilities

- Secure authentication with magic links or password
- Appointment viewing and self-scheduling
- Treatment progress and photo access
- Online bill pay and statement access
- Form completion and document signing
- Secure messaging with practice

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Portal Authentication](./functions/portal-authentication.md) | Secure login and account management | Critical |
| 2 | [Patient Profile Management](./functions/patient-profile-management.md) | View and update patient information | High |
| 3 | [Appointment Self-Service](./functions/appointment-self-service.md) | View, request, and manage appointments | High |
| 4 | [Treatment Progress Access](./functions/treatment-progress-access.md) | View treatment photos and progress | Medium |
| 5 | [Payment & Billing Self-Service](./functions/payment-billing-self-service.md) | Pay bills and view statements | High |

---

## Function Details

### Portal Authentication

Secure login system for patient portal access.

**Key Features:**
- Magic link authentication (passwordless)
- Password-based login option
- Multi-factor authentication (optional)
- Session management
- Family account linking
- Password reset flow

---

### Patient Profile Management

Allow patients to view and update their information.

**Key Features:**
- View demographic information
- Update contact details (phone, email, address)
- Manage communication preferences
- View insurance information
- Emergency contact management
- Update notification settings

---

### Appointment Self-Service

Self-service appointment management.

**Key Features:**
- View upcoming appointments
- View appointment history
- Request new appointments
- Request reschedules/cancellations
- Add appointments to calendar
- Pre-appointment instructions

---

### Treatment Progress Access

View treatment photos and progress information.

**Key Features:**
- Before/during/after photo galleries
- Treatment timeline view
- Progress milestones
- Care instructions by phase
- Educational content links
- Download photos

---

### Payment & Billing Self-Service

Online payment and billing access.

**Key Features:**
- View current balance
- View and download statements
- Make one-time payments
- Set up autopay
- View payment history
- Download receipts

---

## Data Model

### Prisma Schema

```prisma
model PortalAccount {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  patientId       String            @db.ObjectId

  // Authentication
  email           String
  passwordHash    String?           // Null for magic-link-only

  // Account status
  isActive        Boolean           @default(true)
  isVerified      Boolean           @default(false)

  // MFA
  mfaEnabled      Boolean           @default(false)
  mfaSecret       String?

  // Tokens
  magicLinkToken  String?
  magicLinkExpiry DateTime?
  resetToken      String?
  resetExpiry     DateTime?

  // Preferences
  preferences     Json?

  // Audit
  lastLoginAt     DateTime?
  loginCount      Int               @default(0)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  patient         Patient           @relation(fields: [patientId], references: [id])
  sessions        PortalSession[]

  @@unique([clinicId, email])
  @@unique([clinicId, patientId])
}

model PortalSession {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  accountId       String            @db.ObjectId

  // Session data
  token           String            @unique
  userAgent       String?
  ipAddress       String?

  // Expiry
  expiresAt       DateTime

  // Status
  isActive        Boolean           @default(true)
  revokedAt       DateTime?

  createdAt       DateTime          @default(now())

  // Relations
  account         PortalAccount     @relation(fields: [accountId], references: [id])

  @@index([accountId])
  @@index([token])
}

model PortalActivity {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  accountId       String            @db.ObjectId

  // Activity details
  action          String            // LOGIN, VIEW_APPOINTMENT, MAKE_PAYMENT, etc.
  resource        String?           // Resource type accessed
  resourceId      String?           // Resource ID accessed

  // Request info
  ipAddress       String?
  userAgent       String?

  // Additional data
  metadata        Json?

  createdAt       DateTime          @default(now())

  @@index([accountId, createdAt])
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portal/auth/login` | Login with email/password |
| POST | `/api/portal/auth/magic-link` | Request magic link |
| POST | `/api/portal/auth/verify-magic-link` | Verify magic link token |
| POST | `/api/portal/auth/logout` | Logout |
| POST | `/api/portal/auth/reset-password` | Request password reset |
| GET | `/api/portal/profile` | Get patient profile |
| PUT | `/api/portal/profile` | Update patient profile |
| GET | `/api/portal/appointments` | Get appointments |
| POST | `/api/portal/appointments/request` | Request appointment |
| GET | `/api/portal/treatment/progress` | Get treatment progress |
| GET | `/api/portal/treatment/photos` | Get treatment photos |
| GET | `/api/portal/billing/balance` | Get current balance |
| GET | `/api/portal/billing/statements` | Get statements |
| POST | `/api/portal/billing/payment` | Make payment |
| GET | `/api/portal/billing/receipts` | Get payment receipts |

---

## UI Components (Patient-Facing)

| Component | Description |
|-----------|-------------|
| `PortalLogin` | Login page with magic link option |
| `PortalDashboard` | Patient home dashboard |
| `AppointmentsList` | Upcoming and past appointments |
| `AppointmentRequestForm` | Request new appointment |
| `TreatmentTimeline` | Visual treatment progress |
| `PhotoGallery` | Treatment photo gallery |
| `BillingDashboard` | Balance and payment options |
| `PaymentForm` | Make payment form |
| `StatementsList` | View and download statements |
| `ProfileEditor` | Edit patient information |
| `PreferencesPanel` | Communication preferences |

---

## Business Rules

1. **Email Verification**: Email must be verified before full portal access
2. **Session Timeout**: Sessions expire after 30 minutes of inactivity
3. **Failed Login Lockout**: Account locked after 5 failed attempts (30 min)
4. **Minor Access**: Patients under 18 require guardian portal account
5. **Photo Access**: Only treatment photos, no clinical notes
6. **Appointment Requests**: Subject to clinic approval, not immediate booking
7. **Payment Minimums**: Minimum payment amount of $10

---

## Security Considerations

- Magic links expire after 15 minutes
- Session tokens rotated on each request
- All activity logged for audit
- PHI access minimized to necessary data
- HTTPS required for all connections
- CSRF protection on all forms

---

## Dependencies

- **Authentication**: For portal authentication integration
- **CRM & Onboarding**: For patient data
- **Booking & Scheduling**: For appointment management
- **Billing & Insurance**: For payment processing
- **Imaging Management**: For treatment photos

---

## Related Documentation

- [Patient Communications Overview](../../README.md)
- [Messaging Hub](../messaging-hub/)
- [Booking & Scheduling](../../../booking-scheduling/)
