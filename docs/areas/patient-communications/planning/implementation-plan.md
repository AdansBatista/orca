# Patient Communications — Implementation Plan (Documentation)

Purpose
This plan breaks down deliverables, milestones, owners, and acceptance criteria for documenting and preparing Patient Communications for engineering implementation. Focus is documentation and planning (no code changes) to prepare for handoff.

Milestones

1) Documentation Completion (this sprint)
- Deliverables: Full area README, sub-area READMEs, ~20 function specs, data models, integrations, templates
- Owner: `engagement-lead@orca.example`
- Acceptance: All files present in `docs/areas/patient-communications/`, cross-linked and consistent.

2) API Contract & Webhook Specs
- Deliverables: OpenAPI specs for messaging and portal, webhook docs, provider onboarding guide
- Owner: Integration Lead / `platform-integration@orca.example`
- Acceptance: OpenAPI files added to `docs/areas/patient-communications/openapi/` and reviewed by API SME.

3) SME Review & Compliance Sign-Off
- Deliverables: SME review comments addressed, compliance checklist signed
- Owner: `patient-comms-sme@orca.example`, `compliance@orca.example`
- Acceptance: All compliance items (HIPAA, consent handling) confirmed; audit entry marked green.

4) Test Fixture & Replay Sets
- Deliverables: Provider webhook replay fixtures, internal event fixtures, test vectors for edge cases
- Owner: QA / `testing@orca.example`
- Acceptance: Fixtures live under `tests/doc-fixtures/patient-communications/` and documented with replay instructions.

Timeline (Suggested)
- Week 1: Finalize function specs, add webhook/provider docs
- Week 2: SME review cycle and address feedback
- Week 3: Final QA fixtures, checklist, and readiness review

Risks & Mitigations
- Risk: Missing SME availability — Mitigation: schedule 1-hour deep-dive sessions and prepare concise review packets
- Risk: Provider webhook variation — Mitigation: include multiple provider examples and opt-in testing guidance

Deliverable Checklist
- [ ] Area README complete
- [ ] Sub-area READMEs complete
- [ ] ~20 function specs complete
- [ ] OpenAPI specs added
- [ ] Webhook docs and replay instructions
- [ ] Provider onboarding guide
- [ ] CI test fixtures present
- [ ] SME / Compliance sign-off
