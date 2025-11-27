# Patient Communications — Readiness Report

Generated: 2025-11-27

Overall Status: Yellow — Documentation complete and actionable, pending SME & compliance sign-off and a small set of API/operational clarifications.

Summary
- Deliverables completed: Area README, sub-area READMEs, ~20 function specs, data models, OpenAPI specs (messaging + portal), provider onboarding, webhook contracts, replay fixtures, and CI test vectors.
- Remaining items preventing full green handoff are primarily SME review, compliance sign-off, and a few operational clarifications (rate limits and monitoring thresholds).

Gaps (short list)
- SME Review: Clinical SME to validate result notification wording and release policy edge-cases (e.g., sensitive results, provider hold).
- Compliance Sign-Off: `compliance@orca.example` must verify retention/PHI redaction rules and confirm webhook raw-payload storage policy.
- Operational Parameters: Confirm provider rate limits, backoff strategy, and failover priority per tenant (details in `provider-onboarding.md` need final values).
- UI Wireframes: Lightweight wireframes for portal notification center and campaign builder are recommended but not required for initial engineering.

Risks & Mitigations
- Risk: Provider webhook variability causing missed/double updates.
  - Mitigation: Use idempotency keys and providerMessageId dedupe; include replay fixtures and instruct QA to run webhook replays.
- Risk: PHI leakage in raw webhook logs.
  - Mitigation: Ensure log storage is encrypted, redact PHI before long-term retention, and limit access to compliance/ops roles.
- Risk: High-volume tenants may exceed provider quotas.
  - Mitigation: Document tenant throttling and fallbacks; require provider quota verification during onboarding.

Owners (recommended)
- Area Owner / Documentation Lead: `engagement-lead@orca.example` (coordinate reviews)
- API/Integration Lead: `platform-integration@orca.example` (OpenAPI and provider adapters)
- SME (Clinical): `patient-comms-sme@orca.example` (result wording, clinical flows)
- Compliance: `compliance@orca.example` (HIPAA, retention, audit rules)
- QA / Testing: `testing@orca.example` (fixtures, replay tests)

Acceptance Criteria for Handoff
- All function specs reviewed and marked `Reviewed` by the corresponding SME or owner.
- OpenAPI specs accepted by Integration Lead (minor edits allowed) and added to the API registry.
- Replay fixtures exercise the happy and common failure paths and CI job demonstrates webhook handling (staging). 
- Compliance sign-off recorded in `docs/areas/patient-communications/planning/sme-review-checklist.md`.

Next Steps (recommended immediate actions)
1. Schedule 1-hour SME review session with `patient-comms-sme@orca.example` and product owner.
2. Compliance review and sign-off (add acceptance notes to the SME checklist).
3. Finalize operational parameters (rate limits/backoff/failover) with `platform-integration@orca.example`.
4. Produce an Handoff Pack (one-page README linking all artifacts) and attach to the PR for engineering.

Conclusion
Documentation is in a state suitable for engineering intake pending the few checks above. Once SME and compliance sign-offs are complete and operational parameters are finalized, move status to Green and begin implementation handoff.
