# Training Compliance Reporting

> **Sub-Area**: [Staff Training](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Training Compliance Reporting generates comprehensive reports on staff training completion, certification status, and compliance gaps. It provides dashboards for real-time compliance visibility, audit-ready reports for regulatory inspections, gap analysis for identifying at-risk staff, and trend analysis for tracking compliance improvements over time.

---

## Core Requirements

- [ ] Display real-time compliance dashboard with key metrics
- [ ] Generate individual staff training records
- [ ] Create department/team compliance reports
- [ ] Produce audit-ready certification reports
- [ ] Identify compliance gaps with gap analysis
- [ ] Forecast expiration volumes by period
- [ ] Track training completion trends over time
- [ ] Export reports in multiple formats (PDF, CSV)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/training/reports/dashboard` | `training:view_all` | Get compliance dashboard |
| GET | `/api/compliance/training/reports/status` | `audit:view_full` | Certification status report |
| GET | `/api/compliance/training/reports/expiration` | `training:view_all` | Expiration forecast report |
| GET | `/api/compliance/training/reports/compliance-gap` | `audit:view_full` | Gap analysis report |
| GET | `/api/compliance/training/reports/audit-summary` | `audit:view_full` | Audit summary report |
| GET | `/api/compliance/training/reports/ce-summary` | `training:view_all` | CE progress summary |
| GET | `/api/compliance/training/reports/onboarding` | `training:view_all` | Onboarding status report |
| POST | `/api/compliance/training/reports/export` | `audit:export` | Export report |
| GET | `/api/compliance/training/reports/staff/:userId` | `training:view_all` | Individual staff report |

---

## Data Model

Reports are generated from existing data models. Key computed metrics:

```typescript
interface TrainingComplianceDashboard {
  // Overall compliance
  overallComplianceRate: number;  // Percentage
  staffCount: number;
  fullyCompliantStaff: number;

  // Certification metrics
  certifications: {
    total: number;
    active: number;
    expiringSoon: number;  // Within 30 days
    expired: number;
  };

  // Training metrics
  training: {
    totalAssigned: number;
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };

  // CE metrics
  ceProgress: {
    staffWithCERequirements: number;
    onTrackCount: number;
    atRiskCount: number;
  };

  // Onboarding metrics
  onboarding: {
    activeOnboardings: number;
    completedThisMonth: number;
    averageCompletionDays: number;
  };

  // Trends
  complianceTrend: {
    period: string;
    rate: number;
  }[];
}

interface ComplianceGapReport {
  staffMember: {
    userId: string;
    name: string;
    role: string;
  };
  gaps: {
    type: 'certification' | 'training' | 'ce';
    item: string;
    status: string;
    dueDate?: Date;
    daysOverdue?: number;
  }[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

---

## Business Rules

- Compliance rate calculation: Staff with all required items current / Total staff
- Gap analysis risk levels:
  - Low: Minor training overdue
  - Medium: Certification expiring within 30 days
  - High: Required certification expired < 30 days
  - Critical: Required certification expired > 30 days or license lapsed
- Audit reports include:
  - All certifications with expiration dates and verification status
  - Training completion records with dates
  - CE credits with documentation
- Reports respect data retention policies
- Export includes timestamp and generating user for audit trail

---

## Dependencies

**Depends On:**
- Certification Management (certification data)
- Training Program Administration (training data)
- Continuing Education Tracking (CE data)
- Onboarding Checklist Management (onboarding data)
- Expiration Alert System (expiration data)

**Required By:**
- Audit Management (provides compliance reports for audits)
- Practice Operations Dashboard (compliance widget)

---

## Notes

- Key reports for audits:
  - Certification Status: All staff certifications sorted by status
  - Training Completion: Annual training completion rates
  - CE Summary: CE progress by licensed staff
- Dashboard should highlight immediate attention items
- Consider scheduled report delivery (weekly compliance summary email)
- Benchmark comparisons against industry standards where available
- Historical data retention supports trend analysis

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
