# Data Retention

> **Sub-Area**: [Audit & Compliance](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Manages long-term storage and archival of audit logs to meet HIPAA's 7-year retention requirement. Handles log archival to cold storage, log integrity verification, and eventual deletion after retention period.

---

## Core Requirements

- [ ] Define retention periods by log type
- [ ] Archive logs to cold storage after 1 year
- [ ] Verify log integrity (tamper detection)
- [ ] Provide archived log retrieval
- [ ] Track storage usage and costs
- [ ] Implement retention policy enforcement

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/admin/retention/status` | `super_admin` | View retention status |
| POST | `/api/admin/retention/archive` | `super_admin` | Trigger manual archive |

---

## Data Model

```prisma
model LogArchive {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  logType     String   // 'audit' | 'phi_access' | 'security'
  startDate   DateTime // Range start
  endDate     DateTime // Range end
  recordCount Int
  storageUrl  String   // S3/blob URL
  checksum    String   // For integrity verification
  archivedAt  DateTime @default(now())
  expiresAt   DateTime // When to delete (7 years from oldest record)

  @@index([logType])
  @@index([startDate, endDate])
  @@index([expiresAt])
}
```

---

## Business Rules

### Retention Periods

| Log Type | Hot Storage | Archive | Delete After |
|----------|-------------|---------|--------------|
| Audit Logs | 1 year | Years 2-7 | 7 years |
| PHI Access Logs | 1 year | Years 2-7 | 7 years |
| Security Events | 1 year | Years 2-7 | 7 years |
| System Logs | 90 days | Years 1-2 | 2 years |

### Archive Process

```typescript
// Scheduled job - runs monthly
async function archiveLogs() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Get logs older than 1 year
  const logsToArchive = await db.auditLog.findMany({
    where: {
      timestamp: { lt: oneYearAgo },
      archived: false,
    },
    take: 10000, // Batch size
  });

  if (logsToArchive.length === 0) return;

  // Export to JSON
  const exportData = JSON.stringify(logsToArchive);

  // Calculate checksum
  const checksum = createHash('sha256').update(exportData).digest('hex');

  // Upload to cold storage (S3)
  const storageUrl = await uploadToS3(
    `audit-logs/${format(oneYearAgo, 'yyyy-MM')}.json`,
    exportData
  );

  // Create archive record
  await db.logArchive.create({
    data: {
      logType: 'audit',
      startDate: logsToArchive[0].timestamp,
      endDate: logsToArchive[logsToArchive.length - 1].timestamp,
      recordCount: logsToArchive.length,
      storageUrl,
      checksum,
      expiresAt: addYears(logsToArchive[0].timestamp, 7),
    },
  });

  // Delete from hot storage
  await db.auditLog.deleteMany({
    where: {
      id: { in: logsToArchive.map(l => l.id) },
    },
  });
}
```

### Integrity Verification

```typescript
async function verifyArchiveIntegrity(archiveId: string): Promise<boolean> {
  const archive = await db.logArchive.findUnique({
    where: { id: archiveId },
  });

  // Download from storage
  const data = await downloadFromS3(archive.storageUrl);

  // Verify checksum
  const currentChecksum = createHash('sha256').update(data).digest('hex');

  return currentChecksum === archive.checksum;
}
```

### Deletion Process

```typescript
// Scheduled job - runs monthly
async function deleteExpiredArchives() {
  const expiredArchives = await db.logArchive.findMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  for (const archive of expiredArchives) {
    // Delete from cold storage
    await deleteFromS3(archive.storageUrl);

    // Delete archive record
    await db.logArchive.delete({
      where: { id: archive.id },
    });
  }
}
```

---

## Dependencies

**Depends On:**
- Audit Event Logging
- PHI Access Tracking
- Cloud storage (S3/Azure Blob)

**Required By:**
- HIPAA compliance
- Long-term audit capability

---

## Notes

- HIPAA requires minimum 7 years for audit logs
- Consider: legal hold capability for litigation
- Consider: export archived logs for compliance requests
