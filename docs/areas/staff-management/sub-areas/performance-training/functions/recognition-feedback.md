# Recognition & Feedback

> **Sub-Area**: [Performance & Training](../) | **Status**: 📋 Planned | **Priority**: Low

---

## Overview

Enable peer recognition and ongoing feedback between staff members. Supports kudos, thank-you messages, achievement awards, and service anniversaries. Creates a positive workplace culture through visible appreciation while keeping constructive feedback private.

---

## Core Requirements

- [ ] Peer recognition (kudos/thank you)
- [ ] Manager recognition and awards
- [ ] Patient compliment tracking
- [ ] Recognition badges/awards system
- [ ] Public recognition feed/wall
- [ ] Anniversary and milestone recognition
- [ ] Private constructive feedback option
- [ ] Recognition statistics and reporting

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/recognition` | `staff:read` | Get recognition feed |
| GET | `/api/staff/:id/recognition` | `staff:read` | Get staff recognition |
| POST | `/api/staff/:id/recognition` | `staff:recognize` | Give recognition |
| DELETE | `/api/staff/recognition/:id` | `staff:manage` | Delete recognition |
| GET | `/api/staff/:id/recognition/received` | `staff:read` | Recognition received |
| GET | `/api/staff/:id/recognition/given` | `staff:read` | Recognition given |
| GET | `/api/staff/recognition/stats` | `staff:read` | Recognition stats |
| GET | `/api/staff/recognition/anniversaries` | `staff:read` | Upcoming anniversaries |

---

## Data Model

```prisma
model Recognition {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  recipientId   String   @db.ObjectId
  giverId       String   @db.ObjectId
  recognitionType RecognitionType

  title         String?
  message       String
  badgeCode     String?

  source        RecognitionSource @default(PEER)
  patientName   String?

  isPublic      Boolean  @default(true)
  isAnonymous   Boolean  @default(false)

  createdAt DateTime @default(now())

  @@index([recipientId])
  @@index([giverId])
  @@index([createdAt])
  @@index([recognitionType])
}

enum RecognitionType {
  KUDOS
  THANK_YOU
  GREAT_JOB
  TEAM_PLAYER
  PATIENT_HERO
  INNOVATION
  MILESTONE
  ANNIVERSARY
  BADGE
  CUSTOM
}

enum RecognitionSource {
  PEER
  MANAGER
  PATIENT
  SYSTEM
}
```

---

## Business Rules

- All staff can give peer recognition
- Manager recognition highlighted differently
- Patient compliments linked to survey/feedback
- System auto-generates anniversary recognition
- Anonymous option available for sensitive appreciation
- Constructive feedback is always private
- Recognition cannot be edited after submission
- Managers can delete inappropriate recognition

### Recognition Types

| Type | Description | Who Can Give |
|------|-------------|--------------|
| Kudos | General appreciation | All staff |
| Thank You | Specific thanks | All staff |
| Great Job | Performance recognition | All staff |
| Team Player | Collaboration highlight | All staff |
| Patient Hero | Patient-focused excellence | Managers |
| Milestone | Achievement celebration | System/Manager |
| Anniversary | Service tenure | System |

### Badge System (Optional)

| Badge | Criteria | Description |
|-------|----------|-------------|
| Rising Star | First 90 days excellence | New hire standout |
| Patient Champion | High satisfaction scores | Patient-focused |
| Team Builder | Frequent collaboration | Team-oriented |
| Innovation | Process improvement | Creative solutions |
| Mentor | Training contributions | Knowledge sharing |

---

## Dependencies

**Depends On:**
- Employee Profiles
- Patient Feedback (for patient compliments)

**Required By:**
- Employee engagement metrics
- Culture initiatives

---

## Notes

- Consider: recognition leaderboards (opt-in)
- Monthly/quarterly recognition summaries
- Integration with practice communication channels
- Avoid gamification that feels forced
