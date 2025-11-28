# Employee Profiles

> **Sub-Area**: [Staff Profiles & HR](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Create and maintain comprehensive staff profiles with personal, professional, and employment information. Links user accounts to detailed employee records including demographics, contact information, provider-specific details (NPI, DEA), and multi-location assignments for orthodontic practice staff.

---

## Core Requirements

- [ ] Create staff profiles linked to user accounts
- [ ] Capture personal information (name, DOB, contact, photo)
- [ ] Track employment details (job title, hire date, status)
- [ ] Record provider-specific fields (NPI, DEA, provider type)
- [ ] Support multi-location staff assignments
- [ ] Implement soft delete for terminated employees
- [ ] Generate unique employee numbers

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff` | `staff:read` | List staff profiles |
| GET | `/api/staff/:id` | `staff:read` | Get staff profile |
| POST | `/api/staff` | `staff:create` | Create staff profile |
| PUT | `/api/staff/:id` | `staff:update` | Update staff profile |
| DELETE | `/api/staff/:id` | `staff:delete` | Soft delete staff |
| PUT | `/api/staff/:id/photo` | `staff:update` | Update profile photo |
| GET | `/api/staff/:id/locations` | `staff:read` | Get assigned locations |

---

## Data Model

Uses existing `StaffProfile` model from sub-area README with key fields:

```prisma
model StaffProfile {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId @unique

  // Personal
  firstName     String
  lastName      String
  email         String
  phone         String?

  // Employment
  employeeNumber String   @unique
  jobTitle      String
  hireDate      DateTime
  status        StaffStatus @default(ACTIVE)

  // Provider info
  isProvider    Boolean  @default(false)
  npiNumber     String?  @unique
  deaNumber     String?

  // Multi-location
  primaryClinicId String  @db.ObjectId
  assignedClinicIds String[] @db.ObjectId

  @@index([clinicId])
}
```

---

## Business Rules

- Employee numbers must be unique; auto-generate if not provided
- NPI numbers must pass checksum validation
- Providers (isProvider=true) must have NPI number
- Staff can be assigned to multiple locations but have one primary
- Terminated staff records retained but marked inactive (HIPAA)
- Compensation fields require `staff:view_salary` permission

---

## Dependencies

**Depends On:**
- Authentication (user accounts)
- Role Management (access control)

**Required By:**
- Employment Records
- Credentials & Certifications
- Scheduling
- Performance Tracking

---

## Notes

- Profile photo stored via document storage service
- Sensitive HR data (salary, SSN) requires elevated permissions
- Consider: integration with payroll systems for employee sync
