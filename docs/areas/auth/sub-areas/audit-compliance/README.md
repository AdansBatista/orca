# Audit & Compliance

> **Sub-Area**: [Auth & Authorization](../../) | **Status**: ✅ Complete (Phase 1)

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Parent Area** | [Auth & Authorization](../../) |
| **Status** | ✅ Complete (Phase 1) |
| **Priority** | High |
| **Functions** | 5 |
| **Last Updated** | 2024-11-29 |

---

## Overview

This sub-area handles security audit logging, PHI access tracking, and regulatory compliance requirements for HIPAA and PIPEDA. All security-relevant events must be logged to maintain compliance and enable incident investigation.

### Key Capabilities

- **Audit Logging**: Comprehensive event logging
- **PHI Access Tracking**: HIPAA-required access records
- **Security Checklist**: Implementation validation
- **Compliance Reporting**: Regulatory audit support
- **Data Retention**: Long-term log storage

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Audit Event Logging](./functions/) | Log security events | Critical |
| 2 | [PHI Access Tracking](./functions/) | Track PHI access for HIPAA | Critical |
| 3 | [Security Checklist](./functions/) | Implementation validation | High |
| 4 | [Compliance Reporting](./functions/) | Audit report generation | High |
| 5 | [Data Retention](./functions/) | Log archival and retention | Medium |

---

## Events to Log

### Authentication Events

| Event | Description | Severity |
|-------|-------------|----------|
| `AUTH_LOGIN` | Successful login | Info |
| `AUTH_LOGIN_FAILED` | Failed login attempt | Warning |
| `AUTH_LOGOUT` | User logout | Info |
| `AUTH_SESSION_EXPIRED` | Session timeout | Info |
| `AUTH_PASSWORD_RESET` | Password reset completed | Info |
| `AUTH_PASSWORD_CHANGED` | Password changed | Info |
| `AUTH_MFA_ENABLED` | MFA enabled | Info |
| `AUTH_MFA_DISABLED` | MFA disabled | Warning |
| `AUTH_ACCOUNT_LOCKED` | Account locked after failures | Warning |

### Patient Data Events

| Event | Description | Severity |
|-------|-------------|----------|
| `PHI_VIEW` | Viewed patient PHI | Info |
| `PHI_EXPORT` | Exported patient data | Warning |
| `PHI_PRINT` | Printed patient data | Warning |
| `PATIENT_CREATE` | Created patient record | Info |
| `PATIENT_UPDATE` | Updated patient record | Info |
| `PATIENT_DELETE` | Deleted patient (soft) | Warning |
| `PATIENT_MERGE` | Merged patient records | Warning |

### Financial Events

| Event | Description | Severity |
|-------|-------------|----------|
| `INVOICE_CREATE` | Created invoice | Info |
| `PAYMENT_PROCESS` | Processed payment | Info |
| `REFUND_PROCESS` | Processed refund | Warning |
| `WRITE_OFF` | Write-off applied | Warning |
| `CLAIM_SUBMIT` | Submitted insurance claim | Info |

### Administrative Events

| Event | Description | Severity |
|-------|-------------|----------|
| `USER_CREATE` | Created user account | Info |
| `USER_UPDATE` | Updated user account | Info |
| `USER_DEACTIVATE` | Deactivated user | Warning |
| `ROLE_ASSIGN` | Assigned role to user | Warning |
| `ROLE_REVOKE` | Revoked role from user | Warning |
| `PERMISSION_GRANT` | Granted permission | Warning |
| `PERMISSION_REVOKE` | Revoked permission | Warning |
| `SETTINGS_CHANGE` | Changed system settings | Warning |

### Security Events

| Event | Description | Severity |
|-------|-------------|----------|
| `SECURITY_VIOLATION` | Access attempt blocked | Critical |
| `CLINIC_BOUNDARY_BREACH` | Cross-clinic access attempt | Critical |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Warning |
| `SUSPICIOUS_ACTIVITY` | Unusual pattern detected | Warning |

---

## Data Model

### Audit Log Schema

```prisma
model AuditLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  timestamp DateTime @default(now())

  // Who
  userId    String?  @db.ObjectId  // Null for system events
  userName  String?
  userRole  String?
  userIp    String?
  userAgent String?

  // What
  action    String   // Event type: AUTH_LOGIN, PHI_VIEW, etc.
  severity  String   @default("INFO") // INFO, WARNING, CRITICAL
  entity    String?  // Patient, Appointment, Invoice, etc.
  entityId  String?  @db.ObjectId

  // Where
  clinicId  String?  @db.ObjectId  // Null for cross-clinic events

  // Details
  details   Json?    // Action-specific details
  before    Json?    // State before change (for updates)
  after     Json?    // State after change (for updates)

  // Request context
  requestId String?  // For tracing
  endpoint  String?  // API endpoint called
  method    String?  // HTTP method

  // Relations
  user      User?    @relation(fields: [userId], references: [id])
  clinic    Clinic?  @relation(fields: [clinicId], references: [id])

  // Indexes for querying
  @@index([userId])
  @@index([clinicId])
  @@index([entity, entityId])
  @@index([timestamp])
  @@index([action])
  @@index([severity])
}

// Separate table for PHI access (faster queries for compliance)
model PhiAccessLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  timestamp DateTime @default(now())

  userId    String   @db.ObjectId
  userName  String
  userRole  String
  clinicId  String   @db.ObjectId

  patientId String   @db.ObjectId
  accessType String  // VIEW, EXPORT, PRINT

  // What was accessed
  fieldsAccessed String[] // ["demographics", "medical_history", etc.]
  reason    String?  // Optional reason for access

  // Request context
  userIp    String?
  userAgent String?

  @@index([userId])
  @@index([patientId])
  @@index([clinicId])
  @@index([timestamp])
  @@index([accessType])
}
```

---

## Logging Implementation

### Core Audit Logger

```typescript
// lib/audit/logger.ts
import { db } from '@/lib/db';
import { Session } from 'next-auth';

interface AuditLogData {
  action: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export async function logAudit(
  session: Session | null,
  data: AuditLogData,
  request?: Request
) {
  const log = {
    timestamp: new Date(),
    userId: session?.user?.id,
    userName: session?.user?.name,
    userRole: session?.user?.role,
    userIp: request?.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request?.headers.get('user-agent') ?? undefined,
    clinicId: session?.user?.clinicId,
    severity: data.severity ?? 'INFO',
    action: data.action,
    entity: data.entity,
    entityId: data.entityId,
    details: data.details,
    before: data.before,
    after: data.after,
    endpoint: request?.url,
    method: request?.method,
  };

  // Fire and forget - don't block the request
  db.auditLog.create({ data: log }).catch(console.error);
}

// Usage example
await logAudit(session, {
  action: 'PATIENT_UPDATE',
  entity: 'Patient',
  entityId: patient.id,
  details: { field: 'email', reason: 'Patient request' },
  before: { email: oldEmail },
  after: { email: newEmail },
});
```

### PHI Access Logger

```typescript
// lib/audit/phiAccess.ts
import { db } from '@/lib/db';
import { Session } from 'next-auth';

export async function logPhiAccess(
  session: Session,
  patientId: string,
  accessType: 'VIEW' | 'EXPORT' | 'PRINT',
  options?: {
    fieldsAccessed?: string[];
    reason?: string;
  }
) {
  await db.phiAccessLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      clinicId: session.user.clinicId,
      patientId,
      accessType,
      fieldsAccessed: options?.fieldsAccessed ?? ['full_record'],
      reason: options?.reason,
    },
  });
}

// Usage: Log when viewing patient record
await logPhiAccess(session, patientId, 'VIEW', {
  fieldsAccessed: ['demographics', 'medical_history'],
});

// Usage: Log when exporting patient data
await logPhiAccess(session, patientId, 'EXPORT', {
  fieldsAccessed: ['full_record'],
  reason: 'Records transfer request',
});
```

### Authentication Event Logger

```typescript
// lib/audit/authEvents.ts
import { logAudit } from './logger';

export async function logLogin(
  userId: string,
  userName: string,
  clinicId: string,
  request: Request
) {
  await logAudit(null, {
    action: 'AUTH_LOGIN',
    entity: 'User',
    entityId: userId,
    details: { userName, clinicId },
  }, request);
}

export async function logLoginFailed(
  email: string,
  reason: string,
  request: Request
) {
  await logAudit(null, {
    action: 'AUTH_LOGIN_FAILED',
    severity: 'WARNING',
    details: { email, reason },
  }, request);
}

export async function logLogout(session: Session, request: Request) {
  await logAudit(session, {
    action: 'AUTH_LOGOUT',
  }, request);
}
```

---

## API Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/api/audit-logs` | List audit logs | `audit:view_logs` |
| GET | `/api/audit-logs/[id]` | Get log detail | `audit:view_logs` |
| GET | `/api/audit-logs/user/[userId]` | User activity | `audit:view_logs` |
| GET | `/api/audit-logs/entity/[entity]/[id]` | Entity history | `audit:view_logs` |
| GET | `/api/phi-access-logs` | PHI access report | `audit:view_logs` |
| GET | `/api/phi-access-logs/patient/[id]` | Patient access history | `audit:view_logs` |

### Query Parameters

```typescript
// GET /api/audit-logs
interface AuditLogQuery {
  startDate?: string;    // ISO date
  endDate?: string;      // ISO date
  userId?: string;       // Filter by user
  action?: string;       // Filter by action type
  severity?: string;     // Filter by severity
  entity?: string;       // Filter by entity type
  page?: number;
  pageSize?: number;
}
```

---

## Security Checklist

### Pre-Deployment Checklist

```markdown
## Authentication
- [ ] All API routes use `withAuth` wrapper
- [ ] All routes check appropriate permissions
- [ ] Session timeout is configured
- [ ] Failed login attempts are rate-limited
- [ ] Account lockout is implemented

## Authorization
- [ ] All queries include `clinicId` filter
- [ ] Role checks are implemented
- [ ] Permission checks are implemented
- [ ] No privilege escalation possible

## Data Protection
- [ ] PHI access is logged
- [ ] Data exports are logged
- [ ] Passwords are properly hashed (bcrypt)
- [ ] Sensitive data encrypted at rest

## Audit
- [ ] All auth events logged
- [ ] All PHI access logged
- [ ] All data changes logged
- [ ] Log retention configured (7+ years)

## Compliance
- [ ] HIPAA controls documented
- [ ] PIPEDA controls documented
- [ ] Breach notification process defined
- [ ] Access review process defined
```

### Code Review Checklist

```markdown
When reviewing code, verify:

## Authentication
- [ ] Route requires authentication
- [ ] Session is validated

## Authorization
- [ ] Correct role check
- [ ] Correct permission check
- [ ] No privilege escalation

## Data Access
- [ ] clinicId filter present
- [ ] User can only access own clinic
- [ ] Soft delete respected

## Audit
- [ ] PHI access logged
- [ ] State changes logged
- [ ] User context captured
```

---

## Compliance Requirements

### HIPAA Requirements

| Requirement | Implementation |
|-------------|----------------|
| Access controls | Role-based access, permissions |
| Audit controls | Comprehensive audit logging |
| Integrity controls | Change tracking with before/after |
| Authentication | Strong passwords, session management |
| Transmission security | HTTPS, encrypted cookies |

### PIPEDA Requirements

| Requirement | Implementation |
|-------------|----------------|
| Consent | Consent tracking in patient records |
| Limiting collection | Only collect necessary data |
| Safeguards | Access controls, encryption, audit |
| Access to records | Patient portal, export capability |
| Retention limits | Automated archival after retention period |

### Log Retention

| Log Type | Retention | Archive |
|----------|-----------|---------|
| Audit logs | 7 years (HIPAA minimum) | Cold storage after 1 year |
| PHI access logs | 7 years | Cold storage after 1 year |
| Security events | 7 years | Cold storage after 1 year |
| System logs | 1 year | Archive after 90 days |

---

## Compliance Reporting

### PHI Access Report

For HIPAA audits:

```typescript
// Generate PHI access report for a patient
async function generatePhiAccessReport(
  patientId: string,
  startDate: Date,
  endDate: Date
) {
  return db.phiAccessLog.findMany({
    where: {
      patientId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: 'desc' },
    select: {
      timestamp: true,
      userName: true,
      userRole: true,
      accessType: true,
      fieldsAccessed: true,
      reason: true,
    },
  });
}
```

### User Activity Report

```typescript
// Generate user activity report
async function generateUserActivityReport(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return db.auditLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: 'desc' },
  });
}
```

---

## Dependencies

### Internal
- [Authentication](../authentication/) - Session context for logging
- [Data Isolation](../data-isolation/) - Clinic scope for logs

### External
- MongoDB - Log storage
- (Optional) S3 - Cold storage archive

---

## Related Documentation

- [Parent: Auth & Authorization](../../)
- [Compliance & Documentation Area](../../../compliance-documentation/) - Full compliance docs
- [AUTH-PATTERNS.md](../../../../guides/AUTH-PATTERNS.md) - Code patterns

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented
