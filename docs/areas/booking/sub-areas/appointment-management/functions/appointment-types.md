# Appointment Type Configuration

> **Sub-Area**: [Appointment Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Appointment Type Configuration enables clinics to define and manage different types of appointments with specific durations, colors, resource requirements, and settings. Each appointment type (Scan, Adjustment, Bonding, Debond, Emergency, etc.) can be customized to match the practice's workflow and linked to procedure codes for billing integration.

---

## Core Requirements

- [ ] Define appointment types with unique codes and names
- [ ] Set default, minimum, and maximum durations per type
- [ ] Configure color and icon for visual calendar identification
- [ ] Link procedure codes (CDT codes) to appointment types
- [ ] Specify resource requirements (chair required, room required, equipment needed)
- [ ] Set buffer/prep/cleanup times around appointments
- [ ] Configure online booking availability per type
- [ ] Set capacity limits (how many can be scheduled per day/hour)
- [ ] Support appointment type categories for organization
- [ ] Enable/disable types without deleting

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/appointment-types` | `booking:view_calendar` | List appointment types |
| GET | `/api/booking/appointment-types/:id` | `booking:view_calendar` | Get type details |
| POST | `/api/booking/appointment-types` | `booking:manage_templates` | Create appointment type |
| PUT | `/api/booking/appointment-types/:id` | `booking:manage_templates` | Update appointment type |
| DELETE | `/api/booking/appointment-types/:id` | `booking:manage_templates` | Soft delete type |
| PUT | `/api/booking/appointment-types/:id/toggle` | `booking:manage_templates` | Enable/disable type |
| GET | `/api/booking/appointment-types/categories` | `booking:view_calendar` | List type categories |

---

## Data Model

```prisma
model AppointmentType {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Type info
  code          String   // "SCAN", "ADJ", "BOND", etc.
  name          String   // "Scan", "Adjustment", "Bonding"
  description   String?
  category      String?  // "Clinical", "Administrative", "Consultation"

  // Duration
  defaultDuration  Int   // Minutes
  minDuration      Int?  // Minimum duration
  maxDuration      Int?  // Maximum duration

  // Visual
  color         String   // Hex color "#FF5733"
  icon          String?  // Icon identifier

  // Resources
  requiresChair    Boolean  @default(true)
  requiresRoom     Boolean  @default(false)
  equipmentNeeded  String[] // Equipment IDs

  // Buffer times
  defaultPrepTime     Int  @default(0)
  defaultCleanupTime  Int  @default(0)

  // Billing link
  procedureCodes   String[]  // CDT procedure codes

  // Capacity
  dailyLimit       Int?     // Max per day (null = unlimited)
  concurrentLimit  Int?     // Max at same time

  // Settings
  isActive      Boolean  @default(true)
  allowOnline   Boolean  @default(false)
  requiresDeposit Boolean @default(false)
  depositAmount   Float?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  clinic       Clinic    @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, code])
  @@index([clinicId])
  @@index([isActive])
}
```

---

## Business Rules

- Appointment type codes must be unique within a clinic
- Colors should be visually distinct within the clinic's type set
- Deactivating a type prevents new bookings but preserves existing appointments
- Procedure codes link to billing for automatic charge creation
- Online-enabled types appear in patient self-service booking
- Equipment requirements validated against resource availability at booking
- Duration changes do not affect existing appointments

---

## Dependencies

**Depends On:**
- [Auth & Authorization](../../../../auth/) - Permission checking
- [Resources Management](../../../../resources-management/) - Equipment definitions
- [Billing & Insurance](../../../../billing-insurance/) - Procedure codes

**Required By:**
- [Appointment Booking](./appointment-booking.md)
- [Schedule Template Builder](../../calendar-management/functions/schedule-template-builder.md)
- [Recurring Appointments](./recurring-appointments.md)

---

## Notes

- Provide default appointment types for new clinics (Scan, Adjustment, Bonding, Debond, Emergency, Consultation)
- Consider color picker with accessibility preview
- Import/export types for multi-clinic standardization

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
