# Patient Check-In

> **Sub-Area**: [Patient Flow Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Patient Check-In handles patient arrival and initiates flow tracking through the clinic. It supports staff-assisted check-in at the front desk, self-service kiosk options, and mobile check-in. The process verifies patient information, triggers insurance verification, and checks form completion status.

---

## Core Requirements

- [ ] Staff check-in at front desk with patient lookup
- [ ] Self-service kiosk check-in interface
- [ ] Mobile check-in via patient portal/app
- [ ] Verify and update patient demographics
- [ ] Trigger insurance eligibility verification
- [ ] Check form/questionnaire completion status
- [ ] Alert for special needs or notes
- [ ] Initiate patient flow state tracking
- [ ] Capture arrival time for wait time calculation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/v1/ops/flow/:appointmentId/check-in` | `ops:manage_flow` | Check in patient |
| POST | `/api/v1/ops/flow/check-in/lookup` | `ops:manage_flow` | Find patient for check-in |
| GET | `/api/v1/ops/flow/:appointmentId/check-in/status` | `ops:view_dashboard` | Get check-in readiness |
| POST | `/api/v1/patient-portal/check-in/:appointmentId` | Patient Portal | Self-service check-in |
| GET | `/api/v1/kiosk/check-in/appointments` | Kiosk | Get today's appointments for patient |

---

## Data Model

Check-in updates `PatientFlowState`:

```prisma
model PatientFlowState {
  // ... existing fields ...

  // Check-in specific
  arrivedAt       DateTime?
  checkedInAt     DateTime?
  checkedInBy     String?     @db.ObjectId
  checkInMethod   CheckInMethod?

  // Verification status
  insuranceVerified     Boolean @default(false)
  formsComplete         Boolean @default(false)
  balanceAlertShown     Boolean @default(false)
}

enum CheckInMethod {
  FRONT_DESK
  KIOSK
  MOBILE
  AUTO  // Geo-fence arrival
}
```

---

## Business Rules

- Patient must have appointment scheduled for today
- Early check-in allowed up to 1 hour before appointment (configurable)
- Late arrivals still permitted with timestamp tracking
- Insurance verification triggered automatically on check-in
- Outstanding balance alert shown to staff (not patient)
- Walk-ins create appointment record then check in
- Check-in creates PatientFlowState if not exists

---

## Dependencies

**Depends On:**
- [Auth & Authorization](../../../../auth/) - Patient/staff authentication
- [Booking & Scheduling](../../../../booking/) - Appointment lookup
- [Billing & Insurance](../../../../billing-insurance/) - Insurance verification

**Required By:**
- [Queue Management](./queue-management.md) - Waiting queue
- [Wait Time Monitoring](./wait-time-monitoring.md) - Wait calculation start

---

## Notes

- Kiosk interface should be simple and accessible
- Consider QR code check-in from confirmation email
- Photo verification option for identity confirmation
- Log check-in method for analytics

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
