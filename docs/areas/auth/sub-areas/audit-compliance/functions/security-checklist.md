# Security Checklist

> **Sub-Area**: [Audit & Compliance](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Provides comprehensive security checklists for development, deployment, and code review. Ensures all security controls are properly implemented and maintained. Used during PR reviews and deployment approvals.

---

## Core Requirements

- [ ] Define pre-deployment security checklist
- [ ] Define code review security checklist
- [ ] Define ongoing security audit checklist
- [ ] Provide automated validation where possible
- [ ] Track checklist completion status

---

## API Endpoints

No dedicated endpoints - checklists are documentation and process.

---

## Data Model

No data model - checklists are markdown documentation.

---

## Business Rules

### Pre-Deployment Checklist

```markdown
## Authentication
- [ ] All API routes use `withAuth` wrapper
- [ ] All protected routes check authentication
- [ ] Session timeout is configured (8h/30d)
- [ ] Failed login lockout is implemented (5 attempts)
- [ ] Password policy enforced (12+ chars, complexity)
- [ ] Password history checked (last 5)

## Authorization
- [ ] All queries include `clinicId` filter
- [ ] Role checks implemented where needed
- [ ] Permission checks implemented where needed
- [ ] No privilege escalation vulnerabilities
- [ ] Super admin routes properly protected

## Data Protection
- [ ] PHI access is logged
- [ ] Data exports are logged
- [ ] Passwords hashed with bcrypt (cost 12)
- [ ] Sensitive data encrypted at rest
- [ ] No PHI in logs or error messages

## Session Security
- [ ] JWT in HTTP-only cookies
- [ ] Secure flag set on cookies
- [ ] SameSite=Lax cookie attribute
- [ ] CSRF protection enabled
- [ ] Session invalidation on logout

## Audit
- [ ] All auth events logged
- [ ] All PHI access logged
- [ ] All data changes logged
- [ ] Log retention configured (7+ years)
- [ ] Audit logs tamper-protected
```

### Code Review Checklist

```markdown
## For Every PR

### Authentication
- [ ] Route requires authentication (withAuth)
- [ ] Session is properly validated

### Authorization
- [ ] Correct role check (if applicable)
- [ ] Correct permission check (if applicable)
- [ ] No privilege escalation

### Data Access
- [ ] clinicId filter present in all queries
- [ ] User can only access own clinic data
- [ ] Soft delete (deletedAt) respected
- [ ] Input validated with Zod schema

### Audit
- [ ] PHI access logged (if applicable)
- [ ] State changes logged (if applicable)
- [ ] User context captured in logs

### Security
- [ ] No hardcoded secrets
- [ ] No PHI in logs
- [ ] Input sanitized
- [ ] Output encoded (XSS prevention)
```

### Ongoing Security Audit

```markdown
## Monthly Security Review

### Access Review
- [ ] Review inactive user accounts
- [ ] Review role assignments
- [ ] Review permission overrides
- [ ] Check for anomalous access patterns

### Log Review
- [ ] Review failed login attempts
- [ ] Review security violation events
- [ ] Review cross-clinic access attempts
- [ ] Check audit log integrity

### System Health
- [ ] Dependencies updated
- [ ] Security patches applied
- [ ] SSL certificates valid
- [ ] Backup integrity verified
```

---

## Dependencies

**Depends On:**
- All auth sub-areas

**Required By:**
- Deployment process
- Code review process
- Compliance audits

---

## Notes

- Checklists stored in docs, not code
- Consider: automated checks in CI pipeline
- Consider: checklist tracking tool integration
