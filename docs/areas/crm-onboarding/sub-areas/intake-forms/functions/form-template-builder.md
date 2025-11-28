# Form Template Builder

> **Sub-Area**: [Intake Forms](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Form Template Builder provides a visual drag-and-drop interface for creating and customizing intake form templates. Clinic administrators can design forms with various field types, conditional logic, and validation rules to collect patient information, medical history, and consents in a way that matches their practice workflow.

---

## Core Requirements

- [ ] Provide drag-and-drop form builder interface with field palette
- [ ] Support multiple field types (text, select, date, checkbox, signature, file upload)
- [ ] Enable conditional logic (show/hide fields based on other answers)
- [ ] Organize forms into sections with progress indicators
- [ ] Maintain template versioning with change tracking
- [ ] Allow cloning existing templates as starting point
- [ ] Provide preview mode for testing before activation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/intake/templates` | `intake:read` | List form templates |
| GET | `/api/intake/templates/:id` | `intake:read` | Get template details with schema |
| POST | `/api/intake/templates` | `intake:configure` | Create new template |
| PUT | `/api/intake/templates/:id` | `intake:configure` | Update template |
| POST | `/api/intake/templates/:id/clone` | `intake:configure` | Clone template |
| GET | `/api/intake/templates/:id/preview` | `intake:read` | Preview rendered template |
| POST | `/api/intake/templates/:id/activate` | `intake:configure` | Activate template version |

---

## Data Model

```prisma
model IntakeFormTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  slug          String
  description   String?
  category      FormCategory
  version       Int      @default(1)

  // Form structure (JSON schema)
  schema        Json     // Form fields and structure
  uiSchema      Json?    // UI customization

  // Settings
  isActive      Boolean  @default(true)
  isRequired    Boolean  @default(false)
  requiresSignature Boolean @default(false)
  expiresAfterDays  Int?   // Auto-expire after X days

  // Applicable to
  patientTypes  PatientType[]  // MINOR, ADULT, ALL

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  createdBy     String?  @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, slug, version])
  @@index([clinicId])
  @@index([category])
}

enum FormCategory {
  PATIENT_INFO
  MEDICAL_HISTORY
  DENTAL_HISTORY
  INSURANCE
  CONSENT
  FINANCIAL
  CUSTOM
}
```

---

## Business Rules

- Editing an active template creates a new version; previous submissions remain on old version
- Template slug must be unique within a clinic (per version)
- At least one template per required category must exist
- Consent forms must have requiresSignature = true
- Minor patient forms require guardian signature field
- Template deletion soft-deletes; historical submissions preserved
- Preview mode uses sample data to demonstrate form appearance

---

## Dependencies

**Depends On:**
- Auth (user authentication, clinic context)

**Required By:**
- Patient Form Portal (renders templates)
- Medical History Collection (template for health forms)
- Consent Form Management (template for consent forms)
- Completion Tracking (tracks submissions against templates)

---

## Notes

- Consider JSON Schema standard for form definition portability
- Support import/export of templates for multi-clinic consistency
- Provide starter templates seeded on clinic creation
- Field validation rules should be configurable per field

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
