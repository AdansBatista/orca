# Lead Analytics

> **Sub-Area**: [Lead Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Lead Analytics provides comprehensive reporting and visualization of lead performance metrics, enabling practice leadership to measure conversion rates, evaluate marketing ROI, compare coordinator performance, and identify areas for improvement in the patient acquisition process.

---

## Core Requirements

- [ ] Visualize conversion funnel from lead to treatment start
- [ ] Calculate conversion rates by source, coordinator, and time period
- [ ] Track average time-to-conversion metrics
- [ ] Analyze lost reasons to identify improvement opportunities
- [ ] Compare lead source performance and cost-per-acquisition
- [ ] Generate coordinator performance reports
- [ ] Support date range filtering and comparison periods

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/leads/analytics/funnel` | `lead:analytics` | Get conversion funnel data |
| GET | `/api/leads/analytics/sources` | `lead:analytics` | Source performance comparison |
| GET | `/api/leads/analytics/coordinators` | `lead:analytics` | Coordinator metrics |
| GET | `/api/leads/analytics/lost-reasons` | `lead:analytics` | Lost reason breakdown |
| GET | `/api/leads/analytics/trends` | `lead:analytics` | Lead volume and conversion trends |
| GET | `/api/leads/analytics/summary` | `lead:analytics` | Executive summary metrics |
| GET | `/api/leads/analytics/roi` | `lead:analytics` | Marketing ROI by source |

---

## Data Model

Analytics are computed from existing Lead, LeadActivity, and LeadSource models. No additional persistence required, but consider caching/materialized views for performance.

**Key Computed Metrics:**

| Metric | Calculation |
|--------|-------------|
| Total Leads | Count of leads created in period |
| Conversion Rate | (Leads → Patients) / Total Leads |
| Average Time to Convert | Mean days from lead creation to treatment start |
| Consultation Show Rate | Attended / Scheduled consultations |
| Treatment Acceptance Rate | Accepted / Presented treatments |
| Cost per Lead | Source monthly cost / Source lead count |
| Cost per Acquisition | Source monthly cost / Converted patients |
| Stage Conversion Rate | (Moved to next stage) / (Entered stage) |

---

## Business Rules

- Analytics default to current month with comparison to previous month
- Conversion rates exclude leads less than 30 days old (still in pipeline)
- Source ROI requires cost data to be entered in LeadSource
- Coordinator metrics exclude shared/unassigned leads
- Lost reason analysis requires lost reason to be recorded
- Dashboard refreshes on configurable interval (default: daily cache)
- Historical data retained indefinitely for trend analysis

---

## Dependencies

**Depends On:**
- Auth (user authentication, analytics permission)
- Lead Capture (lead data)
- Conversion Pipeline (stage data)
- Lead Source Tracking (source data)
- Coordinator Assignment (assignment data)

**Required By:**
- Practice Orchestration (executive dashboards)
- AI Manager (anomaly detection inputs)

---

## Notes

- Consider drill-down capability from summary to individual leads
- Export functionality for reports (PDF, CSV)
- Benchmark comparison against industry standards
- Goal setting and tracking against targets
- Scheduled report delivery to stakeholders

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
