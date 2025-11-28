# Compliance Monitoring

> **Sub-Area**: [Records Requests](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Compliance Monitoring ensures all records requests adhere to HIPAA requirements, state timing regulations, and organizational policies. It tracks authorization validity, monitors response deadlines, generates compliance reports, and alerts staff to potential violations before they occur.

---

## Core Requirements

- [ ] Monitor state-specific timing requirements for responses
- [ ] Track authorization expiration dates
- [ ] Alert on approaching and overdue deadlines
- [ ] Enforce minimum necessary principle in releases
- [ ] Maintain accounting of disclosures for HIPAA
- [ ] Generate compliance reports for audits
- [ ] Track authorization revocations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/records-requests/compliance/overdue` | `records:compliance` | Get overdue requests |
| GET | `/api/records-requests/compliance/approaching` | `records:compliance` | Get approaching deadlines |
| GET | `/api/records-authorizations/expiring` | `records:compliance` | Expiring authorizations |
| GET | `/api/records-requests/compliance/report` | `records:compliance` | Compliance summary report |
| GET | `/api/patients/:id/disclosures` | `records:compliance` | Accounting of disclosures |
| POST | `/api/records-requests/:id/extend` | `records:compliance` | Document extension with reason |

---

## Data Model

Compliance data derived from RecordsRequest and RecordsAuthorization models.

**Compliance Metrics:**

| Metric | Description |
|--------|-------------|
| Response Time | Days from request to completion |
| On-Time Rate | Percentage completed within deadline |
| Overdue Count | Requests exceeding deadline |
| Authorization Compliance | Percentage with valid authorization |
| Disclosure Count | Total disclosures in period |

**State Timing Requirements:**

| Jurisdiction | Typical Deadline |
|--------------|-----------------|
| Most US States | 30 days |
| Some States | 15-20 days |
| Extensions | Up to 30 additional days with documentation |
| Urgent/Emergency | As soon as practicable |

---

## Business Rules

- Default deadline: 30 days from receipt of valid request
- Warning alerts at 7 days and 3 days before deadline
- Overdue alerts sent to clinic admin immediately
- Extensions allowed with documented reason (one time, typically 30 days)
- All disclosures logged for accounting of disclosures report
- Authorization expiration alerts 30 days before expiration
- Revoked authorizations immediately flag associated requests
- Compliance report includes all requests in period with status

---

## Dependencies

**Depends On:**
- Auth (user authentication, compliance permission)
- Authorization Verification (authorization status)
- Transfer Status Tracking (request timing data)

**Required By:**
- Practice Orchestration (compliance dashboard)
- Audit & Compliance (compliance reporting)

---

## Notes

- State-specific deadline configuration by clinic location
- HIPAA accounting of disclosures required for 6 years
- Consider integration with compliance management system
- Automated alerts should be configurable by role

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
