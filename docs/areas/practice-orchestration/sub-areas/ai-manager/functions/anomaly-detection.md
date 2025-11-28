# Anomaly Detection

> **Sub-Area**: [AI Manager](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Anomaly Detection monitors clinic operations in real-time to detect and alert on operational anomalies. It uses pattern-based detection, threshold monitoring, and trend analysis to identify unusual situations like excessive wait times, appointment overruns, high no-show rates, and resource bottlenecks.

---

## Core Requirements

- [ ] Monitor operations in real-time for anomalies
- [ ] Detect pattern-based deviations from normal
- [ ] Alert on threshold breaches (wait time, duration)
- [ ] Identify trend deviations (no-show rate spike)
- [ ] Send proactive notifications to relevant staff
- [ ] Suggest root causes for detected anomalies
- [ ] Track anomaly status (active, acknowledged, resolved)
- [ ] Learn from false positive feedback
- [ ] Prioritize anomalies by severity

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/ai/anomalies` | `ops:ai_manager` | Get active anomalies |
| GET | `/api/v1/ops/ai/anomalies/:id` | `ops:ai_manager` | Get anomaly details |
| PUT | `/api/v1/ops/ai/anomalies/:id/acknowledge` | `ops:ai_manager` | Acknowledge anomaly |
| PUT | `/api/v1/ops/ai/anomalies/:id/resolve` | `ops:ai_manager` | Resolve anomaly |
| PUT | `/api/v1/ops/ai/anomalies/:id/dismiss` | `ops:ai_manager` | Dismiss as false positive |
| GET | `/api/v1/ops/ai/anomalies/history` | `ops:ai_manager` | Get anomaly history |

---

## Data Model

```prisma
model AIAnomaly {
  id              String          @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String          @db.ObjectId

  type            AnomalyType
  severity        AnomalySeverity

  title           String
  description     String
  affectedEntity  String?         // appointment, resource, staff
  affectedId      String?         @db.ObjectId

  detectedAt      DateTime        @default(now())
  detectionMetric String?
  expectedValue   Float?
  actualValue     Float?
  deviation       Float?          // % deviation from expected

  suggestedCause  String?
  suggestedAction String?

  status          AnomalyStatus   @default(ACTIVE)
  acknowledgedAt  DateTime?
  acknowledgedBy  String?         @db.ObjectId
  resolvedAt      DateTime?
  resolution      String?

  isFalsePositive Boolean         @default(false)

  @@index([clinicId, status])
  @@index([clinicId, type])
}

enum AnomalyType {
  LONG_APPOINTMENT
  EXCESSIVE_WAIT
  HIGH_NO_SHOW_RATE
  EQUIPMENT_ISSUE
  SCHEDULE_CONFLICT
  UNUSUAL_CANCELLATION
  RESOURCE_BOTTLENECK
  STAFF_OVERLOAD
  LOW_UTILIZATION
}

enum AnomalySeverity {
  LOW       // Informational
  MEDIUM    // Should investigate
  HIGH      // Needs attention
  CRITICAL  // Immediate action required
}

enum AnomalyStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
  DISMISSED
}
```

---

## Business Rules

- CRITICAL anomalies trigger immediate push notification
- Anomalies auto-resolve when condition clears
- Thresholds configurable per clinic
- Minimum 2 data points before anomaly detection
- False positive feedback improves detection model
- Duplicate detection: don't re-alert for same issue
- Historical patterns used as baseline for detection

---

## Dependencies

**Depends On:**
- [Patient Flow](../../patient-flow/) - Real-time flow data
- [Wait Time Monitoring](../../patient-flow/functions/wait-time-monitoring.md) - Wait alerts
- [Utilization Tracking](../../resource-coordination/functions/utilization-tracking.md) - Utilization data

**Required By:**
- [Day View Dashboard](../../operations-dashboard/functions/day-view-dashboard.md) - Alert display
- [Task Generation](./task-generation.md) - Auto-task creation

---

## Notes

- Start with simple threshold-based detection
- Add ML-based pattern detection as enhancement
- Consider anomaly correlation (multiple related anomalies)
- Dashboard widget for anomaly summary

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
