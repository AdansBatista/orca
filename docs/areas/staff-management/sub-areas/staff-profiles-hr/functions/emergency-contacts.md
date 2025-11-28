# Emergency Contacts

> **Sub-Area**: [Staff Profiles & HR](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Maintain emergency contact information for all staff members with support for multiple contacts, priority ordering, and quick access during emergency situations. Ensures practices can reach appropriate contacts when staff emergencies occur.

---

## Core Requirements

- [ ] Record multiple emergency contacts per staff member
- [ ] Set contact priority order (primary, secondary, etc.)
- [ ] Store relationship and contact details
- [ ] Provide quick access for emergency situations
- [ ] Implement privacy controls for contact information
- [ ] Support contact validation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/emergency-contacts` | `staff:read` | List emergency contacts |
| POST | `/api/staff/:id/emergency-contacts` | `staff:update` | Add emergency contact |
| PUT | `/api/staff/emergency-contacts/:contactId` | `staff:update` | Update contact |
| DELETE | `/api/staff/emergency-contacts/:contactId` | `staff:update` | Remove contact |

---

## Data Model

```prisma
model EmergencyContact {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  staffProfileId String  @db.ObjectId

  name          String
  relationship  String   // Spouse, Parent, Sibling, etc.
  phone         String
  alternatePhone String?
  email         String?

  priority      Int      @default(1)  // 1 = primary

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  staffProfile  StaffProfile @relation(fields: [staffProfileId], references: [id])

  @@index([staffProfileId])
}
```

---

## Business Rules

- Each staff member should have at least one emergency contact
- Priority 1 is primary contact, contacted first
- Phone numbers should be validated for format
- Staff can view and update their own emergency contacts
- Clinic admins can view all staff emergency contacts
- Contact information is considered sensitive (not PHI, but protected)

---

## Dependencies

**Depends On:**
- Employee Profiles

**Required By:**
- Emergency procedures
- HR compliance

---

## Notes

- Consider: quick-access emergency contact view for managers
- Phone validation should support international formats
- Email is optional but useful for non-urgent follow-up
