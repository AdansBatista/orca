# Audit Event Logging

> **Sub-Area**: [Audit & Compliance](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Provides comprehensive audit logging for all security-relevant events in the system. Captures who did what, when, and where for compliance, security investigation, and operational visibility. Events are logged asynchronously to avoid impacting request performance.

---

## Core Requirements

- [ ] Define standard audit event types
- [ ] Capture user context (id, name, role, IP, user agent)
- [ ] Capture action context (what, entity, entityId)
- [ ] Capture change context (before/after state)
- [ ] Log asynchronously (fire and forget)
- [ ] Support severity levels (INFO, WARNING, CRITICAL)
- [ ] Provide logAudit() utility function

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/audit-logs` | `audit:view_logs` | List audit logs |
| GET | `/api/audit-logs/[id]` | `audit:view_logs` | Get log detail |

### Query Parameters

```typescript
interface AuditLogQuery {
  startDate?: string;   // ISO date
  endDate?: string;     // ISO date
  userId?: string;      // Filter by user
  action?: string;      // Filter by action type
  severity?: string;    // INFO, WARNING, CRITICAL
  entity?: string;      // Filter by entity type
  page?: number;
  pageSize?: number;
}
```

---

## Data Model

```prisma
model AuditLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  timestamp DateTime @default(now())

  // Who
  userId    String?  @db.ObjectId
  userName  String?
  userRole  String?
  userIp    String?
  userAgent String?

  // What
  action    String   // AUTH_LOGIN, PATIENT_UPDATE, etc.
  severity  String   @default("INFO")
  entity    String?  // Patient, Appointment, etc.
  entityId  String?  @db.ObjectId

  // Where
  clinicId  String?  @db.ObjectId

  // Details
  details   Json?
  before    Json?
  after     Json?

  // Request context
  requestId String?
  endpoint  String?
  method    String?

  @@index([userId])
  @@index([clinicId])
  @@index([timestamp])
  @@index([action])
  @@index([severity])
  @@index([entity, entityId])
}
```

---

## Business Rules

### Event Types

| Category | Events |
|----------|--------|
| Auth | AUTH_LOGIN, AUTH_LOGIN_FAILED, AUTH_LOGOUT, AUTH_PASSWORD_RESET, AUTH_ACCOUNT_LOCKED |
| Patient | PATIENT_CREATE, PATIENT_UPDATE, PATIENT_DELETE, PATIENT_MERGE |
| PHI | PHI_VIEW, PHI_EXPORT, PHI_PRINT |
| Financial | INVOICE_CREATE, PAYMENT_PROCESS, REFUND_PROCESS, WRITE_OFF |
| Admin | USER_CREATE, USER_UPDATE, ROLE_ASSIGN, SETTINGS_CHANGE |
| Security | SECURITY_VIOLATION, CLINIC_BOUNDARY_BREACH, RATE_LIMIT_EXCEEDED |

### Logger Implementation

```typescript
// lib/audit/logger.ts
export async function logAudit(
  session: Session | null,
  data: {
    action: string;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    entity?: string;
    entityId?: string;
    details?: Record<string, unknown>;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  },
  request?: Request
) {
  // Fire and forget - don't await
  db.auditLog.create({
    data: {
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
    },
  }).catch(console.error);
}
```

### Usage Example

```typescript
await logAudit(session, {
  action: 'PATIENT_UPDATE',
  entity: 'Patient',
  entityId: patient.id,
  details: { field: 'email' },
  before: { email: oldEmail },
  after: { email: newEmail },
}, request);
```

---

## Dependencies

**Depends On:**
- Session Management
- Database (MongoDB)

**Required By:**
- All security-relevant operations
- Compliance Reporting

---

## Notes

- Never log PHI in audit details (use generic descriptions)
- Log asynchronously to avoid performance impact
- Consider: batch logging for high-volume events
