# Training Program Administration

> **Sub-Area**: [Staff Training](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Training Program Administration enables clinics to create, assign, and track completion of training programs for staff. It manages both required compliance training (HIPAA, OSHA, infection control) and professional development programs, supports training material delivery, tracks completion progress, and handles recurring training assignment automation.

---

## Core Requirements

- [ ] Create training program definitions with materials and assessments
- [ ] Assign training to staff by role or individual
- [ ] Track training progress and completion status
- [ ] Support recurring training schedules (annual, biennial)
- [ ] Manage training material content (documents, videos, links)
- [ ] Record quiz/assessment scores where applicable
- [ ] Auto-assign training based on role requirements
- [ ] Generate training completion certificates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/training/programs` | `training:read` | List training programs |
| POST | `/api/compliance/training/programs` | `training:manage` | Create program |
| PUT | `/api/compliance/training/programs/:id` | `training:manage` | Update program |
| GET | `/api/compliance/training/programs/:id` | `training:read` | Get program details |
| POST | `/api/compliance/training/programs/:id/assign` | `training:manage` | Assign to staff |
| POST | `/api/compliance/training/programs/:id/assign-role` | `training:manage` | Assign to role |
| GET | `/api/compliance/training/programs/:id/materials` | `training:view_own` | Get training materials |

---

## Data Model

```prisma
model TrainingProgram {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Program info
  name          String
  code          String   @unique
  category      TrainingCategory
  description   String?

  // Content
  content       String?  // Training material content/instructions
  materialUrls  String[] // Links to documents, videos
  duration      Int?     // Expected duration in minutes

  // Assessment
  hasAssessment Boolean  @default(false)
  passingScore  Int?     // Minimum score to pass
  assessmentQuestions Json? // Quiz questions if applicable

  // Settings
  frequency     TrainingFrequency
  isRequired    Boolean  @default(true)
  requiredForRoles String[] // Roles that must complete

  // Status
  isActive      Boolean  @default(true)

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic      Clinic @relation(fields: [clinicId], references: [id])
  assignments TrainingAssignment[]

  @@index([clinicId])
  @@index([category])
  @@index([isActive])
}

model TrainingAssignment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId
  programId     String   @db.ObjectId

  // Assignment info
  assignedDate  DateTime @default(now())
  dueDate       DateTime
  assignedBy    String?  @db.ObjectId

  // Completion
  status        TrainingStatus @default(ASSIGNED)
  startedAt     DateTime?
  completedAt   DateTime?
  completedBy   String?  @db.ObjectId

  // Assessment results
  score         Int?
  passed        Boolean?
  attempts      Int      @default(0)

  // Documentation
  certificateUrl String?
  notes         String?

  // For recurring training
  previousAssignmentId String? @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  user      User   @relation(fields: [userId], references: [id])
  program   TrainingProgram @relation(fields: [programId], references: [id])

  @@index([clinicId])
  @@index([userId])
  @@index([programId])
  @@index([status])
  @@index([dueDate])
}

enum TrainingCategory {
  COMPLIANCE       // HIPAA, OSHA
  CLINICAL         // Clinical procedures
  SAFETY           // Fire, emergency
  SOFTWARE         // System training
  ONBOARDING       // New hire
  PROFESSIONAL     // Professional development
  CUSTOMER_SERVICE
  OTHER
}

enum TrainingFrequency {
  ONCE             // One-time training
  ANNUAL           // Every year
  BIENNIAL         // Every 2 years
  QUARTERLY        // Every 3 months
  AS_NEEDED
}

enum TrainingStatus {
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  OVERDUE
  WAIVED
  FAILED
}
```

---

## Business Rules

- Standard training programs and frequencies:
  - HIPAA Privacy & Security: Annual, all staff
  - OSHA Bloodborne Pathogens: Annual, clinical staff
  - Infection Control: Annual, clinical staff
  - Fire Safety: Annual, all staff
  - Emergency Procedures: Annual, all staff
- Training due dates default to 30 days from assignment (configurable)
- Failed assessments allow retry (configurable retry limit)
- Overdue training generates escalating alerts
- Recurring training auto-assigns based on previous completion date
- Training waivers require management approval and documentation

---

## Dependencies

**Depends On:**
- Auth & User Management (user records)
- Staff Management (staff roles for auto-assignment)
- Document Storage (training material storage)

**Required By:**
- Expiration Alert System (training due date monitoring)
- Training Compliance Reporting (completion metrics)
- Onboarding Checklist Management (links onboarding training)

---

## Notes

- Consider LMS (Learning Management System) integration for external training content
- Training certificates should be auto-generated upon completion
- Mobile-friendly training delivery for staff to complete on personal devices
- Track training time for compliance (some regulations specify minimum hours)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
