# Coordinator Assignment

> **Sub-Area**: [Lead Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Coordinator Assignment manages the distribution of leads to treatment coordinators, supporting both manual assignment and automatic assignment rules. It ensures balanced workloads, tracks assignment history, and handles coordinator availability including out-of-office scenarios.

---

## Core Requirements

- [ ] Manually assign leads to treatment coordinators
- [ ] Configure automatic assignment rules (round-robin, capacity-based)
- [ ] Track assignment history with timestamps and reason
- [ ] Display coordinator workload for balanced distribution
- [ ] Handle out-of-office with temporary reassignment or queue hold
- [ ] Support lead transfer between coordinators with notification
- [ ] Filter pipeline view by assigned coordinator

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/leads/:id/assign` | `lead:assign` | Assign lead to coordinator |
| POST | `/api/leads/:id/transfer` | `lead:assign` | Transfer lead to another coordinator |
| GET | `/api/coordinators/workload` | `lead:read` | Get coordinator workload stats |
| GET | `/api/assignment-rules` | `lead:configure` | List assignment rules |
| POST | `/api/assignment-rules` | `lead:configure` | Create assignment rule |
| PUT | `/api/assignment-rules/:id` | `lead:configure` | Update assignment rule |
| POST | `/api/coordinators/:id/out-of-office` | `lead:configure` | Set out-of-office status |

---

## Data Model

```prisma
model AssignmentRule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Rule definition
  name          String
  type          AssignmentRuleType
  priority      Int      @default(0)
  isActive      Boolean  @default(true)

  // Rule criteria (when this rule applies)
  sourceCategories    LeadSourceCategory[]  // Empty = all sources
  treatmentInterests  TreatmentInterest[]   // Empty = all interests

  // Assignment targets
  coordinatorIds      String[]  @db.ObjectId

  // Round-robin tracking
  lastAssignedIndex   Int      @default(0)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([isActive])
}

enum AssignmentRuleType {
  ROUND_ROBIN       // Distribute evenly
  CAPACITY_BASED    // Consider current workload
  SOURCE_SPECIFIC   // Route by lead source
  RANDOM            // Random selection
}
```

---

## Business Rules

- All active leads must have an assigned coordinator (or be in unassigned queue)
- Round-robin assignment rotates through available coordinators in order
- Capacity-based assignment considers active lead count per coordinator
- Out-of-office coordinators excluded from new assignments
- Lead transfer requires notification to both coordinators
- Assignment changes logged in LeadActivity
- Unassigned queue visible to all coordinators for manual pickup

---

## Dependencies

**Depends On:**
- Auth (user authentication, coordinator role)
- Staff Management (coordinator availability)
- Lead Capture (leads to assign)

**Required By:**
- Lead Capture (auto-assignment on creation)
- Lead Analytics (coordinator performance metrics)

---

## Notes

- Consider implementing skills-based routing (e.g., Spanish-speaking leads)
- Workload should factor in lead stage (pending decision weighs more than new lead)
- Provide coordinator dashboard with their assigned leads prioritized
- Out-of-office should optionally set a backup coordinator

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
