# Patient Flow & Queue Management

Purpose
Manage patient journeys from arrival to departure, minimizing wait time and providing clear chair/call routing for staff.

Primary Users
- Front-desk staff, clinical assistants, patient flow coordinators

Core Functions
- Check-in / Quick Intake: digital or kiosk check-in and queue insertion.
- Queue & Call-to-Chair: triaged queue with priority promotions and call-to-chair workflow.
- Waiting Area Visibility: estimated wait times and occupancy hints.
- Transfer & Hold: move patient between queues (e.g., imaging -> procedure -> recovery).
- Real-time Patient Timeline: stage history and notes for the current visit.
- No-show & Late Arrival Triage: automated rebook suggestions and contact triggers.

Implementation Notes
- Use event-sourced updates for each journey stage to enable replays and diagnostics.
- Surface patient privacy controls (masking, restricted notes) in shared queue views.
