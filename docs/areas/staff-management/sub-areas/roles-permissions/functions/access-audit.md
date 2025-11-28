# Access Audit

> **Sub-Area**: [Roles & Permissions](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Track and audit all permission changes, role assignments, and sensitive data access for HIPAA compliance. Maintains comprehensive audit logs of who accessed what, when, and from where. Generates compliance reports for audits and investigations.

---

## Core Requirements

- [ ] Log all role and permission changes
- [ ] Track role assignments and revocations
- [ ] Monitor sensitive data access (PHI)
- [ ] Record failed access attempts
- [ ] Generate compliance audit reports
- [ ] Alert on suspicious access patterns
- [ ] 7-year log retention for HIPAA

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/audit/access-logs` | `audit:view` | Get access logs |
| GET | `/api/audit/role-history` | `audit:view` | Get role changes |
| GET | `/api/audit/permission-changes` | `audit:view` | Get permission changes |
| GET | `/api/audit/phi-access` | `audit:view_phi` | Get PHI access logs |
| GET | `/api/audit/failed-access` | `audit:view` | Get failed access attempts |
| POST | `/api/audit/reports` | `audit:export` | Generate audit report |
| GET | `/api/audit/user/:userId` | `audit:view` | Get user access history |

---

## Data Model

```prisma
model AccessLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId

  userId        String   @db.ObjectId
  sessionId     String?

  action        String   // Permission code or action
  resource      String   // Resource type
  resourceId    String?  // Specific resource ID

  granted       Boolean
  denialReason  String?

  ipAddress     String?
  userAgent     String?
  requestPath   String?

  involvesPHI   Boolean  @default(false)
  phiFields     String[]

  accessedAt    DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([accessedAt])
  @@index([involvesPHI])
}

model RoleHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  roleId        String   @db.ObjectId

  changeType    RoleChangeType
  fieldChanged  String?
  previousValue String?
  newValue      String?
  reason        String?

  changedAt     DateTime @default(now())
  changedBy     String   @db.ObjectId

  @@index([roleId])
  @@index([changedAt])
}
```

---

## Business Rules

- All permission changes must be logged
- PHI access logged with field-level detail
- Failed access attempts always logged
- Logs retained for minimum 7 years (HIPAA)
- Logs are immutable (append-only)
- Super admin access still logged
- Bulk operations logged as individual entries

### Audit Events

| Event Type | Description | Retention |
|------------|-------------|-----------|
| Role Created | New role added | 7 years |
| Role Modified | Permissions changed | 7 years |
| Role Assigned | User given role | 7 years |
| Role Removed | User role revoked | 7 years |
| PHI Access | Patient data accessed | 7 years |
| Failed Access | Unauthorized attempt | 7 years |
| Login Event | User authentication | 2 years |

### Compliance Requirements

- **HIPAA**: Audit trail for PHI access
- **State Boards**: Provider action tracking
- **PIPEDA**: Canadian privacy compliance
- **Insurance**: Claim-related access audits

---

## Dependencies

**Depends On:**
- Role Management
- Permission Assignment
- Authentication (session info)

**Required By:**
- Compliance audits
- Security investigations
- PHI breach detection

---

## Notes

- Consider: real-time alerts for suspicious patterns
- Log aggregation for high-volume practices
- Archive older logs to cold storage
- Export format should support common audit tools
