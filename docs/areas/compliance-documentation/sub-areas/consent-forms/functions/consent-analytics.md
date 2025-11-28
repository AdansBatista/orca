# Consent Analytics & Reporting

> **Sub-Area**: [Consent Forms](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Consent Analytics & Reporting provides comprehensive visibility into consent collection performance, compliance gaps, and operational metrics. It tracks consent completion rates by type and staff member, identifies patients with missing or expiring consents, and generates audit-ready reports demonstrating compliance with consent documentation requirements.

---

## Core Requirements

- [ ] Display consent completion dashboard with key metrics
- [ ] Generate missing consent alerts by patient and consent type
- [ ] Track consent collection rates by staff member
- [ ] Provide consent aging reports (time from creation to signature)
- [ ] Create audit-ready compliance reports
- [ ] Show patient consent history timeline
- [ ] Forecast expiration volumes by period
- [ ] Compare in-office vs. remote signature collection rates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/consents/report/completion` | `audit:view_full` | Completion rate report |
| GET | `/api/compliance/consents/report/missing` | `consent:read` | Missing consents report |
| GET | `/api/compliance/consents/report/expiring` | `consent:read` | Expiring consents forecast |
| GET | `/api/compliance/consents/report/audit` | `audit:view_full` | Audit trail report |
| GET | `/api/compliance/consents/report/staff-performance` | `audit:view_full` | Staff collection metrics |
| GET | `/api/compliance/consents/report/version-distribution` | `consent:read` | Consent version distribution |
| GET | `/api/patients/:id/consents/history` | `consent:read` | Patient consent timeline |
| POST | `/api/compliance/consents/report/export` | `audit:export` | Export consent report |

---

## Data Model

Analytics are calculated from existing `PatientConsent`, `ConsentSignature`, and `ConsentTemplate` models. Key computed metrics include:

```typescript
interface ConsentAnalytics {
  // Completion metrics
  totalConsentsCreated: number;
  totalConsentsSigned: number;
  completionRate: number;  // percentage
  averageTimeToSign: number;  // days

  // Status breakdown
  byStatus: {
    pending: number;
    sent: number;
    signed: number;
    expired: number;
    revoked: number;
  };

  // By consent type
  byCategory: {
    category: ConsentCategory;
    total: number;
    signed: number;
    completionRate: number;
  }[];

  // Collection method
  byDeliveryMethod: {
    inOffice: number;
    email: number;
    sms: number;
    portal: number;
  };

  // Staff performance
  byStaffMember: {
    userId: string;
    userName: string;
    collected: number;
    sent: number;
    completionRate: number;
  }[];

  // Expiration forecast
  expiringThisWeek: number;
  expiringThisMonth: number;
  expiringThisQuarter: number;
}
```

---

## Business Rules

- Completion rate = signed consents / required consents for active patients
- Missing consent reports only include patients with active treatment status
- Staff performance metrics exclude system-generated consent requests
- Audit reports include complete signature metadata and timestamps
- Export formats: PDF for audit submission, CSV for data analysis
- Reports respect clinic data isolation (clinicId filtering)
- Historical reports available for any date range within retention period

---

## Dependencies

**Depends On:**
- Consent Form Builder (consent types and requirements)
- Digital Signature Capture (signature data and timestamps)
- Consent Expiration Tracking (expiration dates)
- Patient Management (active patient status)

**Required By:**
- Audit Management (audit-ready compliance reports)
- Practice Operations Dashboard (consent compliance widget)

---

## Notes

- Key metrics for dashboard: overall completion rate, consents needing attention today, monthly trend
- Staff performance should be used for coaching, not punitive measures
- Consider consent type benchmarks (e.g., HIPAA should be 100%, photo release may be lower)
- Audit reports should match format expected by common auditors (HIPAA OCR, state boards)
- Real-time dashboard updates preferred for operational use

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
