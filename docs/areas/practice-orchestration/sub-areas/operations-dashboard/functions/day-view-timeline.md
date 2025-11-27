# Day View — Timeline

Purpose
Provide a chronological, minute-granular timeline of appointments, check-ins, in-room procedures, and patient movements for the current day. This is the primary operational surface for front-desk and clinical staff.

Primary Users
- Front-desk, clinical assistants, practice managers

Inputs
- Appointment schedule (appointmentId, startAt, duration, providerId, roomId)
- Real-time events: check-in, patient-enter-room, procedure-start, procedure-end, check-out
- Staff status updates (clock-in/out, breaks)

Outputs / UI
- Ordered timeline with row per room/clinic location and grouped by provider
- Expandable event details with patient pseudonymized view as required
- Action affordances: call-to-chair, mark-start, mark-complete, add delay reason

Events Emitted
- orchestration.patient-stage-changed
- orchestration.delay-recorded

Acceptance Criteria
- Timeline updates within 2s of event in normal network conditions
- Actions create corresponding events that are persisted and appear in other views

Implementation Notes
- Use websocket/SSE for live pushes; provide optimistic updates and reconcile via server authoritative state.
