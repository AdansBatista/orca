# Onboarding Checklist Management

> **Sub-Area**: [Staff Training](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Onboarding Checklist Management provides structured new employee orientation and training workflows. It manages role-specific onboarding checklists, tracks completion of orientation tasks, assigns mentors, schedules training activities, and ensures new hires complete all required compliance training and documentation within their onboarding period.

---

## Core Requirements

- [ ] Create onboarding checklist templates by role
- [ ] Generate personalized checklists for new hires
- [ ] Track task completion with timestamps
- [ ] Assign mentors and supervisors to new hires
- [ ] Schedule and track 30-day and 90-day reviews
- [ ] Collect required documentation (I-9, certifications, etc.)
- [ ] Link compliance training assignments to onboarding
- [ ] Monitor onboarding progress and completion rates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/onboarding` | `training:view_all` | List onboarding records |
| POST | `/api/compliance/onboarding` | `training:manage` | Start onboarding for new hire |
| GET | `/api/compliance/onboarding/:id` | `training:view_all` | Get onboarding details |
| PUT | `/api/compliance/onboarding/:id` | `training:manage` | Update onboarding |
| POST | `/api/compliance/onboarding/:id/items/:itemId` | `training:view_own` | Complete checklist item |
| POST | `/api/compliance/onboarding/:id/review` | `training:manage` | Submit review notes |
| GET | `/api/compliance/onboarding/templates` | `training:read` | List checklist templates |
| POST | `/api/compliance/onboarding/templates` | `training:manage` | Create template |

---

## Data Model

```prisma
model OnboardingChecklist {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  // Checklist info
  templateId    String?  @db.ObjectId
  role          String   // Role being onboarded for
  startDate     DateTime
  targetCompletionDate DateTime

  // Progress
  status        OnboardingStatus @default(IN_PROGRESS)
  items         Json     // Array of checklist items with completion status
  completedItems Int     @default(0)
  totalItems    Int

  // Assignments
  mentorId      String?  @db.ObjectId
  supervisorId  String   @db.ObjectId

  // Reviews
  thirtyDayReviewDate DateTime?
  thirtyDayReviewNotes String?
  thirtyDayReviewedBy String? @db.ObjectId
  ninetyDayReviewDate DateTime?
  ninetyDayReviewNotes String?
  ninetyDayReviewedBy String? @db.ObjectId

  // Completion
  completedAt   DateTime?
  completedBy   String?  @db.ObjectId
  completionNotes String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic     Clinic @relation(fields: [clinicId], references: [id])
  user       User   @relation("OnboardingUser", fields: [userId], references: [id])
  mentor     User?  @relation("OnboardingMentor", fields: [mentorId], references: [id])
  supervisor User   @relation("OnboardingSupervisor", fields: [supervisorId], references: [id])

  @@index([clinicId])
  @@index([userId])
  @@index([status])
}

model OnboardingTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  role          String   // Role this template is for
  description   String?

  // Items
  items         Json     // Array of checklist items
  targetDays    Int      // Target completion in days

  // Training links
  requiredTraining String[] // Training program IDs to auto-assign

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([role])
}

enum OnboardingStatus {
  NOT_STARTED
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  TERMINATED
}
```

---

## Business Rules

- Onboarding phases and typical timeline:
  - Day 1: Administrative paperwork, handbook, system access, facility tour
  - Week 1: HIPAA, OSHA, infection control, fire safety training
  - Weeks 2-4: Role-specific training, shadowing, software training
  - Month 1-3: Competency assessments, 30-day and 90-day reviews
- Compliance training must be completed within first 7 days
- 30-day review is mandatory; 90-day review recommended
- Mentor assignment optional but recommended for clinical roles
- Incomplete onboarding at target date triggers supervisor alert
- Document collection (I-9, certifications) tracked separately in HR

---

## Dependencies

**Depends On:**
- Training Program Administration (links training assignments)
- Staff Management (new hire records, supervisor assignments)
- Auth & User Management (system access setup)

**Required By:**
- Training Compliance Reporting (onboarding metrics)
- Certification Management (collects initial certifications)

---

## Notes

- Day 1 items should be completable in first day orientation
- Consider integration with HR systems for employment documentation
- Mobile-friendly interface for new hires to track their progress
- Mentor should receive notification when assigned
- Onboarding completion is milestone for end of probationary period

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
