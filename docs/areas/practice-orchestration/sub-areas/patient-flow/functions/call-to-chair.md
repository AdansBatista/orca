# Call-to-Chair Workflow

Purpose
Coordinate the in-room handoff: notify provider/assistant and route patient from waiting area to an available chair.

Primary Users
- Clinical assistants, provider staff

Flow
- Mark patient ready -> find nearest available resource -> notify staff -> confirm patient seated

Acceptance Criteria
- Successful call-to-chair completes a `orchestration.patient-enter-room` event and updates occupancy.
