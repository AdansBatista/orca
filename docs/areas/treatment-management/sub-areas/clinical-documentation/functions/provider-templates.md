# Provider Templates

> **Sub-Area**: [Clinical Documentation](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Provider Templates enables creation and management of reusable documentation templates for different visit types. Templates include default SOAP content, common procedure sets, and pre-populated fields that accelerate clinical documentation. Providers can create personal templates or share clinic-wide templates, with system-provided templates for common scenarios.

---

## Core Requirements

- [ ] Create templates for different visit types
- [ ] Define default SOAP content sections
- [ ] Include common procedure code sets
- [ ] Support provider-specific templates
- [ ] Enable clinic-wide template sharing
- [ ] Provide system default templates
- [ ] Version control template changes
- [ ] Import/export template definitions

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/note-templates` | `documentation:read` | List templates |
| GET | `/api/note-templates/:id` | `documentation:read` | Get template |
| POST | `/api/note-templates` | `documentation:create` | Create template |
| PUT | `/api/note-templates/:id` | `documentation:update` | Update template |
| DELETE | `/api/note-templates/:id` | `documentation:delete` | Delete template |
| POST | `/api/progress-notes/from-template/:templateId` | `documentation:create` | Create note from template |
| POST | `/api/note-templates/:id/duplicate` | `documentation:create` | Duplicate template |

---

## Data Model

```prisma
model NoteTemplate {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String?  @db.ObjectId  // null for system templates
  providerId          String?  @db.ObjectId  // null for shared templates

  // Template Details
  templateName        String
  templateType        ProgressNoteType
  description         String?

  // Default Content
  defaultSubjective   String?
  defaultObjective    String?
  defaultAssessment   String?
  defaultPlan         String?
  defaultProcedures   String[]  // Procedure codes

  // Status
  isActive            Boolean  @default(true)
  isSystemTemplate    Boolean  @default(false)

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([clinicId])
  @@index([providerId])
  @@index([templateType])
}
```

---

## Business Rules

- System templates available to all clinics (read-only)
- Clinic templates shared across all clinic providers
- Provider templates private to individual provider
- Templates organized by visit type for easy selection
- Default procedures auto-added when using template
- Template content serves as starting point (fully editable)

---

## Dependencies

**Depends On:**
- Progress Notes (template target)
- Staff Management (provider ownership)

**Required By:**
- Progress Notes (template usage)

---

## Notes

- Common templates: Adjustment Visit, Bonding Appointment, Emergency Visit, Debond
- Consider template analytics to identify most-used templates
- Export/import enables template sharing between clinics

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
