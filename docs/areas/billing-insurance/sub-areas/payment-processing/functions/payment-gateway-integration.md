# Payment Gateway Integration

> **Sub-Area**: [Payment Processing](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Payment Gateway Integration establishes secure connections to payment processors (Stripe, Square) for processing patient payments. This function manages gateway configuration, handles API authentication, processes webhooks for payment events, and supports multi-location merchant accounts. It serves as the foundation for all payment operations in Orca.

---

## Core Requirements

- [ ] Stripe Connect integration for primary payment processing
- [ ] Square API integration as backup gateway
- [ ] Multi-location support (separate merchant accounts per clinic)
- [ ] Webhook handling for payment events
- [ ] Gateway health monitoring and alerting
- [ ] Automatic failover between gateways
- [ ] Secure credential storage
- [ ] Transaction logging for reconciliation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/settings/payment-gateways` | `settings:read` | List configured gateways |
| POST | `/api/settings/payment-gateways/stripe/connect` | `settings:admin` | Connect Stripe account |
| POST | `/api/settings/payment-gateways/square/connect` | `settings:admin` | Connect Square account |
| GET | `/api/settings/payment-gateways/status` | `settings:read` | Check gateway status |
| PUT | `/api/settings/payment-gateways/:gateway/config` | `settings:admin` | Update gateway config |
| POST | `/api/webhooks/stripe` | `webhook` | Stripe webhook handler |
| POST | `/api/webhooks/square` | `webhook` | Square webhook handler |

---

## Data Model

```prisma
model PaymentGatewayConfig {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Gateway
  gateway       PaymentGateway
  isPrimary     Boolean  @default(false)
  isEnabled     Boolean  @default(true)

  // Credentials (encrypted)
  accountId     String   // Stripe account ID or Square merchant ID
  accessToken   String?  // Encrypted
  refreshToken  String?  // Encrypted
  publicKey     String?

  // Webhook
  webhookSecret String?  // Encrypted
  webhookEndpoint String?

  // Configuration
  supportedMethods PaymentMethodType[]
  processingFeePercent Decimal?
  processingFeeFixed   Decimal?

  // Health
  lastHealthCheck DateTime?
  healthStatus    GatewayHealthStatus @default(UNKNOWN)
  lastError       String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, gateway])
  @@index([clinicId])
}

enum PaymentGateway {
  STRIPE
  SQUARE
  MANUAL
}

enum GatewayHealthStatus {
  HEALTHY
  DEGRADED
  DOWN
  UNKNOWN
}
```

---

## Business Rules

- Each clinic must have at least one payment gateway configured
- Stripe is primary gateway; Square is optional backup
- Credentials stored encrypted, never logged
- Webhook signatures validated on every request
- Health checks run every 5 minutes
- Automatic failover if primary gateway down > 5 minutes
- Processing fees tracked for financial reporting
- OAuth tokens refreshed before expiration

---

## Dependencies

**Depends On:**
- Auth & Authorization (admin permissions)
- Clinic Settings (clinic configuration)

**Required By:**
- Card-Present Transactions (terminal payments)
- Card-Not-Present Transactions (online payments)
- Recurring Billing Engine (automated charges)
- Refund Processing (refunds)

---

## Notes

- Use Stripe Connect for multi-tenant architecture
- Implement idempotency keys for all payment operations
- Store webhook events for replay capability
- Monitor gateway latency and error rates
- PCI-DSS compliance maintained by gateway (SAQ-A eligibility)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
