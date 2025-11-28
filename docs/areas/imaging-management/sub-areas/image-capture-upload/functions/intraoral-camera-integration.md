# Intraoral Camera Integration

> **Sub-Area**: [Image Capture & Upload](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Intraoral Camera Integration enables direct capture of patient images from intraoral cameras connected to workstations. The system supports multiple camera brands via USB and video capture devices, providing real-time preview, capture controls, and automatic image optimization for consistent clinical documentation.

---

## Core Requirements

- [ ] Support USB and video capture device connections
- [ ] Provide real-time preview with live feed display
- [ ] Enable capture via UI controls and foot pedal
- [ ] Apply automatic image optimization (brightness, contrast)
- [ ] Support common intraoral camera brands (DEXIS, Carestream, Acteon, MouthWatch)
- [ ] Allow live feed annotation before capture
- [ ] Associate captured images with current patient context

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/imaging/devices` | `imaging:capture` | List connected intraoral cameras |
| GET | `/api/imaging/devices/:id/preview` | `imaging:capture` | Get device preview stream |
| POST | `/api/imaging/devices/:id/capture` | `imaging:capture` | Capture image from device |
| POST | `/api/imaging/devices/:id/settings` | `imaging:capture` | Update device capture settings |

---

## Data Model

```prisma
// Uses Image model from sub-area README with specific fields:
// - deviceType: "INTRAORAL_CAMERA"
// - deviceName: Specific camera identifier
// - category: INTRAORAL
// - subcategory: frontal_occlusion, right_buccal, left_buccal, etc.
```

---

## Business Rules

- Device must be detected and connected before capture
- Captured images automatically associated with active patient session
- Image quality validation runs post-capture with retake suggestion
- Original image preserved; optimization creates processing variant
- Foot pedal capture requires device configuration in settings

---

## Dependencies

**Depends On:**
- Auth & Authorization (user permissions)
- Patient context (active patient session)

**Required By:**
- Photo Protocol Management (protocol-guided capture)
- Patient Image Gallery (displays captured images)

---

## Notes

- Consider WebRTC or MediaDevices API for browser-based capture
- Foot pedal integration may require Electron or native bridge for USB HID
- Image optimization should be non-destructive with adjustable parameters

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
