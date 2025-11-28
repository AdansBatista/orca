# Form Version Management

> **Sub-Area**: [Consent Forms](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Form Version Management tracks all changes to consent form templates, maintaining a complete version history with automatic version numbering, change tracking, and effective date management. This ensures that patient signatures are permanently linked to the specific form version they signed, supporting audit compliance and legal defensibility.

---

## Core Requirements

- [ ] Automatically assign version numbers when templates are modified
- [ ] Track all changes between versions with diff comparison
- [ ] Manage effective dates for version transitions
- [ ] Preserve links between patient signatures and signed form version
- [ ] Support side-by-side version comparison view
- [ ] Archive inactive versions while maintaining access
- [ ] Enable rollback to previous versions if needed
- [ ] Record change notes and modification reasons

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/consent-templates/:id/versions` | `consent:read` | List all template versions |
| GET | `/api/compliance/consent-templates/:id/versions/:version` | `consent:read` | Get specific version |
| GET | `/api/compliance/consent-templates/:id/versions/compare` | `consent:read` | Compare two versions |
| POST | `/api/compliance/consent-templates/:id/rollback` | `consent:create` | Rollback to previous version |
| GET | `/api/compliance/consents/:id/version` | `consent:read` | Get version patient signed |

---

## Data Model

```prisma
model ConsentTemplateVersion {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  templateId    String   @db.ObjectId

  // Version info
  version       Int
  content       String   // Form content at this version
  fields        Json     // Field configuration at this version
  changeNotes   String?  // Description of changes made

  // Effective period
  effectiveFrom DateTime
  effectiveTo   DateTime?  // null = current version

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String?  @db.ObjectId

  // Relations
  template  ConsentTemplate @relation(fields: [templateId], references: [id])
  consents  PatientConsent[] // Consents signed using this version

  @@index([templateId])
  @@index([version])
  @@index([effectiveFrom])
}
```

---

## Business Rules

- Version numbers increment automatically and cannot be modified manually
- Every save of template content creates a new version
- Patient consents reference specific version ID, not just template ID
- Historical versions cannot be modified, only archived
- Rollback creates a new version with content from the target version
- Effective dates determine which version is presented to new patients
- Versions with associated patient signatures cannot be deleted

---

## Dependencies

**Depends On:**
- Consent Form Builder (provides templates being versioned)
- Auth & User Management (tracks who made changes)

**Required By:**
- Digital Signature Capture (links signatures to versions)
- Consent Analytics (reports on version distribution)
- Audit Management (audit trails reference versions)

---

## Notes

- Consider implementing semantic versioning (major.minor) for significant vs. minor changes
- Version comparison should highlight changes in legal language vs. formatting
- Archive storage may use different retention policies than active templates
- Version history is critical for responding to legal inquiries about what patient signed

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
