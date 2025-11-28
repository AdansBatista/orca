# Outgoing Records Preparation

> **Sub-Area**: [Records Requests](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Outgoing Records Preparation manages the compilation and delivery of patient records when requested by other providers, patients themselves, or third parties. It ensures complete record packages are assembled, reviewed for quality, and delivered securely through the requester's preferred method while maintaining compliance with regulations.

---

## Core Requirements

- [ ] Log incoming release requests with requester details
- [ ] Identify and compile required record components
- [ ] Support records package builder for document selection
- [ ] Enable quality review before release
- [ ] Track preparation time for staff productivity
- [ ] Support multiple secure delivery methods
- [ ] Generate delivery confirmation and audit trail

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/records-requests` | `records:create` | Log outgoing request |
| POST | `/api/records-requests/:id/prepare` | `records:prepare` | Start preparation |
| GET | `/api/records-requests/:id/components` | `records:read` | Get available components |
| POST | `/api/records-requests/:id/components` | `records:prepare` | Add components to package |
| POST | `/api/records-requests/:id/review` | `records:authorize` | Submit for review |
| POST | `/api/records-requests/:id/approve` | `records:authorize` | Approve for delivery |
| POST | `/api/records-requests/:id/deliver` | `records:send` | Record delivery |

---

## Data Model

Uses the shared RecordsRequest model with direction = OUTGOING.

**Records Package Components:**

| Component | Description |
|-----------|-------------|
| Treatment Summary | Overview of treatment provided |
| Clinical Notes | Progress notes and observations |
| Treatment Plan | Original plan and modifications |
| Diagnostic X-rays | All X-ray images |
| Clinical Photos | Photography series |
| Consent Forms | Signed treatment consents |
| Financial Summary | Payment history (if requested) |
| Retention Instructions | Post-treatment guidelines |

```prisma
model RecordsDeliveryLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  requestId     String   @db.ObjectId

  // Delivery details
  deliveryMethod    DeliveryMethod
  deliveryAddress   String?
  deliveredAt       DateTime

  // Tracking
  trackingNumber    String?
  confirmationCode  String?
  deliveryStatus    DeliveryStatus @default(SENT)

  // Content
  documentCount     Int?
  imageCount        Int?
  totalPages        Int?

  // Confirmation
  receivedConfirmation  Boolean  @default(false)
  confirmedAt           DateTime?

  // Audit
  sentBy        String   @db.ObjectId

  @@index([requestId])
}
```

---

## Business Rules

- Authorization must be verified before preparation begins
- Minimum necessary principle: only release what's authorized
- Quality review required before delivery (configurable by clinic)
- Delivery method matches requester preference
- All deliveries logged with method, date, and confirmation
- Certified mail for physical deliveries requiring proof
- Portal delivery generates secure download link with expiration
- Transfer patients get comprehensive transfer package

---

## Dependencies

**Depends On:**
- Authorization Verification (valid consent)
- Document Management (source documents)
- Imaging Management (X-rays and photos)
- Treatment Management (treatment records)

**Required By:**
- Transfer Status Tracking (delivery tracking)
- Fee Management (preparation billing)
- Compliance Monitoring (release compliance)

---

## Notes

- Package builder UI allows selecting specific documents
- Redaction tools for sensitive information if needed
- Batch delivery for same-destination requests
- Consider watermarking released documents

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
