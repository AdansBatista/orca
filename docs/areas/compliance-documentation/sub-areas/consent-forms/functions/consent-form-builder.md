# Consent Form Builder

> **Sub-Area**: [Consent Forms](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

The Consent Form Builder enables clinic administrators to create, customize, and manage consent form templates for all patient authorization needs. It provides a drag-and-drop interface for building forms with orthodontic-specific templates for treatment consent, HIPAA acknowledgments, imaging releases, and financial agreements with support for conditional logic and multi-language content.

---

## Core Requirements

- [ ] Provide drag-and-drop form builder interface for creating consent templates
- [ ] Include pre-built templates for common orthodontic consents (treatment, HIPAA, imaging, financial)
- [ ] Support rich text formatting for legal consent language
- [ ] Enable conditional logic for dynamic form sections based on treatment type
- [ ] Support multi-language consent forms (configurable per clinic)
- [ ] Provide template categorization (treatment, HIPAA, financial, imaging, marketing)
- [ ] Include form preview and testing before activation
- [ ] Track template usage and completion rates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/consent-templates` | `consent:read` | List all consent templates |
| GET | `/api/compliance/consent-templates/:id` | `consent:read` | Get template details |
| POST | `/api/compliance/consent-templates` | `consent:create` | Create new template |
| PUT | `/api/compliance/consent-templates/:id` | `consent:create` | Update template |
| POST | `/api/compliance/consent-templates/:id/duplicate` | `consent:create` | Duplicate existing template |
| DELETE | `/api/compliance/consent-templates/:id` | `consent:create` | Deactivate template (soft delete) |
| POST | `/api/compliance/consent-templates/:id/preview` | `consent:read` | Generate form preview |

---

## Data Model

```prisma
model ConsentTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Template info
  name          String
  code          String   @unique  // e.g., "TREATMENT_CONSENT_BRACES"
  category      ConsentCategory
  description   String?

  // Content
  content       String   // Rich text/HTML consent language
  fields        Json     // Dynamic form fields configuration
  conditionalLogic Json? // Rules for showing/hiding sections

  // Settings
  requiresWitness     Boolean @default(false)
  requiresGuardian    Boolean @default(false)
  expirationDays      Int?    // null = never expires
  renewalRequired     Boolean @default(false)
  isRequired          Boolean @default(true)  // Required for treatment start

  // Versioning
  version       Int      @default(1)
  effectiveDate DateTime @default(now())
  isActive      Boolean  @default(true)

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([category])
  @@index([isActive])
}
```

---

## Business Rules

- Template code must be unique within the clinic for identification
- Changes to active templates create new versions, preserving signed consent links
- Templates cannot be hard-deleted if patient consents reference them
- Pre-built templates can be customized but not deleted
- Form fields must include validation rules for required fields
- Templates marked as required must be collected before treatment can begin

---

## Dependencies

**Depends On:**
- Auth & User Management (permissions for template management)

**Required By:**
- Digital Signature Capture (uses templates for consent collection)
- Form Version Management (tracks template versions)
- Minor/Guardian Consent (uses guardian-required templates)

---

## Notes

- Pre-built orthodontic templates include: General Treatment, Braces-Specific, Clear Aligner, Retention, X-Ray/Imaging, Photo/Video Release, Financial Agreement, HIPAA Privacy Notice
- Consider integration with legal review workflows for template approval
- Field types supported: text, signature, checkbox, date, dropdown, radio buttons

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
