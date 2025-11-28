# Compliance Reporting

> **Sub-Area**: [Audit & Compliance](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Generates compliance reports required for HIPAA and PIPEDA audits. Provides pre-built report templates for common audit requests including PHI access reports, user activity reports, and security incident reports.

---

## Core Requirements

- [ ] Generate PHI access report by patient
- [ ] Generate PHI access report by user
- [ ] Generate user activity report
- [ ] Generate security incident report
- [ ] Generate access rights report
- [ ] Support date range filtering
- [ ] Export reports to PDF/CSV

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/reports/compliance/phi-access` | `audit:view_logs` | PHI access report |
| GET | `/api/reports/compliance/user-activity` | `audit:view_logs` | User activity report |
| GET | `/api/reports/compliance/security-incidents` | `audit:view_logs` | Security incidents |
| GET | `/api/reports/compliance/access-rights` | `audit:view_logs` | User access rights |

### Query Parameters

```typescript
interface ComplianceReportQuery {
  startDate: string;    // Required
  endDate: string;      // Required
  patientId?: string;   // For PHI reports
  userId?: string;      // For user reports
  format?: 'json' | 'csv' | 'pdf';
}
```

---

## Data Model

Reports are generated from existing audit logs - no additional storage.

---

## Business Rules

### PHI Access Report

Purpose: Show all access to a patient's PHI for patient requests or breach investigation.

```typescript
interface PhiAccessReport {
  patient: {
    id: string;
    name: string;
  };
  period: { start: Date; end: Date };
  totalAccesses: number;
  accessByType: {
    VIEW: number;
    EXPORT: number;
    PRINT: number;
  };
  accessLog: Array<{
    timestamp: Date;
    userName: string;
    userRole: string;
    accessType: string;
    fieldsAccessed: string[];
    reason?: string;
  }>;
}
```

### User Activity Report

Purpose: Show all actions by a specific user for access review or investigation.

```typescript
interface UserActivityReport {
  user: {
    id: string;
    name: string;
    role: string;
  };
  period: { start: Date; end: Date };
  summary: {
    totalActions: number;
    phiAccesses: number;
    dataModifications: number;
    securityEvents: number;
  };
  activityLog: Array<{
    timestamp: Date;
    action: string;
    entity?: string;
    details?: string;
  }>;
}
```

### Security Incident Report

Purpose: Document security events for compliance audits.

```typescript
interface SecurityIncidentReport {
  period: { start: Date; end: Date };
  summary: {
    totalIncidents: number;
    criticalCount: number;
    warningCount: number;
  };
  incidents: Array<{
    timestamp: Date;
    severity: string;
    type: string;
    description: string;
    userId?: string;
    resolution?: string;
  }>;
}
```

### Access Rights Report

Purpose: Document current user access for access reviews.

```typescript
interface AccessRightsReport {
  generatedAt: Date;
  clinic: { id: string; name: string };
  users: Array<{
    name: string;
    email: string;
    role: string;
    permissions: string[];
    lastLogin: Date;
    status: 'active' | 'inactive' | 'locked';
  }>;
}
```

---

## Dependencies

**Depends On:**
- Audit Event Logging
- PHI Access Tracking

**Required By:**
- Compliance audits
- Patient records requests
- Security investigations

---

## Notes

- Reports must be generated within audit log retention period
- Consider: scheduled report generation
- Consider: report caching for large date ranges
