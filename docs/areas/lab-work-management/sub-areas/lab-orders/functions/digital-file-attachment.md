# Digital File Attachment

> **Sub-Area**: [Lab Orders](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Digital File Attachment enables attaching STL scans, photos, X-rays, and documents to lab orders. Files can be pulled from the patient's imaging gallery, imported from scanner software (iTero, 3Shape), or uploaded directly. This replaces physical impressions and paper forms with a streamlined digital workflow.

---

## Core Requirements

- [ ] Attach STL files from Imaging Management system
- [ ] Import scans directly from iTero/3Shape integrations
- [ ] Upload photos for shade matching and references
- [ ] Attach PDF documents (special instructions, previous Rx)
- [ ] Preview files before submission
- [ ] Compress large files for efficient transmission
- [ ] Track file versions when updated
- [ ] Support multiple files per order item

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/lab/orders/:id/attachments` | `lab:create_order` | Upload attachment |
| POST | `/api/lab/orders/:id/attachments/from-imaging` | `lab:create_order` | Attach from imaging gallery |
| DELETE | `/api/lab/orders/:orderId/attachments/:attachmentId` | `lab:create_order` | Remove attachment |
| GET | `/api/lab/orders/:id/attachments` | `lab:track` | List order attachments |
| GET | `/api/lab/orders/:orderId/attachments/:attachmentId/preview` | `lab:track` | Get file preview URL |

---

## Data Model

```prisma
model LabOrderAttachment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  labOrderId    String   @db.ObjectId

  fileName      String
  fileType      AttachmentType  // STL_SCAN, PHOTO, XRAY, DOCUMENT
  mimeType      String
  fileSize      Int
  storageKey    String

  imageId       String?  @db.ObjectId  // If from Imaging Management
  sourceType    AttachmentSource  // IMAGING_SYSTEM, ITERO_SYNC, MANUAL_UPLOAD

  description   String?
  category      String?  // "Upper Scan", "Shade Photo"

  createdAt     DateTime @default(now())
  uploadedBy    String   @db.ObjectId

  @@index([labOrderId])
}
```

---

## Business Rules

- STL files required for clear retainers and indirect bonding trays
- Maximum file size limits apply (configurable per file type)
- Only draft orders can have attachments modified
- Files from imaging maintain link to source record
- Supported formats: STL, PLY, OBJ, JPG, PNG, PDF

---

## Dependencies

**Depends On:**
- Lab Order Creation (parent order context)
- Imaging Management (source for patient scans/photos)
- Cloud Storage (file storage service)

**Required By:**
- Lab Order Creation (orders submitted with files)
- Order Tracking (files viewable on order details)

---

## Notes

- Use signed URLs for secure file access
- Consider thumbnail generation for quick preview
- Implement virus scanning on uploaded files

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
