# 3D Scanner Integration

> **Sub-Area**: [Image Capture & Upload](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

3D Scanner Integration enables import of digital impressions and 3D scans from intraoral scanners including iTero, 3Shape, and other systems. The system supports cloud API integration for automatic sync, direct file import for STL/PLY/OBJ formats, and automatic scan type detection for organized storage.

---

## Core Requirements

- [ ] Implement iTero cloud API integration for automatic sync
- [ ] Support 3Shape TRIOS file export import
- [ ] Enable universal STL/PLY/OBJ file import
- [ ] Detect scan type automatically (upper, lower, bite)
- [ ] Preserve scan metadata from scanner systems
- [ ] Link scans to patient record and treatment plan
- [ ] Support treatment simulator integration (Outcome Simulator)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/3d/itero/scans` | `imaging:capture` | List available iTero scans |
| POST | `/api/imaging/3d/itero/sync` | `imaging:capture` | Sync iTero scan to patient |
| GET | `/api/imaging/3d/itero/auth` | `imaging:admin` | iTero OAuth flow |
| POST | `/api/imaging/3d/import` | `imaging:capture` | Import STL/PLY/OBJ file |
| GET | `/api/imaging/3d/:id/metadata` | `imaging:view` | Get scan metadata |

---

## Data Model

```prisma
// Image model for 3D scans:
model Image {
  // ... base fields
  fileType      ImageFileType  // SCAN_3D
  category      ImageCategory  // SCAN_UPPER, SCAN_LOWER, SCAN_BITE

  // 3D scan metadata
  scannerType   String?        // ITERO, 3SHAPE, MEDIT, OTHER
  scanFormat    String?        // STL, PLY, OBJ, DCM
  vertexCount   Int?           // Mesh complexity
  scanQuality   Float?         // Quality score from scanner

  // Linkage
  treatmentId   String?  @db.ObjectId  // For treatment simulation
}

model ScannerIntegration {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  scannerType   String           // ITERO, 3SHAPE
  credentials   Json             // Encrypted API credentials
  lastSyncAt    DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
}
```

---

## Business Rules

- iTero sync requires clinic-level OAuth authentication
- Scans without patient match held in pending queue
- Auto-detect scan type from file analysis or scanner metadata
- Large STL files (>50MB) processed in background queue
- Bite registration scans linked to both upper and lower scans
- Treatment simulator access requires scan availability

---

## Dependencies

**Depends On:**
- Auth & Authorization (user permissions, admin for integration setup)
- Patient records (patient matching)

**Required By:**
- 3D Model Viewer (displays imported scans)
- Treatment Simulation Exports (uses scan data)
- Treatment Planning (for digital planning)

---

## Notes

- iTero API requires Align Technology partnership/credentials
- 3Shape typically uses file export rather than cloud API
- Consider WebGL compatibility for 3D file validation
- STL files may need conversion for consistent viewing

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
