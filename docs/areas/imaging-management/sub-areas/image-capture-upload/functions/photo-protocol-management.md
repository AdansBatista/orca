# Photo Protocol Management

> **Sub-Area**: [Image Capture & Upload](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Photo Protocol Management defines and enforces standardized photo series for consistent orthodontic documentation. The system provides configurable protocols with capture checklists, photo positioning guides, quality criteria enforcement, and automatic assignment to appointment types for systematic clinical photography.

---

## Core Requirements

- [ ] Create and manage standard orthodontic photo protocol templates
- [ ] Configure protocol slots with position, category, and requirements
- [ ] Assign protocols to appointment types for automatic activation
- [ ] Display capture checklist during photo sessions
- [ ] Provide visual positioning guides for each photo type
- [ ] Enforce quality criteria with retake notifications
- [ ] Track protocol completion status per session

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/protocols` | `imaging:view` | List all protocols |
| GET | `/api/imaging/protocols/:id` | `imaging:view` | Get protocol details |
| POST | `/api/imaging/protocols` | `imaging:admin` | Create new protocol |
| PUT | `/api/imaging/protocols/:id` | `imaging:admin` | Update protocol |
| DELETE | `/api/imaging/protocols/:id` | `imaging:admin` | Deactivate protocol |
| POST | `/api/imaging/protocols/:id/session` | `imaging:capture` | Start capture session |
| PUT | `/api/imaging/protocols/session/:id` | `imaging:capture` | Update session progress |
| GET | `/api/imaging/protocols/session/:id/status` | `imaging:capture` | Get session completion |

---

## Data Model

```prisma
model PhotoProtocol {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  name            String           // "Initial Records", "Progress Check"
  description     String?
  photoCount      Int              // Expected number of photos
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false)
  appointmentTypes String[]        // Appointment types using this protocol
  slots           PhotoProtocolSlot[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  clinic          Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
}

model PhotoProtocolSlot {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  protocolId      String   @db.ObjectId
  position        Int              // Order in checklist
  name            String           // "Frontal Smile"
  category        ImageCategory    // EXTRAORAL, INTRAORAL
  subcategory     String?          // frontal_smile, right_buccal
  description     String?          // Capture instructions
  required        Boolean  @default(true)
  guideImageUrl   String?          // Reference positioning image
  positioningNotes String?
  lightingNotes   String?
  protocol        PhotoProtocol @relation(fields: [protocolId], references: [id])
  @@index([protocolId])
}

model PhotoCaptureSession {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  patientId       String   @db.ObjectId
  protocolId      String   @db.ObjectId
  appointmentId   String?  @db.ObjectId
  status          SessionStatus @default(IN_PROGRESS)
  capturedSlots   Json             // { slotId: imageId } mapping
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String   @db.ObjectId
  @@index([clinicId])
  @@index([patientId])
}

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
  INCOMPLETE
  CANCELLED
}
```

---

## Business Rules

- Protocol changes don't affect in-progress capture sessions
- Required slots must be captured for session to be marked complete
- Incomplete sessions trigger notification before patient checkout
- Default protocol auto-assigned based on appointment type
- Quality scoring runs on each captured image with retake suggestion
- One active capture session per patient at a time

---

## Dependencies

**Depends On:**
- Auth & Authorization (admin for protocol management)
- Booking & Scheduling (appointment type association)

**Required By:**
- All capture functions (protocol-guided workflow)
- Progress Collage Generation (milestone-based image selection)

---

## Notes

- Standard protocols: Initial Records (12), Progress Check (8), Debond Records (12), Retainer Check (5)
- Guide images should show ideal positioning, lighting, and framing
- Consider voice/audio prompts for hands-free capture guidance

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
