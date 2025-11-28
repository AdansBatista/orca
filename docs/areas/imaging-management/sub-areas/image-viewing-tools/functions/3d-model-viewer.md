# 3D Model Viewer

> **Sub-Area**: [Image Viewing & Tools](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

3D Model Viewer enables visualization of 3D scans, CBCT volumes, and digital dental models. The system supports STL file rendering, CBCT volume visualization with multi-planar reconstruction (MPR), 3D surface rendering, measurement tools in 3D space, and cross-sectional views for comprehensive diagnostic imaging analysis.

---

## Core Requirements

- [ ] Implement STL file rendering for dental models
- [ ] Support CBCT volume visualization
- [ ] Provide multi-planar reconstruction (MPR) views
- [ ] Enable 3D surface rendering with lighting controls
- [ ] Include measurement tools in 3D space
- [ ] Display cross-sectional views (axial, sagittal, coronal)
- [ ] Support panoramic curve reconstruction
- [ ] Enable rotation, zoom, and pan in 3D space
- [ ] Export 2D snapshots from any viewing angle

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/3d/:id` | `imaging:3d_view` | Get 3D model data |
| GET | `/api/imaging/3d/:id/metadata` | `imaging:3d_view` | Get model metadata |
| GET | `/api/imaging/3d/:id/slices` | `imaging:3d_view` | Get CBCT slice data |
| GET | `/api/imaging/3d/:id/slice/:plane/:position` | `imaging:3d_view` | Get specific slice |
| POST | `/api/imaging/3d/:id/snapshot` | `imaging:3d_view` | Create 2D snapshot |
| POST | `/api/imaging/3d/:id/measurements` | `imaging:3d_view` | Save 3D measurement |
| GET | `/api/imaging/3d/:id/measurements` | `imaging:3d_view` | List 3D measurements |

---

## Data Model

```prisma
// 3D-specific image metadata (extends Image model)
model Image {
  // ... base fields
  fileType      ImageFileType  // SCAN_3D
  category      ImageCategory  // SCAN_UPPER, SCAN_LOWER, CBCT

  // 3D model metadata
  modelFormat   String?        // STL, PLY, OBJ, NRRD, DICOM
  vertexCount   Int?
  triangleCount Int?
  volumeDimensions Json?       // {x, y, z} for CBCT
  voxelSpacing  Json?          // {x, y, z} mm per voxel
}

model Model3DViewState {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId
  name          String?

  // Camera position
  cameraPosition Json           // {x, y, z}
  cameraTarget  Json            // {x, y, z}
  cameraUp      Json            // {x, y, z}
  zoom          Float

  // Rendering settings
  renderMode    RenderMode @default(SURFACE)
  lightingPreset String?
  opacity       Float @default(1)

  // Slice positions (for CBCT)
  sliceAxial    Float?
  sliceSagittal Float?
  sliceCoronal  Float?

  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
  @@index([imageId])
}

enum RenderMode {
  SURFACE
  WIREFRAME
  POINTS
  VOLUME
  MIP          // Maximum Intensity Projection
}

model Model3DMeasurement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  imageId       String   @db.ObjectId
  type          String           // DISTANCE, ANGLE, AREA
  name          String?
  points        Json             // Array of {x, y, z}
  value         Float
  unit          String           // mm, degrees, mm²
  isVisible     Boolean @default(true)
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  @@index([clinicId])
  @@index([imageId])
}
```

---

## Business Rules

- 3D viewing requires `imaging:3d_view` permission
- CBCT volumes may require significant memory; warn on large datasets
- Model loading is progressive with LOD (level of detail) support
- Snapshots saved as standard images linked to source 3D model
- 3D measurements require calibration from source data
- Browser must support WebGL 2.0 for 3D viewing

---

## Dependencies

**Depends On:**
- Auth & Authorization (3d_view permission)
- 3D Scanner Integration (provides STL files)
- X-ray Integration (provides CBCT data)

**Required By:**
- Treatment Planning (digital model analysis)
- Treatment Simulation Exports (3D visualizations)
- Case Presentation Builder (3D screenshots)

---

## Notes

- Use Three.js for STL/mesh rendering
- Use Cornerstone3D or AMI.js for CBCT volume rendering
- Consider server-side rendering for very large volumes
- Implement memory management for large datasets
- Touch gestures for rotation/zoom on tablet devices

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
