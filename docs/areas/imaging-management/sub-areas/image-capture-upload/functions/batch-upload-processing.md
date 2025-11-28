# Batch Upload & Processing

> **Sub-Area**: [Image Capture & Upload](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Batch Upload & Processing enables efficient multi-image upload with drag-and-drop, folder import, and background processing. The system handles automatic patient matching by filename, parallel upload for speed, thumbnail generation, multi-resolution variant creation, and duplicate detection for high-volume imaging workflows.

---

## Core Requirements

- [ ] Implement drag-and-drop multi-file upload interface
- [ ] Support folder import for bulk images
- [ ] Enable automatic patient matching by filename patterns
- [ ] Process uploads in parallel for optimal speed
- [ ] Execute background processing queue for large batches
- [ ] Generate thumbnails (150px) and previews (800px)
- [ ] Detect and warn on duplicate image uploads
- [ ] Provide real-time upload progress tracking

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/imaging/upload/batch` | `imaging:capture` | Initialize batch upload |
| POST | `/api/imaging/upload/batch/:id/file` | `imaging:capture` | Upload file to batch |
| GET | `/api/imaging/upload/batch/:id` | `imaging:capture` | Get batch status |
| PUT | `/api/imaging/upload/batch/:id/patient` | `imaging:capture` | Assign patient to batch |
| POST | `/api/imaging/upload/batch/:id/process` | `imaging:capture` | Start batch processing |
| DELETE | `/api/imaging/upload/batch/:id` | `imaging:capture` | Cancel batch upload |

---

## Data Model

```prisma
model ImageUploadBatch {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  batchNumber     String   @unique
  status          BatchStatus @default(PENDING)
  source          String           // DSLR, folder_import, migration
  totalFiles      Int
  processedFiles  Int      @default(0)
  successCount    Int      @default(0)
  failureCount    Int      @default(0)
  patientId       String?  @db.ObjectId  // If all for one patient
  startedAt       DateTime?
  completedAt     DateTime?
  errorLog        String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String   @db.ObjectId
  clinic          Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
  @@index([status])
}

enum BatchStatus {
  PENDING
  UPLOADING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

model BatchUploadFile {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  batchId         String   @db.ObjectId
  originalName    String
  tempStorageKey  String?          // Temp storage before processing
  status          FileStatus @default(PENDING)
  matchedPatientId String? @db.ObjectId
  matchConfidence Float?           // Auto-match confidence
  imageId         String?  @db.ObjectId  // Created image ID
  errorMessage    String?
  processedAt     DateTime?
  @@index([batchId])
}

enum FileStatus {
  PENDING
  UPLOADING
  PROCESSING
  COMPLETED
  FAILED
  DUPLICATE
}
```

---

## Business Rules

- Batch uploads limited to configurable max (default: 100 files)
- Files uploaded to temporary storage before patient assignment
- Patient matching uses filename patterns: `PatientID_*.jpg`, `LastName_FirstName_*.jpg`
- Duplicate detection based on file hash + EXIF timestamp
- Processing continues in background even if user navigates away
- Failed files can be retried without re-uploading
- Batch auto-expires after 24 hours if not processed

---

## Dependencies

**Depends On:**
- Auth & Authorization (user permissions)
- Cloud Storage (temporary and permanent storage)

**Required By:**
- All import functions (DSLR, memory card imports)
- Data migration workflows

---

## Notes

- Use chunked upload for large files to handle network interruptions
- Consider Web Workers for client-side image validation
- Sharp.js for server-side thumbnail and variant generation
- Implement resumable uploads for reliability

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
