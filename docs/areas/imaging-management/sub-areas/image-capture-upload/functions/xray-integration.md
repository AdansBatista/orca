# X-ray Integration

> **Sub-Area**: [Image Capture & Upload](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

X-ray Integration enables import of diagnostic X-rays from digital radiography systems via the DICOM standard. The system supports panoramic, cephalometric, periapical, bitewing, and CBCT 3D imaging, with patient matching verification and radiation exposure logging for comprehensive orthodontic diagnostics.

---

## Core Requirements

- [ ] Implement DICOM file import (.dcm files)
- [ ] Support DICOM Storage SCP for network receive
- [ ] Enable DICOM Query/Retrieve for PACS integration
- [ ] Handle panoramic and cephalometric X-ray modalities
- [ ] Support CBCT 3D volume import
- [ ] Provide patient matching and verification workflow
- [ ] Log radiation exposure data from DICOM metadata
- [ ] Extract and display relevant DICOM tags

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/imaging/dicom/import` | `imaging:capture` | Import DICOM files |
| POST | `/api/imaging/dicom/query` | `imaging:admin` | Query PACS for studies |
| POST | `/api/imaging/dicom/retrieve` | `imaging:admin` | Retrieve study from PACS |
| GET | `/api/imaging/dicom/worklist` | `imaging:admin` | Get modality worklist |
| POST | `/api/imaging/dicom/match` | `imaging:capture` | Match DICOM to patient |

---

## Data Model

```prisma
// Image model with DICOM-specific fields:
model Image {
  // ... base fields
  fileType      ImageFileType  // XRAY
  category      ImageCategory  // PANORAMIC, CEPHALOMETRIC, CBCT, etc.

  // DICOM metadata
  dicomData     Json?          // Full DICOM tags
  modality      String?        // OPG, CEPH, CBCT, PA, BW
  studyId       String?        // DICOM Study UID
  seriesId      String?        // DICOM Series UID
  instanceId    String?        // DICOM SOP Instance UID

  // Radiation exposure (if available)
  radiationDose Float?         // mGy or DAP
}
```

---

## Business Rules

- DICOM imports require patient verification before linking
- Patient matching uses DICOM patient name/ID with fuzzy matching
- Unmatched DICOM images held in pending queue for manual assignment
- CBCT volumes stored as multi-frame DICOM or converted to compatible format
- Radiation dose logged when available in DICOM metadata
- DICOM Storage SCP requires network configuration by clinic admin

---

## Dependencies

**Depends On:**
- Auth & Authorization (user permissions, admin for PACS)
- Patient records (patient matching)

**Required By:**
- Cephalometric Analysis (provides ceph X-rays)
- 3D Model Viewer (provides CBCT volumes)
- Patient Image Gallery (displays X-rays)

---

## Notes

- Use dcmjs or cornerstone-wado-image-loader for DICOM parsing
- PACS integration requires network configuration (AE Title, port)
- Consider DICOM anonymization for test/demo environments
- CBCT support may require specialized viewing (see 3D Model Viewer)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
