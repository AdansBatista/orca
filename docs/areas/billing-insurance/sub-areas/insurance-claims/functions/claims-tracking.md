# Claims Tracking

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Claims Tracking monitors claim status throughout the insurance payment lifecycle. This function provides visibility into submitted claims, aging reports, automatic status updates from clearinghouse, and follow-up reminders for aging claims. It ensures no claim falls through the cracks and supports timely intervention on problematic claims.

---

## Core Requirements

- [ ] Track claim status (submitted, accepted, pending, paid, denied)
- [ ] Generate claim aging reports (30/60/90+ days)
- [ ] Receive automatic status updates from clearinghouse
- [ ] Flag claims requiring attention (rejections, aging)
- [ ] Search and filter claims by multiple criteria
- [ ] Create follow-up tasks for aging claims
- [ ] Track claim lifecycle history
- [ ] Dashboard view of claims pipeline

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/insurance/claims` | `insurance:read` | List claims with filters |
| GET | `/api/insurance/claims/:id/history` | `insurance:read` | Get claim status history |
| GET | `/api/insurance/claims/aging` | `insurance:read` | Get aging report |
| GET | `/api/insurance/claims/summary` | `insurance:read` | Get pipeline summary |
| GET | `/api/insurance/claims/attention` | `insurance:read` | Claims needing attention |
| POST | `/api/insurance/claims/:id/note` | `insurance:update` | Add tracking note |
| POST | `/api/insurance/claims/:id/follow-up` | `insurance:update` | Create follow-up task |

---

## Data Model

```prisma
model ClaimStatusHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  claimId       String   @db.ObjectId

  // Status change
  previousStatus ClaimStatus?
  newStatus      ClaimStatus
  changedAt      DateTime @default(now())
  changedBy      String?  @db.ObjectId

  // Details
  source         StatusChangeSource @default(MANUAL)
  notes          String?
  errorCode      String?
  errorMessage   String?
  clearinghouseRef String?

  // Relations
  claim    InsuranceClaim @relation(fields: [claimId], references: [id])

  @@index([claimId])
  @@index([changedAt])
}

model ClaimNote {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  claimId       String   @db.ObjectId

  // Note details
  noteType      ClaimNoteType
  content       String
  isInternal    Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId

  @@index([claimId])
  @@index([createdAt])
}

enum StatusChangeSource {
  MANUAL
  CLEARINGHOUSE
  SYSTEM
  EOB
}

enum ClaimNoteType {
  GENERAL
  FOLLOW_UP
  PAYER_CONTACT
  APPEAL
  RESOLUTION
}
```

---

## Business Rules

- Claims over 30 days without response flagged for follow-up
- Rejected claims require immediate attention (within 24 hours)
- Status updates from clearinghouse processed automatically
- Claims aging beyond timely filing limit elevated to urgent
- Weekly aging report generated automatically
- Track days in each status for payer performance metrics
- Claim notes visible to all billing staff

---

## Dependencies

**Depends On:**
- Claims Submission (claims to track)
- Clearinghouse Integration (status updates)

**Required By:**
- Denial Management (denied claims)
- EOB Processing (claim matching)
- Collections Management (insurance AR tracking)

---

## Notes

- Implement webhook receiver for clearinghouse status updates
- Consider real-time claim status checks via clearinghouse API
- Build dashboard widgets for at-a-glance pipeline view
- Alert billing manager for claims approaching timely filing deadline

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
