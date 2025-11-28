# Renewal Management

> **Sub-Area**: [Contract Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Renewal Management handles contract expirations, renewals, and termination workflows. This function provides automated alerts before contract expiration, tracks auto-renewal clauses, manages termination notice requirements, and supports the renewal decision process. Ensures practices never miss renewal deadlines and have time to renegotiate or terminate unfavorable agreements.

---

## Core Requirements

- [ ] Track contract expiration and renewal dates
- [ ] Generate automated alerts at 90/60/30 days before expiration
- [ ] Identify and flag auto-renewal contracts
- [ ] Track termination notice requirements and deadlines
- [ ] Support renewal workflow (review, decision, action)
- [ ] Document renewal decisions and outcomes
- [ ] Create renewed contract records linked to original
- [ ] Track non-renewal with termination notice sent
- [ ] Calendar integration for renewal dates
- [ ] Dashboard of upcoming renewals by timeframe

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/contracts/expiring` | `contract:read` | List expiring contracts |
| GET | `/api/vendors/contracts/renewals` | `contract:read` | Renewal calendar view |
| POST | `/api/vendors/contracts/:id/renew` | `contract:update` | Renew contract |
| POST | `/api/vendors/contracts/:id/terminate` | `contract:update` | Initiate termination |
| PUT | `/api/vendors/contracts/:id/renewal-decision` | `contract:update` | Record decision |
| GET | `/api/vendors/contracts/auto-renewal` | `contract:read` | Auto-renewal contracts |

---

## Data Model

```prisma
// Fields within Contract model
model Contract {
  // ... other fields

  // Renewal Tracking
  endDate       DateTime?
  renewalDate   DateTime?
  autoRenewal   Boolean  @default(false)
  renewalTerms  String?
  terminationNotice Int? // Days notice required

  // Renewal History
  renewedFromId String?  @db.ObjectId  // Original contract
  renewedToId   String?  @db.ObjectId  // Renewed contract

  // ... relations
}

// Could also track as separate entity
model ContractRenewal {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  contractId    String   @db.ObjectId

  // Renewal Decision
  decision      RenewalDecision
  decisionDate  DateTime
  decisionBy    String   @db.ObjectId
  notes         String?

  // If Renewed
  newContractId String?  @db.ObjectId

  // If Terminated
  terminationDate DateTime?
  terminationNoticeDate DateTime?

  @@index([contractId])
}

enum RenewalDecision {
  RENEW
  RENEGOTIATE
  TERMINATE
  PENDING
}
```

---

## Business Rules

- Alert schedule: 90 days (initial), 60 days (reminder), 30 days (urgent)
- Auto-renewal contracts require earlier review (add termination notice days)
- Termination notice must be sent before required deadline
- Renewed contracts link to original for history
- Status changes: ACTIVE → RENEWED or EXPIRED or TERMINATED
- Renewal creates new contract, original marked RENEWED
- Dashboard shows contracts needing attention this month/quarter
- Escalate contracts without decision within 30 days of expiration

---

## Dependencies

**Depends On:**
- Contract Creation (contract records)
- Email Service (renewal notifications)
- Calendar Integration (optional)

**Required By:**
- Vendor Performance (contract review at renewal)
- Financial Management (budget planning)

---

## Notes

- Calendar export for Outlook/Google Calendar integration
- Notification recipients configurable per contract
- Consider vendor performance review as part of renewal workflow
- Track cost changes during renegotiation
- Document competitive bids if considering vendor change
- Legal review may be required for significant contracts

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
