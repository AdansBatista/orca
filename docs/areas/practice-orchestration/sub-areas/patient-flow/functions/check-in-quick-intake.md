# Check-in / Quick Intake

Purpose
Digitize arrival check-in, capture minimum intake, consent confirmation, and place patient into the correct queue.

Primary Users
- Front-desk, kiosk flow, mobile check-in

Inputs
- Patient identifier, appointmentId, self-reported arrival time, screening answers

Outputs
- Emit `orchestration.patient-checked-in` and add to queue with timestamp

Acceptance Criteria
- Check-in writes event and reflects in queue within 2s.

Implementation Notes
- Provide fallback for offline/kiosk sync and manual override.
