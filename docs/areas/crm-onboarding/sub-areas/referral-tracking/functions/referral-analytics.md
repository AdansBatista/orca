# Referral Analytics

> **Sub-Area**: [Referral Tracking](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Referral Analytics provides comprehensive insights into referral patterns, provider performance, and relationship health. It enables practice leadership to identify top referrers, track declining relationships, measure referral ROI, and make data-driven decisions about referral marketing and relationship management.

---

## Core Requirements

- [ ] Track referral volume by provider, type, and time period
- [ ] Calculate conversion rates for referrals (consultation → treatment)
- [ ] Measure referral value (treatment revenue attributed to referrals)
- [ ] Identify top referrers with ranking and comparison
- [ ] Detect dormant referrers (declining or stopped referrals)
- [ ] Analyze referral trends over time
- [ ] Generate executive reports for practice leadership

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/referrals/analytics/summary` | `referral:analytics` | Overview metrics |
| GET | `/api/referrals/analytics/top-referrers` | `referral:analytics` | Top referrer ranking |
| GET | `/api/referrals/analytics/trends` | `referral:analytics` | Referral trends over time |
| GET | `/api/referrals/analytics/conversion` | `referral:analytics` | Conversion rate analysis |
| GET | `/api/referrals/analytics/dormant` | `referral:analytics` | Dormant referrer alerts |
| GET | `/api/referrals/analytics/by-type` | `referral:analytics` | Breakdown by referral type |
| GET | `/api/referring-providers/:id/stats` | `referral:analytics` | Individual provider metrics |

---

## Data Model

Analytics are computed from existing Referral and ReferringProvider models. No additional persistence required.

**Key Computed Metrics:**

| Metric | Calculation |
|--------|-------------|
| Total Referrals | Count of referrals in period |
| Referral Conversion Rate | Referrals with treatmentStarted / Total |
| Average Referral Value | Sum(treatmentValue) / Converted referrals |
| Top Referrers | Ranked by volume or value |
| Referral Trend | Month-over-month change percentage |
| New Referrers | Providers with first referral in period |
| Dormant Referrers | Previously active, no referrals in 6+ months |
| Referral Mix | Professional vs patient referral percentage |

---

## Business Rules

- Default analysis period: current month vs. previous month
- Top referrers can be ranked by volume (count) or value (revenue)
- Dormant referrer threshold: 6 months with no referrals after previous activity
- New referrer defined as first referral from provider ever
- Referral value requires treatment plan acceptance with value recorded
- Historical data retained indefinitely for trend analysis
- Provider-specific stats accessible from provider detail view

---

## Dependencies

**Depends On:**
- Auth (user authentication, analytics permission)
- Referral Source Attribution (referral data)
- Referring Provider Directory (provider data)
- Treatment Management (treatment value data)

**Required By:**
- Practice Orchestration (executive dashboards)
- AI Manager (relationship health scoring)

---

## Notes

- Alert system for declining referrers to prompt outreach
- Benchmark against practice goals for referral targets
- Export capability for reports (PDF, CSV)
- Consider provider portal analytics for self-service viewing
- Relationship health score combining multiple factors

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
